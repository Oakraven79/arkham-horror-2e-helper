'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface GameDataRequiredPanelProps {
  missingLabels: string[]
}

interface LoadResponse {
  error?: string
}

function formatList(values: string[]) {
  if (values.length <= 2) return values.join(' and ')

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

async function parseLoadResponse(response: Response) {
  const data = (await response.json()) as LoadResponse

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`)
  }
}

export function GameDataRequiredPanel({ missingLabels }: GameDataRequiredPanelProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function loadGameData() {
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const response = await fetch('/api/game-data/load', {
        credentials: 'same-origin',
        method: 'POST',
      })

      await parseLoadResponse(response)
      setMessage('Game data loaded. Refreshing session setup...')
      router.refresh()
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Game data loading failed.'

      setError(
        message === 'Payload authentication is required.'
          ? 'Sign in through Payload admin to run the game data loader.'
          : message,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="game-data-required-panel">
      <div>
        <h3>Game data required</h3>
        <p>Load the bundled game data before creating a session.</p>
      </div>
      {missingLabels.length > 0 && (
        <p className="game-data-missing-list">Missing: {formatList(missingLabels)}</p>
      )}
      {error && <p className="game-data-required-error">{error}</p>}
      {message && <p className="game-data-required-success">{message}</p>}
      <div className="game-data-required-actions">
        <button disabled={loading} onClick={loadGameData} type="button">
          {loading ? 'Loading game data...' : 'Load bundled fixture'}
        </button>
        <Link href="/admin/game-data">Open game data admin</Link>
      </div>
    </div>
  )
}
