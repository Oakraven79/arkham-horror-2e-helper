import { NextRequest, NextResponse } from 'next/server'

import { controllerSessionForParticipant } from '@/lib/controllerAuth'
import { controllerProjection } from '@/lib/controllerProjection'
import {
  controllerParticipantFromRequest,
  controllerPayload,
} from '@/lib/controllerRequest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const participant = controllerParticipantFromRequest(request)
    const payload = await controllerPayload()
    const session = await controllerSessionForParticipant(payload, participant)

    return NextResponse.json(
      await controllerProjection(payload, session, participant),
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Controller access is unavailable.'
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
