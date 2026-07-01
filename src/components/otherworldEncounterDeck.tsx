'use client'

import { type KeyboardEvent } from 'react'

import { OtherworldEncounterCardBack } from './otherworldEncounterCardBack'
import {
  OtherworldEncounterCardFront,
  type OtherworldEncounterCardFrontProps,
} from './otherworldEncounterCardFront'
import './otherworldEncounterDeck.css'

export interface OtherworldEncounterDeckProps extends OtherworldEncounterCardFrontProps {
  onFlip?: (isRevealed: boolean) => void
  revealed: boolean
}

export function OtherworldEncounterDeck({
  onFlip,
  revealed,
  ...frontProps
}: OtherworldEncounterDeckProps) {
  const flip = () => onFlip?.(!revealed)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      flip()
    }
  }

  return (
    <div
      aria-label={
        revealed ? 'Flip the next Other World encounter card' : 'Reveal Other World encounter card'
      }
      aria-pressed={revealed}
      className={`otherworld-encounter-deck${revealed ? ' is-revealed' : ''}`}
      onClick={flip}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="otherworld-encounter-deck-inner">
        <div className="otherworld-encounter-deck-face back">
          <OtherworldEncounterCardBack />
        </div>
        <div className="otherworld-encounter-deck-face front">
          <OtherworldEncounterCardFront {...frontProps} />
        </div>
      </div>
    </div>
  )
}
