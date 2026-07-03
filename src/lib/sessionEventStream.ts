import { subscribeToSessionChanges } from './sessionEvents'

const encoder = new TextEncoder()

function encodedEvent(event: string, data: unknown, id?: string) {
  const lines = [
    ...(id ? [`id: ${id}`] : []),
    `event: ${event}`,
    `data: ${JSON.stringify(data)}`,
    '',
    '',
  ]

  return encoder.encode(lines.join('\n'))
}

export function sessionEventStream(sessionID: string, signal: AbortSignal) {
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const send = (chunk: Uint8Array) => {
        if (closed) return

        try {
          controller.enqueue(chunk)
        } catch {
          cleanup()
        }
      }
      const unsubscribe = subscribeToSessionChanges(sessionID, (event) => {
        send(encodedEvent('session-change', event, String(event.revision)))
      })
      const heartbeat = setInterval(() => {
        send(encoder.encode(': heartbeat\n\n'))
      }, 15_000)

      cleanup = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        unsubscribe()

        try {
          controller.close()
        } catch {
          // The browser may have already closed the stream.
        }
      }

      signal.addEventListener('abort', cleanup, { once: true })
      send(encodedEvent('connected', { sessionID }))
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  })
}
