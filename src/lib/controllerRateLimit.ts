interface JoinAttemptWindow {
  count: number
  resetsAt: number
}

interface ControllerRateLimitStore {
  joinAttempts: Map<string, JoinAttemptWindow>
}

const storeKey = Symbol.for('arkham-horror-2e-helper.controller-rate-limit')
const globalWithRateLimits = globalThis as typeof globalThis & {
  [storeKey]?: ControllerRateLimitStore
}

const joinAttemptLimit = 12
const joinAttemptWindowMs = 5 * 60 * 1000

function rateLimitStore() {
  globalWithRateLimits[storeKey] ??= {
    joinAttempts: new Map(),
  }

  return globalWithRateLimits[storeKey]
}

export class ControllerJoinRateLimitError extends Error {}

export function consumeControllerJoinAttempt(key: string, now = Date.now()) {
  const attempts = rateLimitStore().joinAttempts
  const existing = attempts.get(key)
  const current =
    !existing || existing.resetsAt <= now
      ? {
          count: 0,
          resetsAt: now + joinAttemptWindowMs,
        }
      : existing

  if (current.count >= joinAttemptLimit) {
    throw new ControllerJoinRateLimitError(
      'Too many join attempts. Wait a few minutes or generate a new room code.',
    )
  }

  current.count += 1
  attempts.set(key, current)

  if (attempts.size > 500) {
    for (const [attemptKey, value] of attempts) {
      if (value.resetsAt <= now) attempts.delete(attemptKey)
    }
  }

  return {
    remaining: joinAttemptLimit - current.count,
    resetsAt: current.resetsAt,
  }
}
