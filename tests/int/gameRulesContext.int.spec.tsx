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
  it('shows Ancient One and investigator modifiers during Mythos', () => {
    const markup = renderToStaticMarkup(
      <GameRulesContext
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        expansionBoardNames={['Dunwich Horror', 'Innsmouth Horror']}
        hasRelationships
        investigatorRules={rules}
        phase="Mythos"
        tracks={tracks}
      />,
    )

    expect(markup).toContain('Cthulhu')
    expect(markup).toContain('The Sleeper')
    expect(markup).toContain('Cultists gain Endless.')
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

    expect(markup).toContain('Not selected')
    expect(markup).toContain('Monster cap')
    expect(markup).toContain('Gates to awaken')
  })
})
