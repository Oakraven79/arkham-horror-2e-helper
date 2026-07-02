import type { CollectionSlug, Payload } from 'payload'

import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION, gameDataFixture } from './gameData'

type SnapshotDocument = Record<string, unknown>
type SnapshotDocuments = readonly SnapshotDocument[]
type GameDataCollection =
  | 'ancient-ones'
  | 'arkham-encounter-cards'
  | 'boxed-sets'
  | 'locations'
  | 'mythos-cards'
  | 'neighborhoods'
  | 'other-world-encounter-cards'
  | 'other-worlds'

interface RestoreContext {
  boxedSets: Map<string, string>
  locations: Map<string, string>
  media: Map<string, string>
  neighborhoods: Map<string, string>
  otherWorlds: Map<string, string>
}

const fixtureOwnedCollections = new Set<GameDataCollection>([
  'arkham-encounter-cards',
  'boxed-sets',
  'locations',
  'mythos-cards',
  'neighborhoods',
  'other-world-encounter-cards',
  'other-worlds',
])
const ignoredComparisonFields = new Set(['id', 'createdAt', 'updatedAt'])

function mutableDocument(document: SnapshotDocument) {
  return structuredClone(document)
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !ignoredComparisonFields.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, canonicalValue(entryValue)]),
  )
}

function comparableExisting(document: unknown, expected: SnapshotDocument) {
  if (!document || typeof document !== 'object') return null

  const record = document as Record<string, unknown>
  return Object.fromEntries(Object.keys(expected).map((key) => [key, record[key]]))
}

function equivalentDocument(document: unknown, expected: SnapshotDocument) {
  return (
    JSON.stringify(canonicalValue(comparableExisting(document, expected))) ===
    JSON.stringify(canonicalValue(expected))
  )
}

function requiredID(keys: Map<string, string>, value: unknown, label: string) {
  if (typeof value !== 'string') throw new Error(`${label} has no portable key.`)

  const id = keys.get(value)
  if (!id) throw new Error(`${label} references missing fixture key ${value}.`)
  return id
}

function optionalID(keys: Map<string, string>, value: unknown, label: string) {
  if (value === null || value === undefined || value === '') return undefined
  return requiredID(keys, value, label)
}

function setOptionalID(
  document: SnapshotDocument,
  field: string,
  keys: Map<string, string>,
  value: unknown,
  label: string,
) {
  const id = optionalID(keys, value, label)

  if (id) {
    document[field] = id
  } else {
    delete document[field]
  }
}

async function collectionIDs(payload: Payload, collection: CollectionSlug, keyField: string) {
  const result = await payload.find({
    collection,
    depth: 0,
    draft: true,
    limit: 10000,
    overrideAccess: true,
  })

  return new Map(
    result.docs.map((document) => {
      const record = document as unknown as Record<string, unknown>
      const key = record[keyField]
      if (typeof key !== 'string') {
        throw new Error(`${collection} document ${document.id} has no ${keyField}.`)
      }
      return [key, String(document.id)]
    }),
  )
}

async function restoreCollection(
  payload: Payload,
  collection: GameDataCollection,
  identityField: string,
  documents: SnapshotDocuments,
  resolveRelationships: (document: SnapshotDocument) => SnapshotDocument,
) {
  const existingResult = await payload.find({
    collection,
    depth: 0,
    draft: true,
    limit: 10000,
    overrideAccess: true,
  })
  const existingByIdentity = new Map(
    existingResult.docs.map((document) => {
      const record = document as unknown as Record<string, unknown>
      return [String(record[identityField]), document]
    }),
  )
  const created: string[] = []
  const updated: string[] = []
  const unchanged: string[] = []
  const ids = new Map<string, string>()

  for (const portableDocument of documents) {
    const identity = portableDocument[identityField]
    if (typeof identity !== 'string') {
      throw new Error(`Snapshot ${collection} document has no ${identityField}.`)
    }

    const data = resolveRelationships(mutableDocument(portableDocument))
    if (fixtureOwnedCollections.has(collection)) {
      data.fixtureNamespace = GAME_DATA_FIXTURE_NAMESPACE
      data.fixtureVersion = GAME_DATA_FIXTURE_VERSION
    }

    const existing = existingByIdentity.get(identity)
    if (existing && equivalentDocument(existing, data)) {
      unchanged.push(identity)
      ids.set(identity, String(existing.id))
      continue
    }

    const draft = data._status === 'draft'
    const restored = existing
      ? await payload.update({
          collection,
          id: existing.id,
          data: data as never,
          draft,
          overrideAccess: true,
        })
      : await payload.create({
          collection,
          data: data as never,
          draft,
          overrideAccess: true,
        })

    ids.set(identity, String(restored.id))
    if (existing) {
      updated.push(identity)
    } else {
      created.push(identity)
    }
  }

  return { created, ids, unchanged, updated }
}

