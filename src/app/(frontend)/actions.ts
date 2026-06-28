'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveRumor,
  discardCurrentMythosCard,
  drawMythosCard,
  createMythosDeckInstances,
  revealCurrentMythosCard,
  type MythosDeckState,
} from '@/lib/mythosDeckState'
import {
  mythosDeckStateForPayload,
  mythosDeckStateFromSession,
} from '@/lib/mythosSessionState'
import config from '@/payload.config'
import type { GameSession } from '@/payload-types'

type SessionLogAction = NonNullable<GameSession['sessionLog']>[number]['action']
type ShuffleEventReason = NonNullable<GameSession['shuffleEvents']>[number]['reason']

const GAME_SESSIONS = 'game-sessions' as const
const MYTHOS_CARDS = 'mythos-cards' as const

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
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
      mythos: mythosDeckStateForPayload(state),
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

  const state = mythosDeckStateFromSession(session)
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
      mythos: mythosDeckStateForPayload(result.state),
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
  const state = revealCurrentMythosCard(mythosDeckStateFromSession(session))

  await updateSessionMythos(
    sessionID,
    state,
    'reveal-card',
    state.currentDraw?.cardID,
  )
}

export async function discardCurrentDrawAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = mythosDeckStateFromSession(session).currentDraw?.cardID
  const state = discardCurrentMythosCard(mythosDeckStateFromSession(session))

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
  const currentDraw = mythosDeckStateFromSession(session).currentDraw?.cardID
  const state = activateCurrentEnvironment(mythosDeckStateFromSession(session))

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
  const sessionState = mythosDeckStateFromSession(session)
  const currentDraw = sessionState.currentDraw?.cardID
  const hadActiveRumor = Boolean(sessionState.activeRumor)
  const state = activateCurrentRumor(sessionState)

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
  const sessionState = mythosDeckStateFromSession(session)
  const activeRumor = sessionState.activeRumor?.cardID
  const state = clearActiveRumor(sessionState)

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
  const state = mythosDeckStateFromSession(session)
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
    drawPile: shuffle(createMythosDeckInstances(cards.docs)),
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
