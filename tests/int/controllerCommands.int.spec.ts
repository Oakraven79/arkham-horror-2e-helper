import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ControllerParticipant } from '@/lib/controllerAuth'
import type { GameSession } from '@/payload-types'

const actionMocks = vi.hoisted(() => ({
  advancePhaseAction: vi.fn(),
}))

vi.mock('@/app/(frontend)/actions', () => ({
  activateCurrentEnvironmentAction: vi.fn(),
  activateCurrentRumorAction: vi.fn(),
  adjustSessionTrackAction: vi.fn(),
  advancePhaseAction: actionMocks.advancePhaseAction,
  clearActiveEnvironmentAction: vi.fn(),
  clearActiveRumorAction: vi.fn(),
  clearArkhamNeighborhoodAction: vi.fn(),
  discardCurrentDrawAction: vi.fn(),
  drawArkhamEncounterAction: vi.fn(),
  drawMythosAction: vi.fn(),
  flipNextOtherWorldEncounterAction: vi.fn(),
  resolveOpeningHeadlineAction: vi.fn(),
  revealCurrentDrawAction: vi.fn(),
  selectArkhamNeighborhoodAction: vi.fn(),
  skipOpeningMythosCardAction: vi.fn(),
}))

import {
  ControllerCommandError,
  executeControllerCommand,
} from '@/lib/controllerCommands'

function savedSession(overrides: Partial<GameSession> = {}) {
  return {
    id: 'session-one',
    name: 'Friday in Arkham',
    status: 'active',
    stateRevision: 2,
    mobileControlsEnabled: true,
    mobileControlExpiresAt: '2030-01-01T00:00:00.000Z',
    mobileControlVersion: 'room-one',
    playerCount: 4,
    enabledSets: ['base-set'],
    turnNumber: 1,
    activeAncientOne: 'ancient-one',
    useAncientOneBackground: false,
    currentPhase: 'Upkeep',
    openingHeadlineResolved: true,
    tracks: {
      doomCurrent: 1,
      doomMax: 10,
      terror: 0,
      gatesOpen: 1,
      elderSigns: 0,
      monstersInArkham: 1,
      monstersInOutskirts: 0,
    },
    expansionTracks: {
      dunwichHorrorTokens: 0,
      deepOnesRising: 0,
      fedsChurchGreen: 0,
      fedsFactoryDistrict: 0,
      fedsInnsmouthShore: 0,
    },
    mythos: {
      shuffleCount: 0,
    },
    otherWorldEncounters: {
      initialized: true,
      shuffleCount: 0,
    },
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  } as GameSession
}

const participant: ControllerParticipant = {
  expiresAt: Date.UTC(2030, 0, 1),
  name: 'Jenny',
  roomVersion: 'room-one',
  sessionID: 'session-one',
}

describe('controller command execution', () => {
  let current: GameSession
  let payload: Payload

  beforeEach(() => {
    actionMocks.advancePhaseAction.mockReset()
    current = savedSession()
    payload = {
      findByID: vi.fn(async () => current),
      update: vi.fn(async (args: { data: Partial<GameSession> }) => {
        current = {
          ...current,
          ...args.data,
          stateRevision: current.stateRevision + 1,
        }
        return current
      }),
    } as unknown as Payload
    actionMocks.advancePhaseAction.mockImplementation(async () => {
      current = {
        ...current,
        currentPhase: 'Movement',
        stateRevision: current.stateRevision + 1,
      }
    })
  })

  it('applies a current legal command once and records its actor', async () => {
    const result = await executeControllerCommand(payload, participant, {
      command: 'advance-phase',
      expectedRevision: 2,
      idempotencyKey: 'command-123',
    })

    expect(actionMocks.advancePhaseAction).toHaveBeenCalledOnce()
    expect(result.session.phase).toBe('Movement')
    expect(current.controllerCommandHistory).toMatchObject([
      {
        actorName: 'Jenny',
        command: 'advance-phase',
        idempotencyKey: 'command-123',
      },
    ])
  })

  it('returns current state without repeating an idempotent command', async () => {
    await executeControllerCommand(payload, participant, {
      command: 'advance-phase',
      expectedRevision: 2,
      idempotencyKey: 'command-123',
    })
    await executeControllerCommand(payload, participant, {
      command: 'advance-phase',
      expectedRevision: 2,
      idempotencyKey: 'command-123',
    })

    expect(actionMocks.advancePhaseAction).toHaveBeenCalledOnce()
  })

  it('rejects a stale command before invoking its state transition', async () => {
    await expect(
      executeControllerCommand(payload, participant, {
        command: 'advance-phase',
        expectedRevision: 1,
        idempotencyKey: 'command-stale',
      }),
    ).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<ControllerCommandError>)

    expect(actionMocks.advancePhaseAction).not.toHaveBeenCalled()
    expect(current.currentPhase).toBe('Upkeep')
  })
})
