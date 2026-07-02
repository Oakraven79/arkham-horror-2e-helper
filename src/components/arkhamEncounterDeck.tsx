'use client'

import { type KeyboardEvent, useState } from 'react'

import {
  ArkhamEncounterCardFront,
  type ArkhamEncounterCardFrontProps,
} from './arkhamEncounterCardFront'
import {
  ArkhamEncounterDeckBack,
  type ArkhamEncounterDeckBackProps,
} from './arkhamEncounterDeckBack'
import './arkhamEncounterCard.css'

export interface ArkhamEncounterDeckProps
  extends ArkhamEncounterCardFrontProps, Pick<ArkhamEncounterDeckBackProps, 'panels'> {
  canFlipBack?: boolean
  initiallyRevealed?: boolean
  onFlip?: (isRevealed: boolean) => void
  revealed?: boolean
  revealedLabel?: string
}

export function ArkhamEncounterDeck({
  canFlipBack = true,
  initiallyRevealed = false,
  onFlip,
  panels,
  revealed,
  revealedLabel,
  ...frontProps
}: ArkhamEncounterDeckProps) {
  const [localRevealed, setLocalRevealed] = useState(initiallyRevealed)
  const isRevealed = revealed ?? localRevealed

  const flip = () => {
    const next = canFlipBack ? !isRevealed : true

    if (next === isRevealed) return
    if (revealed === undefined) setLocalRevealed(next)
    onFlip?.(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      flip()
    }
  }

  return (
    <div
      aria-label={
        isRevealed
          ? (revealedLabel ?? `Flip ${frontProps.neighborhood.name} encounter card face down`)
          : `Draw from the ${frontProps.neighborhood.name} encounter deck`
      }
      aria-pressed={isRevealed}
      className={`arkham-encounter-deck${isRevealed ? ' is-revealed' : ''}`}
      onClick={flip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="arkham-encounter-deck-inner">
        <div className="arkham-encounter-deck-face back">
          <ArkhamEncounterDeckBack neighborhood={frontProps.neighborhood} panels={panels} />
        </div>
        <div className="arkham-encounter-deck-face front">
          <ArkhamEncounterCardFront {...frontProps} />
        </div>
      </div>
    </div>
  )
}
