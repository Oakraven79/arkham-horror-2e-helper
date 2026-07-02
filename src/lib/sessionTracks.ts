import type { GameSession } from '@/payload-types'

import { ELDER_SIGN_VICTORY_THRESHOLD } from './gameStatusRules'

export const adjustableSessionTracks = [
  'doomCurrent',
  'terror',
  'gatesOpen',
  'elderSigns',
  'monstersInArkham',
  'monstersInOutskirts',
] as const

export type AdjustableSessionTrack = (typeof adjustableSessionTracks)[number]
export type SessionTracks = GameSession['tracks']

export const sessionTrackLabels: Record<AdjustableSessionTrack, string> = {
  doomCurrent: 'Doom',
  terror: 'Terror',
  gatesOpen: 'Open gates',
  elderSigns: 'Elder signs',
  monstersInArkham: 'Arkham + Sky',
  monstersInOutskirts: 'Outskirts',
}

export function isAdjustableSessionTrack(value: string): value is AdjustableSessionTrack {
  return adjustableSessionTracks.includes(value as AdjustableSessionTrack)
}

export function sessionTrackMaximum(
  tracks: SessionTracks,
  track: AdjustableSessionTrack,
): number | undefined {
  if (track === 'doomCurrent') return tracks.doomMax ?? 10
  if (track === 'terror') return 10
  if (track === 'elderSigns') return ELDER_SIGN_VICTORY_THRESHOLD
  return undefined
}

export function adjustSessionTrack(
  tracks: SessionTracks,
  track: AdjustableSessionTrack,
  delta: number,
) {
  if (delta !== -1 && delta !== 1) {
    throw new Error('Session counters can only be adjusted by one step at a time.')
  }

  const previousValue = tracks[track] ?? 0
  const maximum = sessionTrackMaximum(tracks, track)
  const nextValue = Math.max(
    0,
    maximum === undefined ? previousValue + delta : Math.min(maximum, previousValue + delta),
  )

  return {
    previousValue,
    nextValue,
    tracks: {
      ...tracks,
      [track]: nextValue,
    },
  }
}

export function sessionTrackLogNote(
  track: AdjustableSessionTrack,
  previousValue: number,
  nextValue: number,
) {
  return `${sessionTrackLabels[track]} changed from ${previousValue} to ${nextValue}.`
}
