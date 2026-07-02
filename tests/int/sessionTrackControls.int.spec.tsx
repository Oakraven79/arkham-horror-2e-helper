import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SessionTrackControls } from '@/app/(frontend)/SessionTrackControls'
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

describe('session track capacity controls', () => {
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
})
