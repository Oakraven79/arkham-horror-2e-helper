import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto'

import type { Payload } from 'payload'

import type { GameSession } from '@/payload-types'

export const controllerCookieName = 'arkham-controller'
export const controllerRoomLifetimeMs = 12 * 60 * 60 * 1000

const joinCodeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export interface ControllerParticipant {
  expiresAt: number
  name: string
  roomVersion: string
  sessionID: string
}

interface ControllerTokenPayload {
  exp: number
  name: string
  room: string
  session: string
}

export interface ControllerRoomCredentials {
  expiresAt: string
  joinCode: string
  joinCodeHash: string
  joinSecret: string
  joinSecretHash: string
  roomVersion: string
}

function controllerSigningSecret() {
  const secret = process.env.CONTROLLER_SECRET || process.env.PAYLOAD_SECRET

  if (!secret) {
    throw new Error('PAYLOAD_SECRET or CONTROLLER_SECRET is required for mobile controllers.')
  }

  return secret
}

function signatureFor(encodedPayload: string) {
  return createHmac('sha256', controllerSigningSecret())
    .update(encodedPayload)
    .digest('base64url')
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)

  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes)
}

export function hashControllerCredential(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function normalizeJoinCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function createControllerRoomCredentials(
  now = Date.now(),
): ControllerRoomCredentials {
  const joinCode = Array.from(
    { length: 6 },
    () => joinCodeAlphabet[randomInt(joinCodeAlphabet.length)],
  ).join('')
  const joinSecret = randomBytes(24).toString('base64url')

  return {
    expiresAt: new Date(now + controllerRoomLifetimeMs).toISOString(),
    joinCode,
    joinCodeHash: hashControllerCredential(joinCode),
    joinSecret,
    joinSecretHash: hashControllerCredential(joinSecret),
    roomVersion: randomUUID(),
  }
}

export function normalizeControllerName(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Enter a name for this controller.')
  }

  const name = value.trim().replace(/\s+/g, ' ')

  if (!name) {
    throw new Error('Enter a name for this controller.')
  }

  if (name.length > 30) {
    throw new Error('Controller names must be 30 characters or fewer.')
  }

  return name
}

export function controllerRoomIsActive(session: GameSession, now = Date.now()) {
  return Boolean(
    session.status === 'active' &&
      session.mobileControlsEnabled &&
      session.mobileControlVersion &&
      session.mobileControlExpiresAt &&
      new Date(session.mobileControlExpiresAt).getTime() > now,
  )
}

export function issueControllerToken(
  session: GameSession,
  name: string,
  now = Date.now(),
) {
  if (!controllerRoomIsActive(session, now) || !session.mobileControlVersion) {
    throw new Error('This mobile controller room is no longer available.')
  }

  const roomExpiry = new Date(session.mobileControlExpiresAt as string).getTime()
  const payload: ControllerTokenPayload = {
    exp: roomExpiry,
    name: normalizeControllerName(name),
    room: session.mobileControlVersion,
    session: String(session.id),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')

  return `${encodedPayload}.${signatureFor(encodedPayload)}`
}

export function readControllerToken(
  token: string | undefined,
  now = Date.now(),
): ControllerParticipant | null {
  if (!token) return null

  const [encodedPayload, signature, ...extra] = token.split('.')

  if (!encodedPayload || !signature || extra.length > 0) return null
  if (!safeEqual(signatureFor(encodedPayload), signature)) return null

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<ControllerTokenPayload>

    if (
      typeof parsed.exp !== 'number' ||
      parsed.exp <= now ||
      typeof parsed.name !== 'string' ||
      typeof parsed.room !== 'string' ||
      typeof parsed.session !== 'string'
    ) {
      return null
    }

    return {
      expiresAt: parsed.exp,
      name: parsed.name,
      roomVersion: parsed.room,
      sessionID: parsed.session,
    }
  } catch {
    return null
  }
}

export async function controllerSessionForParticipant(
  payload: Payload,
  participant: ControllerParticipant,
) {
  const session = await payload.findByID({
    collection: 'game-sessions',
    id: participant.sessionID,
    depth: 2,
    overrideAccess: true,
    showHiddenFields: true,
  })

  if (
    !controllerRoomIsActive(session) ||
    session.mobileControlVersion !== participant.roomVersion
  ) {
    throw new Error('This mobile controller has expired or been revoked.')
  }

  return session
}

export async function controllerSessionForJoin(
  payload: Payload,
  credentials: {
    joinCode?: string
    joinSecret?: string
    sessionID?: string
  },
) {
  let session: GameSession | null = null

  if (credentials.sessionID && credentials.joinSecret) {
    try {
      session = await payload.findByID({
        collection: 'game-sessions',
        id: credentials.sessionID,
        depth: 0,
        overrideAccess: true,
        showHiddenFields: true,
      })
    } catch {
      session = null
    }

    if (
      !session?.mobileJoinSecretHash ||
      !safeEqual(
        session.mobileJoinSecretHash,
        hashControllerCredential(credentials.joinSecret),
      )
    ) {
      session = null
    }
  } else if (credentials.joinCode) {
    const joinCodeHash = hashControllerCredential(normalizeJoinCode(credentials.joinCode))
    const result = await payload.find({
      collection: 'game-sessions',
      where: {
        mobileJoinCodeHash: {
          equals: joinCodeHash,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      showHiddenFields: true,
    })

    session = result.docs[0] ?? null
  }

  if (!session || !controllerRoomIsActive(session)) {
    throw new Error('That controller code is invalid or has expired.')
  }

  return session
}
