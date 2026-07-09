'use client'

import { useOptimistic, useTransition } from 'react'

import { elderSignVictoryStatus, thresholdState, type ThresholdState } from '@/lib/gameStatusRules'
import {
  adjustSessionTrack,
  sessionTrackLabels,
  sessionTrackMaximum,
  type AdjustableSessionTrack,
  type SessionTracks,
} from '@/lib/sessionTracks'

import { adjustSessionTrackAction } from './actions'

interface SessionTrackControlsProps {
  disabled?: boolean
  finalBattle?: boolean
  gateAwakeningThreshold: number
  monsterLimit: number
  outskirtsCapacity: number
  sessionID: string
  tracks: SessionTracks
}

interface CounterProps {
  className?: string
  disabled: boolean
  displayLimit?: number | string
  fullFlowLabel?: string
  label: string
  maximum?: number
  onAdjust: (delta: -1 | 1) => void
  prominent?: boolean
  status?: 'critical' | 'victory' | 'warning'
  value: number
}

function Counter({
  className,
  disabled,
  displayLimit,
  fullFlowLabel,
  label,
  maximum,
  onAdjust,
  prominent = false,
  status,
  value,
}: CounterProps) {
  const resolvedDisplayLimit = displayLimit ?? maximum
  const atMaximum = maximum !== undefined && value >= maximum
  const classNames = [
    'session-counter',
    className,
    prominent ? 'doom-counter' : '',
    fullFlowLabel ? 'has-flow' : '',
    status === 'critical'
      ? 'is-critical'
      : status === 'victory'
        ? 'is-victory'
        : status === 'warning'
          ? 'is-warning'
          : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={classNames} aria-label={`${label} counter`}>
      <span className="session-counter-label">{label}</span>
      <div className="session-counter-controls">
        <button
          aria-label={`Decrease ${label}`}
          disabled={disabled || value <= 0}
          onClick={() => onAdjust(-1)}
          title={`Decrease ${label}`}
          type="button"
        >
          -
        </button>
        <strong aria-live="polite">
          {value}
          {resolvedDisplayLimit !== undefined && <small>/{resolvedDisplayLimit}</small>}
        </strong>
        {atMaximum && fullFlowLabel ? (
          <span className="session-counter-flow-marker" aria-hidden="true">
            →
          </span>
        ) : (
          <button
            aria-label={`Increase ${label}`}
            disabled={disabled || atMaximum}
            onClick={() => onAdjust(1)}
            title={`Increase ${label}`}
            type="button"
          >
            +
          </button>
        )}
      </div>
      {fullFlowLabel && (
        <span className={`session-counter-flow${atMaximum ? ' is-active' : ''}`} aria-live="polite">
          {atMaximum ? <strong>→ {fullFlowLabel}</strong> : <>&nbsp;</>}
        </span>
      )}
      {prominent && maximum !== undefined && (
        <span className="doom-progress" aria-hidden="true">
          <span style={{ width: `${Math.min(100, (value / maximum) * 100)}%` }} />
        </span>
      )}
    </section>
  )
}

function capacityStatus(
  value: number,
  limit: number,
  fullIsCritical = false,
): CounterProps['status'] {
  const state: ThresholdState = thresholdState(value, limit)

  if (state === 'exceeded' || (state === 'full' && fullIsCritical)) return 'critical'
  if (state === 'full' || state === 'near') return 'warning'
  return undefined
}

export function SessionTrackControls({
  disabled = false,
  finalBattle = false,
  gateAwakeningThreshold,
  monsterLimit,
  outskirtsCapacity,
  sessionID,
  tracks,
}: SessionTrackControlsProps) {
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
    if (disabled || isPending) return

    startTransition(async () => {
      applyOptimisticAdjustment({ track, delta })
      await adjustSessionTrackAction(sessionID, track, delta)
    })
  }

  const counterDisabled = disabled || isPending
  const doomMaximum = sessionTrackMaximum(optimisticTracks, 'doomCurrent') ?? 10
  const monsterLimitRemoved = optimisticTracks.terror >= 10
  const elderSignStatus = elderSignVictoryStatus(optimisticTracks.elderSigns)

  return (
    <div className="status-track-controls" aria-busy={isPending}>
      <Counter
        disabled={counterDisabled}
        label={sessionTrackLabels.doomCurrent}
        maximum={doomMaximum}
        onAdjust={(delta) => adjust('doomCurrent', delta)}
        prominent
        status={
          optimisticTracks.doomCurrent >= doomMaximum
            ? 'critical'
            : optimisticTracks.doomCurrent >= Math.max(1, doomMaximum - 2)
              ? 'warning'
              : undefined
        }
        value={optimisticTracks.doomCurrent}
      />

      {!finalBattle && (
        <div className="table-counters" aria-label="Session counters">
          <Counter
            className="track-gates"
            disabled={counterDisabled}
            displayLimit={gateAwakeningThreshold}
            label={sessionTrackLabels.gatesOpen}
            onAdjust={(delta) => adjust('gatesOpen', delta)}
            status={capacityStatus(optimisticTracks.gatesOpen, gateAwakeningThreshold, true)}
            value={optimisticTracks.gatesOpen}
          />
          <Counter
            className="track-elder-signs"
            disabled={counterDisabled}
            label={sessionTrackLabels.elderSigns}
            maximum={sessionTrackMaximum(optimisticTracks, 'elderSigns')}
            onAdjust={(delta) => adjust('elderSigns', delta)}
            status={
              elderSignStatus.won
                ? 'victory'
                : elderSignStatus.remaining === 1
                  ? 'warning'
                  : undefined
            }
            value={optimisticTracks.elderSigns}
          />
          <Counter
            className="track-arkham-monsters"
            disabled={counterDisabled}
            displayLimit={monsterLimitRemoved ? 'no cap' : monsterLimit}
            fullFlowLabel={monsterLimitRemoved ? undefined : 'Outskirts'}
            label={sessionTrackLabels.monstersInArkham}
            maximum={monsterLimitRemoved ? undefined : monsterLimit}
            onAdjust={(delta) => adjust('monstersInArkham', delta)}
            status={
              monsterLimitRemoved
                ? undefined
                : capacityStatus(optimisticTracks.monstersInArkham, monsterLimit)
            }
            value={optimisticTracks.monstersInArkham}
          />
          <Counter
            className="track-outskirts"
            disabled={counterDisabled}
            displayLimit={outskirtsCapacity}
            fullFlowLabel="Clear; Terror +1"
            label={sessionTrackLabels.monstersInOutskirts}
            maximum={outskirtsCapacity}
            onAdjust={(delta) => adjust('monstersInOutskirts', delta)}
            status={capacityStatus(optimisticTracks.monstersInOutskirts, outskirtsCapacity)}
            value={optimisticTracks.monstersInOutskirts}
          />
          <Counter
            className="track-terror"
            disabled={counterDisabled}
            label={sessionTrackLabels.terror}
            maximum={sessionTrackMaximum(optimisticTracks, 'terror')}
            onAdjust={(delta) => adjust('terror', delta)}
            status={optimisticTracks.terror >= 10 ? 'critical' : undefined}
            value={optimisticTracks.terror}
          />
        </div>
      )}
    </div>
  )
}
