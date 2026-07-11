import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { SessionTrackControls } from '@/app/(frontend)/SessionTrackControls'
import {
  SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT,
  type SetupInvestigatorCountPreview,
} from '@/app/(frontend)/setupInvestigatorCountPreview'
import type { GameSession } from '@/payload-types'

const tracks = {
  doomCurrent: 0,
  doomMax: 14,
  terror: 0,
  gatesOpen: 0,
  elderSigns: 0,
  monstersInArkham: 7,
  monstersInOutskirts: 4,
} satisfies GameSession['tracks']

function renderControls(overrides: Partial<GameSession['tracks']> = {}) {
  return renderToStaticMarkup(
    <SessionTrackControls
      gateAwakeningThreshold={7}
      monsterLimit={7}
      outskirtsCapacity={4}
      sessionID="session"
      tracks={{ ...tracks, ...overrides }}
    />,
  )
}

function renderFinalBattleControls(overrides: Partial<GameSession['tracks']> = {}) {
  return renderToStaticMarkup(
    <SessionTrackControls
      finalBattle
      gateAwakeningThreshold={7}
      monsterLimit={7}
      outskirtsCapacity={4}
      sessionID="session"
      tracks={{ ...tracks, ...overrides }}
    />,
  )
}

describe('session track capacity controls', () => {
  afterEach(() => {
    cleanup()
  })

  it('removes increment controls and shows the next destination at capacity', () => {
    const markup = renderControls()

    expect(markup).not.toContain('aria-label="Increase Arkham + Sky"')
    expect(markup).not.toContain('aria-label="Increase Outskirts"')
    expect(markup).toContain('<strong>→ Outskirts</strong>')
    expect(markup).toContain('<strong>→ Clear; Terror +1</strong>')
  })

  it('restores the Arkham increment control when Terror removes the monster limit', () => {
    const markup = renderControls({ terror: 10 })

    expect(markup).toContain('aria-label="Increase Arkham + Sky"')
    expect(markup).not.toContain('<strong>→ Outskirts</strong>')
  })

  it('orders the monster flow from Arkham through the Outskirts to Terror', () => {
    const markup = renderControls()
    const arkhamIndex = markup.indexOf('Arkham + Sky counter')
    const outskirtsIndex = markup.indexOf('Outskirts counter')
    const terrorIndex = markup.indexOf('Terror counter')

    expect(arkhamIndex).toBeGreaterThan(-1)
    expect(outskirtsIndex).toBeGreaterThan(arkhamIndex)
    expect(terrorIndex).toBeGreaterThan(outskirtsIndex)
  })

  it('hides normal table counters during the final battle', () => {
    const markup = renderFinalBattleControls()

    expect(markup).toContain('Doom counter')
    expect(markup).not.toContain('Open gates counter')
    expect(markup).not.toContain('Arkham + Sky counter')
    expect(markup).not.toContain('Terror counter')
  })

  it('SETUP-06 previews investigator-count limits in the top counters during setup', () => {
    render(
      <SessionTrackControls
        expansionBoardCount={0}
        gateAwakeningThreshold={7}
        investigatorCount={4}
        monsterLimit={7}
        outskirtsCapacity={4}
        previewSetupInvestigatorCount
        sessionID="session"
        tracks={{ ...tracks, monstersInArkham: 0, monstersInOutskirts: 0 }}
      />,
    )

    const counterText = (name: string) =>
      screen.getByRole('region', { name: `${name} counter` }).textContent ?? ''

    expect(counterText('Open gates')).toContain('/7')
    expect(counterText('Arkham + Sky')).toContain('/7')
    expect(counterText('Outskirts')).toContain('/4')

    act(() => {
      window.dispatchEvent(
        new CustomEvent<SetupInvestigatorCountPreview>(SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT, {
          detail: {
            investigatorCount: 6,
            sessionID: 'session',
          },
        }),
      )
    })

    expect(counterText('Open gates')).toContain('/6')
    expect(counterText('Arkham + Sky')).toContain('/9')
    expect(counterText('Outskirts')).toContain('/2')
  })
})
