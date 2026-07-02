'use client'

import { useMemo, useState, useTransition } from 'react'

import {
  ArkhamEncounterDeckBack,
  type ArkhamEncounterDeckBackProps,
} from '@/components/arkhamEncounterDeckBack'
import { BoxedSetMark, type BoxedSetDisplay } from '@/components/boxedSetMark'

import { selectArkhamNeighborhoodAction } from './actions'

export interface ArkhamNeighborhoodDeckOption extends ArkhamEncounterDeckBackProps {
  board: string
  boxedSet?: BoxedSetDisplay
  cardCount: number
  id: string
}

interface ArkhamNeighborhoodShelfProps {
  decks: ArkhamNeighborhoodDeckOption[]
  sessionID: string
}

export function ArkhamNeighborhoodShelf({ decks, sessionID }: ArkhamNeighborhoodShelfProps) {
  const boards = useMemo(() => [...new Set(decks.map((deck) => deck.board))], [decks])
  const [activeBoard, setActiveBoard] = useState(boards[0] ?? 'Arkham')
  const [isPending, startTransition] = useTransition()
  const visibleDecks = decks.filter((deck) => deck.board === activeBoard)

  return (
    <section className="arkham-neighborhood-shelf" aria-label="Neighborhood encounter decks">
      <header className="arkham-shelf-heading">
        <div>
          <p className="eyebrow">Location decks</p>
          <h2>Choose a neighborhood</h2>
        </div>

        {boards.length > 1 && (
          <div className="arkham-board-tabs" role="tablist" aria-label="Encounter boards">
            {boards.map((board) => (
              <button
                aria-selected={activeBoard === board}
                className={activeBoard === board ? 'is-active' : undefined}
                key={board}
                onClick={() => setActiveBoard(board)}
                role="tab"
                type="button"
              >
                {board}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="arkham-shelf-grid" aria-busy={isPending}>
        {visibleDecks.map((deck) => {
          const disabled = isPending || deck.cardCount === 0

          return (
            <button
              aria-label={
                deck.cardCount > 0
                  ? `Select ${deck.neighborhood.name} encounter deck`
                  : `${deck.neighborhood.name} has no encounter cards`
              }
              className="arkham-shelf-deck"
              disabled={disabled}
              key={deck.id}
              onClick={() =>
                startTransition(() => selectArkhamNeighborhoodAction(sessionID, deck.id))
              }
              type="button"
            >
              <span className="arkham-shelf-deck-title">{deck.neighborhood.name}</span>
              <span className="arkham-shelf-deck-art" aria-hidden="true">
                <ArkhamEncounterDeckBack neighborhood={deck.neighborhood} panels={deck.panels} />
                <BoxedSetMark boxedSet={deck.boxedSet} />
              </span>
              <span className="arkham-shelf-deck-count">
                {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
