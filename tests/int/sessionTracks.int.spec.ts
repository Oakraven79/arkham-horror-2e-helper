import { describe, expect, it } from 'vitest'

import {
  adjustSessionTrack,
  isAdjustableSessionTrack,
  sessionTrackLogNote,
  type SessionTracks,
} from '@/lib/sessionTracks'

const tracks: SessionTracks = {
  doomCurrent: 4,
  doomMax: 13,
  terror: 2,
  gatesOpen: 3,
  elderSigns: 1,
  monstersInArkham: 5,
  monstersInOutskirts: 2,
}

describe('session track adjustments', () => {
  it('increments a counter while preserving every other track', () => {
    const adjustment = adjustSessionTrack(tracks, 'gatesOpen', 1)

    expect(adjustment.previousValue).toBe(3)
    expect(adjustment.nextValue).toBe(4)
    expect(adjustment.tracks).toEqual({
      ...tracks,
      gatesOpen: 4,
    })
  })

  it('clamps Doom to its Ancient One maximum', () => {
    const adjustment = adjustSessionTrack(
      {
        ...tracks,
        doomCurrent: 13,
      },
      'doomCurrent',
      1,
    )

    expect(adjustment.nextValue).toBe(13)
  })

  it('clamps Terror to ten and every counter to zero', () => {
    expect(adjustSessionTrack({ ...tracks, terror: 10 }, 'terror', 1).nextValue).toBe(10)
    expect(adjustSessionTrack({ ...tracks, elderSigns: 0 }, 'elderSigns', -1).nextValue).toBe(0)
  })

  it('clamps Elder Signs at the fixed sealing victory threshold', () => {
    expect(adjustSessionTrack({ ...tracks, elderSigns: 6 }, 'elderSigns', 1).nextValue).toBe(6)
  })

  it('rejects unsupported counters and adjustment sizes', () => {
    expect(isAdjustableSessionTrack('drawPile')).toBe(false)
    expect(isAdjustableSessionTrack('monstersInArkham')).toBe(true)
    expect(() => adjustSessionTrack(tracks, 'terror', 2)).toThrow(
      'Session counters can only be adjusted by one step at a time.',
    )
  })

  it('provides a readable audit note', () => {
    expect(sessionTrackLogNote('doomCurrent', 4, 5)).toBe('Doom changed from 4 to 5.')
  })
})
