import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@/payload.config'
import type { AncientOne, BoxedSet, GameSession } from '@/payload-types'

import { deleteSessionAction, resumeSessionAction, startNewSessionAction } from '../actions'
import { DeleteSessionControl } from './DeleteSessionControl'

export const dynamic = 'force-dynamic'

type SessionSummary = Pick<
  GameSession,
  | 'activeAncientOne'
  | 'createdAt'
  | 'currentPhase'
  | 'enabledSets'
  | 'id'
  | 'name'
  | 'playerCount'
  | 'status'
  | 'turnNumber'
  | 'updatedAt'
>

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne',
  }).format(new Date(value))
}

function populatedAncientOne(value: SessionSummary['activeAncientOne']): AncientOne | null {
  return value && typeof value === 'object' ? value : null
}

function populatedBoxedSets(values: SessionSummary['enabledSets']) {
  return values.filter(
    (value): value is BoxedSet => typeof value === 'object' && value !== null && 'key' in value,
  )
}

function SessionSetMarks({ sets }: { sets: BoxedSet[] }) {
  return (
    <div className="session-set-marks" aria-label="Sets in play">
      {sets.map((boxedSet) => {
        const icon = boxedSet.icon && typeof boxedSet.icon === 'object' ? boxedSet.icon : null

        return (
          <span className="session-set-mark" key={boxedSet.id} title={boxedSet.name}>
            {icon?.url ? (
              // Payload media may be local or externally hosted.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={icon.alt ?? boxedSet.name} src={icon.url} />
            ) : (
              boxedSet.abbreviation
            )}
          </span>
        )
      })}
    </div>
  )
}

function SavedSessionRow({ session }: { session: SessionSummary }) {
  const ancientOne = populatedAncientOne(session.activeAncientOne)
  const sets = populatedBoxedSets(session.enabledSets)

  return (
    <article className="saved-session-row">
      <div className="saved-session-identity">
        <div>
          <span className={`session-status ${session.status}`}>
            {session.status === 'active' ? 'Current game' : 'Saved game'}
          </span>
          <h2>{session.name}</h2>
        </div>
        <time dateTime={session.updatedAt}>Last played {formatTimestamp(session.updatedAt)}</time>
      </div>

      <dl className="saved-session-facts">
        <div>
          <dt>Progress</dt>
          <dd>
            Turn {session.turnNumber}, {session.currentPhase}
          </dd>
        </div>
        <div>
          <dt>Investigators</dt>
          <dd>{session.playerCount}</dd>
        </div>
        <div>
          <dt>Ancient One</dt>
          <dd>{ancientOne?.name ?? 'Not selected'}</dd>
        </div>
      </dl>

      <SessionSetMarks sets={sets} />

      <div className="saved-session-actions">
        <form action={resumeSessionAction}>
          <input name="sessionID" type="hidden" value={session.id} />
          <button className="resume-session-button" type="submit">
            {session.status === 'active' ? 'Continue' : 'Resume'}
          </button>
        </form>
        <DeleteSessionControl
          action={deleteSessionAction.bind(null, session.id)}
          sessionName={session.name}
        />
      </div>
    </article>
  )
}

export default async function SessionsPage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const result = await payload.find({
    collection: 'game-sessions',
    where: {
      status: {
        in: ['active', 'paused'],
      },
    },
    sort: '-updatedAt',
    limit: 50,
    depth: 2,
    select: {
      name: true,
      status: true,
      playerCount: true,
      enabledSets: true,
      turnNumber: true,
      activeAncientOne: true,
      currentPhase: true,
      updatedAt: true,
      createdAt: true,
    },
    overrideAccess: true,
  })

  return (
    <main className="session-hub">
      <header className="session-hub-header">
        <div>
          <p className="eyebrow">Arkham Horror Helper</p>
          <h1>Game sessions</h1>
          <p>Resume a saved table or prepare a new game.</p>
        </div>
        <Link href="/admin">Admin</Link>
      </header>

      <div className="session-hub-layout">
        <section className="saved-session-library" aria-labelledby="saved-session-heading">
          <header>
            <div>
              <p className="eyebrow">Saved Tables</p>
              <h2 id="saved-session-heading">Continue a game</h2>
            </div>
            <span>{result.docs.length} available</span>
          </header>

          {result.docs.length > 0 ? (
            <div className="saved-session-list">
              {result.docs.map((session) => (
                <SavedSessionRow key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <div className="session-hub-empty">
              <h3>No saved games</h3>
              <p>Create a session to begin preparing the table.</p>
            </div>
          )}
        </section>

        <aside className="create-session-panel">
          <p className="eyebrow">New Table</p>
          <h2>Start a game</h2>
          <form action={startNewSessionAction}>
            <label htmlFor="session-hub-new-name">Session name</label>
            <input
              id="session-hub-new-name"
              maxLength={80}
              name="sessionName"
              placeholder="Friday night in Arkham"
              required
              type="text"
            />
            <button type="submit">Create session</button>
          </form>
        </aside>
      </div>
    </main>
  )
}
