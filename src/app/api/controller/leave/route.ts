import { NextRequest, NextResponse } from 'next/server'

import { controllerCookieName } from '@/lib/controllerAuth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ left: true })

  response.cookies.set(controllerCookieName, '', {
    expires: new Date(0),
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
  })

  return response
}
