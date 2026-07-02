'use client'

import { useEffect, useState, useTransition } from 'react'

import { ArkhamEncounterDeck } from '@/components/arkhamEncounterDeck'
import {
  ArkhamEncounterDeckBack,
  type ArkhamEncounterDeckBackProps,
} from '@/components/arkhamEncounterDeckBack'
import type { ArkhamEncounterCardFrontProps } from '@/components/arkhamEncounterCardFront'

import { drawArkhamEncounterAction } from './actions'

interface ArkhamEncounterDeckSlotProps extends ArkhamEncounterDeckBackProps {
  cardCount: number
  currentCard?: ArkhamEncounterCardFrontProps | null
  currentDrawKey?: string | null
  sessionID: string
}

export function ArkhamEncounterDeckSlot({
  cardCount,
  currentCard,
  currentDrawKey,
  neighborhood,
  panels,
  sessionID,
}: ArkhamEncounterDeckSlotProps) {
  const [isPending, startTransition] = useTransition()
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    if (!currentDrawKey) {
      setIsRevealed(false)
      return
    }

    setIsRevealed(false)
    const frame = window.requestAnimationFrame(() => setIsRevealed(true))

    return () => window.cancelAnimationFrame(frame)
  }, [currentDrawKey])

  const draw = () => {
    if (isPending || cardCount === 0) return

    setIsRevealed(false)
    startTransition(() => drawArkhamEncounterAction(sessionID))
  }

  if (!currentCard) {
    return (
      <button
        aria-label={`Draw from the ${neighborhood.name} encounter deck`}
        className="arkham-selected-deck"
        disabled={isPending || cardCount === 0}
        onClick={draw}
        type="button"
      >
        <span className="arkham-selected-deck-stack" aria-hidden="true">
          <ArkhamEncounterDeckBack neighborhood={neighborhood} panels={panels} />
        </span>
        <span className="arkham-selected-deck-label">
          {cardCount === 0 ? 'No encounter cards available' : 'Draw encounter'}
        </span>
      </button>
    )
  }

  return (
    <div className={isPending ? 'mythos-card-is-saving' : undefined}>
      <ArkhamEncounterDeck
        {...currentCard}
        onFlip={draw}
        panels={panels}
        revealed={isRevealed}
        revealedLabel={`Draw another ${neighborhood.name} encounter`}
      />
    </div>
  )
}
