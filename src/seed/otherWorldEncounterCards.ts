import type { Payload } from 'payload'

import {
  starterOtherWorldEncounterCards,
  type OtherWorldEncounterCardFixture,
} from '@/content/otherWorldEncounterCards'
import {
  GAME_DATA_FIXTURE_NAMESPACE,
  GAME_DATA_FIXTURE_VERSION,
} from '@/fixtures/gameData'
import {
  officialBoxedSetName,
  relationshipID,
  requireBoxedSet,
} from '@/lib/boxedSetContent'
import type {
  BoxedSet,
  OtherWorld,
  OtherWorldEncounterCard,
} from '@/payload-types'

export interface SeedOtherWorldEncounterCardsOptions {
  dryRun?: boolean
}

function fixtureMetadata(
  fixture: OtherWorldEncounterCardFixture,
  sourceSet: BoxedSet,
  worldsByKey: Map<string, OtherWorld>,
) {
  return {
    cardCode: fixture.cardCode,
    colour: fixture.colour,
    encounters: fixture.encounters.map((encounter) => ({
      isOther: encounter.isOther ?? false,
      destination: encounter.destinationKey
        ? requireOtherWorld(worldsByKey, encounter.destinationKey).id
        : undefined,
      text: encounter.text,
    })),
    boxedSet: officialBoxedSetName(
      fixture.sourceSetKey,
    ) as OtherWorldEncounterCard['boxedSet'],
    sourceSet: sourceSet.id,
    clarifications: fixture.clarifications,
    fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
    fixtureVersion: GAME_DATA_FIXTURE_VERSION,
  }
}

function requireOtherWorld(worldsByKey: Map<string, OtherWorld>, key: string) {
  const world = worldsByKey.get(key)

  if (!world) {
    throw new Error(`Missing Other World fixture dependency: ${key}`)
  }

  return world
}

function comparableDocument(card: OtherWorldEncounterCard) {
  return {
    cardCode: card.cardCode,
    colour: card.colour,
    encounters: card.encounters.map((encounter) => ({
      isOther: encounter.isOther ?? false,
      destination: relationshipID(encounter.destination) ?? undefined,
      text: encounter.text,
    })),
    boxedSet: card.boxedSet,
    sourceSet: relationshipID(card.sourceSet) ?? undefined,
    clarifications: card.clarifications ?? undefined,
    fixtureNamespace: card.fixtureNamespace ?? undefined,
    fixtureVersion: card.fixtureVersion ?? undefined,
  }
}

export async function seedOtherWorldEncounterCards(
  payload: Payload,
  options: SeedOtherWorldEncounterCardsOptions = {},
) {
  const dryRun = options.dryRun ?? false
  const [existing, boxedSetResult, otherWorldResult] = await Promise.all([
    payload.find({
      collection: 'other-world-encounter-cards',
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
      collection: 'other-worlds',
      depth: 0,
      draft: true,
      limit: 1000,
      overrideAccess: true,
    }),
  ])
  const cardsByCode = new Map(existing.docs.map((card) => [card.cardCode, card]))
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const boxedSetsByID = new Map(
    boxedSetResult.docs.map((boxedSet) => [String(boxedSet.id), boxedSet]),
  )
  const worldsByKey = new Map(otherWorldResult.docs.map((world) => [world.key, world]))
  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []
  const conflicts: string[] = []

  for (const fixture of starterOtherWorldEncounterCards) {
    const card = cardsByCode.get(fixture.cardCode)
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)

    if (
      card &&
      card.fixtureNamespace !== GAME_DATA_FIXTURE_NAMESPACE &&
      (card.boxedSet === 'Custom' ||
        boxedSetsByID.get(relationshipID(card.sourceSet) ?? '')?.category === 'custom')
    ) {
      conflicts.push(fixture.cardCode)
      continue
    }

    const metadata = fixtureMetadata(fixture, sourceSet, worldsByKey)

    if (!card) {
      created.push(fixture.cardCode)

      if (!dryRun) {
        await payload.create({
          collection: 'other-world-encounter-cards',
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

    const expected = {
      ...metadata,
      sourceSet: String(sourceSet.id),
      encounters: metadata.encounters.map((encounter) => ({
        ...encounter,
        destination: encounter.destination ? String(encounter.destination) : undefined,
      })),
    }

    if (JSON.stringify(comparableDocument(card)) === JSON.stringify(expected)) {
      unchanged.push(fixture.cardCode)
      continue
    }

    enriched.push(fixture.cardCode)

    if (!dryRun) {
      await payload.update({
        collection: 'other-world-encounter-cards',
        id: card.id,
        data: {
          ...metadata,
          _status: card._status,
        },
        draft: card._status === 'draft',
        overrideAccess: true,
      })
    }
  }

  if (!dryRun && conflicts.length > 0) {
    throw new Error(`Custom Other World encounter card conflicts: ${conflicts.join(', ')}`)
  }

  return {
    conflicts,
    created,
    dryRun,
    enriched,
    unchanged,
  }
}