export async function restoreGameDataSnapshot(payload: Payload) {
  const snapshot = gameDataFixture.snapshot.collections
  const context: RestoreContext = {
    media: await collectionIDs(payload, 'media', 'assetKey'),
    boxedSets: new Map(),
    neighborhoods: new Map(),
    locations: new Map(),
    otherWorlds: new Map(),
  }

  const boxedSets = await restoreCollection(
    payload,
    'boxed-sets',
    'key',
    snapshot.boxedSets,
    (document) => {
      setOptionalID(
        document,
        'icon',
        context.media,
        document.icon,
        `Boxed set ${document.key} icon`,
      )
      return document
    },
  )
  context.boxedSets = boxedSets.ids

  const ancientOnes = await restoreCollection(
    payload,
    'ancient-ones',
    'key',
    snapshot.ancientOnes,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Ancient One ${document.key} source set`,
      )
      document.sheets = Array.isArray(document.sheets)
        ? document.sheets.map((sheet) => {
            const resolvedSheet = mutableDocument(sheet as SnapshotDocument)
            setOptionalID(
              resolvedSheet,
              'sheetImage',
              context.media,
              resolvedSheet.sheetImage,
              `Ancient One ${document.key} sheet ${resolvedSheet.key} image`,
            )
            return resolvedSheet
          })
        : []
      return document
    },
  )

  const neighborhoods = await restoreCollection(
    payload,
    'neighborhoods',
    'key',
    snapshot.neighborhoods,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Neighborhood ${document.key} source set`,
      )
      setOptionalID(
        document,
        'frontFrame',
        context.media,
        document.frontFrame,
        `Neighborhood ${document.key} front frame`,
      )
      setOptionalID(
        document,
        'backFrame',
        context.media,
        document.backFrame,
        `Neighborhood ${document.key} back frame`,
      )
      return document
    },
  )
  context.neighborhoods = neighborhoods.ids

  const locations = await restoreCollection(
    payload,
    'locations',
    'key',
    snapshot.locations,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Location ${document.key} source set`,
      )
      document.neighborhood = requiredID(
        context.neighborhoods,
        document.neighborhood,
        `Location ${document.key} neighborhood`,
      )
      setOptionalID(
        document,
        'cardImage',
        context.media,
        document.cardImage,
        `Location ${document.key} image`,
      )
      return document
    },
  )
  context.locations = locations.ids

  const arkhamEncounterCards = await restoreCollection(
    payload,
    'arkham-encounter-cards',
    'cardCode',
    snapshot.arkhamEncounterCards,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Arkham encounter ${document.cardCode} source set`,
      )
      document.neighborhood = requiredID(
        context.neighborhoods,
        document.neighborhood,
        `Arkham encounter ${document.cardCode} neighborhood`,
      )
      document.encounters = Array.isArray(document.encounters)
        ? document.encounters.map((encounter) => {
            const resolvedEncounter = mutableDocument(encounter as SnapshotDocument)
            resolvedEncounter.location = requiredID(
              context.locations,
              resolvedEncounter.location,
              `Arkham encounter ${document.cardCode} location`,
            )
            return resolvedEncounter
          })
        : []
      return document
    },
  )

  const mythosCards = await restoreCollection(
    payload,
    'mythos-cards',
    'cardCode',
    snapshot.mythosCards,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Mythos card ${document.cardCode} source set`,
      )
      const gateInstruction = mutableDocument((document.gateInstruction ?? {}) as SnapshotDocument)
      gateInstruction.locations = Array.isArray(gateInstruction.locations)
        ? gateInstruction.locations.map((location) =>
            requiredID(
              context.locations,
              location,
              `Mythos card ${document.cardCode} gate location`,
            ),
          )
        : []
      document.gateInstruction = gateInstruction

      const lowerLeftOverride = mutableDocument(
        (document.lowerLeftOverride ?? {}) as SnapshotDocument,
      )
      setOptionalID(
        lowerLeftOverride,
        'image',
        context.media,
        lowerLeftOverride.image,
        `Mythos card ${document.cardCode} lower-left image`,
      )
      document.lowerLeftOverride = lowerLeftOverride
      return document
    },
  )

  const otherWorlds = await restoreCollection(
    payload,
    'other-worlds',
    'key',
    snapshot.otherWorlds,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Other World ${document.key} source set`,
      )
      setOptionalID(document, 'art', context.media, document.art, `Other World ${document.key} art`)
      return document
    },
  )
  context.otherWorlds = otherWorlds.ids

  const otherWorldEncounterCards = await restoreCollection(
    payload,
    'other-world-encounter-cards',
    'cardCode',
    snapshot.otherWorldEncounterCards,
    (document) => {
      document.sourceSet = requiredID(
        context.boxedSets,
        document.sourceSet,
        `Other World encounter ${document.cardCode} source set`,
      )
      document.encounters = Array.isArray(document.encounters)
        ? document.encounters.map((encounter) => {
            const resolvedEncounter = mutableDocument(encounter as SnapshotDocument)
            setOptionalID(
              resolvedEncounter,
              'destination',
              context.otherWorlds,
              resolvedEncounter.destination,
              `Other World encounter ${document.cardCode} destination`,
            )
            return resolvedEncounter
          })
        : []
      return document
    },
  )

  return {
    boxedSets,
    ancientOnes,
    neighborhoods,
    locations,
    arkhamEncounterCards,
    mythosCards,
    otherWorlds,
    otherWorldEncounterCards,
  }
}
