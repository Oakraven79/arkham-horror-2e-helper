import type { Payload } from 'payload'

import { starterOtherWorlds, type OtherWorldFixture } from '@/content/otherWorlds'
import {
  GAME_DATA_FIXTURE_NAMESPACE,
  GAME_DATA_FIXTURE_VERSION,
} from '@/fixtures/gameData'
import {
  fixtureRequiredSetKeys,
  officialBoxedSetName,
  relationshipID,
  requireBoxedSet,
  requireBoxedSets,
} from '@/lib/boxedSetContent'
import type { BoxedSet, OtherWorld } from '@/payload-types'

export { starterOtherWorlds } from '@/content/otherWorlds'

export interface SeedOtherWorldsOptions {
  dryRun?: boolean
}

export function getMissingStarterOtherWorlds(existingKeys: Iterable<string>) {
  const existing = new Set(existingKeys)

  return starterOtherWorlds.filter((world) => !existing.has(world.key))
}

function fixtureMetadata(
  fixture: OtherWorldFixture,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
) {
  return {
    name: fixture.name,
    key: fixture.key,
    preferredColours: [...fixture.preferredColours],
    boxedSet: officialBoxedSetName(fixture.sourceSetKey) as OtherWorld['boxedSet'],
    sourceSet: sourceSet.id,
    requiredSets: requiredSets.map((boxedSet) => boxedSet.id),
    fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
    fixtureVersion: GAME_DATA_FIXTURE_VERSION,
  }
}

function comparableDocument(world: OtherWorld) {
  const requiredSets = (world.requiredSets ?? [])
    .map(relationshipID)
    .filter((id): id is string => Boolean(id))

  return {
    name: world.name,
    key: world.key,
    preferredColours: [...(world.preferredColours ?? [])],
    boxedSet: world.boxedSet,
    sourceSet: relationshipID(world.sourceSet) ?? undefined,
    requiredSets:
      requiredSets.length > 0
        ? requiredSets
        : [relationshipID(world.sourceSet)].filter((id): id is string => Boolean(id)),
    fixtureNamespace: world.fixtureNamespace ?? undefined,
    fixtureVersion: world.fixtureVersion ?? undefined,
  }
}

export async function seedOtherWorlds(
  payload: Payload,
  options: SeedOtherWorldsOptions = {},
) {
  const dryRun = options.dryRun ?? false
  const [existing, boxedSetResult] = await Promise.all([
    payload.find({
      collection: 'other-worlds',
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
  ])
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const boxedSetsByID = new Map(
    boxedSetResult.docs.map((boxedSet) => [String(boxedSet.id), boxedSet]),
  )
  const worldsByKey = new Map(existing.docs.map((world) => [world.key, world]))
  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []
  const conflicts: string[] = []

  for (const fixture of starterOtherWorlds) {
    const world = worldsByKey.get(fixture.key)
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)
    const requiredSets = requireBoxedSets(boxedSetsByKey, fixtureRequiredSetKeys(fixture))

    if (
      world &&
      world.fixtureNamespace !== GAME_DATA_FIXTURE_NAMESPACE &&
      (world.boxedSet === 'Custom' ||
        boxedSetsByID.get(relationshipID(world.sourceSet) ?? '')?.category === 'custom')
    ) {
      conflicts.push(fixture.key)
      continue
    }

    const metadata = fixtureMetadata(fixture, requiredSets, sourceSet)

    if (!world) {
      created.push(fixture.name)

      if (!dryRun) {
        await payload.create({
          collection: 'other-worlds',
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
      requiredSets: requiredSets.map((boxedSet) => String(boxedSet.id)),
    }

    if (JSON.stringify(comparableDocument(world)) === JSON.stringify(expected)) {
      unchanged.push(fixture.name)
      continue
    }

    enriched.push(fixture.name)

    if (!dryRun) {
      await payload.update({
        collection: 'other-worlds',
        id: world.id,
        data: {
          ...metadata,
          _status: world._status,
        },
        draft: world._status === 'draft',
        overrideAccess: true,
      })
    }
  }

  if (!dryRun && conflicts.length > 0) {
    throw new Error(`Custom Other World key conflicts: ${conflicts.join(', ')}`)
  }

  return {
    conflicts,
    created,
    dryRun,
    enriched,
    existing: unchanged,
    unchanged,
  }
}
