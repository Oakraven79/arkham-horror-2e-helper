'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { cssBackgroundImageValue } from '@/lib/ancientOneBackground'
import { expansionTrackSetKeys, type ExpansionTrackCommand } from '@/lib/expansionTracks'
import { expansionTracksAvailableForPhase, type GamePhase } from '@/lib/gamePhaseState'
import type {
  ControllerCommandDescriptor,
  ControllerCommandID,
  ControllerProjection,
} from '@/lib/controllerProjection'
import { createControllerCommandID } from '@/lib/controllerCommandID'
import type { AdjustableSessionTrack } from '@/lib/sessionTracks'

import { ExpansionTrackPanel } from '../ExpansionTrackPanel'
import styles from './controller.module.css'

interface ControllerClientProps {
  joinSecret?: string
  sessionID?: string
}

interface ErrorResponse {
  error?: string
}

type ControllerShellStyle = CSSProperties & {
  '--controller-background-image'?: string
}

const trackLabels: Record<AdjustableSessionTrack, string> = {
  doomCurrent: 'Doom',
  elderSigns: 'Elder Signs',
  finalBattleRound: 'Battle Round',
  gatesOpen: 'Open Gates',
  monstersInArkham: 'Arkham + Sky',
  monstersInOutskirts: 'Outskirts',
  terror: 'Terror',
}

const trackOrder = Object.keys(trackLabels) as AdjustableSessionTrack[]
const expansionBoardSetKeys = new Set<string>(Object.values(expansionTrackSetKeys))

async function responseBody<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ErrorResponse

  if (!response.ok) {
    throw new Error(body.error || 'The table could not be reached.')
  }

  return body
}

