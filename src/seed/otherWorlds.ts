import type { Payload } from 'payload'

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
  const existing = await payload.find({
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
  })

  const missing = getMissingStarterOtherWorlds(existing.docs.map((world) => world.key))

  for (const world of missing) {
    await payload.create({
      collection: 'other-worlds',
      data: {
        ...world,
        boxedSet: 'Base Game',
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
