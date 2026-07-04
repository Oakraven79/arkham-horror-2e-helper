import { createHash } from 'node:crypto'

import type { Payload } from 'payload'

import { officialBoxedSets } from '@/content/boxedSets'

import type { GameDataSnapshot } from './gameDataSnapshotTypes'

export const GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS = [
  'users',
  'game-sessions',
  'fixture-installations',
] as const satisfies GameDataSnapshot['excludedCollections']

type SnapshotCollectionName = keyof GameDataSnapshot['collections']
type PayloadDocument = Record<string, unknown> & { id: string | number }
type SnapshotDocument = Record<string, unknown>
type SnapshotPayloadCollection =
  | 'ancient-ones'
  | 'arkham-encounter-cards'
  | 'boxed-sets'
  | 'locations'
  | 'media'
  | 'mythos-cards'
  | 'neighborhoods'
  | 'other-world-encounter-cards'
  | 'other-worlds'

interface BuildGameDataSnapshotOptions {
  generatedAt?: string
  mediaKeysByID?: Map<string, string>
}

export interface GameDataSnapshotValidation {
  checksum: string
  counts: Record<SnapshotCollectionName, number>
  errors: string[]
  generatedAt?: string
  valid: boolean
  warnings: string[]
}

const collectionNames: SnapshotCollectionName[] = [
  'ancientOnes',
  'arkhamEncounterCards',
  'boxedSets',
  'locations',
  'mythosCards',
  'neighborhoods',
  'otherWorldEncounterCards',
  'otherWorlds',
]

const omittedDocumentFields = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'fixtureNamespace',
  'fixtureVersion',
])
const officialBoxedSetKeysByName = new Map(
  officialBoxedSets.flatMap((boxedSet) =>
    [boxedSet.name, boxedSet.key, ...boxedSet.aliases].map((name) => [
      normalizeName(name),
      boxedSet.key,
    ] as const),
  ),
)

function isRecord(value: unknown): value is SnapshotDocument {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPayloadDocument(value: unknown): value is PayloadDocument {
  return isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number')
}

function relationshipID(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)

  if (isRecord(value) && (typeof value.id === 'string' || typeof value.id === 'number')) {
    return String(value.id)
  }

  return null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function portableBoxedSetKey(document: PayloadDocument) {
  const key = documentString(document, 'key')
  if (key) return key

  const name = documentString(document, 'name')
  if (!name) return null

  const officialKey = officialBoxedSetKeysByName.get(normalizeName(name))
  if (officialKey) return officialKey

  const slug = slugify(name)
  return slug ? `custom-${slug}` : null
}

export function portableMediaKey(document: Record<string, unknown>) {
  const assetKey = document.assetKey
  if (typeof assetKey === 'string' && assetKey.length > 0) return assetKey

  const filename = document.filename
  if (typeof filename === 'string' && filename.length > 0) {
    return `media-${slugify(filename)}`
  }

  return null
}

export function portableMediaKeysByID(documents: Record<string, unknown>[]) {
  const usedKeys = new Set<string>()

  return new Map(
    documents.flatMap((document) => {
      const id = document.id
      const baseKey = portableMediaKey(document)

      if ((typeof id !== 'string' && typeof id !== 'number') || !baseKey) return []

      let fixtureKey = baseKey
      let suffix = 2

      while (usedKeys.has(fixtureKey)) {
        fixtureKey = `${baseKey}-${suffix}`
        suffix += 1
      }

      usedKeys.add(fixtureKey)
      return [[String(id), fixtureKey] as const]
    }),
  )
}

function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanValue)

  if (!isRecord(value)) return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !omittedDocumentFields.has(key))
      .map(([key, entryValue]) => [key, cleanValue(entryValue)]),
  )
}

function cleanDocument(value: unknown) {
  return cleanValue(value) as SnapshotDocument
}

function mapByID(
  documents: PayloadDocument[],
  key: (document: PayloadDocument) => string | null | undefined,
  label: string,
) {
  return new Map(
    documents.map((document) => {
      const portableKey = key(document)
      if (!portableKey) throw new Error(`${label} ${document.id} has no portable key.`)
      return [String(document.id), portableKey]
    }),
  )
}

function optionalRelationshipKey(value: unknown, keysByID: Map<string, string>, label: string) {
  const id = relationshipID(value)
  if (!id) return undefined

  const key = keysByID.get(id)
  if (!key) {
    throw new Error(`${label} references a document without a portable key (${id}).`)
  }
  return key
}

