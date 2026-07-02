import { describe, expect, it } from 'vitest'

import {
  applyExpansionTrackCommand,
  assertExpansionTrackCommand,
  expansionTrackStateForPayload,
  expansionTrackStateFromSession,
  fedsRaidTotal,
  freshExpansionTrackState,
} from '@/lib/expansionTracks'

describe('expansion board tracks', () => {
  it('normalizes missing legacy session state', () => {
    expect(expansionTrackStateFromSession()).toEqual(freshExpansionTrackState())
  })

  it('raises Terror and summons the Dunwich Horror on the third vortex event', () => {
    const state = {
      ...freshExpansionTrackState(),
      dunwichHorrorTokens: 2,
    }
    const transition = applyExpansionTrackCommand(state, { type: 'dunwich-vortex' })

    expect(transition.state.dunwichHorrorTokens).toBe(3)
    expect(transition.terrorIncrease).toBe(1)
    expect(transition.note).toContain('appears at Sentinel Hill')

    const defeated = applyExpansionTrackCommand(transition.state, {
      type: 'dunwich-defeated',
    })
    expect(defeated.state.dunwichHorrorTokens).toBe(0)
  })

  it('awakens the Ancient One when Deep Ones Rising reaches six', () => {
    const transition = applyExpansionTrackCommand(
      {
        ...freshExpansionTrackState(),
        deepOnesRising: 5,
      },
      { type: 'innsmouth-gate-prevented' },
    )

    expect(transition.state.deepOnesRising).toBe(6)
    expect(transition.note).toContain('Ancient One awakens')
  })

  it('clears both Innsmouth tracks when the federal raid fills', () => {
    const transition = applyExpansionTrackCommand(
      {
        ...freshExpansionTrackState(),
        deepOnesRising: 5,
        fedsRaid: {
          'church-green': 2,
          'factory-district': 2,
          'innsmouth-shore': 1,
        },
      },
      { type: 'feds-add', district: 'innsmouth-shore' },
    )

    expect(transition.raidCompleted).toBe(true)
    expect(transition.state.deepOnesRising).toBe(0)
    expect(fedsRaidTotal(transition.state)).toBe(0)
  })

  it('opens and then closes a fully investigated Kingsport rift', () => {
    let state = freshExpansionTrackState()

    for (let progress = 0; progress < 4; progress += 1) {
      state = applyExpansionTrackCommand(state, {
        type: 'rift-advance',
        trackKey: 'rift-1',
      }).state
    }

    expect(state.kingsportRifts[0]).toMatchObject({
      progress: 4,
      open: true,
      investigated: 0,
    })

    for (let progress = 0; progress < 4; progress += 1) {
      state = applyExpansionTrackCommand(state, {
        type: 'rift-investigate',
        trackKey: 'rift-1',
      }).state
    }

    expect(state.kingsportRifts[0]).toMatchObject({
      progress: 0,
      open: false,
      investigated: 0,
    })
  })

  it('round-trips the Payload storage shape', () => {
    const state = freshExpansionTrackState()
    const stored = expansionTrackStateForPayload(state)

    expect(expansionTrackStateFromSession(stored)).toEqual(state)
  })

  it('rejects unsupported commands at the server boundary', () => {
    expect(() =>
      assertExpansionTrackCommand({
        type: 'rift-advance',
        trackKey: 'rift-4',
      } as never),
    ).toThrow('That Kingsport rift track is not supported.')
  })
})
