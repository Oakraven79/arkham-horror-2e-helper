import type { Payload } from 'payload'

import { officialBoxedSetName, requireBoxedSet } from '@/lib/boxedSetContent'
import type { OtherWorld } from '@/payload-types'

export const starterOtherWorlds = [
  {
    key: 'abyss',
    name: 'Abyss',
  },
  {
    key: 'celano',
    name: 'Celano',
  },
  {
    key: 'the-dreamlands',
    name: 'The Dreamlands',
  },
  {
    key: 'city-of-the-great-race',
    name: 'City Of The Great Race',
  },
  {
    key: 'rlyeh',
    name: "R'lyeh",
  },
] as const

export function getMissingStarterOtherWorlds(existingKeys: Iterable<string>) {
  const existing = new Set(existingKeys)

  return starterOtherWorlds.filter((world) => !existing.has(world.key))
}

export async function seedOtherWorlds(payload: Payload) {
  const [existing, boxedSetResult] = await Promise.all([
    payload.find({
      collection: 'other-worlds',
      depth: 0,
      draft: true,
      limit: starterOtherWorlds.length,
      overrideAccess: true,
      where: {
        key: {
          in: starterOtherWorlds.map((world) => world.key),
        },
      },
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
  const baseGame = requireBoxedSet(boxedSetsByKey, 'base-game')

  const missing = getMissingStarterOtherWorlds(existing.docs.map((world) => world.key))

  for (const world of missing) {
    await payload.create({
      collection: 'other-worlds',
      data: {
        ...world,
        boxedSet: officialBoxedSetName('base-game') as OtherWorld['boxedSet'],
        sourceSet: baseGame.id,
        _status: 'published',
      },
      draft: false,
      overrideAccess: true,
    })
  }

  return {
    created: missing.map((world) => world.name),
    existing: existing.docs.map((world) => world.name),
  }
}
