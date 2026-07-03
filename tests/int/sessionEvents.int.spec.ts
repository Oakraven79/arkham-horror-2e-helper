import { describe, expect, it, vi } from 'vitest'

import { publishSessionChange, subscribeToSessionChanges } from '@/lib/sessionEvents'
import { sessionEventStream } from '@/lib/sessionEventStream'

describe('session change notifications', () => {
  it('notifies only listeners attached to the changed session', () => {
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = subscribeToSessionChanges('session-one', first)
    const unsubscribeSecond = subscribeToSessionChanges('session-two', second)

    publishSessionChange({ revision: 4, sessionID: 'session-one' })

    expect(first).toHaveBeenCalledWith({ revision: 4, sessionID: 'session-one' })
    expect(second).not.toHaveBeenCalled()

    unsubscribeFirst()
    unsubscribeSecond()
  })

  it('stops notifications after the browser stream unsubscribes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToSessionChanges('session-one', listener)
    unsubscribe()

    publishSessionChange({ revision: 5, sessionID: 'session-one' })

    expect(listener).not.toHaveBeenCalled()
  })

  it('streams committed revisions to connected browser clients', async () => {
    const abort = new AbortController()
    const response = sessionEventStream('session-one', abort.signal)
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    expect(reader).toBeDefined()
    expect(decoder.decode((await reader?.read())?.value)).toContain('event: connected')

    publishSessionChange({ revision: 7, sessionID: 'session-one' })

    const update = decoder.decode((await reader?.read())?.value)
    expect(update).toContain('event: session-change')
    expect(update).toContain('"revision":7')

    abort.abort()
  })
})
