import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { Payload } from 'payload'

import { relationshipID } from '@/lib/boxedSetContent'
import { seedBoxedSets } from '@/seed/boxedSets'
import { seedLocations } from '@/seed/locations'
import { ensureSeedMedia } from '@/seed/media'
import { seedMythosCards } from '@/seed/mythosCards'
import { seedOtherWorldEncounterCards } from '@/seed/otherWorldEncounterCards'
import { seedOtherWorlds } from '@/seed/otherWorlds'

import { gameDataFixture } from './gameData'

export interface GameDataFixtureValidation {
  checksum: string
  counts: {
    boxedSets: number
    locations: number
    media: number
    mythosCards: number
    otherWorldEncounterCards: number
    otherWorlds: number
  }
  errors: string[]
  namespace: string
  valid: boolean
  version: number
  warnings: string[]
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

function assetPath(publicPath: string) {
  return path.resolve(process.cwd(), 'public', publicPath.replace(/^\/+/, ''))
}

async function applyGameDataMediaRelationships(payload: Payload) {
  const [mediaResult, boxedSetResult, locationResult, mythosResult, otherWorldResult] =
    await Promise.all([
      payload.find({
        collection: 'media',
        depth: 0,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'boxed-sets',
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'locations',
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'mythos-cards',
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'other-worlds',
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      }),
    ])
  const mediaByKey = new Map(
    mediaResult.docs
      .filter((media) => media.assetKey)
      .map((media) => [media.assetKey as string, media]),
  )
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const locationsByKey = new Map(locationResult.docs.map((location) => [location.key, location]))
  const mythosByCode = new Map(mythosResult.docs.map((card) => [card.cardCode, card]))
  const otherWorldsByKey = new Map(otherWorldResult.docs.map((world) => [world.key, world]))
  const result = {
    boxedSetIcons: { updated: [] as string[], unchanged: [] as string[] },
    locationImages: { updated: [] as string[], unchanged: [] as string[] },
    mythosLowerLeftImages: { updated: [] as string[], unchanged: [] as string[] },
    otherWorldArt: { updated: [] as string[], unchanged: [] as string[] },
  }
  const requireMediaID = (assetKey: string) => {
    const media = mediaByKey.get(assetKey)

    if (!media) {
      throw new Error(`Fixture media was not loaded: ${assetKey}`)
    }

    return String(media.id)
  }

  for (const [boxedSetKey, assetKey] of Object.entries(
    gameDataFixture.mediaRelationships.boxedSetIcons as Record<string, string>,
  )) {
    const boxedSet = boxedSetsByKey.get(boxedSetKey)
    if (!boxedSet) throw new Error(`Missing boxed set for media relationship: ${boxedSetKey}`)

    const mediaID = requireMediaID(assetKey)
    if (relationshipID(boxedSet.icon) === mediaID) {
      result.boxedSetIcons.unchanged.push(boxedSetKey)
      continue
    }

    result.boxedSetIcons.updated.push(boxedSetKey)
    await payload.update({
      collection: 'boxed-sets',
      id: boxedSet.id,
      data: { icon: mediaID, _status: boxedSet._status },
      draft: boxedSet._status === 'draft',
      overrideAccess: true,
    })
  }

  for (const [locationKey, assetKey] of Object.entries(
    gameDataFixture.mediaRelationships.locationImages as Record<string, string>,
  )) {
    const location = locationsByKey.get(locationKey)
    if (!location) throw new Error(`Missing location for media relationship: ${locationKey}`)

    const mediaID = requireMediaID(assetKey)
    if (relationshipID(location.cardImage) === mediaID) {
      result.locationImages.unchanged.push(locationKey)
      continue
    }

    result.locationImages.updated.push(locationKey)
    await payload.update({
      collection: 'locations',
      id: location.id,
      data: { cardImage: mediaID, _status: location._status },
      draft: location._status === 'draft',
      overrideAccess: true,
    })
  }

  for (const [cardCode, assetKey] of Object.entries(
    gameDataFixture.mediaRelationships.mythosLowerLeftImages as Record<string, string>,
  )) {
    const card = mythosByCode.get(cardCode)
    if (!card) throw new Error(`Missing Mythos card for media relationship: ${cardCode}`)

    const mediaID = requireMediaID(assetKey)
    if (relationshipID(card.lowerLeftOverride?.image) === mediaID) {
      result.mythosLowerLeftImages.unchanged.push(cardCode)
      continue
    }

    result.mythosLowerLeftImages.updated.push(cardCode)
    await payload.update({
      collection: 'mythos-cards',
      id: card.id,
      data: {
        lowerLeftOverride: {
          text: card.lowerLeftOverride?.text,
          image: mediaID,
        },
        _status: card._status,
      },
      draft: card._status === 'draft',
      overrideAccess: true,
    })
  }

  for (const [worldKey, assetKey] of Object.entries(
    gameDataFixture.mediaRelationships.otherWorldArt as Record<string, string>,
  )) {
    const world = otherWorldsByKey.get(worldKey)
    if (!world) throw new Error(`Missing Other World for media relationship: ${worldKey}`)

    const mediaID = requireMediaID(assetKey)
    if (relationshipID(world.art) === mediaID) {
      result.otherWorldArt.unchanged.push(worldKey)
      continue
    }

    result.otherWorldArt.updated.push(worldKey)
    await payload.update({
      collection: 'other-worlds',
      id: world.id,
      data: { art: mediaID, _status: world._status },
      draft: world._status === 'draft',
      overrideAccess: true,
    })
  }

  return result
}

export function validateGameDataFixture(): GameDataFixtureValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const boxedSetKeys = new Set(gameDataFixture.boxedSets.map((boxedSet) => boxedSet.key))
  const locationKeys = new Set(gameDataFixture.locations.map((location) => location.key))
  const otherWorldKeys = new Set(gameDataFixture.otherWorlds.map((world) => world.key))
  const mediaByPublicPath = new Map(
    gameDataFixture.media.map((asset) => [asset.publicPath, asset]),
  )
  const mediaKeys = new Set(gameDataFixture.media.map((asset) => asset.fixtureKey))

