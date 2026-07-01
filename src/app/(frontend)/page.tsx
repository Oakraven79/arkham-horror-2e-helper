import Link from 'next/link'
import { getPayload } from 'payload'

import { MythosCardFront, type MythosCardFrontProps } from '@/components/mythosCardFront'
import { gamePhaseGuides } from '@/content/gamePhaseGuides'
import { turnPhases, type GamePhase } from '@/lib/gamePhaseState'
import {
  calculateInvestigatorRules,
  calculateMonsterSurgeCount,
  gameLimitWarnings,
} from '@/lib/investigatorRules'
import { createGameSession } from '@/lib/gameSessions'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import { mythosDeckStateFromSession } from '@/lib/mythosSessionState'
import config from '@/payload.config'
import type {
  AncientOne,
  BoxedSet,
  GameSession,
  Location,
  MythosCard,
  OtherWorld,
} from '@/payload-types'

import {
  activateCurrentEnvironmentAction,
  activateCurrentRumorAction,
  advancePhaseAction,
  clearActiveEnvironmentAction,
  clearActiveRumorAction,
  discardCurrentDrawAction,
  previousPhaseAction,
  renameSessionAction,
  resetMythosDeckAction,
  resumeSessionAction,
  selectAncientOneAction,
  shuffleDiscardIntoDeckAction,
  startNewSessionAction,
} from './actions'
import { GameRulesContext } from './GameRulesContext'
import { InvestigatorCountInput } from './InvestigatorCountInput'
import { MythosDeckSlot } from './MythosDeckSlot'
import './styles.css'

export const dynamic = 'force-dynamic'

type RelationshipValue = string | MythosCard | null | undefined
type AncientOneSheet = AncientOne['sheets'][number]

const MYTHOS_CARDS = 'mythos-cards' as const
const EXPANSION_CITY_KEYS = new Set(['dunwich-horror', 'kingsport-horror', 'innsmouth-horror'])

function relationshipID(value: string | { id?: string | number } | null | undefined) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.id === undefined) return null
  return String(value.id)
}

function formatSessionTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne',
  }).format(new Date(value))
}

function isCardDocument(value: RelationshipValue): value is MythosCard {
  return Boolean(value && typeof value === 'object' && value.id !== undefined && 'title' in value)
}

function cardProps(card: MythosCard | null): MythosCardFrontProps | null {
  if (!card) return null
  return mythosCardFrontProps(card)
}

async function getAllMythosCards(payload: Awaited<ReturnType<typeof getPayload>>) {
  const cards = await payload.find({
    collection: MYTHOS_CARDS,
    limit: 1000,
    depth: 2,
    overrideAccess: true,
  })

  return cards.docs
}

async function getReferenceData(payload: Awaited<ReturnType<typeof getPayload>>) {
  const [ancientOnes, locations, otherWorlds] = await Promise.all([
    payload.find({
      collection: 'ancient-ones',
      limit: 100,
      sort: 'name',
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'locations',
      limit: 500,
      sort: 'name',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'other-worlds',
      limit: 100,
      sort: 'name',
      depth: 0,
      overrideAccess: true,
    }),
  ])

  return {
    ancientOnes: ancientOnes.docs,
    locations: locations.docs,
    otherWorlds: otherWorlds.docs,
  }
}

