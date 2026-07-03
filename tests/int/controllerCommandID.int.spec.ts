import { describe, expect, it } from 'vitest'

import { createControllerCommandID } from '../../src/lib/controllerCommandID'

describe('controller command identifiers', () => {
  it('uses randomUUID when the browser provides it', () => {
    expect(
      createControllerCommandID({
        randomUUID: () => 'browser-generated-id',
      }),
    ).toBe('browser-generated-id')
  })

  it('creates a UUID with getRandomValues when randomUUID is unavailable', () => {
    const id = createControllerCommandID({
      getRandomValues: (array) => {
        array.set(Array.from({ length: 16 }, (_, index) => index))
        return array
      },
    })

    expect(id).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
  })

  it('still creates distinct idempotency keys without Web Crypto', () => {
    const first = createControllerCommandID({})
    const second = createControllerCommandID({})

    expect(first).not.toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(8)
  })
})
