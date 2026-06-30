'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import './styles.scss'

interface FixtureValidation {
  checksum: string
  counts: Record<string, number>
  errors: string[]
  namespace: string
  valid: boolean
  version: number
  warnings: string[]
}

interface Installation {
  completedAt?: string | null
  createdAt: string
  error?: string | null
  fixtureVersion: number
  status: 'failed' | 'running' | 'succeeded'
}

interface StatusResponse {
  fixture: FixtureValidation
  latestInstallation?: Installation | null
}

interface LoadResponse {
  error?: string
  installation?: Installation
  summary?: {
    collections?: Record<string, Record<string, unknown>>
  }
}

function formatLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())
}

function actionCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0
}

function resultEntries(summary: Record<string, unknown>) {
  return Object.entries(summary).flatMap(([action, value]) => {
    if (Array.isArray(value)) {
      return [[formatLabel(action), value.length] as const]
    }

    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .filter(([, nestedValue]) => Array.isArray(nestedValue))
        .map(
          ([nestedAction, nestedValue]) =>
            [
              `${formatLabel(action)} ${formatLabel(nestedAction)}`,
              actionCount(nestedValue),
            ] as const,
        )
    }

    return []
  })
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`)
  }

  return data
}

export function GameDataManager() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [result, setResult] = useState<LoadResponse['summary'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [operation, setOperation] = useState<'load' | 'status' | 'validate' | null>('status')

  const refreshStatus = useCallback(async () => {
    setOperation('status')
    setError(null)

    try {
      const response = await fetch('/api/game-data/status', {
        credentials: 'same-origin',
      })
      setStatus(await parseResponse<StatusResponse>(response))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load fixture status.')
    } finally {
      setOperation(null)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  async function validateFixture() {
    setOperation('validate')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/game-data/validate', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await parseResponse<{ fixture: FixtureValidation }>(response)
      setStatus((current) => ({
        fixture: data.fixture,
        latestInstallation: current?.latestInstallation,
      }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Fixture validation failed.')
    } finally {
      setOperation(null)
    }
  }

  async function loadFixture() {
    if (
      !window.confirm(
        'Load the official Arkham Horror game data into this Payload instance? Existing fixture-owned records may be updated.',
      )
    ) {
      return
    }

    setOperation('load')
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/game-data/load', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await parseResponse<LoadResponse>(response)
      setResult(data.summary ?? null)
      await refreshStatus()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Fixture loading failed.')
      setOperation(null)
    }
  }

  const fixture = status?.fixture
  const installation = status?.latestInstallation
  const busy = operation !== null

  return (
    <main className="game-data-view">
      <Link className="game-data-back-link" href="/admin">
        <span aria-hidden="true">&larr;</span>
        Back to admin
      </Link>

      <header className="game-data-header">
        <div>
          <p>Arkham Horror 2nd Edition</p>
          <h1>Game Data</h1>
        </div>
        <div className="game-data-actions">
          <button disabled={busy} onClick={validateFixture} type="button">
            {operation === 'validate' ? 'Validating...' : 'Validate fixture'}
          </button>
          <button
            className="game-data-primary-action"
            disabled={busy || !fixture?.valid}
            onClick={loadFixture}
            type="button"
          >
            {operation === 'load' ? 'Loading game data...' : 'Load game data'}
          </button>
        </div>
      </header>

      {error && <div className="game-data-alert error">{error}</div>}

      <section className="game-data-status-band">
        <div>
          <span>Fixture</span>
          <strong>{fixture ? `${fixture.namespace} v${fixture.version}` : 'Loading...'}</strong>
        </div>
        <div>
          <span>Validation</span>
          <strong>{fixture?.valid ? 'Ready' : fixture ? 'Blocked' : 'Checking'}</strong>
        </div>
        <div>
          <span>Last load</span>
          <strong>{installation?.status ?? 'Never loaded'}</strong>
        </div>
        <div>
          <span>Completed</span>
          <strong>
            {installation?.completedAt
              ? new Date(installation.completedAt).toLocaleString()
              : 'Not available'}
          </strong>
        </div>
      </section>

      <section className="game-data-section">
        <h2>Fixture contents</h2>
        <div className="game-data-counts">
          {fixture &&
            Object.entries(fixture.counts).map(([collection, count]) => (
              <div key={collection}>
                <span>{formatLabel(collection)}</span>
                <strong>{count}</strong>
              </div>
            ))}
        </div>
      </section>

      {(fixture?.errors.length || fixture?.warnings.length) && (
        <section className="game-data-section">
          <h2>Validation messages</h2>
          {fixture.errors.map((message) => (
            <div className="game-data-alert error" key={message}>
              {message}
            </div>
          ))}
          {fixture.warnings.map((message) => (
            <div className="game-data-alert warning" key={message}>
              {message}
            </div>
          ))}
        </section>
      )}

      {installation?.error && (
        <section className="game-data-section">
          <h2>Last error</h2>
          <div className="game-data-alert error">{installation.error}</div>
        </section>
      )}

      {result?.collections && (
        <section className="game-data-section">
          <h2>Load result</h2>
          <div className="game-data-results">
            {Object.entries(result.collections).map(([collection, summary]) => (
              <div key={collection}>
                <h3>{formatLabel(collection)}</h3>
                <dl>
                  {resultEntries(summary).map(([action, count]) => (
                    <div key={action}>
                      <dt>{action}</dt>
                      <dd>{count}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
