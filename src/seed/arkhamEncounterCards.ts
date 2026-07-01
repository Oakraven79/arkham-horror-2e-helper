import type { Payload } from 'payload'

import {
  starterArkhamEncounterCards,
  type ArkhamEncounterCardFixture,
} from '@/content/arkhamEncounterCards'
import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION } from '@/fixtures/gameData'
import { relationshipID, requireBoxedSet } from '@/lib/boxedSetContent'
import type { ArkhamEncounterCard, BoxedSet, Location, Neighborhood } from '@/payload-types'

export interface SeedArkhamEncounterCardsOptions {
  dryRun?: boolean
}

function requireFixtureDependency<T>(valuesByKey: Map<string, T>, key: string, label: string) {
  const value = valuesByKey.get(key)

  if (!value) {
    throw new Error(`Missing ${label} fixture dependency: ${key}`)
  }

  return value
}

function fixtureMetadata(
  fixture: ArkhamEncounterCardFixture,
  sourceSet: BoxedSet,
  neighborhood: Neighborhood,
  locationsByKey: Map<string, Location>,
) {
  return {
    cardCode: fixture.cardCode,
    neighborhood: neighborhood.id,
    encounters: fixture.encounters.map((encounter) => ({
      location: requireFixtureDependency(locationsByKey, encounter.locationKey, 'location').id,
      text: encounter.text,
    })),
    sourceSet: sourceSet.id,
    clarifications: fixture.clarifications,
    fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
    fixtureVersion: GAME_DATA_FIXTURE_VERSION,
  }
}

function comparableDocument(card: ArkhamEncounterCard) {
  return {
    cardCode: card.cardCode,
    neighborhood: relationshipID(card.neighborhood) ?? undefined,
    encounters: card.encounters.map((encounter) => ({
      location: relationshipID(encounter.location) ?? undefined,
      text: encounter.text,
    })),
    sourceSet: relationshipID(card.sourceSet) ?? undefined,
    clarifications: card.clarifications ?? undefined,
    fixtureNamespace: card.fixtureNamespace ?? undefined,
    fixtureVersion: card.fixtureVersion ?? undefined,
  }
}

export async function seedArkhamEncounterCards(
  payload: Payload,
  options: SeedArkhamEncounterCardsOptions = {},
) {
  const dryRun = options.dryRun ?? false
  const [existingResult, boxedSetResult, neighborhoodResult, locationResult] = await Promise.all([
    payload.find({
      collection: 'arkham-encounter-cards',
      depth: 0,
      draft: true,
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
      collection: 'neighborhoods',
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
  ])
  const cardsByCode = new Map(existingResult.docs.map((card) => [card.cardCode, card]))
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const neighborhoodsByKey = new Map(
    neighborhoodResult.docs.map((neighborhood) => [neighborhood.key, neighborhood]),
  )
  const locationsByKey = new Map(locationResult.docs.map((location) => [location.key, location]))
  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []

  for (const fixture of starterArkhamEncounterCards) {
    const existing = cardsByCode.get(fixture.cardCode)
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)
    const neighborhood = requireFixtureDependency(
      neighborhoodsByKey,
      fixture.neighborhoodKey,
      'neighborhood',
    )
    const metadata = fixtureMetadata(fixture, sourceSet, neighborhood, locationsByKey)
    const expected = {
      ...metadata,
      neighborhood: String(neighborhood.id),
      sourceSet: String(sourceSet.id),
      encounters: metadata.encounters.map((encounter) => ({
        ...encounter,
        location: String(encounter.location),
      })),
    }

    if (!existing) {
      created.push(fixture.cardCode)

      if (!dryRun) {
        await payload.create({
          collection: 'arkham-encounter-cards',
          data: {
            ...metadata,
            _status: 'published',
          },
          draft: false,
          overrideAccess: true,
        })
      }

      continue
    }

    if (JSON.stringify(comparableDocument(existing)) === JSON.stringify(expected)) {
      unchanged.push(fixture.cardCode)
      continue
    }

    enriched.push(fixture.cardCode)

    if (!dryRun) {
      await payload.update({
        collection: 'arkham-encounter-cards',
        id: existing.id,
        data: {
          ...metadata,
          _status: existing._status,
        },
        draft: existing._status === 'draft',
        overrideAccess: true,
      })
    }
  }

  return {
    created,
    dryRun,
    enriched,
    unchanged,
  }
}
