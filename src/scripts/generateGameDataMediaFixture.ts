import 'dotenv/config'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'
import sharp from 'sharp'

import config from '@/payload.config'

const omittedDocumentFields = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'fixtureNamespace',
  'fixtureVersion',
])

function relationshipID(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') return String(value)

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id
    if (typeof id === 'string' || typeof id === 'number') return String(id)
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

function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanValue)

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !omittedDocumentFields.has(key))
      .map(([key, entryValue]) => [key, cleanValue(entryValue)]),
  )
}

function cleanDocument(value: unknown) {
  return cleanValue(value) as Record<string, unknown>
}

function mapByID<T extends { id: number | string }>(
  documents: T[],
  key: (document: T) => string | null | undefined,
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
  if (!key) throw new Error(`${label} references an excluded or missing document (${id}).`)
  return key
}

function requiredRelationshipKey(value: unknown, keysByID: Map<string, string>, label: string) {
  const key = optionalRelationshipKey(value, keysByID, label)
  if (!key) throw new Error(`${label} has no relationship value.`)
  return key
}

function setOptionalRelationship(document: Record<string, unknown>, field: string, value: unknown) {
  if (value) {
    document[field] = value
  } else {
    delete document[field]
  }
}

function sortedDocuments<T extends Record<string, unknown>>(documents: T[], field: keyof T) {
  return documents.sort((left, right) =>
    String(left[field] ?? '').localeCompare(String(right[field] ?? '')),
  )
}

const payload = await getPayload({ config })

