import { describe, expect, it } from 'vitest'

import {
  expansionTracksAvailableForPhase,
  nextGamePhase,
  previousGamePhase,
  transitionFor,
} from '@/lib/gamePhaseState'

describe('game phase state', () => {
  it('moves through the five table phases in order', () => {
    const openingMythos = nextGamePhase({ currentPhase: 'Setup', turnNumber: 1 })
    const upkeep = nextGamePhase(openingMythos)
    const movement = nextGamePhase(upkeep)
    const arkham = nextGamePhase(movement)
    const otherWorld = nextGamePhase(arkham)
    const mythos = nextGamePhase(otherWorld)

    expect([
      openingMythos.currentPhase,
      upkeep.currentPhase,
      movement.currentPhase,
      arkham.currentPhase,
      otherWorld.currentPhase,
      mythos.currentPhase,
    ]).toEqual([
      'Opening Mythos',
      'Upkeep',
      'Movement',
      'Arkham Encounters',
      'Other World Encounters',
      'Mythos',
    ])
  })

  it('starts a new turn after Mythos and can move back across the boundary', () => {
    const nextTurn = nextGamePhase({ currentPhase: 'Mythos', turnNumber: 3 })

    expect(nextTurn).toEqual({ currentPhase: 'Upkeep', turnNumber: 4 })
    expect(previousGamePhase(nextTurn)).toEqual({
      currentPhase: 'Mythos',
      turnNumber: 3,
    })
  })

  it('returns from first-turn Upkeep to Opening Mythos but never back into Setup', () => {
    expect(previousGamePhase({ currentPhase: 'Upkeep', turnNumber: 1 })).toEqual({
      currentPhase: 'Opening Mythos',
      turnNumber: 1,
    })
    expect(previousGamePhase({ currentPhase: 'Opening Mythos', turnNumber: 1 })).toEqual({
      currentPhase: 'Opening Mythos',
      turnNumber: 1,
    })
  })

  it('records a reversible transition without game action state', () => {
    expect(
      transitionFor(
        { currentPhase: 'Movement', turnNumber: 2 },
        { currentPhase: 'Arkham Encounters', turnNumber: 2 },
      ),
    ).toEqual({
      fromPhase: 'Movement',
      fromTurn: 2,
      toPhase: 'Arkham Encounters',
      toTurn: 2,
    })
  })

  it('keeps expansion tracks hidden until the opening Mythos is resolved', () => {
    expect(expansionTracksAvailableForPhase('Setup')).toBe(false)
    expect(expansionTracksAvailableForPhase('Opening Mythos')).toBe(false)
    expect(expansionTracksAvailableForPhase('Upkeep')).toBe(true)
    expect(expansionTracksAvailableForPhase('Mythos')).toBe(true)
  })
})
