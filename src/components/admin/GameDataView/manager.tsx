'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

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

interface CurrentGameDataSummary {
  available: true
  checksum: string
  counts: Record<string, number>
  generatedAt: string
  media: {
    available: number
    bytes: number
    missing: number
    missingKeys: string[]
    referenced: number
    unreferenced: number
  }
  snapshotBytes: number
  totalBytes: number
  totalRecords: number
}

interface UnavailableCurrentGameDataSummary {
  available: false
  error: string
}

interface StatusResponse {
  current?: CurrentGameDataSummary | UnavailableCurrentGameDataSummary
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

function formatBytes(value: number) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const maximumFractionDigits = unitIndex === 0 ? 0 : 1

  return `${size.toLocaleString(undefined, { maximumFractionDigits })} ${units[unitIndex]}`
}

function formatNumber(value: number) {
  return value.toLocaleString()
}

function mediaMissingSummary(keys: string[]) {
  const shownKeys = keys.slice(0, 5).join(', ')
  const remaining = keys.length - 5

  return remaining > 0 ? `${shownKeys}, and ${remaining.toLocaleString()} more` : shownKeys
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

const actionGuidance = [
  {
    title: 'Download archive',
    body: 'Downloads the current CMS game data and referenced media. This does not change CMS data.',
  },
  {
    title: 'Upload & import archive',
    body: 'Imports immediately. Matching records are updated, missing records are created, and other game data is not cleared.',
  },
  {
    title: 'Load bundled fixture',
    body: 'Loads the app fixture. Matching records are updated, missing records are created, and other game data is not cleared.',
  },
]

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`)
  }

  return data
}

export function GameDataManager() {
  const archiveFileInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [result, setResult] = useState<LoadResponse['summary'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [operation, setOperation] = useState<
    'downloadArchive' | 'load' | 'status' | 'uploadArchive' | null
  >('status')

  const refreshStatus = useCallback(async () => {
    setOperation('status')
    setError(null)

    try {
      const response = await fetch('/api/game-data/status', {
        credentials: 'same-origin',
      })
      setStatus(await parseResponse<StatusResponse>(response))
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load fixture status.',
      )
    } finally {
      setOperation(null)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  async function loadFixture() {
    if (
      !window.confirm(
        'Load the bundled Arkham Horror game-data fixture now? Matching records will be updated, missing records will be created, and other game data will not be cleared.',
      )
    ) {
      return
    }

    setOperation('load')
    setError(null)
    setMessage(null)
    setResult(null)

    try {
      const response = await fetch('/api/game-data/load', {
        method: 'POST',
        credentials: 'same-origin',
      })
      const data = await parseResponse<LoadResponse>(response)
      setResult(data.summary ?? null)
      setMessage('Bundled fixture loaded.')
      await refreshStatus()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Fixture loading failed.')
      setOperation(null)
    }
  }

  async function downloadFile(endpoint: string, fallbackFilename: string) {
    const response = await fetch(endpoint, {
      credentials: 'same-origin',
    })

    if (!response.ok) {
      await parseResponse<{ error?: string }>(response)
    }

    const blob = await response.blob()
    const disposition = response.headers.get('Content-Disposition')
    const filename =
      disposition?.match(/filename="?(?<filename>[^";]+)"?/)?.groups?.filename ?? fallbackFilename
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function downloadArchive() {
    setOperation('downloadArchive')
    setError(null)
    setMessage(null)
    setResult(null)

    try {
      await downloadFile('/api/game-data/archive', 'game-data-archive.zip')
      setMessage('Archive downloaded.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Archive download failed.')
    } finally {
      setOperation(null)
    }
  }

  async function uploadArchive(file: File) {
    if (
      !window.confirm(
        'Upload and import this game-data archive now? Matching records will be updated, missing records will be created, and other game data will not be cleared.',
      )
    ) {
      return
    }

    setOperation('uploadArchive')
    setError(null)
    setMessage(null)
    setResult(null)

    try {
      const response = await fetch('/api/game-data/archive', {
        method: 'POST',
        body: file,
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/zip',
        },
      })
      const data = await parseResponse<LoadResponse>(response)

      setResult(data.summary ?? null)
      setMessage('Archive imported.')
      await refreshStatus()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Archive upload failed.')
      setOperation(null)
    }
  }

  const fixture = status?.fixture
  const current = status?.current
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
          <button disabled={busy} onClick={downloadArchive} type="button">
            {operation === 'downloadArchive' ? 'Preparing archive...' : 'Download archive'}
          </button>
          <button
            disabled={busy}
            onClick={() => archiveFileInputRef.current?.click()}
            type="button"
          >
            {operation === 'uploadArchive' ? 'Importing archive...' : 'Upload & import archive'}
          </button>
          <input
            accept="application/zip,.zip"
            aria-label="Upload game data archive"
            ref={archiveFileInputRef}
            style={{ display: 'none' }}
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file) void uploadArchive(file)
            }}
          />
          <button
            className="game-data-primary-action"
            disabled={busy || !fixture?.valid}
            onClick={loadFixture}
            type="button"
          >
            {operation === 'load' ? 'Loading fixture...' : 'Load bundled fixture'}
          </button>
        </div>
      </header>

      {error && <div className="game-data-alert error">{error}</div>}
      {message && <div className="game-data-alert success">{message}</div>}

      {result?.collections && (
        <section className="game-data-section">
          <h2>Action result</h2>
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

      <section className="game-data-section game-data-action-guide" aria-label="Game data actions">
        <h2>Action behavior</h2>
        <div className="game-data-action-grid">
          {actionGuidance.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
      </section>

      

      {current?.available ? (
        <section className="game-data-section">
          <h2>Current CMS contents</h2>
          <div className="game-data-size-grid">
            <div>
              <span>Total records</span>
              <strong>{formatNumber(current.totalRecords)}</strong>
            </div>
            <div>
              <span>Snapshot JSON</span>
              <strong>{formatBytes(current.snapshotBytes)}</strong>
            </div>
            <div>
              <span>Media disk</span>
              <strong>{formatBytes(current.media.bytes)}</strong>
            </div>
            <div>
              <span>Portable total</span>
              <strong>{formatBytes(current.totalBytes)}</strong>
            </div>
            <div>
              <span>Referenced media</span>
              <strong>
                {formatNumber(current.media.available)} / {formatNumber(current.media.referenced)}
              </strong>
            </div>
          </div>
          <div className="game-data-counts game-data-current-counts">
            {Object.entries(current.counts).map(([collection, count]) => (
              <div key={collection}>
                <span>{formatLabel(collection)}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
          {current.media.missing > 0 && (
            <div className="game-data-alert warning">
              Missing referenced media files: {mediaMissingSummary(current.media.missingKeys)}
            </div>
          )}
          {current.media.unreferenced > 0 && (
            <div className="game-data-alert">
              {formatNumber(current.media.unreferenced)} media item
              {current.media.unreferenced === 1
                ? ' has a portable key but is not referenced'
                : 's have portable keys but are not referenced'}{' '}
              by current game data.
            </div>
          )}
        </section>
      ) : current ? (
        <section className="game-data-section">
          <h2>Current CMS contents</h2>
          <div className="game-data-alert error">
            Current game data could not be summarized: {current.error}
          </div>
        </section>
      ) : null}

      <section className="game-data-section">
        <h2>Bundled Fixture Contents</h2>
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

      <section className="game-data-status-band">
        <div>
          <span>Fixture</span>
          <strong>{fixture ? `${fixture.namespace} v${fixture.version}` : 'Loading...'}</strong>
        </div>
        <div>
          <span>Bundled load</span>
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
    </main>
  )
}