try {
  const [
    mediaResult,
    boxedSetResult,
    ancientOneResult,
    neighborhoodResult,
    locationResult,
    arkhamEncounterResult,
    mythosResult,
    otherWorldResult,
    otherWorldEncounterResult,
  ] = await Promise.all([
    payload.find({
      collection: 'media',
      depth: 0,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'boxed-sets',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'ancient-ones',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'neighborhoods',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'locations',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'arkham-encounter-cards',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'mythos-cards',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'other-worlds',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'other-world-encounter-cards',
      depth: 0,
      draft: true,
      limit: 10000,
      overrideAccess: true,
    }),
  ])
  const outputDirectory = path.resolve(process.cwd(), 'public', 'fixture-assets', 'game-data')
  const generatedMediaFile = path.resolve(
    process.cwd(),
    'src',
    'fixtures',
    'gameDataMedia.generated.ts',
  )
  const generatedSnapshotFile = path.resolve(
    process.cwd(),
    'src',
    'fixtures',
    'gameDataSnapshot.generated.ts',
  )
  const usedKeys = new Set<string>()
  const mediaKeysByID = new Map<string, string>()
  const assets: {
    alt: string
    filename: string
    fixtureKey: string
    matchFilename: string
    publicPath: string
  }[] = []

  await mkdir(outputDirectory, { recursive: true })

  for (const media of mediaResult.docs) {
    if (!media.filename) {
      throw new Error(`Media ${media.id} has no filename.`)
    }

    const baseKey = media.assetKey || `media-${slugify(media.filename)}`
    let fixtureKey = baseKey
    let suffix = 2

    while (usedKeys.has(fixtureKey)) {
      fixtureKey = `${baseKey}-${suffix}`
      suffix += 1
    }

    usedKeys.add(fixtureKey)
    mediaKeysByID.set(String(media.id), fixtureKey)

    const targetFilename = `${fixtureKey}.webp`
    const sourcePath = path.resolve(process.cwd(), 'media', media.filename)
    const targetPath = path.join(outputDirectory, targetFilename)

    await sharp(sourcePath)
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(targetPath)

    assets.push({
      fixtureKey,
      alt: media.alt || media.filename,
      filename: targetFilename,
      matchFilename: media.filename,
      publicPath: `/fixture-assets/game-data/${targetFilename}`,
    })
  }

  assets.sort((left, right) => left.fixtureKey.localeCompare(right.fixtureKey))

  const boxedSetKeysByID = mapByID(boxedSetResult.docs, (document) => document.key, 'Boxed set')
  const neighborhoodKeysByID = mapByID(
    neighborhoodResult.docs,
    (document) => document.key,
    'Neighborhood',
  )
  const locationKeysByID = mapByID(locationResult.docs, (document) => document.key, 'Location')
  const otherWorldKeysByID = mapByID(
    otherWorldResult.docs,
    (document) => document.key,
    'Other World',
  )

  const boxedSets = boxedSetResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    setOptionalRelationship(
      snapshot,
      'icon',
      optionalRelationshipKey(document.icon, mediaKeysByID, `Boxed set ${document.key} icon`),
    )
    return snapshot
  })
  const ancientOnes = ancientOneResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Ancient One ${document.key} source set`,
    )
    snapshot.sheets = document.sheets.map((sheet) => {
      const portableSheet = cleanDocument(sheet)
      setOptionalRelationship(
        portableSheet,
        'sheetImage',
        optionalRelationshipKey(
          sheet.sheetImage,
          mediaKeysByID,
          `Ancient One ${document.key} sheet ${sheet.key} image`,
        ),
      )
      return portableSheet
    })
    return snapshot
  })
  const neighborhoods = neighborhoodResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Neighborhood ${document.key} source set`,
    )
    setOptionalRelationship(
      snapshot,
      'frontFrame',
      optionalRelationshipKey(
        document.frontFrame,
        mediaKeysByID,
        `Neighborhood ${document.key} front frame`,
      ),
    )
    setOptionalRelationship(
      snapshot,
      'backFrame',
      optionalRelationshipKey(
        document.backFrame,
        mediaKeysByID,
        `Neighborhood ${document.key} back frame`,
      ),
    )
    return snapshot
  })
  const locations = locationResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Location ${document.key} source set`,
    )
    snapshot.neighborhood = requiredRelationshipKey(
      document.neighborhood,
      neighborhoodKeysByID,
      `Location ${document.key} neighborhood`,
    )
    setOptionalRelationship(
      snapshot,
      'cardImage',
      optionalRelationshipKey(document.cardImage, mediaKeysByID, `Location ${document.key} image`),
    )
    return snapshot
  })
  const arkhamEncounterCards = arkhamEncounterResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Arkham encounter ${document.cardCode} source set`,
    )
    snapshot.neighborhood = requiredRelationshipKey(
      document.neighborhood,
      neighborhoodKeysByID,
      `Arkham encounter ${document.cardCode} neighborhood`,
    )
    snapshot.encounters = document.encounters.map((encounter) => ({
      ...cleanDocument(encounter),
      location: requiredRelationshipKey(
        encounter.location,
        locationKeysByID,
        `Arkham encounter ${document.cardCode} location`,
      ),
    }))
    return snapshot
  })
  const mythosCards = mythosResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Mythos card ${document.cardCode} source set`,
    )
    snapshot.gateInstruction = {
      ...cleanDocument(document.gateInstruction),
      locations: (document.gateInstruction?.locations ?? []).map((location) =>
        requiredRelationshipKey(
          location,
          locationKeysByID,
          `Mythos card ${document.cardCode} gate location`,
        ),
      ),
    }
    const lowerLeftOverride = cleanDocument(document.lowerLeftOverride)
    setOptionalRelationship(
      lowerLeftOverride,
      'image',
      optionalRelationshipKey(
        document.lowerLeftOverride?.image,
        mediaKeysByID,
        `Mythos card ${document.cardCode} lower-left image`,
      ),
    )
    snapshot.lowerLeftOverride = lowerLeftOverride
    return snapshot
  })
  const otherWorlds = otherWorldResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Other World ${document.key} source set`,
    )
    setOptionalRelationship(
      snapshot,
      'art',
      optionalRelationshipKey(document.art, mediaKeysByID, `Other World ${document.key} art`),
    )
    return snapshot
  })
  const otherWorldEncounterCards = otherWorldEncounterResult.docs.map((document) => {
    const snapshot = cleanDocument(document)
    snapshot.sourceSet = requiredRelationshipKey(
      document.sourceSet,
      boxedSetKeysByID,
      `Other World encounter ${document.cardCode} source set`,
    )
    snapshot.encounters = document.encounters.map((encounter) => {
      const portableEncounter = cleanDocument(encounter)
      setOptionalRelationship(
        portableEncounter,
        'destination',
        optionalRelationshipKey(
          encounter.destination,
          otherWorldKeysByID,
          `Other World encounter ${document.cardCode} destination`,
        ),
      )
      return portableEncounter
    })
    return snapshot
  })

  const relationships = {
    boxedSetIcons: Object.fromEntries(
      boxedSets
        .map((boxedSet) => [boxedSet.key, boxedSet.icon])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
    locationImages: Object.fromEntries(
      locations
        .map((location) => [location.key, location.cardImage])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
    mythosLowerLeftImages: Object.fromEntries(
      mythosCards
        .map((card) => [
          card.cardCode,
          (card.lowerLeftOverride as Record<string, unknown> | undefined)?.image,
        ])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
    otherWorldArt: Object.fromEntries(
      otherWorlds
        .map((world) => [world.key, world.art])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  }
  const mediaSource = `/* This file is generated by src/scripts/generateGameDataMediaFixture.ts. */\n\nexport const generatedGameDataMedia = ${JSON.stringify(
    {
      assets,
      relationships,
    },
    null,
    2,
  )} as const\n`
  const snapshotSource = `/* This file is generated by src/scripts/generateGameDataMediaFixture.ts. */\n\nimport type { GameDataSnapshot } from './gameDataSnapshotTypes'\n\nexport const generatedGameDataSnapshot: GameDataSnapshot = ${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      excludedCollections: ['users', 'game-sessions', 'fixture-installations'],
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
    },
    null,
    2,
  )} as const\n`

  await Promise.all([
    writeFile(generatedMediaFile, mediaSource),
    writeFile(generatedSnapshotFile, snapshotSource),
  ])
  payload.logger.info(
    `Snapshotted ${assets.length} media assets and ${
      boxedSets.length +
      ancientOnes.length +
      neighborhoods.length +
      locations.length +
      arkhamEncounterCards.length +
      mythosCards.length +
      otherWorlds.length +
      otherWorldEncounterCards.length
    } game documents.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
