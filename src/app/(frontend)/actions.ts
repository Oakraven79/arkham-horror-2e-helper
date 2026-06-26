'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveRumor,
  discardCurrentMythosCard,
  drawMythosCard,
  revealCurrentMythosCard,
  type MythosDeckState,
} from '@/lib/mythosDeckState'
import config from '@/payload.config'
import type { GameSession } from '@/payload-types'

type RelationshipValue = string | { id?: string | number } | null | undefined
type SessionLogAction = NonNullable<GameSession['sessionLog']>[number]['action']
type ShuffleEventReason = NonNullable<GameSession['shuffleEvents']>[number]['reason']

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

function sessionMythosState(session: GameSession): MythosDeckState {
  const mythos = session.mythos ?? {}

  return {
    drawPile: relationshipIDs(mythos.drawPile),
    discardPile: relationshipIDs(mythos.discardPile),
    drawHistory: relationshipIDs(mythos.drawHistory),
    currentDraw: relationshipID(mythos.currentDraw),
    currentDrawRevealed: mythos.currentDrawRevealed ?? false,
    activeEnvironment: relationshipID(mythos.activeEnvironment),
    activeRumor: relationshipID(mythos.activeRumor),
    shuffleCount: mythos.shuffleCount ?? 0,
  }
}

function logEntry(
  session: GameSession,
  action: SessionLogAction,
  card?: string | null,
  note?: string,
): NonNullable<GameSession['sessionLog']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    action,
    ...(card ? { card } : {}),
    ...(note ? { note } : {}),
  }
}

function shuffleEvent(
  session: GameSession,
  reason: ShuffleEventReason,
  note: string,
): NonNullable<GameSession['shuffleEvents']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    reason,
    note,
  }
}

async function getPayloadClient() {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}

async function updateSessionMythos(
  sessionID: string,
  state: MythosDeckState,
  action: SessionLogAction,
  card?: string | null,
  note?: string,
  extraData: Partial<Pick<GameSession, 'shuffleEvents'>> = {},
) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: state,
      sessionLog: [...(session.sessionLog ?? []), logEntry(session, action, card, note)],
      ...extraData,
    },
  })

  revalidatePath('/')
}

export async function drawMythosAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  const state = sessionMythosState(session)
  const result = drawMythosCard(state, shuffle(state.discardPile ?? []))
  const shuffleEvents = result.didShuffle
    ? [
        ...(session.shuffleEvents ?? []),
        shuffleEvent(session, 'deck-empty', 'Discard pile shuffled into the Mythos draw pile.'),
      ]
    : session.shuffleEvents

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: result.state,
      sessionLog: [
        ...(session.sessionLog ?? []),
        ...(result.didShuffle ? [logEntry(session, 'shuffle-deck', null, 'Deck empty.')] : []),
        logEntry(session, 'draw-mythos', result.drawnCardID),
      ],
      shuffleEvents,
    },
  })

  revalidatePath('/')
}

export async function revealCurrentDrawAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const state = revealCurrentMythosCard(sessionMythosState(session))

  await updateSessionMythos(sessionID, state, 'reveal-card', state.currentDraw)
}

export async function discardCurrentDrawAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = relationshipID(session.mythos?.currentDraw)
  const state = discardCurrentMythosCard(sessionMythosState(session))

  await updateSessionMythos(sessionID, state, 'discard-card', currentDraw)
}

export async function activateCurrentEnvironmentAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = relationshipID(session.mythos?.currentDraw)
  const state = activateCurrentEnvironment(sessionMythosState(session))

  await updateSessionMythos(sessionID, state, 'activate-environment', currentDraw)
}

export async function activateCurrentRumorAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = relationshipID(session.mythos?.currentDraw)
  const hadActiveRumor = Boolean(relationshipID(session.mythos?.activeRumor))
  const state = activateCurrentRumor(sessionMythosState(session))

  await updateSessionMythos(
    sessionID,
    state,
    hadActiveRumor ? 'discard-card' : 'activate-rumor',
    currentDraw,
    hadActiveRumor ? 'A Rumor was already active, so this Rumor text was ignored.' : undefined,
  )
}

export async function clearActiveRumorAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const activeRumor = relationshipID(session.mythos?.activeRumor)
  const state = clearActiveRumor(sessionMythosState(session))

  await updateSessionMythos(sessionID, state, 'pass-rumor', activeRumor)
}

export async function shuffleDiscardIntoDeckAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const state = sessionMythosState(session)
  const shuffledDiscard = shuffle(state.discardPile ?? [])
  const nextState = {
    ...state,
    drawPile: [...(state.drawPile ?? []), ...shuffledDiscard],
    discardPile: [],
    shuffleCount: (state.shuffleCount ?? 0) + 1,
  }

  await updateSessionMythos(
    sessionID,
    nextState,
    'shuffle-deck',
    null,
    'Discard pile manually shuffled into the Mythos draw pile.',
    {
      shuffleEvents: [
        ...(session.shuffleEvents ?? []),
        shuffleEvent(session, 'manual', 'Discard pile manually shuffled into the Mythos draw pile.'),
      ],
    },
  )
}

export async function resetMythosDeckAction(sessionID: string) {
  const payload = await getPayloadClient()
  const cards = await payload.find({
    collection: MYTHOS_CARDS,
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const nextState: MythosDeckState = {
    drawPile: shuffle(cards.docs.map((card) => String(card.id))),
    discardPile: [],
    drawHistory: [],
    currentDraw: null,
    currentDrawRevealed: false,
    activeEnvironment: null,
    activeRumor: null,
    shuffleCount: 0,
  }

  await updateSessionMythos(
    sessionID,
    nextState,
    'shuffle-deck',
    null,
    'Mythos deck reset from all available Mythos cards.',
  )
}