  const duplicateChecks = [
    ['media asset keys', duplicateValues(gameDataFixture.media.map((asset) => asset.fixtureKey))],
    ['media filenames', duplicateValues(gameDataFixture.media.map((asset) => asset.filename))],
    ['boxed set keys', duplicateValues(gameDataFixture.boxedSets.map((boxedSet) => boxedSet.key))],
    ['location keys', duplicateValues(gameDataFixture.locations.map((location) => location.key))],
    [
      'Mythos card codes',
      duplicateValues(gameDataFixture.mythosCards.map((card) => card.cardCode)),
    ],
    ['Other World keys', duplicateValues(gameDataFixture.otherWorlds.map((world) => world.key))],
    [
      'Other World encounter card codes',
      duplicateValues(
        gameDataFixture.otherWorldEncounterCards.map((card) => card.cardCode),
      ),
    ],
  ] as const

  for (const [label, duplicates] of duplicateChecks) {
    if (duplicates.length > 0) {
      errors.push(`Duplicate ${label}: ${duplicates.join(', ')}`)
    }
  }

  for (const asset of gameDataFixture.media) {
    if (!existsSync(assetPath(asset.publicPath))) {
      errors.push(`Missing media asset: ${asset.publicPath}`)
    }
  }

  for (const location of gameDataFixture.locations) {
    if (!boxedSetKeys.has(location.sourceSetKey)) {
      errors.push(`Location ${location.key} has unknown boxed set ${location.sourceSetKey}`)
    }

    if (
      location.image &&
      !mediaKeys.has(location.image.fixtureKey) &&
      !mediaByPublicPath.has(location.image.publicPath)
    ) {
      errors.push(
        `Location ${location.key} has unregistered media ${location.image.fixtureKey}`,
      )
    }
  }

  for (const card of gameDataFixture.mythosCards) {
    if (!boxedSetKeys.has(card.sourceSetKey)) {
      errors.push(`Mythos card ${card.cardCode} has unknown boxed set ${card.sourceSetKey}`)
    }

    for (const locationKey of card.gateInstruction.locationKeys) {
      if (!locationKeys.has(locationKey)) {
        errors.push(`Mythos card ${card.cardCode} has unknown location ${locationKey}`)
      }
    }

    if (
      card.lowerLeftOverride?.imagePublicPath &&
      !(gameDataFixture.mediaRelationships.mythosLowerLeftImages as Record<string, string>)[
        card.cardCode
      ] &&
      !mediaByPublicPath.has(card.lowerLeftOverride.imagePublicPath)
    ) {
      errors.push(
        `Mythos card ${card.cardCode} has unregistered media ${card.lowerLeftOverride.imagePublicPath}`,
      )
    }
  }

