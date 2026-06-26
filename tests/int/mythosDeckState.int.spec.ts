import { describe, expect, it } from 'vitest'

import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveRumor,
  discardCurrentMythosCard,
  drawMythosCard,
  revealCurrentMythosCard,
  type MythosDeckState,
} from '@/lib/mythosDeckState'

describe('mythos deck state', () => {
  it('draws from the draw pile without duplicating cards in the current cycle', () => {
    const initialState: MythosDeckState = {
      drawPile: ['card-a', 'card-b'],
      discardPile: [],
      drawHistory: [],
      shuffleCount: 0,
    }

    const firstDraw = drawMythosCard(initialState)
    const secondDraw = drawMythosCard(discardCurrentMythosCard(firstDraw.state))

    expect(firstDraw.drawnCardID).toBe('card-a')
    expect(secondDraw.drawnCardID).toBe('card-b')
    expect(secondDraw.state.drawPile).toEqual([])
    expect(secondDraw.state.discardPile).toEqual(['card-a'])
    expect(secondDraw.state.drawHistory).toEqual(['card-a', 'card-b'])
    expect(secondDraw.didShuffle).toBe(false)
  })

  it('shuffles the discard pile back in only when the draw pile is empty', () => {
    const result = drawMythosCard(
      {
        drawPile: [],
        discardPile: ['card-a', 'card-b'],
        drawHistory: ['card-a', 'card-b'],
        shuffleCount: 1,
      },
      ['card-b', 'card-a'],
    )

    expect(result.didShuffle).toBe(true)
    expect(result.drawnCardID).toBe('card-b')
    expect(result.state.drawPile).toEqual(['card-a'])
    expect(result.state.discardPile).toEqual([])
    expect(result.state.shuffleCount).toBe(2)
  })

  it('tracks reveal, discard, active environment, and active rumor slots separately', () => {
    const revealed = revealCurrentMythosCard({
      currentDraw: 'environment-new',
      currentDrawRevealed: false,
      activeEnvironment: 'environment-old',
      activeRumor: 'rumor-active',
      discardPile: [],
    })

    const withEnvironment = activateCurrentEnvironment(revealed)
    const withIgnoredRumor = activateCurrentRumor({
      ...withEnvironment,
      currentDraw: 'rumor-new',
    })
    const withClearedRumor = clearActiveRumor(withIgnoredRumor)

    expect(revealed.currentDrawRevealed).toBe(true)
    expect(withEnvironment.activeEnvironment).toBe('environment-new')
    expect(withEnvironment.discardPile).toEqual(['environment-old'])
    expect(withIgnoredRumor.activeRumor).toBe('rumor-active')
    expect(withIgnoredRumor.discardPile).toEqual(['environment-old', 'rumor-new'])
    expect(withClearedRumor.activeRumor).toBeNull()
    expect(withClearedRumor.discardPile).toEqual(['environment-old', 'rumor-new', 'rumor-active'])
  })
})
