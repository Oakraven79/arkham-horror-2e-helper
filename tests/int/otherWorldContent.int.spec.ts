import { describe, expect, it } from 'vitest'

import { validateOtherWorldEncounterRows } from '@/lib/otherWorldContent'
import {
  getMissingStarterOtherWorlds,
  starterOtherWorlds,
} from '@/seed/otherWorlds'

describe('Other World encounter content validation', () => {
  it('accepts two distinct destinations and one Other fallback', () => {
    expect(
      validateOtherWorldEncounterRows([
        { destination: 'abyss' },
        { destination: { id: 'dreamlands' } },
        { isOther: true },
      ]),
    ).toBe(true)
  })

  it('requires exactly one Other fallback', () => {
    expect(
      validateOtherWorldEncounterRows([
        { destination: 'abyss' },
        { destination: 'dreamlands' },
        { destination: 'rlyeh' },
      ]),
    ).toContain('exactly one')
  })

  it('requires distinct destinations for named entries', () => {
    expect(
      validateOtherWorldEncounterRows([
        { destination: 'abyss' },
        { destination: 'abyss' },
        { isOther: true },
      ]),
    ).toContain('different')
  })
})

describe('Other World starter content', () => {
  it('contains the destinations used by the component stories', () => {
    expect(starterOtherWorlds.map((world) => world.name)).toEqual([
      'Abyss',
      'Celano',
      'The Dreamlands',
      'City Of The Great Race',
      "R'lyeh",
    ])
  })

  it('only returns starter worlds that are not already present', () => {
    expect(
      getMissingStarterOtherWorlds(['abyss', 'celano']).map((world) => world.key),
    ).toEqual(['the-dreamlands', 'city-of-the-great-race', 'rlyeh'])
  })
})
