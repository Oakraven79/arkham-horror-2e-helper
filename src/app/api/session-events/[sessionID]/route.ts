import { NextRequest, NextResponse } from 'next/server'

import { controllerPayload } from '@/lib/controllerRequest'
import { sessionEventStream } from '@/lib/sessionEventStream'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionID: string }> },
) {
  const { sessionID } = await context.params

  try {
    const payload = await controllerPayload()
    await payload.findByID({
      collection: 'game-sessions',
      id: sessionID,
      depth: 0,
      overrideAccess: true,
    })

    return sessionEventStream(sessionID, request.signal)
  } catch {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  }
}
