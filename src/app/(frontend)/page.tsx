import Link from 'next/link'
import { getPayload } from 'payload'

import { MythosCardFront, type MythosCardFrontProps } from '@/components/mythosCardFront'
import config from '@/payload.config'
import type { GameSession, MythosCard } from '@/payload-types'

import {
  activateCurrentEnvironmentAction,
  activateCurrentRumorAction,
  clearActiveRumorAction,
  discardCurrentDrawAction,
  resetMythosDeckAction,
  shuffleDiscardIntoDeckAction,
} from './actions'
import { MythosDeckSlot } from './MythosDeckSlot'
import './styles.css'

export const dynamic = 'force-dynamic'

type RelationshipValue = string | MythosCard | null | undefined

const GAME_SESSIONS = 'game-sessions' as const
const MYTHOS_CARDS = 'mythos-cards' as const

function relationshipID(value: RelationshipValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.id === undefined) return null
  return String(value.id)
}

function relationshipIDs(values: RelationshipValue[] | null | undefined): string[] {
  return (values ?? []).map(relationshipID).filter((id): id is string => Boolean(id))
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

  return {
    title: card.title,
    cardType: card.cardType,
    cardDescription: card.desc ?? '',
    monsterMoveWhite: card.monsterMoveWhite ?? undefined,
    monsterMoveBlack: card.monsterMoveBlack ?? undefined,
    portalLocation: card.encounterLocation,
    portalLocationAltImg: card.altLocationImg ?? undefined,
    portalLocationAltText: card.altLocationText ?? undefined,
  }
}

async function getAllMythosCards(payload: Awaited<ReturnType<typeof getPayload>>) {
  const cards = await payload.find({
    collection: MYTHOS_CARDS,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  return cards.docs
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
    depth: 1,
    overrideAccess: true,
  })

  if (existing.docs[0]) return existing.docs[0]

  const created = await payload.create({
    collection: GAME_SESSIONS,
    overrideAccess: true,
    data: {
      name: 'Arkham Horror Session',
      status: 'active',
      playerCount: 4,
      activeExpansions: ['Base Game'],
      turnNumber: 1,
      currentPhase: 'Mythos',
      tracks: {
        doomCurrent: 0,
        doomMax: 10,
        terror: 0,
        gatesOpen: 0,
        elderSigns: 0,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
      },
      mythos: {
        drawPile: shuffle(mythosCards.map((card) => String(card.id))),
        discardPile: [],
        drawHistory: [],
        currentDrawRevealed: false,
        shuffleCount: 0,
      },
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
    depth: 1,
    overrideAccess: true,
  })
}

function resolveCard(value: RelationshipValue, cardsByID: Map<string, MythosCard>) {
  if (isCardDocument(value)) return value

  const id = relationshipID(value)
  if (!id) return null

  return cardsByID.get(id) ?? null
}

function CardSlot({
  title,
  card,
  emptyText,
  action,
  actionLabel,
}: {
  title: string
  card: MythosCardFrontProps | null
  emptyText: string
  action?: () => Promise<void>
  actionLabel?: string
}) {
  return (
    <section className="active-card-slot">
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
        <div className="active-card-frame">
          <MythosCardFront {...card} />
        </div>
      ) : (
        <div className="empty-card-slot">{emptyText}</div>
      )}
    </section>
  )
}

export default async function HomePage() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const mythosCards = await getAllMythosCards(payload)
  const session = await getOrCreateSession(payload, mythosCards)
  const cardsByID = new Map(mythosCards.map((card) => [String(card.id), card]))
  const mythos = session.mythos ?? {}
  const tracks = session.tracks ?? {}

  const drawPile = relationshipIDs(mythos.drawPile)
  const discardPile = relationshipIDs(mythos.discardPile)
  const drawHistory = relationshipIDs(mythos.drawHistory)
  const currentCardDocument = resolveCard(mythos.currentDraw, cardsByID)
  const activeEnvironmentDocument = resolveCard(mythos.activeEnvironment, cardsByID)
  const activeRumorDocument = resolveCard(mythos.activeRumor, cardsByID)
  const currentCard = cardProps(currentCardDocument)
  const activeEnvironment = cardProps(activeEnvironmentDocument)
  const activeRumor = cardProps(activeRumorDocument)
  const currentCardType = currentCardDocument?.cardType ?? ''
  const sessionID = String(session.id)

  return (
    <main className="mythos-table">
      <header className="table-topbar">
        <div>
          <p className="eyebrow">Arkham Horror Helper</p>
          <h1>{session.name}</h1>
        </div>
        <div className="table-counters" aria-label="Session counters">
          <div>
            <span>Doom</span>
            <strong>
              {tracks.doomCurrent ?? 0}/{tracks.doomMax ?? 10}
            </strong>
          </div>
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
            <span>Draw Pile</span>
            <strong>{drawPile.length}</strong>
          </div>
        </div>
      </header>

      {mythosCards.length === 0 ? (
        <section className="empty-library">
          <h2>No Mythos cards yet</h2>
          <p>Create Mythos cards in Payload, then return here to build the deck.</p>
          <Link href="/admin/collections/mythos-cards">Open Mythos cards</Link>
        </section>
      ) : (
        <section className="table-layout">
          <aside className="phase-rail" aria-label="Turn phase">
            {[
              'Upkeep',
              'Movement',
              'Arkham Encounters',
              'Other World Encounters',
              'Mythos',
            ].map((phase) => (
              <div
                className={phase === session.currentPhase ? 'phase-step active' : 'phase-step'}
                key={phase}
              >
                {phase}
              </div>
            ))}
          </aside>

          <section className="mythos-stage" aria-label="Mythos deck">
            <div className="deck-area">
              <MythosDeckSlot
                sessionID={sessionID}
                currentCard={currentCard}
                currentCardID={relationshipID(mythos.currentDraw)}
                revealed={Boolean(mythos.currentDrawRevealed)}
                cardsRemaining={drawPile.length}
              />
            </div>

            <div className="persistent-cards">
              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                action={
                  activeRumorDocument
                    ? clearActiveRumorAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
            </div>
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
                  : 'Draw the next Mythos card when the Mythos phase begins.'}
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
                <li>Open gate or resolve monster surge.</li>
                <li>Place the clue token.</li>
                <li>Move monsters using the card icons.</li>
                <li>Resolve Headline, Environment, or Rumor text.</li>
              </ol>
            </section>
          </aside>
        </section>
      )}
    </main>
  )
}
