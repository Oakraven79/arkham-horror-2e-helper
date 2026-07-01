import { describe, expect, it } from 'vitest'

import {
  createOtherWorldEncounterDeckInstances,
  discardCurrentOtherWorldEncounterCard,
  flipNextOtherWorldEncounterCard,
  freshOtherWorldEncounterDeckState,
  type OtherWorldEncounterCardInstance,
  type OtherWorldEncounterDeckState,
} from '@/lib/otherWorldEncounterDeckState'
import {
  otherWorldEncounterDeckStateForPayload,
  otherWorldEncounterDeckStateFromSession,
} from '@/lib/otherWorldEncounterSessionState'
import type { GameSession, OtherWorldEncounterCard } from '@/payload-types'

function instance(cardID: string, copyNumber = 1): OtherWorldEncounterCardInstance {
  return {
    cardID,
    instanceKey: `${cardID}:${copyNumber}`,
  }
}

describe('Other World encounter deck state', () => {
  it('discards the displayed card when the next card is flipped', () => {
    const initialState: OtherWorldEncounterDeckState = {
      initialized: true,
      drawPile: [instance('card-a'), instance('card-b')],
      discardPile: [],
      drawHistory: [],
      currentDraw: null,
      shuffleCount: 0,
    }

    const firstFlip = flipNextOtherWorldEncounterCard(initialState)
    const secondFlip = flipNextOtherWorldEncounterCard(firstFlip.state)

    expect(firstFlip.drawnCardID).toBe('card-a')
    expect(secondFlip.drawnCardID).toBe('card-b')
    expect(secondFlip.state.currentDraw).toEqual(instance('card-b'))
    expect(secondFlip.state.discardPile).toEqual([instance('card-a')])
    expect(secondFlip.state.drawHistory).toEqual([instance('card-a'), instance('card-b')])
    expect(secondFlip.didShuffle).toBe(false)
  })

  it('automatically shuffles all discarded cards when the draw pile is empty', () => {
    const result = flipNextOtherWorldEncounterCard(
      {
        initialized: true,
        drawPile: [],
        discardPile: [instance('card-a')],
        drawHistory: [instance('card-a'), instance('card-b')],
        currentDraw: instance('card-b'),
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

  it('creates distinct physical instances and a clean filtered deck', () => {
    const cards = [
      { id: 'base-card', copyCount: 1 },
      { id: 'expansion-card', copyCount: 2 },
    ] as Pick<OtherWorldEncounterCard, 'copyCount' | 'id'>[]

    expect(createOtherWorldEncounterDeckInstances(cards)).toEqual([
      instance('base-card'),
      instance('expansion-card'),
      instance('expansion-card', 2),
    ])

    const filtered = freshOtherWorldEncounterDeckState([cards[0]!], () => 0)
    expect(filtered.drawPile).toEqual([instance('base-card')])
    expect(filtered.initialized).toBe(true)
  })

  it('round-trips an in-progress encounter through saved session data', () => {
    const state: OtherWorldEncounterDeckState = {
      initialized: true,
      drawPile: [instance('card-b')],
      discardPile: [instance('card-c')],
      drawHistory: [instance('card-a')],
      currentDraw: instance('card-a'),
      shuffleCount: 2,
    }
    const stored = otherWorldEncounterDeckStateForPayload(state)
    const restored = otherWorldEncounterDeckStateFromSession({
      otherWorldEncounters: stored,
    } as GameSession)

    expect(restored).toEqual(state)
  })

  it('discards the final displayed card when the phase completes', () => {
    const completed = discardCurrentOtherWorldEncounterCard({
      initialized: true,
      drawPile: [instance('card-b')],
      discardPile: [],
      drawHistory: [instance('card-a')],
      currentDraw: instance('card-a'),
      shuffleCount: 0,
    })

    expect(completed.currentDraw).toBeNull()
    expect(completed.discardPile).toEqual([instance('card-a')])
  })
})