export function ControllerClient({ joinSecret, sessionID }: ControllerClientProps) {
  const [projection, setProjection] = useState<ControllerProjection | null>(null)
  const [roomSecret, setRoomSecret] = useState(joinSecret)
  const [roomSessionID, setRoomSessionID] = useState(sessionID)
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingCommand, setPendingCommand] = useState<string | null>(null)
  const [connection, setConnection] = useState<'connected' | 'connecting' | 'offline'>('connecting')

  const applyProjection = useCallback((next: ControllerProjection) => {
    setProjection((current) =>
      !current || next.session.revision >= current.session.revision ? next : current,
    )
  }, [])

  const refreshProjection = useCallback(async () => {
    try {
      const response = await fetch('/api/controller/session', {
        cache: 'no-store',
      })

      if (response.status === 401) {
        setProjection(null)
        setConnection('offline')
        return false
      }

      applyProjection(await responseBody<ControllerProjection>(response))
      return true
    } catch (caught) {
      setConnection(navigator.onLine ? 'connecting' : 'offline')
      setError(caught instanceof Error ? caught.message : 'The table could not be reached.')
      return false
    } finally {
      setLoading(false)
    }
  }, [applyProjection])

  useEffect(() => {
    if (!roomSecret || !roomSessionID) {
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const secretFromFragment = fragment.get('secret') || undefined
      const sessionFromFragment = fragment.get('session') || undefined

      if (secretFromFragment && sessionFromFragment) {
        setRoomSecret(secretFromFragment)
        setRoomSessionID(sessionFromFragment)
        window.history.replaceState(null, '', '/controller')
      }
    }
  }, [roomSecret, roomSessionID])

  useEffect(() => {
    void refreshProjection()
  }, [refreshProjection])

  const activeSessionID = projection?.session.id

  useEffect(() => {
    if (!activeSessionID) return

    const events = new EventSource('/api/controller/events')
    events.addEventListener('connected', () => setConnection('connected'))
    events.addEventListener('session-change', () => {
      setConnection('connected')
      void refreshProjection()
    })
    events.onerror = () => {
      setConnection(navigator.onLine ? 'connecting' : 'offline')
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshProjection()
    }
    const markOffline = () => setConnection('offline')
    const reconnect = () => {
      setConnection('connecting')
      void refreshProjection()
    }

    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('offline', markOffline)
    window.addEventListener('online', reconnect)

    return () => {
      events.close()
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('online', reconnect)
    }
  }, [activeSessionID, refreshProjection])

  const join = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    try {
      const response = await fetch('/api/controller/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          ...(roomSecret && roomSessionID
            ? { joinSecret: roomSecret, sessionID: roomSessionID }
            : { joinCode: joinCode.trim() }),
        }),
      })

      await responseBody<{ sessionID: string }>(response)
      const connected = await refreshProjection()

      if (connected) {
        setConnection('connecting')
        setNotice('Controller connected.')
        window.history.replaceState(null, '', '/controller')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not join this table.')
      setLoading(false)
    }
  }

  const leave = async () => {
    await fetch('/api/controller/leave', { method: 'POST' })
    setProjection(null)
    setNotice('')
    setError('')
    setConnection('offline')
  }

  const sendCommand = async (
    command: ControllerCommandID | 'adjust-expansion-track' | 'adjust-track',
    params?: Record<string, unknown>,
    confirmation?: string,
  ) => {
    if (!projection || pendingCommand) return
    if (confirmation && !window.confirm(confirmation)) return

    setError('')
    setNotice('')
    setPendingCommand(command)

    try {
      const response = await fetch('/api/controller/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command,
          expectedRevision: projection.session.revision,
          idempotencyKey: createControllerCommandID(),
          params,
        }),
      })
      const next = await responseBody<ControllerProjection>(response)
      applyProjection(next)
      setNotice('Applied to the table.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The command was not applied.')
      await refreshProjection()
    } finally {
      setPendingCommand(null)
    }
  }

  if (loading && !projection) {
    return (
      <main className={styles.shell}>
        <section className={styles.loading} aria-live="polite">
          <span className={styles.sigil}>AH</span>
          <p>Finding the table…</p>
        </section>
      </main>
    )
  }

  if (!projection) {
    return (
      <main className={styles.shell}>
        <section className={styles.joinCard}>
          <p className={styles.eyebrow}>Arkham Horror Helper</p>
          <h1>Join the table</h1>
          <p>This phone becomes an optional remote. The main dashboard remains in control.</p>

          <form onSubmit={join}>
            <label>
              Your name
              <input
                autoComplete="nickname"
                maxLength={30}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Jenny"
                required
                value={name}
              />
            </label>

            {!roomSecret && (
              <label>
                Join code
                <input
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  className={styles.codeInput}
                  maxLength={8}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="ABC234"
                  required
                  value={joinCode}
                />
              </label>
            )}

            <button disabled={loading} type="submit">
              {loading ? 'Joining…' : 'Join controller'}
            </button>
          </form>

          {error && <p className={styles.error}>{error}</p>}
        </section>
      </main>
    )
  }

  const primaryCommands = projection.commands.filter((command) => command.group === 'primary')
  const secondaryCommands = projection.commands.filter((command) => command.group === 'secondary')
  const hasExpansionTrackControls =
    expansionTracksAvailableForPhase(projection.session.phase as GamePhase) &&
    projection.expansionTracks.enabledSetKeys.some((key) => expansionBoardSetKeys.has(key))
  const shellStyle: ControllerShellStyle | undefined = projection.presentation.tableBackgroundUrl
    ? {
        '--controller-background-image': cssBackgroundImageValue(
          projection.presentation.tableBackgroundUrl,
        ),
      }
    : undefined

  return (
    <main className={styles.shell} style={shellStyle}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Connected as {projection.connection.participantName}</p>
          <h1>{projection.session.name}</h1>
        </div>
        <span className={styles.connection} data-state={connection}>
          {connection}
        </span>
      </header>

      <section className={styles.phaseCard}>
        <div className={styles.turn}>
          <span>Turn</span>
          <strong>{projection.session.turnNumber}</strong>
        </div>
        <div>
          <p className={styles.eyebrow}>Current phase</p>
          <h2>{projection.session.phase}</h2>
        </div>
      </section>

      <ControllerContext projection={projection} />

      <section className={styles.actions} aria-busy={Boolean(pendingCommand)}>
        {primaryCommands.map((command) =>
          command.id === 'select-arkham-neighborhood' ? (
            <NeighborhoodChoices
              disabled={Boolean(pendingCommand)}
              key={command.id}
              onSelect={(neighborhoodID) => void sendCommand(command.id, { neighborhoodID })}
              projection={projection}
            />
          ) : (
            <CommandButton
              command={command}
              disabled={Boolean(pendingCommand)}
              key={command.id}
              onCommand={sendCommand}
              pending={pendingCommand === command.id}
            />
          ),
        )}

        {secondaryCommands.length > 0 && (
          <div className={styles.secondaryActions}>
            {secondaryCommands.map((command) => (
              <CommandButton
                command={command}
                disabled={Boolean(pendingCommand)}
                key={command.id}
                onCommand={sendCommand}
                pending={pendingCommand === command.id}
              />
            ))}
          </div>
        )}
      </section>

      {projection.canAdjustTracks && (
        <TrackControls
          disabled={Boolean(pendingCommand)}
          onAdjust={(track, delta) => void sendCommand('adjust-track', { track, delta })}
          projection={projection}
        />
      )}

      {projection.canAdjustTracks && hasExpansionTrackControls && (
        <MobileExpansionTrackControls
          disabled={Boolean(pendingCommand)}
          onCommand={(expansionCommand) =>
            void sendCommand('adjust-expansion-track', { expansionCommand })
          }
          projection={projection}
        />
      )}

      {(notice || error) && (
        <p className={error ? styles.error : styles.notice} aria-live="polite">
          {error || notice}
        </p>
      )}

      <footer className={styles.footer}>
        <button onClick={() => void refreshProjection()} type="button">
          Refresh
        </button>
        <button onClick={() => void leave()} type="button">
          Leave table
        </button>
      </footer>
    </main>
  )
}

