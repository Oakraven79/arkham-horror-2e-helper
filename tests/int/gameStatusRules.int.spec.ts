import { describe, expect, it } from 'vitest'

import {
  ELDER_SIGN_VICTORY_THRESHOLD,
  elderSignVictoryStatus,
  terrorLevelStatus,
  thresholdState,
} from '@/lib/gameStatusRules'

describe('visible game status rules', () => {
  it('shows the next Terror milestone before any effects are active', () => {
    expect(terrorLevelStatus(0)).toEqual({
      level: 0,
      activeEffects: [],
      nextMilestone: {
        level: 3,
        effect: 'The General Store is closed.',
      },
    })
  })

  it('accumulates location closures as Terror rises', () => {
    const status = terrorLevelStatus(6)

    expect(status.activeEffects).toEqual([
      'The General Store is closed.',
      'The Curiositie Shoppe is closed.',
    ])
    expect(status.nextMilestone).toEqual({
      level: 9,
      effect: 'Ye Olde Magick Shoppe is closed.',
    })
  })

  it('removes the monster limit and redirects further increases at Terror 10', () => {
    const status = terrorLevelStatus(10)

    expect(status.activeEffects).toEqual([
      'The General Store is closed.',
      'The Curiositie Shoppe is closed.',
      'Ye Olde Magick Shoppe is closed.',
      'Arkham is overrun and the monster limit is removed.',
      'Further Terror increases add one Doom instead.',
    ])
    expect(status.nextMilestone).toBeUndefined()
  })

  it('rejects impossible Terror values', () => {
    expect(() => terrorLevelStatus(-1)).toThrow('Terror level must be an integer between 0 and 10.')
    expect(() => terrorLevelStatus(11)).toThrow('Terror level must be an integer between 0 and 10.')
  })

  it('describes proximity to a soft threshold', () => {
    expect(thresholdState(2, 4)).toBe('normal')
    expect(thresholdState(3, 4)).toBe('near')
    expect(thresholdState(4, 4)).toBe('full')
    expect(thresholdState(5, 4)).toBe('exceeded')
  })

  it('declares a sealing victory at six Elder Signs', () => {
    expect(ELDER_SIGN_VICTORY_THRESHOLD).toBe(6)
    expect(elderSignVictoryStatus(5)).toEqual({
      current: 5,
      remaining: 1,
      won: false,
    })
    expect(elderSignVictoryStatus(6)).toEqual({
      current: 6,
      remaining: 0,
      won: true,
    })
  })

  it('rejects impossible Elder Sign values', () => {
    expect(() => elderSignVictoryStatus(-1)).toThrow('Elder Signs must be a non-negative integer.')
    expect(() => elderSignVictoryStatus(1.5)).toThrow('Elder Signs must be a non-negative integer.')
  })
})
