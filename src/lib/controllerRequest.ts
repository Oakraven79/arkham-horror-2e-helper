import type { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'

import {
  controllerCookieName,
  readControllerToken,
  type ControllerParticipant,
} from './controllerAuth'

export async function controllerPayload() {
  return getPayload({ config: await config })
}

export function controllerParticipantFromRequest(
  request: NextRequest,
): ControllerParticipant {
  const participant = readControllerToken(
    request.cookies.get(controllerCookieName)?.value,
  )

  if (!participant) {
    throw new Error('Join the controller room to continue.')
  }

  return participant
}
