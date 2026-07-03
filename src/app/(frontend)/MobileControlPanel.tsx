'use client'

import QRCode from 'qrcode'
import Image from 'next/image'
import { useEffect, useMemo, useState, useTransition } from 'react'

import {
  disableMobileControlsAction,
  enableMobileControlsAction,
} from './mobileControlActions'
import styles from './MobileControlPanel.module.css'

interface MobileControlPanelProps {
  expiresAt?: string | null
  initiallyEnabled: boolean
  sessionID: string
}

interface RoomCredentials {
  expiresAt: string
  joinCode: string
  joinSecret: string
}

function expiryLabel(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function MobileControlPanel({
  expiresAt,
  initiallyEnabled,
  sessionID,
}: MobileControlPanelProps) {
  const [credentials, setCredentials] = useState<RoomCredentials | null>(null)
  const [enabled, setEnabled] = useState(initiallyEnabled)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [isPending, startTransition] = useTransition()
  const joinURL = useMemo(() => {
    if (!credentials || typeof window === 'undefined') return ''

    const configuredOrigin = process.env.NEXT_PUBLIC_CONTROLLER_ORIGIN
    const url = new URL('/controller', configuredOrigin || window.location.origin)
    url.hash = new URLSearchParams({
      session: sessionID,
      secret: credentials.joinSecret,
    }).toString()
    return url.toString()
  }, [credentials, sessionID])
  const joinUsesLoopback = useMemo(() => {
    if (!joinURL) return false

    const hostname = new URL(joinURL).hostname
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  }, [joinURL])

  useEffect(() => {
    if (!joinURL) {
      setQrCode('')
      return
    }

    let cancelled = false

    QRCode.toDataURL(joinURL, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#10211a',
        light: '#f7f0d7',
      },
    })
      .then((value) => {
        if (!cancelled) setQrCode(value)
      })
      .catch(() => {
        if (!cancelled) setError('The QR code could not be generated. Use the join code.')
      })

    return () => {
      cancelled = true
    }
  }, [joinURL])

  const enable = () => {
    setError('')
    startTransition(async () => {
      try {
        const room = await enableMobileControlsAction(sessionID)
        setCredentials(room)
        setEnabled(true)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not enable mobile controls.')
      }
    })
  }

  const disable = () => {
    setError('')
    startTransition(async () => {
      try {
        await disableMobileControlsAction(sessionID)
        setCredentials(null)
        setEnabled(false)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not disable mobile controls.')
      }
    })
  }

  return (
    <details className={styles.panel} open={Boolean(credentials)}>
      <summary>
        <span>
          <strong>Mobile controls</strong>
          <small>{enabled ? 'Optional room enabled' : 'Optional companion controls'}</small>
        </span>
        <span className={enabled ? styles.active : styles.inactive}>
          {enabled ? 'On' : 'Off'}
        </span>
      </summary>

      <div className={styles.content}>
        {!enabled ? (
          <div className={styles.intro}>
            <p>Let phones control this table. The dashboard continues to work normally.</p>
            <button disabled={isPending} onClick={enable} type="button">
              {isPending ? 'Opening room…' : 'Enable mobile controls'}
            </button>
          </div>
        ) : credentials ? (
          <div className={styles.room}>
            <div className={styles.qr}>
              {qrCode ? (
                <Image
                  alt="QR code to join the mobile controller"
                  height={320}
                  src={qrCode}
                  unoptimized
                  width={320}
                />
              ) : null}
            </div>
            <div className={styles.joinDetails}>
              <span>Join code</span>
              <strong>{credentials.joinCode}</strong>
              <small>Valid until {expiryLabel(credentials.expiresAt)}</small>
              <a href={joinURL} rel="noreferrer" target="_blank">
                Open controller link
              </a>
              {joinUsesLoopback && (
                <p className={styles.warning}>
                  This link uses {new URL(joinURL).hostname}. Open the dashboard from its LAN
                  address, or set NEXT_PUBLIC_CONTROLLER_ORIGIN, before phones scan it.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.intro}>
            <p>
              The room is active
              {expiresAt ? ` until ${expiryLabel(expiresAt)}` : ''}. Generate a fresh code to
              add another phone.
            </p>
            <button disabled={isPending} onClick={enable} type="button">
              {isPending ? 'Generating…' : 'Generate new join code'}
            </button>
          </div>
        )}

        {enabled && (
          <div className={styles.footer}>
            <button
              className={styles.disable}
              disabled={isPending}
              onClick={disable}
              type="button"
            >
              Disable and disconnect phones
            </button>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </details>
  )
}
