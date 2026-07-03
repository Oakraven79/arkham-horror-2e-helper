import { beforeEach, describe, expect, it } from 'vitest'

import {
  controllerRoomIsActive,
  createControllerRoomCredentials,
  issueControllerToken,
  normalizeControllerName,
  normalizeJoinCode,
  readControllerToken,
} from '@/lib/controllerAuth'
import type { GameSession } from '@/payload-types'

function session(overrides: Partial<GameSession> = {}) {
  return {
    id: 'session-one',
    name: 'Friday in Arkham',
    status: 'active',
    stateRevision: 3,
    mobileControlsEnabled: true,
    mobileControlExpiresAt: '2030-01-01T00:00:00.000Z',
    mobileControlVersion: 'room-one',
    playerCount: 4,
    enabledSets: ['base-set'],
    turnNumber: 1,
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

describe('mobile controller credentials', () => {
  beforeEach(() => {
    process.env.CONTROLLER_SECRET = 'controller-test-secret'
  })

  it('creates a human-readable code and a separate strong QR secret', () => {
    const room = createControllerRoomCredentials(Date.UTC(2026, 6, 3))

    expect(room.joinCode).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/)
    expect(room.joinSecret.length).toBeGreaterThan(20)
    expect(room.joinCodeHash).not.toContain(room.joinCode)
    expect(room.joinSecretHash).not.toContain(room.joinSecret)
  })

  it('normalizes names and join codes without ambiguous separators', () => {
    expect(normalizeControllerName('  Jenny   Barnes ')).toBe('Jenny Barnes')
    expect(normalizeJoinCode('ab-c 234')).toBe('ABC234')
  })

  it('issues and verifies a room-bound participant token', () => {
    const now = Date.UTC(2026, 6, 3)
    const active = session({
      mobileControlExpiresAt: new Date(now + 60_000).toISOString(),
    })
    const token = issueControllerToken(active, 'Jenny', now)

    expect(readControllerToken(token, now)).toEqual({
      expiresAt: now + 60_000,
      name: 'Jenny',
      roomVersion: 'room-one',
      sessionID: 'session-one',
    })
    expect(readControllerToken(`${token}tampered`, now)).toBeNull()
    expect(readControllerToken(token, now + 60_001)).toBeNull()
  })

  it('keeps controller lifecycle separate from underlying game state', () => {
    const paused = session({ status: 'paused' })
    const disabled = session({ mobileControlsEnabled: false })

    expect(controllerRoomIsActive(paused, Date.UTC(2026, 6, 3))).toBe(false)
    expect(controllerRoomIsActive(disabled, Date.UTC(2026, 6, 3))).toBe(false)
    expect(paused.currentPhase).toBe('Upkeep')
    expect(paused.tracks.doomCurrent).toBe(1)
  })
})
