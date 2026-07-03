import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  deleteGameSession,
  exitGameSession,
  pauseActiveGameSessions,
  repairLegacyOpeningHeadline,
  resumeGameSession,
} from '@/lib/gameSessions'
import type { GameSession } from '@/payload-types'

function savedSession(overrides: Partial<GameSession> = {}) {
  return {
    id: 'session-one',
    name: 'Friday in Arkham',
    status: 'active',
    playerCount: 4,
    enabledSets: ['base-set'],
    turnNumber: 6,
    activeAncientOne: 'ancient-one',
    ancientOneSheetKey: 'standard',
    currentPhase: 'Mythos',
    openingHeadlineResolved: false,
    tracks: {
      doomCurrent: 4,
      doomMax: 11,
      terror: 2,
      gatesOpen: 3,
      elderSigns: 1,
      monstersInArkham: 5,
      monstersInOutskirts: 2,
    },
    mythos: {
      drawPileInstances: [{ instanceKey: 'card-a:1', card: 'card-a' }],
      discardPileInstances: [{ instanceKey: 'card-b:1', card: 'card-b' }],
      drawHistoryInstances: [{ instanceKey: 'card-b:1', card: 'card-b' }],
      activeEnvironment: 'card-environment',
      activeEnvironmentInstanceKey: 'card-environment:1',
      activeRumor: 'card-rumor',
      activeRumorInstanceKey: 'card-rumor:1',
      currentDraw: 'card-current',
      currentDrawInstanceKey: 'card-current:1',
      currentDrawRevealed: true,
      shuffleCount: 1,
    },
    sessionLog: [],
    updatedAt: '2026-07-01T08:00:00.000Z',
    createdAt: '2026-06-30T08:00:00.000Z',
    ...overrides,
  } as GameSession
}

function payloadDouble(session: GameSession, activeSessions: GameSession[] = []) {
  const deletions: Array<Record<string, unknown>> = []
  const updates: Array<Record<string, unknown>> = []
  const payload = {
    delete: async (args: Record<string, unknown>) => {
      deletions.push(args)
      return session
    },
    findByID: async () => session,
    find: async () => ({ docs: activeSessions }),
    update: async (args: Record<string, unknown>) => {
      updates.push(args)
      return {
        ...session,
        ...(args.data as Record<string, unknown>),
      }
    },
  } as unknown as Payload

  return { deletions, payload, updates }
}

describe('game session lifecycle', () => {
  it('exits by pausing and logging without replacing any game-state field', async () => {
    const session = savedSession()
    const { payload, updates } = payloadDouble(session)

    await exitGameSession(payload, session.id)

    expect(updates).toHaveLength(1)
    expect(updates[0]?.data).toEqual({
      status: 'paused',
      sessionLog: [
        {
          turnNumber: 6,
          phase: 'Mythos',
          action: 'exit-session',
          note: 'Session exited and saved.',
        },
      ],
    })
    expect(updates[0]?.data).not.toHaveProperty('currentPhase')
    expect(updates[0]?.data).not.toHaveProperty('turnNumber')
    expect(updates[0]?.data).not.toHaveProperty('tracks')
    expect(updates[0]?.data).not.toHaveProperty('mythos')
  })

  it('resumes the selected session and records its saved phase', async () => {
    const session = savedSession({ status: 'paused' })
    const { payload, updates } = payloadDouble(session)

    await resumeGameSession(payload, session.id)

    expect(updates).toHaveLength(1)
    expect(updates[0]?.data).toEqual({
      status: 'active',
      sessionLog: [
        {
          turnNumber: 6,
          phase: 'Mythos',
          action: 'resume-session',
          note: 'Session resumed.',
        },
      ],
    })
  })

  it('does not resume completed sessions', async () => {
    const session = savedSession({ status: 'complete' })
    const { payload } = payloadDouble(session)

    await expect(resumeGameSession(payload, session.id)).rejects.toThrow(
      'Only active or paused sessions can be resumed.',
    )
  })

  it('pauses other active sessions when switching tables', async () => {
    const current = savedSession()
    const other = savedSession({ id: 'session-two', name: 'Other table' })
    const { payload, updates } = payloadDouble(current, [current, other])

    await pauseActiveGameSessions(payload, current.id)

    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      id: 'session-two',
      data: {
        status: 'paused',
      },
    })
  })

  it('deletes only the selected session', async () => {
    const session = savedSession()
    const { deletions, payload } = payloadDouble(session)

    await deleteGameSession(payload, session.id)

    expect(deletions).toEqual([
      {
        collection: 'game-sessions',
        id: 'session-one',
        overrideAccess: true,
      },
    ])
  })

  it('marks legacy games beyond setup as having completed the opening Mythos step', async () => {
    const session = savedSession()
    const { payload, updates } = payloadDouble(session)

    const repaired = await repairLegacyOpeningHeadline(payload, session)

    expect(repaired.openingHeadlineResolved).toBe(true)
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      id: 'session-one',
      data: {
        openingHeadlineResolved: true,
      },
    })
  })

  it('does not mark an unfinished Setup session as complete', async () => {
    const session = savedSession({ currentPhase: 'Setup' })
    const { payload, updates } = payloadDouble(session)

    const repaired = await repairLegacyOpeningHeadline(payload, session)

    expect(repaired.openingHeadlineResolved).toBe(false)
    expect(updates).toHaveLength(0)
  })
})
