'use client'

import { useState, useTransition, type FormEvent } from 'react'

import {
  expansionTrackSetKeys,
  fedsRaidDistrictLabels,
  fedsRaidTotal,
  type ExpansionTrackCommand,
  type ExpansionTrackState,
  type FedsRaidDistrict,
  type KingsportRiftState,
} from '@/lib/expansionTracks'
import type { GamePhase } from '@/lib/gamePhaseState'

interface ExpansionTrackPanelProps {
  enabledSetKeys: string[]
  mythosMovement?: {
    black: string[]
    white: string[]
  }
  onCommand: (command: ExpansionTrackCommand) => Promise<void> | void
  phase: GamePhase
  state: ExpansionTrackState
}

interface PipTrackProps {
  investigated?: number
  label: string
  maximum: number
  value: number
}

function PipTrack({ investigated = 0, label, maximum, value }: PipTrackProps) {
  return (
    <div className="expansion-pip-track" aria-label={`${label}: ${value} of ${maximum}`}>
      {Array.from({ length: maximum }, (_, index) => {
        const filled = index < value
        const isInvestigated = filled && index < investigated

        return (
          <span
            className={[
              'expansion-pip',
              filled ? 'is-filled' : '',
              isInvestigated ? 'is-investigated' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={index}
          />
        )
      })}
    </div>
  )
}

function TrackCorrectionButton({
  disabled,
  label,
  onClick,
}: {
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="track-correction-button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      −
    </button>
  )
}

function RiftTrack({
  disabled,
  location,
  onCommand,
  onLocationChange,
  rift,
}: {
  disabled: boolean
  location: string
  onCommand: (command: ExpansionTrackCommand) => void
  onLocationChange: (value: string) => void
  rift: KingsportRiftState
}) {
  const label = rift.trackKey.replace('rift-', 'Rift ')

  const saveLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCommand({
      type: 'rift-location',
      trackKey: rift.trackKey,
      location,
    })
  }

  return (
    <section className={`rift-track${rift.open ? ' is-open' : ''}`}>
      <div className="rift-track-heading">
        <strong>{label}</strong>
        <span>{rift.open ? 'Open' : `${rift.progress}/4`}</span>
      </div>
      <PipTrack investigated={rift.investigated} label={label} maximum={4} value={rift.progress} />
      <div className="rift-track-actions">
        <TrackCorrectionButton
          disabled={disabled || (rift.progress === 0 && rift.investigated === 0)}
          label={`Correct ${label} down`}
          onClick={() => onCommand({ type: 'rift-correct-down', trackKey: rift.trackKey })}
        />
        {rift.open ? (
          <button
            disabled={disabled}
            onClick={() => onCommand({ type: 'rift-investigate', trackKey: rift.trackKey })}
            type="button"
          >
            Investigate {rift.investigated}/4
          </button>
        ) : (
          <button
            disabled={disabled || rift.progress >= 4}
            onClick={() => onCommand({ type: 'rift-advance', trackKey: rift.trackKey })}
            type="button"
          >
            Add progress
          </button>
        )}
      </div>
      {rift.open && (
        <form className="rift-location-form" onSubmit={saveLocation}>
          <input
            aria-label={`${label} current location`}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="Current board space"
            value={location}
          />
          <button disabled={disabled} type="submit">
            Save
          </button>
        </form>
      )}
    </section>
  )
}

export function ExpansionTrackPanel({
  enabledSetKeys,
  mythosMovement,
  onCommand,
  phase,
  state,
}: ExpansionTrackPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [riftLocations, setRiftLocations] = useState<Record<string, string>>(
    Object.fromEntries(
      state.kingsportRifts.map((rift) => [rift.trackKey, rift.currentLocation ?? '']),
    ),
  )
  const enabled = new Set(enabledSetKeys)
  const showDunwich = enabled.has(expansionTrackSetKeys.dunwich)
  const showInnsmouth = enabled.has(expansionTrackSetKeys.innsmouth)
  const showKingsport = enabled.has(expansionTrackSetKeys.kingsport)

  if (!showDunwich && !showInnsmouth && !showKingsport) return null

  const runCommand = (command: ExpansionTrackCommand) => {
    if (isPending) return

    startTransition(async () => {
      await onCommand(command)
    })
  }

  const deepOnesAwaken = state.deepOnesRising >= 6

  return (
    <section className="expansion-track-panel" aria-busy={isPending} aria-label="Expansion tracks">
      <div className="expansion-track-panel-heading">
        <p className="eyebrow">Expansion boards</p>
        <span>Persistent table tracks</span>
      </div>

      <div className="expansion-track-grid">
        {showDunwich && (
          <section
            className={`expansion-track-module dunwich-track${
              state.dunwichHorrorTokens >= 3 ? ' is-critical' : ''
            }`}
          >
            <div className="expansion-track-heading">
              <div>
                <span>Dunwich Horror</span>
                <strong>
                  {state.dunwichHorrorTokens >= 3
                    ? 'At Sentinel Hill'
                    : `${state.dunwichHorrorTokens}/3`}
                </strong>
              </div>
              <PipTrack label="Dunwich Horror" maximum={3} value={state.dunwichHorrorTokens} />
            </div>
            <p>
              {state.dunwichHorrorTokens >= 3
                ? 'Draw a Dunwich Horror card whenever combat begins.'
                : 'A Dunwich vortex raises Terror and advances this track.'}
            </p>
            <div className="expansion-track-actions">
              <TrackCorrectionButton
                disabled={isPending || state.dunwichHorrorTokens <= 0}
                label="Correct Dunwich Horror down"
                onClick={() => runCommand({ type: 'dunwich-correct-down' })}
              />
              <button
                disabled={isPending}
                onClick={() => runCommand({ type: 'dunwich-vortex' })}
                type="button"
              >
                Monster entered vortex
              </button>
              {state.dunwichHorrorTokens >= 3 && (
                <button
                  className="track-resolution-button"
                  disabled={isPending}
                  onClick={() => runCommand({ type: 'dunwich-defeated' })}
                  type="button"
                >
                  Horror defeated
                </button>
              )}
            </div>
          </section>
        )}

        {showInnsmouth && (
          <section
            className={`expansion-track-module innsmouth-track${
              deepOnesAwaken ? ' is-critical' : ''
            }`}
          >
            <div className="innsmouth-threat">
              <div className="expansion-track-heading">
                <div>
                  <span>Deep Ones Rising</span>
                  <strong>{state.deepOnesRising}/6</strong>
                </div>
                <PipTrack label="Deep Ones Rising" maximum={6} value={state.deepOnesRising} />
              </div>
              <p>
                {deepOnesAwaken
                  ? 'The track is full. The Ancient One awakens.'
                  : 'Prevented gates and Innsmouth vortices advance the uprising.'}
              </p>
              <div className="expansion-track-actions">
                <TrackCorrectionButton
                  disabled={isPending || state.deepOnesRising <= 0}
                  label="Correct Deep Ones Rising down"
                  onClick={() => runCommand({ type: 'innsmouth-correct-down' })}
                />
                <button
                  disabled={isPending || deepOnesAwaken}
                  onClick={() => runCommand({ type: 'innsmouth-gate-prevented' })}
                  type="button"
                >
                  Gate prevented
                </button>
                <button
                  disabled={isPending || deepOnesAwaken}
                  onClick={() => runCommand({ type: 'innsmouth-vortex' })}
                  type="button"
                >
                  Monster entered vortex
                </button>
              </div>
            </div>

            <div className={`feds-raid${phase === 'Upkeep' ? ' is-current-phase' : ''}`}>
              <div className="expansion-track-heading">
                <div>
                  <span>Feds Raid Innsmouth</span>
                  <strong>{fedsRaidTotal(state)}/6</strong>
                </div>
                <PipTrack label="Feds Raid Innsmouth" maximum={6} value={fedsRaidTotal(state)} />
              </div>
              <p>
                {phase === 'Upkeep'
                  ? 'Investigators in Innsmouth may spend clues now.'
                  : 'Evidence is placed during Upkeep from its matching neighborhood.'}
              </p>
              <div className="feds-districts">
                {(Object.keys(fedsRaidDistrictLabels) as FedsRaidDistrict[]).map((district) => (
                  <div className="feds-district" key={district}>
                    <span>{fedsRaidDistrictLabels[district]}</span>
                    <div>
                      <TrackCorrectionButton
                        disabled={isPending || state.fedsRaid[district] <= 0}
                        label={`Remove evidence from ${fedsRaidDistrictLabels[district]}`}
                        onClick={() => runCommand({ type: 'feds-remove', district })}
                      />
                      <strong>{state.fedsRaid[district]}/2</strong>
                      <button
                        aria-label={`Add evidence from ${fedsRaidDistrictLabels[district]}`}
                        disabled={isPending || deepOnesAwaken || state.fedsRaid[district] >= 2}
                        onClick={() => runCommand({ type: 'feds-add', district })}
                        title={`Add evidence from ${fedsRaidDistrictLabels[district]}`}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showKingsport && (
          <section className="expansion-track-module kingsport-track">
            <div className="expansion-track-heading">
              <div>
                <span>Kingsport Rifts</span>
                <strong>{state.kingsportRifts.filter((rift) => rift.open).length} open</strong>
              </div>
            </div>
            <p>
              Add progress when a Mythos movement pattern matches an available space on the board.
            </p>
            {phase === 'Mythos' &&
              mythosMovement &&
              (mythosMovement.white.length > 0 || mythosMovement.black.length > 0) && (
                <div className="rift-mythos-cue">
                  <span>Current Mythos movement</span>
                  <strong>White: {mythosMovement.white.join(', ') || 'none'}</strong>
                  <strong>Black: {mythosMovement.black.join(', ') || 'none'}</strong>
                </div>
              )}
            <div className="rift-track-grid">
              {state.kingsportRifts.map((rift) => (
                <RiftTrack
                  disabled={isPending}
                  key={rift.trackKey}
                  location={riftLocations[rift.trackKey] ?? ''}
                  onCommand={runCommand}
                  onLocationChange={(location) =>
                    setRiftLocations((current) => ({
                      ...current,
                      [rift.trackKey]: location,
                    }))
                  }
                  rift={rift}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
