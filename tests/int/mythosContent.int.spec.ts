import { describe, expect, it } from 'vitest'

import { getStarterLocation, starterLocations } from '@/content/locations'
import { mythosCardExampleProps } from '@/content/mythosCardExamples'
import { starterMythosCards } from '@/content/mythosCards'

describe('Mythos starter content', () => {
  it('contains nine uniquely coded real card examples', () => {
    expect(starterMythosCards).toHaveLength(9)
    expect(new Set(starterMythosCards.map((card) => card.cardCode)).size).toBe(9)
  })

  it('resolves every referenced location fixture', () => {
    const unresolved = starterMythosCards
      .filter((card) => card.locationKey)
      .filter((card) => !getStarterLocation(card.locationKey as string))

    expect(unresolved).toEqual([])
    expect(starterLocations).toHaveLength(57)
    expect(new Set(starterLocations.map((location) => location.key)).size).toBe(57)
    expect(starterLocations.map((location) => location.name)).toEqual(
      expect.arrayContaining(['The Witch House', 'Unvisited Isle', 'Black Cave']),
    )
  })

  it('maps the complete location catalog to its four boards', () => {
    const boardCounts = starterLocations.reduce<Record<string, number>>(
      (counts, location) => ({
        ...counts,
        [location.board]: (counts[location.board] ?? 0) + 1,
      }),
      {},
    )

    expect(boardCounts).toEqual({
      Arkham: 27,
      Dunwich: 9,
      Kingsport: 12,
      Innsmouth: 9,
    })

    expect(getStarterLocation('hall-school')).toMatchObject({
      board: 'Kingsport',
      aquatic: false,
      homeInvestigators: [],
    })
  })

  it('converts shared content into Storybook presentation props', () => {
    expect(mythosCardExampleProps('base-fourth-of-july-parade').location).toEqual({
      text: 'The Witch  \nHouse',
      imageUrl: '/images/arkhamLocations/old-house.jpg',
      imageAlt: 'The Witch House',
    })
    expect(mythosCardExampleProps('base-the-story-continues').cardType).toBeUndefined()
    expect(
      mythosCardExampleProps('king-in-yellow-the-tattered-king').lowerLeftOverride,
    ).toMatchObject({
      imageUrl: '/images/misc/doomCounters.png',
    })
  })
})
