import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { GameRulesContext } from '@/app/(frontend)/GameRulesContext'
import { calculateInvestigatorRules } from '@/lib/investigatorRules'
import type { AncientOne, GameSession } from '@/payload-types'

const activeSheet = {
  key: 'standard',
  label: 'Standard',
  isDefault: true,
  doomTrack: 13,
  combatRating: {
    display: '-6',
    type: 'fixed',
    modifier: -6,
  },
  defenses: ['physical-immunity'],
  defenseText: 'Physical Immunity',
  worshippers: 'Cultists gain Endless.',
  powerName: 'The Sleeper',
  power: 'Investigators have their maximum Sanity reduced by 1.',
  startOfBattle: 'Each investigator loses 1 Sanity.',
  attack: 'All investigators lose 1 Stamina.',
} as AncientOne['sheets'][number]

const ancientOne = {
  id: 'ancient-one',
  name: 'Cthulhu',
  sheets: [activeSheet],
  rulesNotes: [
    {
      kind: 'clarification',
      text: 'This effect remains active throughout the game.',
      sheetKey: 'standard',
    },
  ],
} as AncientOne

const rules = calculateInvestigatorRules({
  investigatorCount: 6,
  expansionBoardCount: 2,
  hasDunwich: true,
  hasInnsmouth: true,
})

const tracks = {
  doomCurrent: 4,
  doomMax: 13,
  terror: 0,
  gatesOpen: 0,
  elderSigns: 0,
  monstersInArkham: 0,
  monstersInOutskirts: 0,
} satisfies GameSession['tracks']

describe('persistent game rules context', () => {
  it('shows Ancient One details and investigator modifiers during Mythos', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        expansionBoardNames={['Dunwich Horror', 'Innsmouth Horror']}
        hasRelationships
        investigatorRules={rules}
        phase="Mythos"
        tracks={{ ...tracks, terror: 6 }}
      />,
    )

    expect(markup).toContain('The Sleeper')
    expect(markup).toContain('Cultists gain Endless.')
    expect(markup).toContain('The General Store is closed.')
    expect(markup).toContain('The Curiositie Shoppe is closed.')
    expect(markup).toContain('Next at 9')
    expect(markup).toContain('Arkham + Sky')
    expect(markup).toContain('Additional monsters go to the Outskirts.')
    expect(markup).toContain('Elder signs')
    expect(markup).toContain('0/6')
    expect(markup).toContain('6 more on the board wins the game.')
    expect(markup).toContain('Adjusted investigators')
    expect(markup).toContain('Terror 10 awakening')
    expect(markup).toContain('Relationship setup')
    expect(markup).toContain('Dunwich Horror, Innsmouth Horror')
    expect(markup).toContain('Reference details')
  })

  it('adds combat information during the Final Battle', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        expansionBoardNames={[]}
        hasRelationships={false}
        investigatorRules={rules}
        phase="Final Battle"
        tracks={tracks}
      />,
    )

    expect(markup).toContain('Combat')
    expect(markup).toContain('Physical Immunity')
    expect(markup).toContain('Start of battle')
    expect(markup).toContain('All investigators lose 1 Stamina.')
  })

  it('announces a sealing victory when six Elder Signs are on the board', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        expansionBoardNames={[]}
        hasRelationships={false}
        investigatorRules={rules}
        phase="Mythos"
        tracks={{ ...tracks, elderSigns: 6 }}
      />,
    )

    expect(markup).toContain('6/6')
    expect(markup).toContain('Six Elder Signs are on the board. The investigators win.')
    expect(markup).toContain('is-victory')
  })

  it('shows where monsters flow when both capacities are full', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        expansionBoardNames={[]}
        hasRelationships={false}
        investigatorRules={rules}
        phase="Mythos"
        tracks={{
          ...tracks,
          monstersInArkham: rules.monsterLimit,
          monstersInOutskirts: rules.outskirtsCapacity,
        }}
      />,
    )

    expect(markup).toContain('Full. The next monster flows to the Outskirts.')
    expect(markup).toContain('Full. The next monster clears the Outskirts and raises Terror.')
  })

  it('keeps count modifiers visible before an Ancient One is selected', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={null}
        activeSheet={null}
        expansionBoardNames={[]}
        hasRelationships={false}
        investigatorRules={rules}
        phase="Setup"
        tracks={tracks}
      />,
    )

    expect(markup).toContain('Choose an Ancient One during Setup')
    expect(markup).toContain('New gate monsters')
    expect(markup).toContain('Minimum surge')
  })
})
