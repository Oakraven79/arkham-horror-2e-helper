import { describe, expect, it } from 'vitest'

import { getOfficialBoxedSet, officialBoxedSets } from '@/content/boxedSets'

describe('Boxed Set starter content', () => {
  it('contains eleven uniquely keyed official sets in display order', () => {
    expect(officialBoxedSets).toHaveLength(11)
    expect(new Set(officialBoxedSets.map((boxedSet) => boxedSet.key)).size).toBe(11)
    expect(new Set(officialBoxedSets.map((boxedSet) => boxedSet.name)).size).toBe(11)
    expect(officialBoxedSets.map((boxedSet) => boxedSet.sortOrder)).toEqual([
      10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110,
    ])
  })

  it('maps source aliases to distinct official records', () => {
    const aliases = new Map<string, string>()

    for (const boxedSet of officialBoxedSets) {
      for (const name of [boxedSet.name, boxedSet.key, ...boxedSet.aliases]) {
        const normalized = name.trim().toLowerCase()
        const existing = aliases.get(normalized)

        expect(existing === undefined || existing === boxedSet.key).toBe(true)
        aliases.set(normalized, boxedSet.key)
      }
    }

    expect(getOfficialBoxedSet('curse-dark-pharaoh-revised')).toMatchObject({
      abbreviation: 'DP-R',
      aliases: expect.arrayContaining(['Curse of the Dark Pharaoh']),
    })
    expect(getOfficialBoxedSet('promotional')).toMatchObject({
      name: 'Promotional',
      category: 'promotional',
    })
  })
})
