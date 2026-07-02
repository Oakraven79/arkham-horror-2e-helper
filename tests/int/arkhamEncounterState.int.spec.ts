import { describe, expect, it } from 'vitest'

import { arkhamEncounterCardsWhere } from '@/lib/arkhamEncounterContent'
import {
  clearArkhamEncounterSelection,
  drawArkhamEncounterCard,
  selectArkhamEncounterNeighborhood,
  type ArkhamEncounterState,
} from '@/lib/arkhamEncounterState'
import {
  arkhamEncounterStateForPayload,
  arkhamEncounterStateFromSession,
} from '@/lib/arkhamEncounterSessionState'
import type { GameSession } from '@/payload-types'

describe('Arkham encounter state', () => {
  it('selects a neighborhood while retaining session history', () => {
    const selected = selectArkhamEncounterNeighborhood(
      {
        selectedNeighborhoodID: 'downtown',
        currentCardID: 'downtown-card',
        currentDrawKey: 'draw-1',
        drawHistory: [
          {
            cardID: 'downtown-card',
            neighborhoodID: 'downtown',
            drawKey: 'draw-1',
            drawnAt: '2026-07-02T00:00:00.000Z',
            turnNumber: 2,
          },
        ],
      },
      'uptown',
    )

    expect(selected).toMatchObject({
      selectedNeighborhoodID: 'uptown',
      currentCardID: null,
      currentDrawKey: null,
    })
    expect(selected.drawHistory).toHaveLength(1)
  })

  it('allows the same card to be drawn again after the deck is reshuffled', () => {
    const selected: ArkhamEncounterState = {
      selectedNeighborhoodID: 'uptown',
      drawHistory: [],
    }
    const first = drawArkhamEncounterCard(selected, ['card-a', 'card-b'], {
      drawKey: 'draw-1',
      drawnAt: '2026-07-02T00:00:00.000Z',
      random: () => 0,
      turnNumber: 3,
    })
    const second = drawArkhamEncounterCard(first, ['card-a', 'card-b'], {
      drawKey: 'draw-2',
      drawnAt: '2026-07-02T00:01:00.000Z',
      random: () => 0,
      turnNumber: 3,
    })

    expect(second.currentCardID).toBe('card-a')
    expect(second.currentDrawKey).toBe('draw-2')
    expect(second.drawHistory?.map((entry) => entry.cardID)).toEqual(['card-a', 'card-a'])
  })

  it('round-trips the current card and history through saved session data', () => {
    const state: ArkhamEncounterState = {
      selectedNeighborhoodID: 'uptown',
      currentCardID: 'card-a',
      currentDrawKey: 'draw-1',
      drawHistory: [
        {
          cardID: 'card-a',
          neighborhoodID: 'uptown',
          drawKey: 'draw-1',
          drawnAt: '2026-07-02T00:00:00.000Z',
          turnNumber: 3,
        },
      ],
    }
    const restored = arkhamEncounterStateFromSession({
      arkhamEncounters: arkhamEncounterStateForPayload(state),
    } as GameSession)

    expect(restored).toEqual(state)
  })

  it('clears working selection without losing draw history', () => {
    const cleared = clearArkhamEncounterSelection({
      selectedNeighborhoodID: 'uptown',
      currentCardID: 'card-a',
      currentDrawKey: 'draw-1',
      drawHistory: [
        {
          cardID: 'card-a',
          neighborhoodID: 'uptown',
          drawKey: 'draw-1',
          drawnAt: '2026-07-02T00:00:00.000Z',
          turnNumber: 3,
        },
      ],
    })

    expect(cleared.selectedNeighborhoodID).toBeNull()
    expect(cleared.currentCardID).toBeNull()
    expect(cleared.currentDrawKey).toBeNull()
    expect(cleared.drawHistory).toHaveLength(1)
  })

  it('combines neighborhood and active boxed-set filters', () => {
    expect(arkhamEncounterCardsWhere('uptown', ['base-set', 'dunwich-set'])).toEqual({
      and: [
        {
          neighborhood: {
            equals: 'uptown',
          },
        },
        {
          sourceSet: {
            in: ['base-set', 'dunwich-set'],
          },
        },
      ],
    })
  })
})
