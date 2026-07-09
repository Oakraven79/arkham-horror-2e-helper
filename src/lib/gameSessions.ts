import type { Payload } from 'payload'

import type { GameSession } from '@/payload-types'

import {
  BASE_GAME_SET_KEY,
  eligibleDocuments,
  freshMythosDeckState,
  relationshipID,
  relationshipIDs,
  requiredSetIDs,
  sameSetSelection,
  sourceSetWhere,
} from './gameSessionContent'
import { expansionTrackStateForPayload, freshExpansionTrackState } from './expansionTracks'
import { mythosDeckStateForPayload } from './mythosSessionState'
import { freshOtherWorldEncounterDeckState } from './otherWorldEncounterDeckState'
import {
  otherWorldEncounterDeckStateForPayload,
  otherWorldEncounterDeckStateFromSession,
} from './otherWorldEncounterSessionState'

function lifecycleLogEntry(
  session: GameSession,
  action: 'exit-session' | 'resume-session',
  note: string,
): NonNullable<GameSession['sessionLog']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    action,
    note,
  }
}

export async function pauseActiveGameSessions(payload: Payload, exceptSessionID?: string) {
  const activeSessions = await payload.find({
    collection: 'game-sessions',
    where: {
      status: {
        equals: 'active',
      },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  await Promise.all(
    activeSessions.docs
      .filter((session) => String(session.id) !== exceptSessionID)
      .map((session) =>
        payload.update({
          collection: 'game-sessions',
          id: session.id,
          data: {
            status: 'paused',
          },
          overrideAccess: true,
        }),
      ),
  )
}

export async function resumeGameSession(payload: Payload, sessionID: string) {
  const session = await payload.findByID({
    collection: 'game-sessions',
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.status === 'complete' || session.status === 'abandoned') {
    throw new Error('Only active or paused sessions can be resumed.')
  }

  await pauseActiveGameSessions(payload, sessionID)

  return payload.update({
    collection: 'game-sessions',
    id: sessionID,
    data: {
      status: 'active',
      sessionLog: [
        ...(session.sessionLog ?? []),
        lifecycleLogEntry(session, 'resume-session', 'Session resumed.'),
      ],
    },
    overrideAccess: true,
  })
}

export async function exitGameSession(payload: Payload, sessionID: string) {
  const session = await payload.findByID({
    collection: 'game-sessions',
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.status === 'complete' || session.status === 'abandoned') return session

  return payload.update({
    collection: 'game-sessions',
    id: sessionID,
    data: {
      status: 'paused',
      sessionLog: [
        ...(session.sessionLog ?? []),
        lifecycleLogEntry(session, 'exit-session', 'Session exited and saved.'),
      ],
    },
    overrideAccess: true,
  })
}

export function deleteGameSession(payload: Payload, sessionID: string) {
  return payload.delete({
    collection: 'game-sessions',
    id: sessionID,
    overrideAccess: true,
  })
}

export async function createGameSession(
  payload: Payload,
  name = 'Arkham Horror Session',
): Promise<GameSession> {
  const baseSet = await payload.find({
    collection: 'boxed-sets',
    where: {
      key: {
        equals: BASE_GAME_SET_KEY,
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

  const [mythosCards, otherWorldEncounterCards] = await Promise.all([
    payload.find({
      collection: 'mythos-cards',
      where: sourceSetWhere([String(baseSetID)]),
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'other-world-encounter-cards',
      where: sourceSetWhere([String(baseSetID)]),
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const enabledSetIDs = [String(baseSetID)]
  const eligibleMythosCards = eligibleDocuments(mythosCards.docs, enabledSetIDs)
  const eligibleOtherWorldEncounterCards = eligibleDocuments(
    otherWorldEncounterCards.docs,
    enabledSetIDs,
  )

  const created = await payload.create({
    collection: 'game-sessions',
    overrideAccess: true,
    data: {
      name,
      status: 'active',
      stateRevision: 0,
      mobileControlsEnabled: false,
      playerCount: 4,
      enabledSets: [baseSetID],
      useAncientOneBackground: false,
      turnNumber: 1,
      currentPhase: 'Setup',
      openingHeadlineResolved: false,
      tracks: {
        doomCurrent: 0,
        doomMax: 10,
        terror: 0,
        gatesOpen: 0,
        elderSigns: 0,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        finalBattleRound: 1,
      },
      expansionTracks: expansionTrackStateForPayload(freshExpansionTrackState()),
      mythos: mythosDeckStateForPayload(freshMythosDeckState(eligibleMythosCards)),
      otherWorldEncounters: otherWorldEncounterDeckStateForPayload(
        freshOtherWorldEncounterDeckState(eligibleOtherWorldEncounterCards),
      ),
      sessionLog: [
        {
          turnNumber: 1,
          phase: 'Setup',
          action: 'create-session',
          note: 'Session created.',
        },
        {
          turnNumber: 1,
          phase: 'Setup',
          action: 'shuffle-deck',
          note: 'Session created with shuffled Mythos and Other World encounter decks.',
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
    collection: 'game-sessions',
    id: created.id,
    depth: 2,
    overrideAccess: true,
  })
}

export async function repairLegacyOtherWorldEncounterDeck(payload: Payload, session: GameSession) {
  const currentState = otherWorldEncounterDeckStateFromSession(session)

  if (currentState.initialized) return session

  const cards = await payload.find({
    collection: 'other-world-encounter-cards',
    where: sourceSetWhere(relationshipIDs(session.enabledSets)),
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const eligibleCards = eligibleDocuments(cards.docs, enabledSetIDs)

  await payload.update({
    collection: 'game-sessions',
    id: session.id,
    data: {
      otherWorldEncounters: otherWorldEncounterDeckStateForPayload(
        freshOtherWorldEncounterDeckState(eligibleCards),
      ),
    },
    overrideAccess: true,
  })

  return payload.findByID({
    collection: 'game-sessions',
    id: session.id,
    depth: 2,
    overrideAccess: true,
  })
}

function storedMythosCardIDs(session: GameSession) {
  const mythos = session.mythos
  const relationshipValues = [
    ...(mythos.drawPile ?? []),
    ...(mythos.discardPile ?? []),
    ...(mythos.drawHistory ?? []),
    mythos.currentDraw,
    mythos.activeEnvironment,
    mythos.activeRumor,
  ]
  const instanceValues = [
    ...(mythos.drawPileInstances ?? []),
    ...(mythos.discardPileInstances ?? []),
    ...(mythos.drawHistoryInstances ?? []),
  ].map((instance) => instance.card)

  return [
    ...new Set(
      [...relationshipValues, ...instanceValues]
        .map(relationshipID)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
}

export async function repairLegacySessionEnabledSets(payload: Payload, session: GameSession) {
  if (!session.activeExpansions?.length) return session

  const cardIDs = storedMythosCardIDs(session)

  if (cardIDs.length === 0) {
    await payload.update({
      collection: 'game-sessions',
      id: session.id,
      data: {
        activeExpansions: [],
      },
      overrideAccess: true,
    })

    return {
      ...session,
      activeExpansions: [],
    }
  }

  const cards = await payload.find({
    collection: 'mythos-cards',
    where: {
      id: {
        in: cardIDs,
      },
    },
    limit: Math.max(cardIDs.length, 1),
    depth: 0,
    overrideAccess: true,
  })
  const currentSetIDs = relationshipIDs(session.enabledSets)
  const representedSetIDs = cards.docs.flatMap(requiredSetIDs)
  const repairedSetIDs = [...new Set([...currentSetIDs, ...representedSetIDs])]

  await payload.update({
    collection: 'game-sessions',
    id: session.id,
    data: {
      ...(sameSetSelection(currentSetIDs, repairedSetIDs)
        ? {}
        : {
            enabledSets: repairedSetIDs,
          }),
      activeExpansions: [],
    },
    overrideAccess: true,
  })

  return payload.findByID({
    collection: 'game-sessions',
    id: session.id,
    depth: 2,
    overrideAccess: true,
  })
}

export async function repairLegacyOpeningHeadline(payload: Payload, session: GameSession) {
  if (
    session.openingHeadlineResolved ||
    session.currentPhase === 'Setup' ||
    session.currentPhase === 'Opening Mythos'
  ) {
    return session
  }

  await payload.update({
    collection: 'game-sessions',
    id: session.id,
    data: {
      openingHeadlineResolved: true,
    },
    overrideAccess: true,
  })

  return {
    ...session,
    openingHeadlineResolved: true,
  }
}
