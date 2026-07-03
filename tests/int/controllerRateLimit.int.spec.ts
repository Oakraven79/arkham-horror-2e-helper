import { describe, expect, it } from 'vitest'

import {
  consumeControllerJoinAttempt,
  ControllerJoinRateLimitError,
} from '@/lib/controllerRateLimit'

describe('controller join rate limiting', () => {
  it('limits repeated guesses and resets after the window', () => {
    const key = `test-${crypto.randomUUID()}`
    const now = Date.UTC(2026, 6, 3)

    for (let attempt = 0; attempt < 12; attempt += 1) {
      consumeControllerJoinAttempt(key, now)
    }

    expect(() => consumeControllerJoinAttempt(key, now)).toThrow(
      ControllerJoinRateLimitError,
    )
    expect(() => consumeControllerJoinAttempt(key, now + 5 * 60 * 1000)).not.toThrow()
  })
})
