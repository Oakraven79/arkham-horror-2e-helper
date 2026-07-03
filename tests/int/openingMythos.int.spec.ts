import { describe, expect, it } from 'vitest'

import {
  isEligibleOpeningMythosCard,
  isHeadlineCardType,
  resolveOpeningMythosCard,
} from '@/lib/openingMythos'

describe('opening Mythos', () => {
  it('still classifies Headlines for ordinary Mythos presentation', () => {
    expect(isHeadlineCardType('Headline')).toBe(true)
    expect(isHeadlineCardType('Rumor')).toBe(false)
    expect(isHeadlineCardType('Environment (Weather)')).toBe(false)
    expect(isHeadlineCardType('Environment (Mystic)')).toBe(false)
  })

  it('accepts a non-Rumor card that depicts a gate during setup', () => {
    expect(
      isEligibleOpeningMythosCard({
        cardType: 'Environment (Weather)',
        gateInstruction: {
          mode: 'single',
          locations: ['woods'],
        },
      }),
    ).toBe(true)
  })

  it('redraws a Rumor even when it depicts a gate', () => {
    expect(
      isEligibleOpeningMythosCard({
        cardType: 'Rumor',
        gateInstruction: {
          mode: 'single',
          locations: ['woods'],
        },
      }),
    ).toBe(false)
  })

  it('redraws a card that does not depict a gate', () => {
    expect(
      isEligibleOpeningMythosCard({
        cardType: 'Headline',
        gateInstruction: {
          mode: 'none',
          locations: [],
        },
      }),
    ).toBe(false)
  })

  it('leaves an eligible opening Environment in play after full resolution', () => {
    const resolved = resolveOpeningMythosCard(
      {
        drawPile: [],
        discardPile: [],
        drawHistory: [],
        currentDraw: {
          cardID: 'environment',
          instanceKey: 'environment:1',
        },
        currentDrawRevealed: true,
        activeEnvironment: null,
        activeRumor: null,
        shuffleCount: 0,
      },
      'Environment (Weather)',
    )

    expect(resolved.currentDraw).toBeNull()
    expect(resolved.activeEnvironment).toEqual({
      cardID: 'environment',
      instanceKey: 'environment:1',
    })
    expect(resolved.discardPile).toEqual([])
  })

  it('discards a completed opening Headline', () => {
    const resolved = resolveOpeningMythosCard(
      {
        drawPile: [],
        discardPile: [],
        drawHistory: [],
        currentDraw: {
          cardID: 'headline',
          instanceKey: 'headline:1',
        },
        currentDrawRevealed: true,
        activeEnvironment: null,
        activeRumor: null,
        shuffleCount: 0,
      },
      'Headline',
    )

    expect(resolved.currentDraw).toBeNull()
    expect(resolved.discardPile).toEqual([
      {
        cardID: 'headline',
        instanceKey: 'headline:1',
      },
    ])
  })
})
