import Link from 'next/link'
import { getPayload } from 'payload'

import { MythosCardFront, type MythosCardFrontProps } from '@/components/mythosCardFront'
import { gamePhaseGuides } from '@/content/gamePhaseGuides'
import { turnPhases, type GamePhase } from '@/lib/gamePhaseState'
import { createMythosDeckInstances } from '@/lib/mythosDeckState'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import {
  mythosDeckStateForPayload,
  mythosDeckStateFromSession,
} from '@/lib/mythosSessionState'
import config from '@/payload.config'
import type {
  AncientOne,
  GameSession,
  Location,
  MythosCard,
  OtherWorld,
} from '@/payload-types'

import {
  activateCurrentEnvironmentAction,
  activateCurrentRumorAction,
  advancePhaseAction,
  clearActiveRumorAction,
  discardCurrentDrawAction,
  previousPhaseAction,
  resetMythosDeckAction,
  selectAncientOneAction,
  shuffleDiscardIntoDeckAction,
} from './actions'
import { MythosDeckSlot } from './MythosDeckSlot'
import './styles.css'

export const dynamic = 'force-dynamic'

type RelationshipValue = string | MythosCard | null | undefined
type AncientOneSheet = AncientOne['sheets'][number]

const GAME_SESSIONS = 'game-sessions' as const
const MYTHOS_CARDS = 'mythos-cards' as const

