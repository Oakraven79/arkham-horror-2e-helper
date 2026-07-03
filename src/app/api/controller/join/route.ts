import { NextRequest, NextResponse } from 'next/server'

import {
  controllerCookieName,
  controllerSessionForJoin,
  issueControllerToken,
  normalizeControllerName,
} from '@/lib/controllerAuth'
import { controllerPayload } from '@/lib/controllerRequest'
import {
  consumeControllerJoinAttempt,
  ControllerJoinRateLimitError,
} from '@/lib/controllerRateLimit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface JoinRequestBody {
  joinCode?: string
  joinSecret?: string
  name?: string
  sessionID?: string
}

export async function POST(request: NextRequest) {
  try {
    const address =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'local-network'
    consumeControllerJoinAttempt(address)

    const body = (await request.json()) as JoinRequestBody
    const payload = await controllerPayload()
    const name = normalizeControllerName(body.name)
    const session = await controllerSessionForJoin(payload, {
      joinCode: body.joinCode,
      joinSecret: body.joinSecret,
      sessionID: body.sessionID,
    })
    const token = issueControllerToken(session, name)
    const response = NextResponse.json({
      sessionID: String(session.id),
    })

    response.cookies.set(controllerCookieName, token, {
      expires: new Date(session.mobileControlExpiresAt as string),
      httpOnly: true,
      sameSite: 'strict',
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to join this controller room.'
    const status = error instanceof ControllerJoinRateLimitError ? 429 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
