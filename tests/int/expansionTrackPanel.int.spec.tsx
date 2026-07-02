import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ExpansionTrackPanel } from '@/app/(frontend)/ExpansionTrackPanel'
import { freshExpansionTrackState } from '@/lib/expansionTracks'

describe('expansion track panel', () => {
  it('renders nothing when no expansion board is enabled', () => {
    expect(
      renderToStaticMarkup(
        <ExpansionTrackPanel
          enabledSetKeys={['base-game']}
          onCommand={() => {}}
          phase="Upkeep"
          state={freshExpansionTrackState()}
        />,
      ),
    ).toBe('')
  })

  it('only renders tracks belonging to enabled expansions', () => {
    const markup = renderToStaticMarkup(
      <ExpansionTrackPanel
        enabledSetKeys={['base-game', 'dunwich-horror']}
        onCommand={() => {}}
        phase="Mythos"
        state={freshExpansionTrackState()}
      />,
    )

    expect(markup).toContain('Dunwich Horror')
    expect(markup).not.toContain('Deep Ones Rising')
    expect(markup).not.toContain('Kingsport Rifts')
  })

  it('shows all three expansion board systems together', () => {
    const markup = renderToStaticMarkup(
      <ExpansionTrackPanel
        enabledSetKeys={['base-game', 'dunwich-horror', 'innsmouth-horror', 'kingsport-horror']}
        onCommand={() => {}}
        phase="Upkeep"
        state={freshExpansionTrackState()}
      />,
    )

    expect(markup).toContain('Dunwich Horror')
    expect(markup).toContain('Deep Ones Rising')
    expect(markup).toContain('Feds Raid Innsmouth')
    expect(markup).toContain('Kingsport Rifts')
    expect(markup).toContain('Investigators in Innsmouth may spend clues now.')
  })
})
