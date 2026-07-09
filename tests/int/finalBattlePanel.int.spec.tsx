import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FinalBattlePanel } from '@/app/(frontend)/FinalBattlePanel'
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
  sheetImage: {
    id: 'media',
    alt: 'Cthulhu rising from the sea',
    url: '/api/media/file/cthulhu.jpg',
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
  },
} satisfies AncientOne['sheets'][number]

const ancientOne = {
  id: 'ancient-one',
  name: 'Cthulhu',
  sheets: [activeSheet],
} as AncientOne

const tracks = {
  doomCurrent: 13,
  doomMax: 13,
  finalBattleRound: 3,
  terror: 2,
  gatesOpen: 4,
  elderSigns: 0,
  monstersInArkham: 5,
  monstersInOutskirts: 1,
} satisfies GameSession['tracks']

describe('final battle Ancient One panel', () => {
  it('shows the awakened Ancient One artwork and battle stats', () => {
    const markup = renderToStaticMarkup(
      <FinalBattlePanel
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        investigatorRules={calculateInvestigatorRules({
          investigatorCount: 4,
          expansionBoardCount: 0,
        })}
        sessionID="session"
        tracks={tracks}
      />,
    )

    expect(markup).toContain('Final Battle')
    expect(markup).toContain('Cthulhu awakens')
    expect(markup).toContain('src="/api/media/file/cthulhu.jpg"')
    expect(markup).toContain('alt="Cthulhu rising from the sea"')
    expect(markup).toContain('13/13')
    expect(markup).toContain('13 of 13 doom tokens remain')
    expect(markup).toContain('Remove Doom')
    expect(markup).toContain('Restore Doom')
    expect(markup).toContain('Battle round')
    expect(markup).toContain('Next battle round')
    expect(markup).toContain('-6')
    expect(markup).toContain('Physical Immunity')
    expect(markup).toContain('4 successes per doom')
    expect(markup).toContain('Each investigator loses 1 Sanity.')
    expect(markup).toContain('All investigators lose 1 Stamina.')
  })

  it('replaces final battle counters with a victory state when the last doom is removed', () => {
    const markup = renderToStaticMarkup(
      <FinalBattlePanel
        activeAncientOne={ancientOne}
        activeSheet={activeSheet}
        investigatorRules={calculateInvestigatorRules({
          investigatorCount: 4,
          expansionBoardCount: 0,
        })}
        sessionID="session"
        tracks={{
          ...tracks,
          doomCurrent: 0,
        }}
      />,
    )

    // RULES_CORE.md, PDF pp. 19, 22: removing the last doom wins final battle.
    expect(markup).toContain('Ancient One defeated')
    expect(markup).toContain('You won')
    expect(markup).toContain('The last doom token has been removed.')
    expect(markup).toContain('Restore Doom')
    expect(markup).not.toContain('0 of 13 doom tokens remain')
    expect(markup).not.toContain('Battle round')
    expect(markup).not.toContain('Next battle round')
  })
})
