import type { Payload } from 'payload'

import {
  activateCurrentEnvironmentAction,
  activateCurrentRumorAction,
  adjustSessionTrackAction,
  advancePhaseAction,
  clearActiveEnvironmentAction,
  clearActiveRumorAction,
  clearArkhamNeighborhoodAction,
  discardCurrentDrawAction,
  drawArkhamEncounterAction,
  drawMythosAction,
  flipNextOtherWorldEncounterAction,
  resolveOpeningHeadlineAction,
  revealCurrentDrawAction,
  selectArkhamNeighborhoodAction,
  skipOpeningMythosCardAction,
} from '@/app/(frontend)/actions'
import type { AdjustableSessionTrack } from '@/lib/sessionTracks'

import {
  controllerSessionForParticipant,
  type ControllerParticipant,
} from './controllerAuth'
import {
  controllerCommandsForSession,
  controllerProjection,
  type ControllerCommandID,
} from './controllerProjection'

const sessionLocks = new Map<string, Promise<void>>()

export class ControllerCommandError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

export interface ControllerCommandRequest {
  command: ControllerCommandID | 'adjust-track'
  expectedRevision: number
  idempotencyKey: string
  params?: Record<string, unknown>
}

async function withSessionLock<T>(sessionID: string, action: () => Promise<T>) {
  const previous = sessionLocks.get(sessionID) ?? Promise.resolve()
  let release = () => {}
  const current = new Promise<void>((resolve) => {
    release = resolve
  })

  sessionLocks.set(sessionID, current)
  await previous.catch(() => undefined)

  try {
    return await action()
  } finally {
    release()

    if (sessionLocks.get(sessionID) === current) {
      sessionLocks.delete(sessionID)
    }
  }
}

function stringParam(params: Record<string, unknown> | undefined, name: string) {
  const value = params?.[name]

  if (typeof value !== 'string' || !value) {
    throw new ControllerCommandError(`Missing ${name}.`)
  }

  return value
}

function trackAdjustment(params: Record<string, unknown> | undefined) {
  const track = stringParam(params, 'track') as AdjustableSessionTrack
  const delta = params?.delta

  if (delta !== -1 && delta !== 1) {
    throw new ControllerCommandError('Counter adjustments must be -1 or 1.')
  }

  return { delta, track }
}

async function dispatchCommand(
  participant: ControllerParticipant,
  request: ControllerCommandRequest,
) {
  const sessionID = participant.sessionID

  switch (request.command) {
    case 'advance-phase':
      return advancePhaseAction(sessionID)
    case 'select-arkham-neighborhood':
      return selectArkhamNeighborhoodAction(
        sessionID,
        stringParam(request.params, 'neighborhoodID'),
      )
    case 'draw-arkham-encounter':
      return drawArkhamEncounterAction(sessionID)
    case 'clear-arkham-neighborhood':
      return clearArkhamNeighborhoodAction(sessionID)
    case 'flip-other-world-encounter':
      return flipNextOtherWorldEncounterAction(sessionID)
    case 'draw-mythos':
      return drawMythosAction(sessionID)
    case 'reveal-mythos':
      return revealCurrentDrawAction(sessionID)
    case 'discard-mythos':
      return discardCurrentDrawAction(sessionID)
    case 'skip-opening-mythos':
      return skipOpeningMythosCardAction(sessionID)
    case 'resolve-opening-mythos':
      return resolveOpeningHeadlineAction(sessionID)
    case 'activate-environment':
      return activateCurrentEnvironmentAction(sessionID)
    case 'activate-rumor':
      return activateCurrentRumorAction(sessionID)
    case 'clear-active-environment':
      return clearActiveEnvironmentAction(sessionID)
    case 'clear-active-rumor':
      return clearActiveRumorAction(sessionID)
    case 'adjust-track': {
      const adjustment = trackAdjustment(request.params)
      return adjustSessionTrackAction(sessionID, adjustment.track, adjustment.delta)
    }
  }
}

export async function executeControllerCommand(
  payload: Payload,
  participant: ControllerParticipant,
  request: ControllerCommandRequest,
) {
  if (!Number.isInteger(request.expectedRevision) || request.expectedRevision < 0) {
    throw new ControllerCommandError('A valid session revision is required.')
  }

  if (
    typeof request.idempotencyKey !== 'string' ||
    request.idempotencyKey.length < 8 ||
    request.idempotencyKey.length > 100
  ) {
    throw new ControllerCommandError('A valid command identifier is required.')
  }

  return withSessionLock(participant.sessionID, async () => {
    const session = await controllerSessionForParticipant(payload, participant)
    const priorCommand = session.controllerCommandHistory?.find(
      (entry) => entry.idempotencyKey === request.idempotencyKey,
    )

    if (priorCommand) {
      return controllerProjection(payload, session, participant)
    }

    if ((session.stateRevision ?? 0) !== request.expectedRevision) {
      throw new ControllerCommandError(
        'The table changed before that command arrived. The controller has been refreshed.',
        409,
      )
    }

    if (request.command === 'adjust-track') {
      if (!session.activeAncientOne) {
        throw new ControllerCommandError('Complete setup before adjusting counters.')
      }
    } else {
      const allowed = controllerCommandsForSession(session).some(
        (command) => command.id === request.command,
      )

      if (!allowed) {
        throw new ControllerCommandError(
          'That action is no longer available in the current phase.',
          409,
        )
      }
    }

    await dispatchCommand(participant, request)

    const changed = await controllerSessionForParticipant(payload, participant)
    const history = [
      ...(changed.controllerCommandHistory ?? []),
      {
        idempotencyKey: request.idempotencyKey,
        command: request.command,
        actorName: participant.name,
        appliedAt: new Date().toISOString(),
      },
    ].slice(-100)

    await payload.update({
      collection: 'game-sessions',
      id: participant.sessionID,
      depth: 2,
      overrideAccess: true,
      showHiddenFields: true,
      data: {
        controllerCommandHistory: history,
      },
    })

    const recorded = await controllerSessionForParticipant(payload, participant)
    return controllerProjection(payload, recorded, participant)
  })
}