  for (const world of gameDataFixture.otherWorlds) {
    if (!boxedSetKeys.has(world.sourceSetKey)) {
      errors.push(`Other World ${world.key} has unknown boxed set ${world.sourceSetKey}`)
    }
  }

  for (const card of gameDataFixture.otherWorldEncounterCards) {
    if (!boxedSetKeys.has(card.sourceSetKey)) {
      errors.push(`Encounter card ${card.cardCode} has unknown boxed set ${card.sourceSetKey}`)
    }

    if (card.encounters.length !== 3) {
      errors.push(`Encounter card ${card.cardCode} must contain exactly three encounters`)
    }

    if (card.encounters.filter((encounter) => encounter.isOther).length !== 1) {
      errors.push(`Encounter card ${card.cardCode} must contain exactly one Other encounter`)
    }

    for (const encounter of card.encounters) {
      if (encounter.destinationKey && !otherWorldKeys.has(encounter.destinationKey)) {
        errors.push(
          `Encounter card ${card.cardCode} has unknown Other World ${encounter.destinationKey}`,
        )
      }
    }
  }

  for (const [relationshipType, relationships] of Object.entries(
    gameDataFixture.mediaRelationships,
  )) {
    for (const assetKey of Object.values(relationships as Record<string, string>)) {
      if (!mediaKeys.has(assetKey)) {
        errors.push(`${relationshipType} references unknown media asset ${assetKey}`)
      }
    }
  }

  if (gameDataFixture.media.length === 0) {
    warnings.push('The fixture contains no Payload media assets.')
  }

  const checksum = createHash('sha256')
  checksum.update(
    JSON.stringify({
      ...gameDataFixture,
      media: gameDataFixture.media.map((asset) => ({
        ...asset,
        fileHash: existsSync(assetPath(asset.publicPath))
          ? createHash('sha256').update(readFileSync(assetPath(asset.publicPath))).digest('hex')
          : null,
      })),
    }),
  )

  return {
    checksum: checksum.digest('hex'),
    counts: {
      boxedSets: gameDataFixture.boxedSets.length,
      locations: gameDataFixture.locations.length,
      media: gameDataFixture.media.length,
      mythosCards: gameDataFixture.mythosCards.length,
      otherWorldEncounterCards: gameDataFixture.otherWorldEncounterCards.length,
      otherWorlds: gameDataFixture.otherWorlds.length,
    },
    errors,
    namespace: gameDataFixture.namespace,
    valid: errors.length === 0,
    version: gameDataFixture.version,
    warnings,
  }
}

export async function loadGameDataFixture(payload: Payload) {
  const validation = validateGameDataFixture()

  if (!validation.valid) {
    throw new Error(`Game data fixture is invalid: ${validation.errors.join('; ')}`)
  }

  const media = {
    created: [] as string[],
    updated: [] as string[],
    unchanged: [] as string[],
  }

  for (const asset of gameDataFixture.media) {
    const result = await ensureSeedMedia(payload, asset)

    if (result.created) {
      media.created.push(asset.fixtureKey)
    } else if (result.updated) {
      media.updated.push(asset.fixtureKey)
    } else {
      media.unchanged.push(asset.fixtureKey)
    }
  }

  const boxedSets = await seedBoxedSets(payload)
  const locations = await seedLocations(payload)
  const otherWorlds = await seedOtherWorlds(payload)
  const mythosCards = await seedMythosCards(payload)
  const otherWorldEncounterCards = await seedOtherWorldEncounterCards(payload)
  const mediaRelationships = await applyGameDataMediaRelationships(payload)

  return {
    validation,
    collections: {
      media,
      boxedSets,
      locations,
      mythosCards,
      otherWorlds,
      otherWorldEncounterCards,
      mediaRelationships,
    },
  }
}
