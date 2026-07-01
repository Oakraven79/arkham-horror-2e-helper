'use client'

import { useEffect, useState, useTransition } from 'react'

import { OtherworldEncounterCardBack } from '@/components/otherworldEncounterCardBack'
import { OtherworldEncounterDeck } from '@/components/otherworldEncounterDeck'
import type { OtherworldEncounterCardFrontProps } from '@/components/otherworldEncounterCardFront'

import { flipNextOtherWorldEncounterAction } from './actions'

interface OtherWorldEncounterDeckSlotProps {
  availableCards: number
  currentCard?: OtherworldEncounterCardFrontProps | null
  currentCardInstanceKey?: string | null
  sessionID: string
}

export function OtherWorldEncounterDeckSlot({
  availableCards,
  currentCard,
  currentCardInstanceKey,
  sessionID,
}: OtherWorldEncounterDeckSlotProps) {
  const [isPending, startTransition] = useTransition()
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (!currentCardInstanceKey) {
      setIsRevealed(false)
      return
    }

    setIsRevealed(false)
    const frame = window.requestAnimationFrame(() => setIsRevealed(true))

    return () => window.cancelAnimationFrame(frame)
  }, [currentCardInstanceKey])

  const flipNext = () => {
    if (isPending || availableCards === 0) return

    setIsRevealed(false)
    startTransition(() => flipNextOtherWorldEncounterAction(sessionID))
  }

  if (!currentCard) {
    return (
      <button
        className="mythos-table-deck-button"
        disabled={isPending || availableCards === 0}
        onClick={flipNext}
        type="button"
      >
        <span className="mythos-table-deck-stack" aria-hidden="true">
          <OtherworldEncounterCardBack />
        </span>
        <span className="mythos-table-deck-label">
          {availableCards === 0 ? 'No encounter cards available' : 'Flip encounter card'}
        </span>
      </button>
    )
  }

  return (
    <div className={isPending ? 'mythos-card-is-saving' : undefined}>
      <OtherworldEncounterDeck {...currentCard} onFlip={flipNext} revealed={isRevealed} />
    </div>
  )
}
