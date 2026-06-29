import type { Payload } from 'payload'

import { officialBoxedSets } from '@/content/boxedSets'
import type { BoxedSetFixture } from '@/content/boxedSetTypes'
import type { BoxedSet } from '@/payload-types'

export interface SeedBoxedSetsOptions {
  dryRun?: boolean
}

function comparableDocument(boxedSet: BoxedSet) {
  return {
    name: boxedSet.name,
    key: boxedSet.key,
    category: boxedSet.category,
    abbreviation: boxedSet.abbreviation,
    sortOrder: boxedSet.sortOrder,
    aliases: (boxedSet.aliases ?? []).map((alias) => alias.name),
  }
}

function fixtureMetadata(boxedSet: BoxedSetFixture) {
  return {
    name: boxedSet.name,
    key: boxedSet.key,
    category: boxedSet.category,
    abbreviation: boxedSet.abbreviation,
    sortOrder: boxedSet.sortOrder,
    aliases: boxedSet.aliases.map((name) => ({ name })),
  }
}

function fixtureComparable(boxedSet: BoxedSetFixture) {
  return {
    ...fixtureMetadata(boxedSet),
    aliases: [...boxedSet.aliases],
  }
}

export async function seedBoxedSets(payload: Payload, options: SeedBoxedSetsOptions = {}) {
  const dryRun = options.dryRun ?? false
  const existing = await payload.find({
    collection: 'boxed-sets',
    depth: 0,
    draft: true,
    limit: 100,
    overrideAccess: true,
  })
  const byKey = new Map(existing.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const byName = new Map(existing.docs.map((boxedSet) => [boxedSet.name, boxedSet]))
  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []

  for (const fixture of officialBoxedSets) {
    const boxedSet = byKey.get(fixture.key) ?? byName.get(fixture.name)

    if (!boxedSet) {
      created.push(fixture.name)

      if (dryRun) continue

      await payload.create({
        collection: 'boxed-sets',
        data: {
          ...fixtureMetadata(fixture),
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    if (
      JSON.stringify(comparableDocument(boxedSet)) === JSON.stringify(fixtureComparable(fixture))
    ) {
      unchanged.push(fixture.name)
      continue
    }

    enriched.push(fixture.name)

    if (dryRun) continue

    await payload.update({
      collection: 'boxed-sets',
      id: boxedSet.id,
      data: {
        ...fixtureMetadata(fixture),
        _status: boxedSet._status,
      },
      draft: boxedSet._status === 'draft',
      overrideAccess: true,
    })
  }

  return {
    created,
    dryRun,
    enriched,
    unchanged,
  }
}
