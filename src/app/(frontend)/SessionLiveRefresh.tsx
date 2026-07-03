'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import styles from './SessionLiveRefresh.module.css'

interface SessionLiveRefreshProps {
  revision: number
  sessionID: string
}

export function SessionLiveRefresh({
  revision,
  sessionID,
}: SessionLiveRefreshProps) {
  const router = useRouter()
  const latestRevision = useRef(revision)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [connection, setConnection] = useState<'connected' | 'connecting' | 'offline'>(
    'connecting',
  )

  useEffect(() => {
    latestRevision.current = Math.max(latestRevision.current, revision)
  }, [revision])

  useEffect(() => {
    const events = new EventSource(`/api/session-events/${encodeURIComponent(sessionID)}`)
    const refresh = () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      refreshTimer.current = setTimeout(() => router.refresh(), 80)
    }

    events.addEventListener('connected', () => setConnection('connected'))
    events.addEventListener('session-change', (event) => {
      setConnection('connected')

      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          revision?: number
        }
        const nextRevision = Number(payload.revision ?? 0)

        if (nextRevision <= latestRevision.current) return
        latestRevision.current = nextRevision
      } catch {
        // A malformed event still warrants a safe authoritative refresh.
      }

      refresh()
    })
    events.onerror = () => setConnection(navigator.onLine ? 'connecting' : 'offline')

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const markOffline = () => setConnection('offline')
    const reconnect = () => {
      setConnection('connecting')
      refresh()
    }

    document.addEventListener('visibilitychange', refreshOnFocus)
    window.addEventListener('offline', markOffline)
    window.addEventListener('online', reconnect)

    return () => {
      events.close()
      document.removeEventListener('visibilitychange', refreshOnFocus)
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('online', reconnect)
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
    }
  }, [router, sessionID])

  return (
    <span className={styles.status} data-state={connection} aria-live="polite">
      Live table {connection}
    </span>
  )
}
