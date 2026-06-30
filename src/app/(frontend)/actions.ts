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
import {
  nextGamePhase,
  previousGamePhase,
  transitionFor,
  type GamePhase,
  type GamePhasePointer,
} from '@/lib/gamePhaseState'
import config from '@/payload.config'
import type { AncientOne, GameSession } from '@/payload-types'

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

function phasePointer(session: GameSession): GamePhasePointer {
  return {
    currentPhase: session.currentPhase as GamePhase,
    turnNumber: session.turnNumber,
  }
}

function relationshipID(value: AncientOne | string | null | undefined) {
  if (!value) return null
  return typeof value === 'string' ? value : String(value.id)
}

export async function selectAncientOneAction(sessionID: string, formData: FormData) {
  const selection = formData.get('ancientOneSelection')

  if (typeof selection !== 'string') {
    throw new Error('Select an Ancient One before beginning the game.')
  }

  const [ancientOneID, sheetKey] = selection.split('::')

  if (!ancientOneID || !sheetKey) {
    throw new Error('The selected Ancient One sheet is invalid.')
  }

  const payload = await getPayloadClient()
  const [session, ancientOne] = await Promise.all([
    payload.findByID({
      collection: GAME_SESSIONS,
      id: sessionID,
      depth: 0,
      overrideAccess: true,
    }),
    payload.findByID({
      collection: 'ancient-ones',
      id: ancientOneID,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const sheet = ancientOne.sheets.find((candidate) => candidate.key === sheetKey)

  if (!sheet) {
    throw new Error('The selected Ancient One sheet could not be found.')
  }

  if (relationshipID(session.activeAncientOne) && session.currentPhase !== 'Setup') {
    throw new Error('The Ancient One is locked after setup.')
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      activeAncientOne: ancientOne.id,
      ancientOneSheetKey: sheet.key,
      currentPhase: 'Setup',
      tracks: {
        ...session.tracks,
        doomCurrent: 0,
        doomMax: sheet.doomTrack,
      },
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          { ...session, currentPhase: 'Setup' },
          'select-ancient-one',
          null,
          `${ancientOne.name} - ${sheet.label} selected with a ${sheet.doomTrack}-space doom track.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function advancePhaseAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (!relationshipID(session.activeAncientOne)) {
    return
  }

  const current = phasePointer(session)
  const next = nextGamePhase(current)

  if (next.currentPhase === current.currentPhase && next.turnNumber === current.turnNumber) {
    return
  }

  const transition = transitionFor(current, next)

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      currentPhase: next.currentPhase,
      turnNumber: next.turnNumber,
      phaseHistory: [...(session.phaseHistory ?? []), transition],
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          session,
          'advance-phase',
          null,
          `Advanced to ${next.currentPhase}, turn ${next.turnNumber}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function previousPhaseAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const current = phasePointer(session)
  const history = session.phaseHistory ?? []
  const latest = history.at(-1)
  const canReverseLatest =
    latest?.toPhase === current.currentPhase && latest.toTurn === current.turnNumber
  const previous = canReverseLatest
    ? {
        currentPhase: latest.fromPhase as GamePhase,
        turnNumber: latest.fromTurn,
      }
    : previousGamePhase(current)

  if (
    previous.currentPhase === current.currentPhase &&
    previous.turnNumber === current.turnNumber
  ) {
    return
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      currentPhase: previous.currentPhase,
      turnNumber: previous.turnNumber,
      phaseHistory: canReverseLatest ? history.slice(0, -1) : history,
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          session,
          'previous-phase',
          null,
          `Returned to ${previous.currentPhase}, turn ${previous.turnNumber}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
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
