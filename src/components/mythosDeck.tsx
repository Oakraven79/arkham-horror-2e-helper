'use client'

import { type KeyboardEvent, useState } from 'react'

import { MythosCardBack } from './mythosCardBack'
import { MythosCardFront, type MythosCardFrontProps } from './mythosCardFront'
import './mythosDeck.css'

export interface MythosDeckProps extends MythosCardFrontProps {
  initiallyRevealed?: boolean
  revealed?: boolean
  canFlipBack?: boolean
  onFlip?: (isRevealed: boolean) => void
}

export const MythosDeck = ({
  initiallyRevealed = false,
  revealed,
  canFlipBack = true,
  onFlip,
  ...frontProps
}: MythosDeckProps) => {
  const [localRevealed, setLocalRevealed] = useState(initiallyRevealed)
  const isRevealed = revealed ?? localRevealed

  const flip = () => {
    const next = canFlipBack ? !isRevealed : true

    if (next === isRevealed) return

    if (revealed === undefined) {
      setLocalRevealed(next)
    }

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
      role="button"
      tabIndex={0}
      className={`mythos-deck-shell${isRevealed ? ' is-revealed' : ''}`}
      onClick={flip}
      onKeyDown={handleKeyDown}
      aria-pressed={isRevealed}
      aria-label={isRevealed ? 'Flip Mythos card face down' : 'Flip Mythos deck card face up'}
    >
      <div className="mythos-deck-inner">
        <div className="mythos-deck-face back">
          <MythosCardBack />
        </div>
        <div className="mythos-deck-face front">
          <MythosCardFront {...frontProps} />
        </div>
      </div>
    </div>
  )
}
