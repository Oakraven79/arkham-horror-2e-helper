export interface SessionChangeEvent {
  revision: number
  sessionID: string
}

type SessionChangeListener = (event: SessionChangeEvent) => void

interface SessionEventStore {
  listeners: Map<string, Set<SessionChangeListener>>
}

const storeKey = Symbol.for('arkham-horror-2e-helper.session-events')
const globalWithSessionEvents = globalThis as typeof globalThis & {
  [storeKey]?: SessionEventStore
}

function eventStore(): SessionEventStore {
  globalWithSessionEvents[storeKey] ??= {
    listeners: new Map(),
  }

  return globalWithSessionEvents[storeKey]
}

export function publishSessionChange(event: SessionChangeEvent) {
  const listeners = eventStore().listeners.get(event.sessionID)

  if (!listeners) return

  for (const listener of [...listeners]) {
    listener(event)
  }
}

export function subscribeToSessionChanges(
  sessionID: string,
  listener: SessionChangeListener,
) {
  const listeners = eventStore().listeners.get(sessionID) ?? new Set<SessionChangeListener>()
  listeners.add(listener)
  eventStore().listeners.set(sessionID, listeners)

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      eventStore().listeners.delete(sessionID)
    }
  }
}
