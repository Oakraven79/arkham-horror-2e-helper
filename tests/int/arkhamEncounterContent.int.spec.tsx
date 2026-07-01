import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ArkhamEncounterCardFront } from '@/components/arkhamEncounterCardFront'
import {
  arkhamEncounterCardExampleProps,
  arkhamEncounterDeckBackExampleProps,
} from '@/content/arkhamEncounterCardExamples'
import { starterArkhamEncounterCards } from '@/content/arkhamEncounterCards'
import { starterLocations } from '@/content/locations'
import { neighborhoodKey, starterNeighborhoods } from '@/content/neighborhoods'
import { validateArkhamEncounterRows } from '@/lib/arkhamEncounterContent'

describe('Arkham encounter content validation', () => {
  it('accepts unique location rows and rejects duplicates', () => {
    expect(
      validateArkhamEncounterRows([
        { location: 'st-marys-hospital' },
        { location: { id: 'woods' } },
      ]),
    ).toBe(true)
    expect(
      validateArkhamEncounterRows([{ location: 'woods' }, { location: { id: 'woods' } }]),
    ).toContain('only once')
  })

  it('keeps every starter card within its selected neighborhood', () => {
    const neighborhoodsByKey = new Map(
      starterNeighborhoods.map((neighborhood) => [neighborhood.key, neighborhood]),
    )
    const locationsByKey = new Map(starterLocations.map((location) => [location.key, location]))

    for (const card of starterArkhamEncounterCards) {
      const neighborhood = neighborhoodsByKey.get(card.neighborhoodKey)
      expect(neighborhood).toBeDefined()

      for (const encounter of card.encounters) {
        const location = locationsByKey.get(encounter.locationKey)
        expect(location).toBeDefined()
        expect(neighborhoodKey(location!.board, location!.neighborhood)).toBe(card.neighborhoodKey)
      }
    }
  })
})

describe('Arkham encounter card presentation examples', () => {
  it('models French Hill as a two-panel back and a three-entry front', () => {
    expect(
      arkhamEncounterDeckBackExampleProps('arkham-french-hill').panels.map((panel) => panel.name),
    ).toEqual(['The Witch House', 'Silver Twilight Lodge'])
    expect(arkhamEncounterCardExampleProps('base-french-hill-001').encounters).toHaveLength(3)
  })

  it('renders Markdown without nested paragraphs and preserves the neighborhood frame', () => {
    const markup = renderToStaticMarkup(
      <ArkhamEncounterCardFront {...arkhamEncounterCardExampleProps('base-uptown-001')} />,
    )

    expect(markup).toContain('arkham encounter red front.png')
    expect(markup).toContain('<strong>Sneak (-1) check</strong>')
    expect(markup).not.toContain('<p><p>')
  })

  it('uses compact typography for the long Southside example', () => {
    const markup = renderToStaticMarkup(
      <ArkhamEncounterCardFront {...arkhamEncounterCardExampleProps('base-southside-001')} />,
    )

    expect(markup).toContain('arkham-encounter-copy--dense')
  })
})
