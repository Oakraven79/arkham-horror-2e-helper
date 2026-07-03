import { NextRequest, NextResponse } from 'next/server'

import { controllerSessionForParticipant } from '@/lib/controllerAuth'
import {
  controllerParticipantFromRequest,
  controllerPayload,
} from '@/lib/controllerRequest'
import { sessionEventStream } from '@/lib/sessionEventStream'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const participant = controllerParticipantFromRequest(request)
    const payload = await controllerPayload()
    await controllerSessionForParticipant(payload, participant)

    return sessionEventStream(participant.sessionID, request.signal)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Controller access is unavailable.'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