function relationshipID(value: string | { id?: string | number } | null | undefined) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.id === undefined) return null
  return String(value.id)
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
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
  mythosCards: MythosCard[],
): Promise<GameSession> {
  const existing = await payload.find({
    collection: GAME_SESSIONS,
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

  const baseSet = await payload.find({
    collection: 'boxed-sets',
    where: {
      key: {
        equals: 'base-game',
      },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const baseSetID = baseSet.docs[0]?.id

  if (!baseSetID) {
    throw new Error('The Base Game boxed set must be seeded before creating a session.')
  }

  const created = await payload.create({
    collection: GAME_SESSIONS,
    overrideAccess: true,
    data: {
      name: 'Arkham Horror Session',
      status: 'active',
      playerCount: 4,
      activeExpansions: ['Base Game'],
      enabledSets: [baseSetID],
      turnNumber: 1,
      currentPhase: 'Setup',
      tracks: {
        doomCurrent: 0,
        doomMax: 10,
        terror: 0,
        gatesOpen: 0,
        elderSigns: 0,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
      },
      mythos: mythosDeckStateForPayload({
        drawPile: shuffle(createMythosDeckInstances(mythosCards)),
        discardPile: [],
        drawHistory: [],
        currentDraw: null,
        currentDrawRevealed: false,
        activeEnvironment: null,
        activeRumor: null,
        shuffleCount: 0,
      }),
      sessionLog: [
        {
          turnNumber: 1,
          phase: 'Setup',
          action: 'shuffle-deck',
          note: 'Session created with a shuffled Mythos draw pile.',
        },
      ],
      shuffleEvents: [
        {
          turnNumber: 1,
          phase: 'Setup',
          reason: 'setup',
          note: 'Initial Mythos deck shuffle.',
        },
      ],
    },
  })

  return payload.findByID({
    collection: GAME_SESSIONS,
    id: created.id,
    depth: 2,
    overrideAccess: true,
  })
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
  return id ? ancientOnesByID.get(id) ?? null : null
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
  sessionID,
}: {
  ancientOnes: AncientOne[]
  activeAncientOne: AncientOne | null
  activeSheet: AncientOneSheet | null
  sessionID: string
}) {
  const currentSelection =
    activeAncientOne && activeSheet ? `${activeAncientOne.id}::${activeSheet.key}` : ''

  return (
    <section className="setup-workspace">
      <div className="setup-copy">
        <p className="eyebrow">Game Setup</p>
        <h2>Choose the Ancient One</h2>
        <p>
          The selected playable sheet sets the doom-track length for this saved game.
        </p>
      </div>

      {ancientOnes.length > 0 ? (
        <form
          action={selectAncientOneAction.bind(null, sessionID)}
          className="ancient-one-selector"
        >
          <label htmlFor="ancient-one-selection">Ancient One and sheet</label>
          <div>
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
            <button type="submit">
              {activeAncientOne ? 'Update selection' : 'Set Ancient One'}
            </button>
          </div>
        </form>
      ) : (
        <div className="setup-empty-state">
          <p>No Ancient Ones are available.</p>
          <Link href="/admin/collections/ancient-ones">Open Ancient Ones</Link>
        </div>
      )}

      {activeAncientOne && activeSheet && (
        <section className="ancient-one-sheet-summary">
          <div>
            <span>Ancient One</span>
            <strong>{activeAncientOne.name}</strong>
          </div>
          <div>
            <span>Sheet</span>
            <strong>{activeSheet.label}</strong>
          </div>
          <div>
            <span>Doom track</span>
            <strong>{activeSheet.doomTrack}</strong>
          </div>
          <div>
            <span>{activeSheet.powerName}</span>
            <strong>{activeSheet.power}</strong>
          </div>
        </section>
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
          isArkham
            ? 'Arkham encounter deck placeholder'
            : 'Other World encounter deck placeholder'
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
  activeAncientOne,
  activeSheet,
  locations,
  otherWorlds,
  phase,
}: {
  activeAncientOne: AncientOne | null
  activeSheet: AncientOneSheet | null
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

      {activeAncientOne && activeSheet && (
        <section className="ancient-one-power">
          <p>{activeAncientOne.name}</p>
          <h3>{activeSheet.powerName}</h3>
          <span>{activeSheet.power}</span>
        </section>
      )}
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

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const [mythosCards, referenceData] = await Promise.all([
    getAllMythosCards(payload),
    getReferenceData(payload),
  ])
  const session = await getOrCreateSession(payload, mythosCards)
  const cardsByID = new Map(mythosCards.map((card) => [String(card.id), card]))
  const ancientOnesByID = new Map(
    referenceData.ancientOnes.map((ancientOne) => [String(ancientOne.id), ancientOne]),
  )
  const mythos = mythosDeckStateFromSession(session)
  const tracks = session.tracks ?? {}
  const activeAncientOne = selectedAncientOne(session, ancientOnesByID)
  const activeSheet = selectedAncientOneSheet(
    activeAncientOne,
    session.ancientOneSheetKey,
  )
  const currentPhase: GamePhase = activeAncientOne
    ? (session.currentPhase as GamePhase)
    : 'Setup'

  const drawPile = mythos.drawPile ?? []
  const discardPile = mythos.discardPile ?? []
  const drawHistory = mythos.drawHistory ?? []
  const currentCardDocument = resolveCard(mythos.currentDraw?.cardID, cardsByID)
  const activeEnvironmentDocument = resolveCard(
    mythos.activeEnvironment?.cardID,
    cardsByID,
  )
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
        <section className="ancient-one-status" aria-label="Active Ancient One">
          <span>Ancient One</span>
          <strong>{activeAncientOne?.name ?? 'Not selected'}</strong>
          <small>
            {activeSheet
              ? `${activeSheet.powerName} | Doom ${tracks.doomCurrent ?? 0}/${tracks.doomMax ?? activeSheet.doomTrack}`
              : 'Choose during setup'}
          </small>
        </section>
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

        {currentPhase === 'Setup' ? (
          <AncientOneSetup
            ancientOnes={referenceData.ancientOnes}
            activeAncientOne={activeAncientOne}
            activeSheet={activeSheet}
            sessionID={sessionID}
          />
        ) : currentPhase === 'Mythos' ? (
          <>
            <section className="card-lineup" aria-label="Mythos cards in play">
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
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument
                    ? clearActiveRumorAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
            </section>

            <aside className="resolver-panel" aria-label="Mythos resolver">
              <section>
                <p className="eyebrow">Current Draw</p>
                <h2>{currentCardDocument?.title ?? 'Deck ready'}</h2>
                <p className="resolver-copy">
                  {currentCardDocument
                    ? mythos.currentDrawRevealed
                      ? currentCardType || 'Mythos card'
                      : 'Face down'
                    : mythosCards.length
                      ? 'Draw the next Mythos card.'
                      : 'No Mythos cards are available.'}
                </p>
              </section>

              <section className="resolver-actions">
                {currentCardDocument && (
                  <>
                    <form action={discardCurrentDrawAction.bind(null, sessionID)}>
                      <button type="submit">Discard after resolving</button>
                    </form>
                    {String(currentCardType).startsWith('Environment') && (
                      <form action={activateCurrentEnvironmentAction.bind(null, sessionID)}>
                        <button type="submit">Set as Environment</button>
                      </form>
                    )}
                    {currentCardType === 'Rumor' && (
                      <form action={activateCurrentRumorAction.bind(null, sessionID)}>
                        <button type="submit">
                          {activeRumorDocument ? 'Ignore new Rumor' : 'Set as Rumor'}
                        </button>
                      </form>
                    )}
                  </>
                )}
                <form action={shuffleDiscardIntoDeckAction.bind(null, sessionID)}>
                  <button disabled={discardPile.length === 0} type="submit">
                    Shuffle discard into deck
                  </button>
                </form>
                <form action={resetMythosDeckAction.bind(null, sessionID)}>
                  <button type="submit">Reset Mythos deck</button>
                </form>
              </section>

              <section className="session-piles">
                <div>
                  <span>Discard</span>
                  <strong>{discardPile.length}</strong>
                </div>
                <div>
                  <span>Drawn</span>
                  <strong>{drawHistory.length}</strong>
                </div>
                <div>
                  <span>Shuffles</span>
                  <strong>{mythos.shuffleCount ?? 0}</strong>
                </div>
              </section>

              <section className="resolver-steps">
                <h2>Mythos Steps</h2>
                <ol>
                  {gamePhaseGuides.Mythos.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            </aside>
          </>
        ) : (
          <div className="phase-workspace">
            <PhaseGuide
              activeAncientOne={activeAncientOne}
              activeSheet={activeSheet}
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
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument
                    ? clearActiveRumorAction.bind(null, sessionID)
                    : undefined
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