function requiredRelationshipKey(value: unknown, keysByID: Map<string, string>, label: string) {
  const key = optionalRelationshipKey(value, keysByID, label)
  if (!key) throw new Error(`${label} has no relationship value.`)
  return key
}

function relationshipKeys(value: unknown, keysByID: Map<string, string>, label: string) {
  if (!Array.isArray(value)) return []

  return value.map((entry, index) =>
    requiredRelationshipKey(entry, keysByID, `${label} ${index + 1}`),
  )
}

function setRequiredSets(
  snapshot: SnapshotDocument,
  document: PayloadDocument,
  keysByID: Map<string, string>,
  label: string,
) {
  const keys = relationshipKeys(document.requiredSets, keysByID, `${label} required set`)

  if (keys.length > 0) {
    snapshot.requiredSets = keys
  } else {
    delete snapshot.requiredSets
  }
}

function setOptionalRelationship(document: SnapshotDocument, field: string, value: unknown) {
  if (value) {
    document[field] = value
  } else {
    delete document[field]
  }
}

function sortedDocuments<T extends SnapshotDocument>(documents: T[], field: keyof T) {
  return [...documents].sort((left, right) =>
    String(left[field] ?? '').localeCompare(String(right[field] ?? '')),
  )
}

async function findDocuments(
  payload: Payload,
  collection: SnapshotPayloadCollection,
  draft = true,
) {
  const result = await payload.find({
    collection,
    depth: 0,
    draft,
    limit: 10000,
    overrideAccess: true,
  })

  return (result.docs as unknown[]).filter(isPayloadDocument)
}

function documentString(document: PayloadDocument, field: string) {
  const value = document[field]
  return typeof value === 'string' ? value : null
}

function snapshotLabel(document: SnapshotDocument, fallback: string) {
  return typeof document[fallback] === 'string' ? document[fallback] : 'unknown'
}

