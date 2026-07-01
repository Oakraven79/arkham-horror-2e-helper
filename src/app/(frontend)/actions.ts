'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveEnvironment,
  clearActiveRumor,
  discardCurrentMythosCard,
  drawMythosCard,
  createMythosDeckInstances,
  revealCurrentMythosCard,
  type MythosDeckState,
} from '@/lib/mythosDeckState'
import { mythosDeckStateForPayload, mythosDeckStateFromSession } from '@/lib/mythosSessionState'
import {
  nextGamePhase,
  previousGamePhase,
  transitionFor,
  type GamePhase,
  type GamePhasePointer,
} from '@/lib/gamePhaseState'
import { createGameSession, pauseActiveGameSessions } from '@/lib/gameSessions'
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

function sessionNameFrom(formData: FormData) {
  const value = formData.get('sessionName')

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Enter a name for the session.')
  }

  const name = value.trim()

  if (name.length > 80) {
    throw new Error('Session names must be 80 characters or fewer.')
  }

  return name
}

export async function startNewSessionAction(formData: FormData) {
  const payload = await getPayloadClient()
  const sessionName = sessionNameFrom(formData)
  await pauseActiveGameSessions(payload)

  const session = await createGameSession(payload, sessionName)

  redirect(`/?session=${session.id}`)
}

export async function renameSessionAction(sessionID: string, formData: FormData) {
  const payload = await getPayloadClient()

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    data: {
      name: sessionNameFrom(formData),
    },
    overrideAccess: true,
  })

  revalidatePath('/')
}

export async function resumeSessionAction(formData: FormData) {
  const sessionID = formData.get('sessionID')

  if (typeof sessionID !== 'string' || !sessionID) {
    throw new Error('Select a saved session to resume.')
  }

  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.status === 'complete' || session.status === 'abandoned') {
    throw new Error('Only active or paused sessions can be resumed.')
  }

  await pauseActiveGameSessions(payload, sessionID)
  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    data: {
      status: 'active',
    },
    overrideAccess: true,
  })

  redirect(`/?session=${sessionID}`)
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
  const investigatorCountValue = formData.get('investigatorCount')

  if (typeof selection !== 'string') {
    throw new Error('Select an Ancient One before beginning the game.')
  }

  const investigatorCount = Number(investigatorCountValue)

  if (!Number.isInteger(investigatorCount) || investigatorCount < 1 || investigatorCount > 8) {
    throw new Error('Investigator count must be between 1 and 8.')
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
      playerCount: investigatorCount,
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
          `${ancientOne.name} - ${sheet.label} selected with ${investigatorCount} investigators and a ${sheet.doomTrack}-space doom track.`,
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

  await updateSessionMythos(sessionID, state, 'reveal-card', state.currentDraw?.cardID)
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

export async function clearActiveEnvironmentAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const activeEnvironment = sessionState.activeEnvironment?.cardID
  const state = clearActiveEnvironment(sessionState)

  await updateSessionMythos(sessionID, state, 'clear-environment', activeEnvironment)
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
        shuffleEvent(
          session,
          'manual',
          'Discard pile manually shuffled into the Mythos draw pile.',
        ),
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
