import { NextRequest, NextResponse } from 'next/server'

import {
  ControllerCommandError,
  executeControllerCommand,
  type ControllerCommandRequest,
} from '@/lib/controllerCommands'
import {
  controllerParticipantFromRequest,
  controllerPayload,
} from '@/lib/controllerRequest'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const participant = controllerParticipantFromRequest(request)
    const command = (await request.json()) as ControllerCommandRequest
    const payload = await controllerPayload()
    const projection = await executeControllerCommand(payload, participant, command)

    return NextResponse.json(projection, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const status = error instanceof ControllerCommandError ? error.status : 400
    const message = error instanceof Error ? error.message : 'The command could not be applied.'
    return NextResponse.json({ error: message }, { status })
  }
}
