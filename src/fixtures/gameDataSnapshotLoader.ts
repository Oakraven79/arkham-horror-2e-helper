import type { Payload } from 'payload'

import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION, gameDataFixture } from './gameData'
import { portableMediaKeysByID } from './gameDataSnapshot'
import type { GameDataSnapshot } from './gameDataSnapshotTypes'

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
const legacyBoxedSetFields = new Set(['boxedSet', 'boxedset', 'customSetName'])
const ignoredComparisonFields = new Set([
  'id',
  'createdAt',
  'updatedAt',
  ...legacyBoxedSetFields,
])

function removeLegacyBoxedSetFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeLegacyBoxedSetFields)

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as SnapshotDocument)
      .filter(([key]) => !legacyBoxedSetFields.has(key))
      .map(([key, entryValue]) => [key, removeLegacyBoxedSetFields(entryValue)]),
  )
}

function mutableDocument(document: SnapshotDocument) {
  return removeLegacyBoxedSetFields(structuredClone(document)) as SnapshotDocument
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

function requiredSetIDs(
  keys: Map<string, string>,
  value: unknown,
  fallbackSourceSet: unknown,
  label: string,
) {
  const portableKeys = Array.isArray(value) && value.length > 0 ? value : [fallbackSourceSet]

  return portableKeys.map((key, index) =>
    requiredID(keys, key, `${label} required set ${index + 1}`),
  )
}

async function mediaIDs(payload: Payload) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    draft: true,
    limit: 10000,
    overrideAccess: true,
  })

  return new Map(
    [...portableMediaKeysByID(result.docs as unknown as Record<string, unknown>[]).entries()].map(
      ([id, key]) => [key, id],
    ),
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

export async function restoreGameDataSnapshot(
  payload: Payload,
  snapshot: GameDataSnapshot = gameDataFixture.snapshot,
) {
  const snapshotCollections = snapshot.collections
  const context: RestoreContext = {
    media: await mediaIDs(payload),
    boxedSets: new Map(),
    neighborhoods: new Map(),
    locations: new Map(),
    otherWorlds: new Map(),
  }

  const boxedSets = await restoreCollection(
    payload,
    'boxed-sets',
    'key',
    snapshotCollections.boxedSets,
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
    snapshotCollections.ancientOnes,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Ancient One ${document.key} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Ancient One ${document.key}`,
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
    snapshotCollections.neighborhoods,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Neighborhood ${document.key} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Neighborhood ${document.key}`,
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
    snapshotCollections.locations,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Location ${document.key} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Location ${document.key}`,
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
    snapshotCollections.arkhamEncounterCards,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Arkham encounter ${document.cardCode} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Arkham encounter ${document.cardCode}`,
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
    snapshotCollections.mythosCards,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Mythos card ${document.cardCode} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Mythos card ${document.cardCode}`,
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
    snapshotCollections.otherWorlds,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Other World ${document.key} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Other World ${document.key}`,
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
    snapshotCollections.otherWorldEncounterCards,
    (document) => {
      const sourceSetKey = document.sourceSet
      document.sourceSet = requiredID(
        context.boxedSets,
        sourceSetKey,
        `Other World encounter ${document.cardCode} source set`,
      )
      document.requiredSets = requiredSetIDs(
        context.boxedSets,
        document.requiredSets,
        sourceSetKey,
        `Other World encounter ${document.cardCode}`,
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
