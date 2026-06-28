import { describe, expect, it } from 'vitest'

import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveRumor,
  createMythosDeckInstances,
  discardCurrentMythosCard,
  drawMythosCard,
  revealCurrentMythosCard,
  type MythosCardInstance,
  type MythosDeckState,
} from '@/lib/mythosDeckState'
import {
  mythosDeckStateForPayload,
  mythosDeckStateFromSession,
} from '@/lib/mythosSessionState'
import type { GameSession } from '@/payload-types'

function instance(cardID: string, copyNumber = 1): MythosCardInstance {
  return {
    cardID,
    instanceKey: `${cardID}:${copyNumber}`,
  }
}

describe('mythos deck state', () => {
  it('draws physical instances without repeating an instance in the current cycle', () => {
    const initialState: MythosDeckState = {
      drawPile: [instance('card-a'), instance('card-b')],
      discardPile: [],
      drawHistory: [],
      shuffleCount: 0,
    }

    const firstDraw = drawMythosCard(initialState)
    const secondDraw = drawMythosCard(discardCurrentMythosCard(firstDraw.state))

    expect(firstDraw.drawnCardID).toBe('card-a')
    expect(firstDraw.drawnInstanceKey).toBe('card-a:1')
    expect(secondDraw.drawnCardID).toBe('card-b')
    expect(secondDraw.state.drawPile).toEqual([])
    expect(secondDraw.state.discardPile).toEqual([instance('card-a')])
    expect(secondDraw.state.drawHistory).toEqual([instance('card-a'), instance('card-b')])
    expect(secondDraw.didShuffle).toBe(false)
  })

  it('creates distinct instances for legitimate physical copies', () => {
    expect(createMythosDeckInstances([{ id: 'card-a', copyCount: 3 }])).toEqual([
      instance('card-a', 1),
      instance('card-a', 2),
      instance('card-a', 3),
    ])
  })

  it('upgrades legacy relationship piles to instance records', () => {
    const legacySession = {
      mythos: {
        drawPile: ['card-a', 'card-a', 'card-b'],
        discardPile: [],
        drawHistory: [],
        currentDraw: null,
        currentDrawRevealed: false,
        activeEnvironment: null,
        activeRumor: null,
        shuffleCount: 0,
      },
    } as unknown as GameSession

    const state = mythosDeckStateFromSession(legacySession)
    const persisted = mythosDeckStateForPayload(state)

    expect(state.drawPile).toEqual([
      instance('card-a', 1),
      instance('card-a', 2),
      instance('card-b', 1),
    ])
    expect(persisted.drawPileInstances).toEqual([
      { instanceKey: 'card-a:1', card: 'card-a' },
      { instanceKey: 'card-a:2', card: 'card-a' },
      { instanceKey: 'card-b:1', card: 'card-b' },
    ])
  })

  it('shuffles the discard pile back in only when the draw pile is empty', () => {
    const result = drawMythosCard(
      {
        drawPile: [],
        discardPile: [instance('card-a'), instance('card-b')],
        drawHistory: [instance('card-a'), instance('card-b')],
        shuffleCount: 1,
      },
      [instance('card-b'), instance('card-a')],
    )

    expect(result.didShuffle).toBe(true)
    expect(result.drawnCardID).toBe('card-b')
    expect(result.state.drawPile).toEqual([instance('card-a')])
    expect(result.state.discardPile).toEqual([])
    expect(result.state.shuffleCount).toBe(2)
  })

  it('tracks reveal, discard, active environment, and active rumor slots separately', () => {
    const revealed = revealCurrentMythosCard({
      currentDraw: instance('environment-new'),
      currentDrawRevealed: false,
      activeEnvironment: instance('environment-old'),
      activeRumor: instance('rumor-active'),
      discardPile: [],
    })

    const withEnvironment = activateCurrentEnvironment(revealed)
    const withIgnoredRumor = activateCurrentRumor({
      ...withEnvironment,
      currentDraw: instance('rumor-new'),
    })
    const withClearedRumor = clearActiveRumor(withIgnoredRumor)

    expect(revealed.currentDrawRevealed).toBe(true)
    expect(withEnvironment.activeEnvironment).toEqual(instance('environment-new'))
    expect(withEnvironment.discardPile).toEqual([instance('environment-old')])
    expect(withIgnoredRumor.activeRumor).toEqual(instance('rumor-active'))
    expect(withIgnoredRumor.discardPile).toEqual([
      instance('environment-old'),
      instance('rumor-new'),
    ])
    expect(withClearedRumor.activeRumor).toBeNull()
    expect(withClearedRumor.discardPile).toEqual([
      instance('environment-old'),
      instance('rumor-new'),
      instance('rumor-active'),
    ])
  })
})
