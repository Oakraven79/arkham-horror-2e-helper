import type { Payload } from 'payload'

import type { GameSession } from '@/payload-types'

import { createMythosDeckInstances } from './mythosDeckState'
import { mythosDeckStateForPayload } from './mythosSessionState'

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
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

export async function createGameSession(
  payload: Payload,
  name = 'Arkham Horror Session',
): Promise<GameSession> {
  const [cards, baseSet] = await Promise.all([
    payload.find({
      collection: 'mythos-cards',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'boxed-sets',
      where: {
        key: {
          equals: 'base-game',
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const baseSetID = baseSet.docs[0]?.id

  if (!baseSetID) {
    throw new Error('The Base Game boxed set must be seeded before creating a session.')
  }

  const created = await payload.create({
    collection: 'game-sessions',
    overrideAccess: true,
    data: {
      name,
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
        drawPile: shuffle(createMythosDeckInstances(cards.docs)),
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
    collection: 'game-sessions',
    id: created.id,
    depth: 2,
    overrideAccess: true,
  })
}
