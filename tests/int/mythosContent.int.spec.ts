import { describe, expect, it } from 'vitest'

import { getStarterLocation, starterLocations } from '@/content/locations'
import { mythosCardExampleProps } from '@/content/mythosCardExamples'
import { getStarterMythosCard, starterMythosCards } from '@/content/mythosCards'

describe('Mythos starter content', () => {
  it('contains the complete uniquely coded Mythos catalog', () => {
    expect(starterMythosCards).toHaveLength(287)
    expect(starterMythosCards.reduce((total, card) => total + card.copyCount, 0)).toBe(294)
    expect(new Set(starterMythosCards.map((card) => card.cardCode)).size).toBe(287)
  })

  it('resolves every primary and alternate gate location fixture', () => {
    const unresolved = starterMythosCards
      .flatMap((card) => [
        ...(card.locationKey ? [card.locationKey] : []),
        ...card.gateInstruction.locationKeys,
      ])
      .filter((key) => !getStarterLocation(key))

    expect(unresolved).toEqual([])
    expect(starterLocations).toHaveLength(57)
    expect(new Set(starterLocations.map((location) => location.key)).size).toBe(57)
    expect(starterLocations.map((location) => location.name)).toEqual(
      expect.arrayContaining(['The Witch House', 'Unvisited Isle', 'Black Cave']),
    )
  })

  it('preserves the reviewed import decisions and gate semantics', () => {
    const gateModeCounts = starterMythosCards.reduce<Record<string, number>>(
      (counts, card) => ({
        ...counts,
        [card.gateInstruction.mode]: (counts[card.gateInstruction.mode] ?? 0) + 1,
      }),
      {},
    )
    const darkPharaohCards = starterMythosCards.filter(
      (card) => card.sourceSetKey === 'curse-dark-pharaoh-revised',
    )
    const nextActCards = starterMythosCards.filter((card) =>
      card.title.startsWith('The Next Act Begins'),
    )

    expect(gateModeCounts).toEqual({
      none: 18,
      single: 222,
      choice: 36,
      all: 4,
      surge: 7,
    })
    expect(darkPharaohCards).toHaveLength(18)
    expect(
      starterMythosCards.find((card) => card.title === 'The Doors of Sleep')?.gateInstruction.burst,
    ).toBe(true)
    expect(
      getStarterMythosCard('king-in-yellow-new-miskatonic-u-curriculum')?.gateInstruction
        .locationKeys,
    ).toEqual(['the-witch-house'])
    expect(nextActCards).toHaveLength(2)
    expect(nextActCards.map((card) => card.copyCount)).toEqual([3, 3])
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
    expect(mythosCardExampleProps('base-fourth-of-july-parade').gateInstruction).toMatchObject({
      mode: 'single',
      locations: [{ text: 'The Witch  \nHouse' }],
    })
    expect(mythosCardExampleProps('base-fourth-of-july-parade').boxedSet).toEqual({
      name: 'Base Game',
      abbreviation: 'AH',
    })
    expect(mythosCardExampleProps('base-the-story-continues').cardType).toBeUndefined()
    expect(
      mythosCardExampleProps('king-in-yellow-the-tattered-king').lowerLeftOverride,
    ).toMatchObject({
      imageUrl: '/images/misc/doomCounters.png',
    })
  })
})
