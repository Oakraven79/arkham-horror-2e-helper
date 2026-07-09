'use client'

import { useOptimistic, useTransition } from 'react'

import {
  adjustSessionTrack,
  sessionTrackMaximum,
  type AdjustableSessionTrack,
  type SessionTracks,
} from '@/lib/sessionTracks'

import { adjustSessionTrackAction } from './actions'

interface FinalBattleCountersProps {
  sessionID: string
  tracks: SessionTracks
}

const doomTrack = 'doomCurrent' satisfies AdjustableSessionTrack
const roundTrack = 'finalBattleRound' satisfies AdjustableSessionTrack

export function FinalBattleCounters({ sessionID, tracks }: FinalBattleCountersProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTracks, applyOptimisticAdjustment] = useOptimistic(
    tracks,
    (
      currentTracks,
      adjustment: {
        delta: -1 | 1
        track: AdjustableSessionTrack
      },
    ) => adjustSessionTrack(currentTracks, adjustment.track, adjustment.delta).tracks,
  )

  const adjust = (track: AdjustableSessionTrack, delta: -1 | 1) => {
    if (isPending) return

    startTransition(async () => {
      applyOptimisticAdjustment({ track, delta })
      await adjustSessionTrackAction(sessionID, track, delta)
    })
  }

  const doomMax = sessionTrackMaximum(optimisticTracks, doomTrack) ?? 10
  const doomCurrent = optimisticTracks.doomCurrent ?? 0
  const battleRound = optimisticTracks.finalBattleRound ?? 1
  const ancientOneDefeated = doomCurrent <= 0

  if (ancientOneDefeated) {
    return (
      <section className="final-battle-counters is-victory" aria-busy={isPending}>
        <div className="final-battle-victory" aria-live="polite">
          <span>Ancient One defeated</span>
          <strong>You won</strong>
          <p>The last doom token has been removed.</p>
          <button
            aria-label="Restore Doom"
            disabled={isPending || doomCurrent >= doomMax}
            onClick={() => adjust(doomTrack, 1)}
            type="button"
          >
            Restore Doom
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="final-battle-counters" aria-busy={isPending}>
      <div className="final-battle-doom-feature">
        <div className="final-battle-counter-heading">
          <span>Doom</span>
          <strong>
            {doomCurrent}/{doomMax}
          </strong>
        </div>
        <div
          className="final-battle-doom-track"
          aria-label={`${doomCurrent} of ${doomMax} doom tokens remain`}
        >
          {Array.from({ length: doomMax }, (_, index) => (
            <span
              aria-hidden="true"
              className={index < doomCurrent ? 'is-filled' : undefined}
              key={index}
            />
          ))}
        </div>
        <div className="final-battle-counter-actions">
          <button
            aria-label="Remove Doom"
            disabled={isPending || doomCurrent <= 0}
            onClick={() => adjust(doomTrack, -1)}
            type="button"
          >
            -
          </button>
          <span>Remove Doom as successes accrue</span>
          <button
            aria-label="Restore Doom"
            disabled={isPending || doomCurrent >= doomMax}
            onClick={() => adjust(doomTrack, 1)}
            type="button"
          >
            +
          </button>
        </div>
      </div>

      <div className="final-battle-round-counter">
        <span>Battle round</span>
        <strong className="final-battle-round-value">{battleRound}</strong>
        <div className="final-battle-round-actions">
          <button
            aria-label="Previous battle round"
            disabled={isPending || battleRound <= 1}
            onClick={() => adjust(roundTrack, -1)}
            type="button"
          >
            -
          </button>
          <button
            aria-label="Next battle round"
            disabled={isPending}
            onClick={() => adjust(roundTrack, 1)}
            type="button"
          >
            +
          </button>
        </div>
      </div>
    </section>
  )
}