function ControllerContext({ projection }: { projection: ControllerProjection }) {
  const details = useMemo(() => {
    if (projection.currentCard) {
      return {
        eyebrow: projection.currentCard.revealed ? projection.currentCard.type : 'Face down',
        title: projection.currentCard.revealed ? projection.currentCard.title : 'Mythos card drawn',
      }
    }

    if (projection.arkhamEncounter.currentCardTitle) {
      return {
        eyebrow: projection.arkhamEncounter.selectedNeighborhoodName ?? 'Arkham encounter',
        title: projection.arkhamEncounter.currentCardTitle,
      }
    }

    if (projection.arkhamEncounter.selectedNeighborhoodName) {
      return {
        eyebrow: 'Neighborhood selected',
        title: projection.arkhamEncounter.selectedNeighborhoodName,
      }
    }

    if (projection.otherWorldEncounter.currentCardTitle) {
      return {
        eyebrow: 'Other World encounter',
        title: projection.otherWorldEncounter.currentCardTitle,
      }
    }

    return null
  }, [projection])

  if (!details) return null

  return (
    <section className={styles.contextCard}>
      <p className={styles.eyebrow}>{details.eyebrow}</p>
      <h2>{details.title}</h2>
    </section>
  )
}

function NeighborhoodChoices({
  disabled,
  onSelect,
  projection,
}: {
  disabled: boolean
  onSelect: (neighborhoodID: string) => void
  projection: ControllerProjection
}) {
  return (
    <section className={styles.neighborhoods}>
      <h2>Choose a neighborhood</h2>
      <div>
        {projection.arkhamEncounter.neighborhoods.map((neighborhood) => (
          <button
            disabled={disabled}
            key={neighborhood.id}
            onClick={() => onSelect(neighborhood.id)}
            type="button"
          >
            <span>{neighborhood.board}</span>
            <strong>{neighborhood.name}</strong>
          </button>
        ))}
      </div>
    </section>
  )
}

function CommandButton({
  command,
  disabled,
  onCommand,
  pending,
}: {
  command: ControllerCommandDescriptor
  disabled: boolean
  onCommand: (
    command: ControllerCommandID,
    params?: Record<string, unknown>,
    confirmation?: string,
  ) => Promise<void>
  pending: boolean
}) {
  return (
    <button
      className={command.tone === 'primary' ? styles.primaryAction : styles.secondaryAction}
      disabled={disabled}
      onClick={() => void onCommand(command.id, undefined, command.confirmation)}
      type="button"
    >
      {pending ? 'Applying…' : command.label}
    </button>
  )
}

function MobileExpansionTrackControls({
  disabled,
  onCommand,
  projection,
}: {
  disabled: boolean
  onCommand: (command: ExpansionTrackCommand) => void
  projection: ControllerProjection
}) {
  return (
    <details className={styles.expansionPanel}>
      <summary>Expansion boards</summary>
      <ExpansionTrackPanel
        enabledSetKeys={projection.expansionTracks.enabledSetKeys}
        mythosMovement={projection.expansionTracks.mythosMovement ?? undefined}
        onCommand={(command) => {
          if (!disabled) onCommand(command)
        }}
        phase={projection.session.phase as GamePhase}
        state={projection.expansionTracks.state}
      />
    </details>
  )
}

function TrackControls({
  disabled,
  onAdjust,
  projection,
}: {
  disabled: boolean
  onAdjust: (track: AdjustableSessionTrack, delta: -1 | 1) => void
  projection: ControllerProjection
}) {
  return (
    <details className={styles.trackPanel}>
      <summary>Table counters</summary>
      <div>
        {trackOrder.map((track) => {
          const minimum = track === 'finalBattleRound' ? 1 : 0
          const value = projection.tracks[track] ?? minimum
          const maximum =
            track === 'doomCurrent'
              ? (projection.tracks.doomMax ?? undefined)
              : track === 'terror'
                ? 10
                : undefined

          return (
            <section className={styles.counter} key={track}>
              <span>{trackLabels[track]}</span>
              <div>
                <button
                  aria-label={`Decrease ${trackLabels[track]}`}
                  disabled={disabled || value <= minimum}
                  onClick={() => onAdjust(track, -1)}
                  type="button"
                >
                  −
                </button>
                <strong>
                  {value}
                  {maximum !== undefined ? <small>/{maximum}</small> : null}
                </strong>
                <button
                  aria-label={`Increase ${trackLabels[track]}`}
                  disabled={disabled || (maximum !== undefined && value >= maximum)}
                  onClick={() => onAdjust(track, 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </section>
          )
        })}
      </div>
    </details>
  )
}
