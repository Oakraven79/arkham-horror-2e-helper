import { describe, expect, it } from 'vitest'

import { gameDataFixture } from '@/fixtures/gameData'
import { validateGameDataFixture } from '@/fixtures/gameDataLoader'

describe('Game data fixture', () => {
  it('is complete and internally valid', () => {
    const validation = validateGameDataFixture()

    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.counts).toEqual({
      arkhamEncounterCards: 9,
      boxedSets: 11,
      locations: 57,
      media: 84,
      mythosCards: 287,
      neighborhoods: 19,
      otherWorldEncounterCards: 4,
      otherWorlds: 5,
    })
    expect(validation.checksum).toMatch(/^[a-f0-9]{64}$/)
  })

  it('stores portable relationship keys instead of Payload IDs', () => {
    const serialized = JSON.stringify(gameDataFixture)

    expect(serialized).not.toContain('"id":')
    expect(
      gameDataFixture.otherWorldEncounterCards.flatMap((card) =>
        card.encounters
          .map((encounter) => encounter.destinationKey)
          .filter((key): key is string => Boolean(key)),
      ),
    ).toEqual(
      expect.arrayContaining([
        'abyss',
        'celano',
        'the-dreamlands',
        'city-of-the-great-race',
        'rlyeh',
      ]),
    )
  })
})