export async function buildGameDataSnapshot(
  payload: Payload,
  options: BuildGameDataSnapshotOptions = {},
): Promise<GameDataSnapshot> {
  const [
    mediaDocuments,
    boxedSetDocuments,
    ancientOneDocuments,
    neighborhoodDocuments,
    locationDocuments,
    arkhamEncounterDocuments,
    mythosDocuments,
    otherWorldDocuments,
    otherWorldEncounterDocuments,
  ] = await Promise.all([
    findDocuments(payload, 'media', false),
    findDocuments(payload, 'boxed-sets'),
    findDocuments(payload, 'ancient-ones'),
    findDocuments(payload, 'neighborhoods'),
    findDocuments(payload, 'locations'),
    findDocuments(payload, 'arkham-encounter-cards'),
    findDocuments(payload, 'mythos-cards'),
    findDocuments(payload, 'other-worlds'),
    findDocuments(payload, 'other-world-encounter-cards'),
  ])

  const mediaKeysByID = options.mediaKeysByID ?? portableMediaKeysByID(mediaDocuments)
  const portableBoxedSetDocuments = boxedSetDocuments.filter((document) =>
    Boolean(portableBoxedSetKey(document)),
  )
  const boxedSetKeysByID = mapByID(
    portableBoxedSetDocuments,
    portableBoxedSetKey,
    'Boxed set',
  )
  const neighborhoodKeysByID = mapByID(
    neighborhoodDocuments,
    (document) => documentString(document, 'key'),
    'Neighborhood',
  )
  const locationKeysByID = mapByID(
    locationDocuments,
    (document) => documentString(document, 'key'),
    'Location',
  )
  const otherWorldKeysByID = mapByID(
    otherWorldDocuments,
    (document) => documentString(document, 'key'),
    'Other World',
  )

  const boxedSets = portableBoxedSetDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.key = requiredRelationshipKey(
      document.id,
      boxedSetKeysByID,
      `Boxed set ${document.id} portable key`,
    )
    setOptionalRelationship(
      snapshot,
      'icon',
      optionalRelationshipKey(
        document.icon,
        mediaKeysByID,
        `Boxed set ${snapshotLabel(snapshot, 'key')} icon`,
      ),
    )
    return snapshot
  })

  const ancientOnes = ancientOneDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Ancient One ${snapshotLabel(snapshot, 'key')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Ancient One ${snapshotLabel(snapshot, 'key')}`,
    )
    snapshot.sheets = Array.isArray(document.sheets)
      ? document.sheets.map((sheet) => {
          const portableSheet = cleanDocument(sheet)
          setOptionalRelationship(
            portableSheet,
            'sheetImage',
            optionalRelationshipKey(
              isRecord(sheet) ? sheet.sheetImage : undefined,
              mediaKeysByID,
              `Ancient One ${snapshotLabel(snapshot, 'key')} sheet ${snapshotLabel(
                portableSheet,
                'key',
              )} image`,
            ),
          )
          return portableSheet
        })
      : []
    return snapshot
  })

  const neighborhoods = neighborhoodDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Neighborhood ${snapshotLabel(snapshot, 'key')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Neighborhood ${snapshotLabel(snapshot, 'key')}`,
    )
    setOptionalRelationship(
      snapshot,
      'frontFrame',
      optionalRelationshipKey(
        document.frontFrame,
        mediaKeysByID,
        `Neighborhood ${snapshotLabel(snapshot, 'key')} front frame`,
      ),
    )
    setOptionalRelationship(
      snapshot,
      'backFrame',
      optionalRelationshipKey(
        document.backFrame,
        mediaKeysByID,
        `Neighborhood ${snapshotLabel(snapshot, 'key')} back frame`,
      ),
    )
    return snapshot
  })

  const locations = locationDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Location ${snapshotLabel(snapshot, 'key')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Location ${snapshotLabel(snapshot, 'key')}`,
    )
    snapshot.neighborhood = requiredRelationshipKey(
      document.neighborhood,
      neighborhoodKeysByID,
      `Location ${snapshotLabel(snapshot, 'key')} neighborhood`,
    )
    setOptionalRelationship(
      snapshot,
      'cardImage',
      optionalRelationshipKey(
        document.cardImage,
        mediaKeysByID,
        `Location ${snapshotLabel(snapshot, 'key')} image`,
      ),
    )
    return snapshot
  })

  const arkhamEncounterCards = arkhamEncounterDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Arkham encounter ${snapshotLabel(snapshot, 'cardCode')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Arkham encounter ${snapshotLabel(snapshot, 'cardCode')}`,
    )
    snapshot.neighborhood = requiredRelationshipKey(
      document.neighborhood,
      neighborhoodKeysByID,
      `Arkham encounter ${snapshotLabel(snapshot, 'cardCode')} neighborhood`,
    )
    snapshot.encounters = Array.isArray(document.encounters)
      ? document.encounters.map((encounter) => ({
          ...cleanDocument(encounter),
          location: requiredRelationshipKey(
            isRecord(encounter) ? encounter.location : undefined,
            locationKeysByID,
            `Arkham encounter ${snapshotLabel(snapshot, 'cardCode')} location`,
          ),
        }))
      : []
    return snapshot
  })

  const mythosCards = mythosDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Mythos card ${snapshotLabel(snapshot, 'cardCode')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Mythos card ${snapshotLabel(snapshot, 'cardCode')}`,
    )
    const gateInstruction = cleanDocument(document.gateInstruction ?? {})
    const gateInstructionLocations = isRecord(document.gateInstruction)
      ? document.gateInstruction.locations
      : undefined
    gateInstruction.locations = Array.isArray(gateInstructionLocations)
      ? gateInstructionLocations.map((location) =>
          requiredRelationshipKey(
            location,
            locationKeysByID,
            `Mythos card ${snapshotLabel(snapshot, 'cardCode')} gate location`,
          ),
        )
      : []
    snapshot.gateInstruction = gateInstruction

    const lowerLeftOverride = cleanDocument(document.lowerLeftOverride ?? {})
    setOptionalRelationship(
      lowerLeftOverride,
      'image',
      optionalRelationshipKey(
        isRecord(document.lowerLeftOverride) ? document.lowerLeftOverride.image : undefined,
        mediaKeysByID,
        `Mythos card ${snapshotLabel(snapshot, 'cardCode')} lower-left image`,
      ),
    )
    snapshot.lowerLeftOverride = lowerLeftOverride
    return snapshot
  })

  const otherWorlds = otherWorldDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Other World ${snapshotLabel(snapshot, 'key')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Other World ${snapshotLabel(snapshot, 'key')}`,
    )
    setOptionalRelationship(
      snapshot,
      'art',
      optionalRelationshipKey(
        document.art,
        mediaKeysByID,
        `Other World ${snapshotLabel(snapshot, 'key')} art`,
      ),
    )
    return snapshot
  })

  const otherWorldEncounterCards = otherWorldEncounterDocuments.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Other World encounter ${snapshotLabel(snapshot, 'cardCode')} source set`,
    )
    setRequiredSets(
      snapshot,
      document,
      boxedSetKeysByID,
      `Other World encounter ${snapshotLabel(snapshot, 'cardCode')}`,
    )
    snapshot.encounters = Array.isArray(document.encounters)
      ? document.encounters.map((encounter) => {
          const portableEncounter = cleanDocument(encounter)
          setOptionalRelationship(
            portableEncounter,
            'destination',
            optionalRelationshipKey(
              isRecord(encounter) ? encounter.destination : undefined,
              otherWorldKeysByID,
              `Other World encounter ${snapshotLabel(snapshot, 'cardCode')} destination`,
            ),
          )
          return portableEncounter
        })
      : []
    return snapshot
  })

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    excludedCollections: GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS,
    collections: {
      boxedSets: sortedDocuments(boxedSets, 'key'),
      ancientOnes: sortedDocuments(ancientOnes, 'key'),
      neighborhoods: sortedDocuments(neighborhoods, 'key'),
      locations: sortedDocuments(locations, 'key'),
      arkhamEncounterCards: sortedDocuments(arkhamEncounterCards, 'cardCode'),
      mythosCards: sortedDocuments(mythosCards, 'cardCode'),
      otherWorlds: sortedDocuments(otherWorlds, 'key'),
      otherWorldEncounterCards: sortedDocuments(otherWorldEncounterCards, 'cardCode'),
    },
  } as GameDataSnapshot
}

export async function currentGameDataMediaKeys(payload: Payload) {
  const mediaDocuments = await findDocuments(payload, 'media', false)

  return new Set(portableMediaKeysByID(mediaDocuments).values())
}

export function extractGameDataSnapshot(value: unknown) {
  if (isRecord(value) && isRecord(value.snapshot)) return value.snapshot

  return value
}

export function checksumGameDataSnapshot(value: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(value ?? null))
    .digest('hex')
}

export function gameDataSnapshotMediaKeys(snapshot: GameDataSnapshot) {
  const keys = new Set<string>()
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.length > 0) keys.add(value)
  }

  for (const document of snapshot.collections.boxedSets) add(document.icon)
  for (const document of snapshot.collections.ancientOnes) {
    for (const sheet of document.sheets) add(sheet.sheetImage)
  }
  for (const document of snapshot.collections.neighborhoods) {
    add(document.frontFrame)
    add(document.backFrame)
  }
  for (const document of snapshot.collections.locations) add(document.cardImage)
  for (const document of snapshot.collections.mythosCards) add(document.lowerLeftOverride?.image)
  for (const document of snapshot.collections.otherWorlds) add(document.art)

  return keys
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  return [...duplicates]
}

function emptySnapshotCounts(): Record<SnapshotCollectionName, number> {
  return Object.fromEntries(collectionNames.map((collection) => [collection, 0])) as Record<
    SnapshotCollectionName,
    number
  >
}

function snapshotCollectionArrays(
  value: unknown,
  errors: string[],
): GameDataSnapshot['collections'] | null {
  if (!isRecord(value)) {
    errors.push('Snapshot must be a JSON object.')
    return null
  }

  const allowedTopLevelKeys = new Set(['collections', 'excludedCollections', 'generatedAt'])
  for (const key of Object.keys(value)) {
    if (!allowedTopLevelKeys.has(key)) {
      errors.push(`Snapshot contains unsupported top-level key ${key}.`)
    }
  }

  if (typeof value.generatedAt !== 'string') {
    errors.push('Snapshot must include a generatedAt timestamp.')
  }

  if (
    !Array.isArray(value.excludedCollections) ||
    JSON.stringify(value.excludedCollections) !==
      JSON.stringify(GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS)
  ) {
    errors.push(
      `Snapshot excludedCollections must be ${GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS.join(', ')}.`,
    )
  }

  if (!isRecord(value.collections)) {
    errors.push('Snapshot must include a collections object.')
    return null
  }

  let missingCollectionArray = false

  for (const collection of collectionNames) {
    if (!Array.isArray(value.collections[collection])) {
      errors.push(`Snapshot collections.${collection} must be an array.`)
      missingCollectionArray = true
    }
  }

  if (missingCollectionArray) return null

  return value.collections as unknown as GameDataSnapshot['collections']
}

function documentIdentity(
  document: unknown,
  collection: SnapshotCollectionName,
  field: string,
  errors: string[],
) {
  if (!isRecord(document)) {
    errors.push(`Snapshot ${collection} entry must be an object.`)
    return null
  }

  const value = document[field]
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`Snapshot ${collection} entry must include ${field}.`)
    return null
  }

  return value
}

function recordArray(documents: unknown[], collection: SnapshotCollectionName, errors: string[]) {
  return documents.filter((document): document is SnapshotDocument => {
    if (isRecord(document)) return true
    errors.push(`Snapshot ${collection} entry must be an object.`)
    return false
  })
}

function optionalRecord(value: unknown, label: string, errors: string[]) {
  if (value === null || value === undefined) return null
  if (isRecord(value)) return value

  errors.push(`${label} must be an object when present.`)
  return null
}

function checkReference(
  keys: Set<string>,
  value: unknown,
  label: string,
  errors: string[],
  required = true,
) {
  if (value === null || value === undefined || value === '') {
    if (required) errors.push(`${label} is required.`)
    return
  }

  if (typeof value !== 'string') {
    errors.push(`${label} must be a portable key.`)
    return
  }

  if (!keys.has(value)) {
    errors.push(`${label} references unknown key ${value}.`)
  }
}

export function validateGameDataSnapshot(
  value: unknown,
  availableMediaKeys?: Iterable<string>,
): GameDataSnapshotValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const snapshot = extractGameDataSnapshot(value)
  const collections = snapshotCollectionArrays(snapshot, errors)
  const counts = emptySnapshotCounts()
  const mediaKeys = availableMediaKeys ? new Set(availableMediaKeys) : null

  if (!collections) {
    return {
      checksum: checksumGameDataSnapshot(snapshot),
      counts,
      errors,
      generatedAt:
        isRecord(snapshot) && typeof snapshot.generatedAt === 'string'
          ? snapshot.generatedAt
          : undefined,
      valid: false,
      warnings,
    }
  }

  for (const collection of collectionNames) {
    counts[collection] = collections[collection].length
  }

  if (JSON.stringify(collections).includes('"id":')) {
    errors.push('The game-data snapshot contains Payload document or row IDs.')
  }

  const boxedSets = recordArray(collections.boxedSets, 'boxedSets', errors)
  const ancientOnes = recordArray(collections.ancientOnes, 'ancientOnes', errors)
  const neighborhoods = recordArray(collections.neighborhoods, 'neighborhoods', errors)
  const locations = recordArray(collections.locations, 'locations', errors)
  const arkhamEncounterCards = recordArray(
    collections.arkhamEncounterCards,
    'arkhamEncounterCards',
    errors,
  )
  const mythosCards = recordArray(collections.mythosCards, 'mythosCards', errors)
  const otherWorlds = recordArray(collections.otherWorlds, 'otherWorlds', errors)
  const otherWorldEncounterCards = recordArray(
    collections.otherWorldEncounterCards,
    'otherWorldEncounterCards',
    errors,
  )

  const boxedSetKeys = new Set(
    boxedSets
      .map((document) => documentIdentity(document, 'boxedSets', 'key', errors))
      .filter((key): key is string => Boolean(key)),
  )
  const neighborhoodKeys = new Set(
    neighborhoods
      .map((document) => documentIdentity(document, 'neighborhoods', 'key', errors))
      .filter((key): key is string => Boolean(key)),
  )
  const locationKeys = new Set(
    locations
      .map((document) => documentIdentity(document, 'locations', 'key', errors))
      .filter((key): key is string => Boolean(key)),
  )
  const otherWorldKeys = new Set(
    otherWorlds
      .map((document) => documentIdentity(document, 'otherWorlds', 'key', errors))
      .filter((key): key is string => Boolean(key)),
  )

  const duplicateChecks = [
    ['boxed set keys', boxedSets.map((document) => document.key)],
    ['Ancient One keys', ancientOnes.map((document) => document.key)],
    ['neighborhood keys', neighborhoods.map((document) => document.key)],
    ['location keys', locations.map((document) => document.key)],
    ['Arkham encounter card codes', arkhamEncounterCards.map((document) => document.cardCode)],
    ['Mythos card codes', mythosCards.map((document) => document.cardCode)],
    ['Other World keys', otherWorlds.map((document) => document.key)],
    [
      'Other World encounter card codes',
      otherWorldEncounterCards.map((document) => document.cardCode),
    ],
  ] as const

  for (const [label, values] of duplicateChecks) {
    const duplicates = duplicateValues(
      values.filter((value): value is string => typeof value === 'string'),
    )
    if (duplicates.length > 0) errors.push(`Duplicate snapshot ${label}: ${duplicates.join(', ')}`)
  }

  const checkMedia = (assetKey: unknown, label: string) => {
    if (!mediaKeys) return
    checkReference(mediaKeys, assetKey, label, errors, false)
  }
  const checkRequiredSets = (value: unknown, label: string) => {
    if (value === null || value === undefined) return
    if (!Array.isArray(value)) {
      errors.push(`${label} requiredSets must be an array when present.`)
      return
    }

    for (const [index, setKey] of value.entries()) {
      checkReference(boxedSetKeys, setKey, `${label} required set ${index + 1}`, errors)
    }
  }

  for (const document of boxedSets) {
    checkMedia(document.icon, `Boxed set ${document.key} icon`)
  }

  for (const document of ancientOnes) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Ancient One ${document.key} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Ancient One ${document.key}`)
    const sheets = Array.isArray(document.sheets) ? document.sheets : []

    for (const sheet of sheets) {
      const sheetRecord = optionalRecord(sheet, `Ancient One ${document.key} sheet`, errors)
      if (sheetRecord) checkMedia(sheetRecord.sheetImage, `Ancient One ${document.key} sheet image`)
    }
  }

  for (const document of neighborhoods) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Neighborhood ${document.key} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Neighborhood ${document.key}`)
    checkMedia(document.frontFrame, `Neighborhood ${document.key} front frame`)
    checkMedia(document.backFrame, `Neighborhood ${document.key} back frame`)
  }

  for (const document of locations) {
    checkReference(boxedSetKeys, document.sourceSet, `Location ${document.key} source set`, errors)
    checkRequiredSets(document.requiredSets, `Location ${document.key}`)
    checkReference(
      neighborhoodKeys,
      document.neighborhood,
      `Location ${document.key} neighborhood`,
      errors,
    )
    checkMedia(document.cardImage, `Location ${document.key} image`)
  }

  for (const document of arkhamEncounterCards) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Arkham encounter ${document.cardCode} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Arkham encounter ${document.cardCode}`)
    checkReference(
      neighborhoodKeys,
      document.neighborhood,
      `Arkham encounter ${document.cardCode} neighborhood`,
      errors,
    )
    const encounters = Array.isArray(document.encounters) ? document.encounters : []

    for (const encounter of encounters) {
      const encounterRecord = optionalRecord(
        encounter,
        `Arkham encounter ${document.cardCode} encounter`,
        errors,
      )
      if (encounterRecord) {
        checkReference(
          locationKeys,
          encounterRecord.location,
          `Arkham encounter ${document.cardCode} location`,
          errors,
        )
      }
    }
  }

  for (const document of mythosCards) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Mythos card ${document.cardCode} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Mythos card ${document.cardCode}`)
    const gateInstruction = optionalRecord(
      document.gateInstruction,
      `Mythos card ${document.cardCode} gateInstruction`,
      errors,
    )
    const gateLocations = Array.isArray(gateInstruction?.locations) ? gateInstruction.locations : []

    for (const location of gateLocations) {
      checkReference(
        locationKeys,
        location,
        `Mythos card ${document.cardCode} gate location`,
        errors,
      )
    }

    const lowerLeftOverride = optionalRecord(
      document.lowerLeftOverride,
      `Mythos card ${document.cardCode} lowerLeftOverride`,
      errors,
    )
    checkMedia(lowerLeftOverride?.image, `Mythos card ${document.cardCode} lower-left image`)
  }

  for (const document of otherWorlds) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Other World ${document.key} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Other World ${document.key}`)
    checkMedia(document.art, `Other World ${document.key} art`)
  }

  for (const document of otherWorldEncounterCards) {
    checkReference(
      boxedSetKeys,
      document.sourceSet,
      `Other World encounter ${document.cardCode} source set`,
      errors,
    )
    checkRequiredSets(document.requiredSets, `Other World encounter ${document.cardCode}`)
    const encounters = Array.isArray(document.encounters) ? document.encounters : []

    for (const encounter of encounters) {
      const encounterRecord = optionalRecord(
        encounter,
        `Other World encounter ${document.cardCode} encounter`,
        errors,
      )
      if (encounterRecord?.destination) {
        checkReference(
          otherWorldKeys,
          encounterRecord.destination,
          `Other World encounter ${document.cardCode} destination`,
          errors,
        )
      }
    }
  }

  return {
    checksum: checksumGameDataSnapshot(snapshot),
    counts,
    errors,
    generatedAt:
      isRecord(snapshot) && typeof snapshot.generatedAt === 'string'
        ? snapshot.generatedAt
        : undefined,
    valid: errors.length === 0,
    warnings,
  }
}
