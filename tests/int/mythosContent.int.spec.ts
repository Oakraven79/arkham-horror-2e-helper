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
    expect(starterLocations.map((location) => location.name)).toEqual([
      'The Witch House',
      'Unvisited Isle',
      'Black Cave',
    ])
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