async function getOrCreateSession(
  payload: Awaited<ReturnType<typeof getPayload>>,
  requestedSessionID?: string,
): Promise<GameSession> {
  if (requestedSessionID) {
    try {
      return await payload.findByID({
        collection: 'game-sessions',
        id: requestedSessionID,
        depth: 2,
        overrideAccess: true,
      })
    } catch {
      // Fall back to the current active session when a saved URL is stale.
    }
  }

  const existing = await payload.find({
    collection: 'game-sessions',
    where: {
      status: {
        equals: 'active',
      },
    },
    sort: '-updatedAt',
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  if (existing.docs[0]) return existing.docs[0]

  return createGameSession(payload)
}

function resolveCard(value: RelationshipValue, cardsByID: Map<string, MythosCard>) {
  if (isCardDocument(value)) return value

  const id = relationshipID(value)
  if (!id) return null

  return cardsByID.get(id) ?? null
}

function selectedAncientOne(
  session: GameSession,
  ancientOnesByID: Map<string, AncientOne>,
): AncientOne | null {
  if (session.activeAncientOne && typeof session.activeAncientOne === 'object') {
    return session.activeAncientOne
  }

  const id = relationshipID(session.activeAncientOne)
  return id ? (ancientOnesByID.get(id) ?? null) : null
}

function selectedAncientOneSheet(
  ancientOne: AncientOne | null,
  sheetKey: string | null | undefined,
): AncientOneSheet | null {
  if (!ancientOne) return null

  return (
    ancientOne.sheets.find((sheet) => sheet.key === sheetKey) ??
    ancientOne.sheets.find((sheet) => sheet.isDefault) ??
    ancientOne.sheets[0] ??
    null
  )
}

function isBoxedSetDocument(value: BoxedSet | string): value is BoxedSet {
  return typeof value === 'object' && value !== null && 'key' in value
}

function addsExpansionBoard(boxedSet: BoxedSet) {
  return Boolean(boxedSet.addsExpansionBoard || EXPANSION_CITY_KEYS.has(boxedSet.key))
}

function CardSlot({
  title,
  card,
  emptyText,
  action,
  actionLabel,
  effectCard,
}: {
  title: string
  card: MythosCardFrontProps | null
  emptyText: string
  action?: () => Promise<void>
  actionLabel?: string
  effectCard?: MythosCard | null
}) {
  return (
    <section className="table-card-slot">
      <div className="slot-heading">
        <h2>{title}</h2>
        {action && actionLabel && (
          <form action={action}>
            <button className="text-button" type="submit">
              {actionLabel}
            </button>
          </form>
        )}
      </div>
      {card ? (
        <div className="table-card-frame">
          <MythosCardFront {...card} />
        </div>
      ) : (
        <div className="empty-card-slot">{emptyText}</div>
      )}
      {effectCard && (
        <div className="slot-effects">
          <ActiveEffect title={`${title.replace('Active ', '')} Effect`} card={effectCard} />
        </div>
      )}
    </section>
  )
}

function ActiveEffect({ title, card }: { title: string; card: MythosCard | null }) {
  const details = card
    ? [
        { label: 'Effect', text: card.effectText },
        { label: 'Ongoing', text: card.ongoingEffect },
        { label: 'Pass', text: card.passCondition },
        { label: 'Fail', text: card.failCondition },
      ].filter((detail): detail is { label: string; text: string } => Boolean(detail.text))
    : []

  return (
    <section className="active-effect">
      <p>{title}</p>
      <h3>{card?.title ?? 'None active'}</h3>
      {details.map((detail) => (
        <div className="active-effect-detail" key={detail.label}>
          <strong>{detail.label}</strong>
          <span>{detail.text}</span>
        </div>
      ))}
    </section>
  )
}

function AncientOneSetup({
  ancientOnes,
  activeAncientOne,
  activeSheet,
  investigatorCount,
  currentSession,
  savedSessions,
  sessionID,
}: {
  ancientOnes: AncientOne[]
  activeAncientOne: AncientOne | null
  activeSheet: AncientOneSheet | null
  investigatorCount: number
  currentSession: GameSession
  savedSessions: GameSession[]
  sessionID: string
}) {
  const currentSelection =
    activeAncientOne && activeSheet ? `${activeAncientOne.id}::${activeSheet.key}` : ''

  return (
    <section className="setup-workspace">
      <div className="setup-copy">
        <p className="eyebrow">Game Setup</p>
        <h2>Prepare the game</h2>
        <p>Choose the Ancient One sheet and number of investigators before the first turn.</p>
      </div>

      <section className="session-setup">
        <div className="current-session-details">
          <p className="eyebrow">Saved Games</p>
          <h3>{currentSession.name}</h3>
          <time dateTime={currentSession.createdAt}>
            Started {formatSessionTimestamp(currentSession.createdAt)}
          </time>
          <form action={renameSessionAction.bind(null, sessionID)} className="session-name-form">
            <label htmlFor="current-session-name">Session name</label>
            <input
              defaultValue={currentSession.name}
              id="current-session-name"
              maxLength={80}
              name="sessionName"
              required
              type="text"
            />
            <button type="submit">Save</button>
          </form>
        </div>
        <form action={resumeSessionAction} className="resume-session-form">
          <label htmlFor="saved-session">Resume session</label>
          <select defaultValue={sessionID} id="saved-session" name="sessionID">
            {savedSessions.map((savedSession) => (
              <option key={savedSession.id} value={savedSession.id}>
                {savedSession.name} - {formatSessionTimestamp(savedSession.createdAt)} - Turn{' '}
                {savedSession.turnNumber}, {savedSession.currentPhase} ({savedSession.status})
              </option>
            ))}
          </select>
          <button type="submit">Resume</button>
        </form>
        <form action={startNewSessionAction} className="new-session-form">
          <label htmlFor="new-session-name">New session name</label>
          <input
            id="new-session-name"
            maxLength={80}
            name="sessionName"
            placeholder="Friday night in Arkham"
            required
            type="text"
          />
          <button className="new-session-button" type="submit">
            Start session
          </button>
        </form>
      </section>

      {ancientOnes.length > 0 ? (
        <form
          action={selectAncientOneAction.bind(null, sessionID)}
          className="ancient-one-selector"
        >
          <div className="setup-form-fields">
            <div className="setup-form-field ancient-one-field">
              <label htmlFor="ancient-one-selection">Ancient One and sheet</label>
              <select
                defaultValue={currentSelection}
                id="ancient-one-selection"
                name="ancientOneSelection"
                required
              >
                <option disabled value="">
                  Select an Ancient One
                </option>
                {ancientOnes.flatMap((ancientOne) =>
                  ancientOne.sheets.map((sheet) => (
                    <option
                      key={`${ancientOne.id}-${sheet.key}`}
                      value={`${ancientOne.id}::${sheet.key}`}
                    >
                      {ancientOne.name} - {sheet.label} ({sheet.doomTrack} doom)
                    </option>
                  )),
                )}
              </select>
            </div>
            <div className="setup-form-field investigator-count-field">
              <label>Investigators</label>
              <InvestigatorCountInput initialValue={investigatorCount} />
            </div>
            <button type="submit">Save setup</button>
          </div>
        </form>
      ) : (
        <div className="setup-empty-state">
          <p>No Ancient Ones are available.</p>
          <Link href="/admin/collections/ancient-ones">Open Ancient Ones</Link>
        </div>
      )}
    </section>
  )
}

function EncounterDeckPlaceholder({
  kind,
  locations,
  otherWorlds,
}: {
  kind: 'arkham' | 'other-world'
  locations: Location[]
  otherWorlds: OtherWorld[]
}) {
  const isArkham = kind === 'arkham'

  return (
    <div className="encounter-draw-area">
      <label htmlFor={`${kind}-encounter-target`}>
        {isArkham ? 'Encounter location' : 'Other World'}
      </label>
      <select defaultValue="" id={`${kind}-encounter-target`}>
        <option disabled value="">
          {isArkham ? 'Select a location' : 'Select an Other World'}
        </option>
        {(isArkham ? locations : otherWorlds).map((destination) => (
          <option key={destination.id} value={destination.id}>
            {destination.name}
          </option>
        ))}
      </select>
      <button
        aria-label={
          isArkham ? 'Arkham encounter deck placeholder' : 'Other World encounter deck placeholder'
        }
        className={`encounter-deck-placeholder ${kind}`}
        disabled
        type="button"
      >
        <span className="encounter-deck-mark" aria-hidden="true">
          {isArkham ? 'AH' : 'OW'}
        </span>
        <span>{isArkham ? 'Arkham Encounter' : 'Other World Encounter'}</span>
        <strong>Draw card</strong>
      </button>
    </div>
  )
}

function PhaseGuide({
  locations,
  otherWorlds,
  phase,
}: {
  locations: Location[]
  otherWorlds: OtherWorld[]
  phase: GamePhase
}) {
  const guide = gamePhaseGuides[phase]
  const encounterKind =
    phase === 'Arkham Encounters'
      ? 'arkham'
      : phase === 'Other World Encounters'
        ? 'other-world'
        : null

  return (
    <section className="phase-guide">
      <p className="eyebrow">Current Phase</p>
      <h2>{guide.title}</h2>
      <p className="phase-summary">{guide.summary}</p>

      {encounterKind && (
        <EncounterDeckPlaceholder
          kind={encounterKind}
          locations={locations}
          otherWorlds={otherWorlds}
        />
      )}

      <ol className="phase-checklist">
        {guide.steps.map((step) => (
          <li key={step}>
            <span aria-hidden="true" />
            {step}
          </li>
        ))}
      </ol>
    </section>
  )
}

function PhaseNavigation({
  activeAncientOne,
  phase,
  sessionID,
  turnNumber,
}: {
  activeAncientOne: AncientOne | null
  phase: GamePhase
  sessionID: string
  turnNumber: number
}) {
  const activeIndex = turnPhases.findIndex((candidate) => candidate === phase)
  const nextLabel =
    phase === 'Setup'
      ? 'Begin game'
      : phase === 'Mythos'
        ? 'Complete turn'
        : phase === 'Final Battle'
          ? 'Final battle'
          : 'Next phase'

  return (
    <nav className="phase-ribbon" aria-label="Turn phase">
      <form action={previousPhaseAction.bind(null, sessionID)}>
        <button
          className="phase-navigation-button previous"
          disabled={phase === 'Setup'}
          type="submit"
        >
          <span aria-hidden="true">&larr;</span>
          Previous
        </button>
      </form>
      <div className="phase-context">
        <div className="turn-context">
          <span>{phase === 'Setup' ? 'Setup' : 'Turn'}</span>
          {phase !== 'Setup' && <strong>{turnNumber}</strong>}
        </div>
        <div className="phase-sequence">
          {turnPhases.map((candidate, index) => (
            <div
              className={[
                'phase-step',
                candidate === phase ? 'active' : '',
                activeIndex >= 0 && index < activeIndex ? 'complete' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={candidate}
            >
              {candidate}
            </div>
          ))}
        </div>
      </div>
      <form action={advancePhaseAction.bind(null, sessionID)}>
        <button
          className="phase-navigation-button next"
          disabled={!activeAncientOne || phase === 'Final Battle'}
          type="submit"
        >
          {nextLabel}
          <span aria-hidden="true">&rarr;</span>
        </button>
      </form>
    </nav>
  )
}

interface HomePageProps {
  searchParams: Promise<{
    session?: string | string[]
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestedSearchParams = await searchParams
  const requestedSessionID = Array.isArray(requestedSearchParams.session)
    ? requestedSearchParams.session[0]
    : requestedSearchParams.session
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const [mythosCards, referenceData] = await Promise.all([
    getAllMythosCards(payload),
    getReferenceData(payload),
  ])
  const session = await getOrCreateSession(payload, requestedSessionID)
  const savedSessionResult = await payload.find({
    collection: 'game-sessions',
    sort: '-updatedAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  const savedSessions = savedSessionResult.docs.filter(
    (savedSession) => savedSession.status === 'active' || savedSession.status === 'paused',
  )
  const cardsByID = new Map(mythosCards.map((card) => [String(card.id), card]))
  const ancientOnesByID = new Map(
    referenceData.ancientOnes.map((ancientOne) => [String(ancientOne.id), ancientOne]),
  )
  const mythos = mythosDeckStateFromSession(session)
  const tracks = session.tracks ?? {}
  const enabledSets = session.enabledSets.filter(isBoxedSetDocument)
  const enabledSetKeys = new Set(enabledSets.map((boxedSet) => boxedSet.key))
  const expansionBoards = enabledSets.filter(addsExpansionBoard)
  const investigatorRules = calculateInvestigatorRules({
    investigatorCount: session.playerCount,
    expansionBoardCount: expansionBoards.length,
    hasDunwich: enabledSetKeys.has('dunwich-horror'),
    hasInnsmouth: enabledSetKeys.has('innsmouth-horror'),
  })
  const limitWarnings = gameLimitWarnings(investigatorRules, {
    gatesOpen: tracks.gatesOpen ?? 0,
    monstersInArkham: tracks.monstersInArkham ?? 0,
    monstersInOutskirts: tracks.monstersInOutskirts ?? 0,
    terror: tracks.terror ?? 0,
  })
  const monsterSurgeCount = calculateMonsterSurgeCount(tracks.gatesOpen ?? 0, session.playerCount)
  const activeAncientOne = selectedAncientOne(session, ancientOnesByID)
  const activeSheet = selectedAncientOneSheet(activeAncientOne, session.ancientOneSheetKey)
  const currentPhase: GamePhase = activeAncientOne ? (session.currentPhase as GamePhase) : 'Setup'

  const drawPile = mythos.drawPile ?? []
  const discardPile = mythos.discardPile ?? []
  const drawHistory = mythos.drawHistory ?? []
  const currentCardDocument = resolveCard(mythos.currentDraw?.cardID, cardsByID)
  const activeEnvironmentDocument = resolveCard(mythos.activeEnvironment?.cardID, cardsByID)
  const activeRumorDocument = resolveCard(mythos.activeRumor?.cardID, cardsByID)
  const currentCard = cardProps(currentCardDocument)
  const activeEnvironment = cardProps(activeEnvironmentDocument)
  const activeRumor = cardProps(activeRumorDocument)
  const currentCardType = currentCardDocument?.cardType ?? ''
  const sessionID = String(session.id)

  return (
    <main className="mythos-table">
      <header className="table-topbar">
        <div className="session-title">
          <p className="eyebrow">Arkham Horror Helper</p>
          <h1>{session.name}</h1>
        </div>
        <div className="table-counters" aria-label="Session counters">
          <div>
            <span>Terror</span>
            <strong>{tracks.terror ?? 0}/10</strong>
          </div>
          <div>
            <span>Gates</span>
            <strong>{tracks.gatesOpen ?? 0}</strong>
          </div>
          <div>
            <span>Elder Signs</span>
            <strong>{tracks.elderSigns ?? 0}</strong>
          </div>
          <div>
            <span>Monsters</span>
            <strong>{tracks.monstersInArkham ?? 0}</strong>
          </div>
          <div>
            <span>Outskirts</span>
            <strong>{tracks.monstersInOutskirts ?? 0}</strong>
          </div>
          <div>
            <span>Draw Pile</span>
            <strong>{drawPile.length}</strong>
          </div>
        </div>
      </header>

      <section className="table-layout">
        <PhaseNavigation
          activeAncientOne={activeAncientOne}
          phase={currentPhase}
          sessionID={sessionID}
          turnNumber={session.turnNumber}
        />

        <GameRulesContext
          activeAncientOne={activeAncientOne}
          activeSheet={activeSheet}
          expansionBoardNames={expansionBoards.map((boxedSet) => boxedSet.name)}
          hasRelationships={enabledSetKeys.has('lurker-at-the-threshold')}
          investigatorRules={investigatorRules}
          phase={currentPhase}
          tracks={tracks}
        />

        {currentPhase !== 'Setup' && limitWarnings.length > 0 && (
          <section className="limit-warnings" aria-label="Game limit warnings">
            {limitWarnings.map((warning) => (
              <div className={warning.level} key={warning.text}>
                {warning.text}
              </div>
            ))}
          </section>
        )}

        {currentPhase === 'Setup' ? (
          <AncientOneSetup
            ancientOnes={referenceData.ancientOnes}
            activeAncientOne={activeAncientOne}
            activeSheet={activeSheet}
            investigatorCount={session.playerCount}
            currentSession={session}
            savedSessions={savedSessions}
            sessionID={sessionID}
          />
        ) : currentPhase === 'Mythos' ? (
          <div className="mythos-workspace">
            <aside className="mythos-resolver" aria-label="Mythos resolver">
              <header>
                <p className="eyebrow">Mythos Resolver</p>
                <h2>
                  {currentCardDocument
                    ? mythos.currentDrawRevealed
                      ? currentCardDocument.title
                      : 'Card drawn'
                    : 'Deck ready'}
                </h2>
                <p className="resolver-copy">
                  {currentCardDocument
                    ? mythos.currentDrawRevealed
                      ? currentCardType || 'Mythos card'
                      : 'Flip the card to reveal it.'
                    : mythosCards.length
                      ? 'Draw the next Mythos card.'
                      : 'No Mythos cards are available.'}
                </p>
              </header>

              <ol className="mythos-step-list">
                {gamePhaseGuides.Mythos.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="mythos-count-rules">
                <div>
                  <span>New gate</span>
                  <strong>{investigatorRules.newGateMonsterCount}</strong>
                </div>
                <div>
                  <span>Surge</span>
                  <strong>{monsterSurgeCount}</strong>
                </div>
                <div>
                  <span>Arkham room</span>
                  <strong>
                    {(tracks.terror ?? 0) >= 10
                      ? 'None'
                      : Math.max(
                          0,
                          investigatorRules.monsterLimit - (tracks.monstersInArkham ?? 0),
                        )}
                  </strong>
                </div>
                <div>
                  <span>Outskirts room</span>
                  <strong>
                    {Math.max(
                      0,
                      investigatorRules.outskirtsCapacity - (tracks.monstersInOutskirts ?? 0),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Gate pressure</span>
                  <strong>
                    {tracks.gatesOpen ?? 0}/{investigatorRules.gateAwakeningThreshold}
                  </strong>
                </div>
              </div>

              {currentCardDocument && mythos.currentDrawRevealed && (
                <section className="mythos-primary-action">
                  {String(currentCardType).startsWith('Environment') ? (
                    <form action={activateCurrentEnvironmentAction.bind(null, sessionID)}>
                      <button type="submit">Set as Environment</button>
                    </form>
                  ) : currentCardType === 'Rumor' ? (
                    <form action={activateCurrentRumorAction.bind(null, sessionID)}>
                      <button type="submit">
                        {activeRumorDocument ? 'Ignore new Rumor' : 'Set as Rumor'}
                      </button>
                    </form>
                  ) : (
                    <form action={discardCurrentDrawAction.bind(null, sessionID)}>
                      <button type="submit">Discard after resolving</button>
                    </form>
                  )}
                </section>
              )}

              <div className="mythos-pile-summary">
                <span>
                  Discard <strong>{discardPile.length}</strong>
                </span>
                <span>
                  Drawn <strong>{drawHistory.length}</strong>
                </span>
                <span>
                  Shuffles <strong>{mythos.shuffleCount ?? 0}</strong>
                </span>
              </div>

              <details className="mythos-deck-actions">
                <summary>Deck actions</summary>
                <div>
                  <form action={shuffleDiscardIntoDeckAction.bind(null, sessionID)}>
                    <button disabled={discardPile.length === 0} type="submit">
                      Shuffle discard into deck
                    </button>
                  </form>
                  <form action={resetMythosDeckAction.bind(null, sessionID)}>
                    <button type="submit">Reset Mythos deck</button>
                  </form>
                </div>
              </details>
            </aside>

            <section className="card-lineup mythos-card-lineup" aria-label="Mythos cards in play">
              <section className="table-card-slot">
                <div className="slot-heading">
                  <h2>Current Mythos</h2>
                </div>
                <div className="deck-area">
                  <MythosDeckSlot
                    sessionID={sessionID}
                    currentCard={currentCard}
                    currentCardID={mythos.currentDraw?.cardID ?? null}
                    revealed={Boolean(mythos.currentDrawRevealed)}
                    cardsRemaining={drawPile.length}
                  />
                </div>
              </section>

              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
                effectCard={activeEnvironmentDocument}
                action={
                  activeEnvironmentDocument
                    ? clearActiveEnvironmentAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                }
                actionLabel="Clear"
              />
            </section>
          </div>
        ) : (
          <div className="phase-workspace">
            <PhaseGuide
              locations={referenceData.locations}
              otherWorlds={referenceData.otherWorlds}
              phase={currentPhase}
            />
            <div className="persistent-card-lineup" aria-label="Active Mythos effects">
              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
                effectCard={activeEnvironmentDocument}
                action={
                  activeEnvironmentDocument
                    ? clearActiveEnvironmentAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                }
                actionLabel="Clear"
              />
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
