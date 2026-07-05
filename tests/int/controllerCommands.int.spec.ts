import type { Payload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ControllerParticipant } from '@/lib/controllerAuth'
import type { GameSession, MythosCard } from '@/payload-types'

const actionMocks = vi.hoisted(() => ({
  adjustExpansionTrackAction: vi.fn(),
  advancePhaseAction: vi.fn(),
  discardCurrentDrawAction: vi.fn(),
}))

vi.mock('@/app/(frontend)/actions', () => ({
  activateCurrentEnvironmentAction: vi.fn(),
  activateCurrentRumorAction: vi.fn(),
  adjustExpansionTrackAction: actionMocks.adjustExpansionTrackAction,
  adjustSessionTrackAction: vi.fn(),
  advancePhaseAction: actionMocks.advancePhaseAction,
  clearActiveEnvironmentAction: vi.fn(),
  clearActiveRumorAction: vi.fn(),
  clearArkhamNeighborhoodAction: vi.fn(),
  discardCurrentDrawAction: actionMocks.discardCurrentDrawAction,
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

function mythosCard(cardType: MythosCard['cardType']) {
  return {
    id: 'headline-card',
    title: `${cardType} card`,
    cardCode: `${cardType}-1`,
    copyCount: 1,
    cardType,
    gateInstruction: {
      mode: 'single',
      locations: ['woods'],
    },
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
  } as MythosCard
}

const participant: ControllerParticipant = {
  expiresAt: Date.UTC(2030, 0, 1),
  name: 'Jenny',
  roomVersion: 'room-one',
  sessionID: 'session-one',
}

describe('controller command execution', () => {
  let current: GameSession
  let findByID: ReturnType<typeof vi.fn>
  let payload: Payload

  beforeEach(() => {
    actionMocks.adjustExpansionTrackAction.mockReset()
    actionMocks.advancePhaseAction.mockReset()
    actionMocks.discardCurrentDrawAction.mockReset()
    current = savedSession()
    findByID = vi.fn(async (args: { collection: string }) => {
      if (args.collection === 'mythos-cards') {
        throw new Error('Unexpected Mythos card lookup.')
      }

      return current
    })
    payload = {
      findByID,
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
    actionMocks.adjustExpansionTrackAction.mockImplementation(async () => {
      current = {
        ...current,
        expansionTracks: {
          ...current.expansionTracks,
          dunwichHorrorTokens: 1,
        },
        tracks: {
          ...current.tracks,
          terror: current.tracks.terror + 1,
        },
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

  it('allows MOBILE-07 discarding a revealed Mythos card stored as an ID relationship', async () => {
    const headline = mythosCard('Headline')
    current = savedSession({
      currentPhase: 'Mythos',
      mythos: {
        currentDraw: String(headline.id),
        currentDrawInstanceKey: `${headline.id}:1`,
        currentDrawRevealed: true,
        shuffleCount: 0,
      },
    })
    findByID.mockImplementation(async (args: { collection: string }) =>
      args.collection === 'mythos-cards' ? headline : current,
    )
    actionMocks.discardCurrentDrawAction.mockImplementation(async () => {
      current = {
        ...current,
        mythos: {
          ...current.mythos,
          currentDraw: null,
          currentDrawInstanceKey: null,
          currentDrawRevealed: false,
        },
        sessionLog: [
          ...(current.sessionLog ?? []),
          {
            turnNumber: current.turnNumber,
            phase: 'Mythos',
            action: 'discard-card',
            card: String(headline.id),
          },
        ],
        stateRevision: current.stateRevision + 1,
      }
    })

    const result = await executeControllerCommand(payload, participant, {
      command: 'discard-mythos',
      expectedRevision: 2,
      idempotencyKey: 'command-discard',
    })

    expect(actionMocks.discardCurrentDrawAction).toHaveBeenCalledOnce()
    expect(result.commands.map((command) => command.id)).toEqual(['advance-phase'])
    expect(current.controllerCommandHistory).toMatchObject([
      {
        actorName: 'Jenny',
        command: 'discard-mythos',
        idempotencyKey: 'command-discard',
      },
    ])
  })

  it('applies and records MOBILE-08 expansion track commands', async () => {
    const expansionCommand = { type: 'dunwich-vortex' } as const

    const result = await executeControllerCommand(payload, participant, {
      command: 'adjust-expansion-track',
      expectedRevision: 2,
      idempotencyKey: 'command-expansion',
      params: {
        expansionCommand,
      },
    })

    expect(actionMocks.adjustExpansionTrackAction).toHaveBeenCalledWith(
      'session-one',
      expansionCommand,
    )
    expect(result.expansionTracks.state.dunwichHorrorTokens).toBe(1)
    expect(result.tracks.terror).toBe(1)
    expect(current.controllerCommandHistory).toMatchObject([
      {
        actorName: 'Jenny',
        command: 'adjust-expansion-track',
        idempotencyKey: 'command-expansion',
      },
    ])
  })
})
