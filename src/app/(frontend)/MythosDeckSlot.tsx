'use client'

import { useEffect, useState, useTransition } from 'react'

import { MythosCardBack } from '@/components/mythosCardBack'
import { MythosDeck } from '@/components/mythosDeck'
import type { MythosCardFrontProps } from '@/components/mythosCardFront'

import { drawMythosAction, revealCurrentDrawAction } from './actions'

interface MythosDeckSlotProps {
  sessionID: string
  currentCard?: MythosCardFrontProps | null
  currentCardID?: string | null
  revealed: boolean
  cardsRemaining: number
  drawDisabled?: boolean
  drawLabel?: string
}

export function MythosDeckSlot({
  sessionID,
  currentCard,
  currentCardID,
  revealed,
  cardsRemaining,
  drawDisabled = false,
  drawLabel = 'Draw Mythos',
}: MythosDeckSlotProps) {
  const [isPending, startTransition] = useTransition()
  const [isRevealed, setIsRevealed] = useState(revealed)

  useEffect(() => {
    setIsRevealed(revealed)
  }, [revealed, currentCardID])

  if (!currentCard) {
    return (
      <button
        className="mythos-table-deck-button"
        disabled={isPending || drawDisabled || cardsRemaining === 0}
        type="button"
        onClick={() => startTransition(() => drawMythosAction(sessionID))}
      >
        <span className="mythos-table-deck-stack" aria-hidden="true">
          <MythosCardBack />
        </span>
        <span className="mythos-table-deck-label">
          {cardsRemaining === 0 ? 'No Mythos cards in draw pile' : drawLabel}
        </span>
      </button>
    )
  }

  return (
    <div className={isPending ? 'mythos-card-is-saving' : undefined}>
      <MythosDeck
        {...currentCard}
        revealed={isRevealed}
        canFlipBack={false}
        onFlip={(next) => {
          if (!next) return

          setIsRevealed(true)
          startTransition(() => revealCurrentDrawAction(sessionID))
        }}
      />
    </div>
  )
}
