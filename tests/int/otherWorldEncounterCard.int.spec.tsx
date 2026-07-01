import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { OtherworldEncounterCardFront } from '@/components/otherworldEncounterCardFront'
import { otherWorldEncounterCardFrontProps } from '@/lib/otherWorldEncounterCardPresentation'
import type { BoxedSet, Media, OtherWorld, OtherWorldEncounterCard } from '@/payload-types'

const timestamp = '2025-01-01T00:00:00.000Z'

const icon: Media = {
  id: 'base-icon',
  alt: 'Arkham Horror',
  url: '/media/base-icon.png',
  createdAt: timestamp,
  updatedAt: timestamp,
}

const sourceSet: BoxedSet = {
  id: 'base-game',
  name: 'Base Game',
  key: 'base-game',
  category: 'core',
  abbreviation: 'AH',
  addsExpansionBoard: false,
  icon,
  sortOrder: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
}

function otherWorld(id: string, name: string): OtherWorld {
  return {
    id,
    name,
    key: id,
    preferredColours: ['blue'],
    boxedSet: 'Base Game',
    sourceSet,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function encounterCard(encounters: OtherWorldEncounterCard['encounters']): OtherWorldEncounterCard {
  return {
    id: 'blue-001',
    cardCode: 'blue-001',
    copyCount: 1,
    colour: 'blue',
    encounters,
    boxedSet: 'Base Game',
    sourceSet,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

describe('Other World encounter card presentation', () => {
  it('maps populated destinations, Other, colour, and boxed-set display in stored order', () => {
    const props = otherWorldEncounterCardFrontProps(
      encounterCard([
        { destination: otherWorld('abyss', 'Abyss'), text: 'First encounter.' },
        { isOther: true, text: 'Fallback encounter.' },
        { destination: otherWorld('celano', 'Celano'), text: 'Last encounter.' },
      ]),
    )

    expect(props).toEqual({
      colour: 'blue',
      boxedSet: {
        name: 'Base Game',
        abbreviation: 'AH',
        iconUrl: '/media/base-icon.png',
        iconAlt: 'Arkham Horror',
      },
      textBlocks: [
        { header: 'Abyss', desc: 'First encounter.' },
        { header: 'Other', desc: 'Fallback encounter.' },
        { header: 'Celano', desc: 'Last encounter.' },
      ],
    })
  })

  it('makes an unpopulated destination visible in preview output', () => {
    const props = otherWorldEncounterCardFrontProps(
      encounterCard([
        { destination: 'abyss', text: 'First encounter.' },
        { destination: otherWorld('celano', 'Celano'), text: 'Second encounter.' },
        { isOther: true, text: 'Fallback encounter.' },
      ]),
    )

    expect(props.textBlocks[0]?.header).toBe('Unresolved destination')
  })

  it('renders Markdown without nesting block elements inside a paragraph', () => {
    const markup = renderToStaticMarkup(
      <OtherworldEncounterCardFront
        colour="green"
        textBlocks={[
          { header: 'The Dreamlands', desc: 'Pass a **Luck (-1) check**.' },
          { header: 'Celano', desc: 'Draw 1 Spell.' },
          { header: 'Other', desc: 'A Monster Appears!' },
        ]}
      />,
    )

    expect(markup).toContain('<strong>Luck (-1) check</strong>')
    expect(markup).not.toContain('<p><p>')
  })

  it('uses the compact density for especially long cards', () => {
    const markup = renderToStaticMarkup(
      <OtherworldEncounterCardFront
        colour="red"
        textBlocks={[
          { header: 'Abyss', desc: 'A'.repeat(260) },
          { header: 'Celano', desc: 'B'.repeat(260) },
          { header: 'Other', desc: 'C'.repeat(260) },
        ]}
      />,
    )

    expect(markup).toContain('otherworldcard-center-panel--compact')
  })
})
