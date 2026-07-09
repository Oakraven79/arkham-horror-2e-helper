import { describe, expect, it } from 'vitest'

import {
  calculateInvestigatorRules,
  calculateMonsterSurgeCount,
  gameLimitWarnings,
  hasTrackedAwakeningCondition,
} from '@/lib/investigatorRules'

describe('investigator-count rules', () => {
  it.each([
    [1, 4, 7, 8, 1],
    [2, 5, 6, 8, 1],
    [3, 6, 5, 7, 1],
    [4, 7, 4, 7, 1],
    [5, 8, 3, 6, 2],
    [6, 9, 2, 6, 2],
    [7, 10, 1, 5, 2],
    [8, 11, 0, 5, 2],
  ])(
    'derives core limits for %i investigators',
    (investigatorCount, monsterLimit, outskirtsCapacity, gateThreshold, gateMonsters) => {
      const rules = calculateInvestigatorRules({
        investigatorCount,
        expansionBoardCount: 0,
      })

      expect(rules).toMatchObject({
        effectiveInvestigatorCount: investigatorCount,
        monsterLimit,
        outskirtsCapacity,
        gateAwakeningThreshold: gateThreshold,
        newGateMonsterCount: gateMonsters,
        monsterSurgeMinimum: investigatorCount,
        finalBattleSuccessesPerDoom: investigatorCount,
        closeGateTrophiesRequired: investigatorCount,
      })
      expect(rules.terrorTenAwakeningMonsterCount).toBe(monsterLimit * 2)
    },
  )

  it('applies the multiple-city-board handicap only to its four derived limits', () => {
    const rules = calculateInvestigatorRules({
      investigatorCount: 6,
      expansionBoardCount: 3,
    })

    expect(rules).toMatchObject({
      actualInvestigatorCount: 6,
      effectiveInvestigatorCount: 4,
      expansionBoardAdjustment: 2,
      monsterLimit: 7,
      outskirtsCapacity: 4,
      gateAwakeningThreshold: 7,
      newGateMonsterCount: 1,
      monsterSurgeMinimum: 6,
      finalBattleSuccessesPerDoom: 6,
      closeGateTrophiesRequired: 6,
    })
  })

  it('uses actual investigators when calculating a monster surge', () => {
    expect(calculateMonsterSurgeCount(3, 6)).toBe(6)
    expect(calculateMonsterSurgeCount(7, 4)).toBe(7)
  })

  it('reports limits that need immediate table attention', () => {
    const rules = calculateInvestigatorRules({
      investigatorCount: 4,
      expansionBoardCount: 0,
    })

    expect(
      gameLimitWarnings(rules, {
        doomCurrent: 9,
        doomMax: 13,
        gatesOpen: 6,
        monstersInArkham: 7,
        monstersInOutskirts: 4,
        terror: 2,
      }).map((warning) => warning.text),
    ).toEqual([
      'One more open gate will awaken the Ancient One.',
      'The monster limit is full. Additional monsters are placed in the Outskirts.',
      'The Outskirts are full. The next monster placed there raises terror.',
    ])
  })

  it('separates Doom warnings from open-gate awakening warnings', () => {
    const rules = calculateInvestigatorRules({
      investigatorCount: 4,
      expansionBoardCount: 0,
    })

    expect(
      gameLimitWarnings(rules, {
        doomCurrent: 12,
        doomMax: 13,
        gatesOpen: 2,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        terror: 0,
      }).map((warning) => warning.text),
    ).toEqual(['One more doom token will awaken the Ancient One.'])

    expect(
      gameLimitWarnings(rules, {
        doomCurrent: 11,
        doomMax: 13,
        gatesOpen: 2,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        terror: 0,
      }).map((warning) => warning.text),
    ).toEqual([])
  })

  it('detects tracked awakening conditions for final battle setup', () => {
    const rules = calculateInvestigatorRules({
      investigatorCount: 4,
      expansionBoardCount: 0,
    })

    expect(
      hasTrackedAwakeningCondition(rules, {
        doomCurrent: 13,
        doomMax: 13,
        gatesOpen: 0,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        terror: 0,
      }),
    ).toBe(true)
    expect(
      hasTrackedAwakeningCondition(rules, {
        doomCurrent: 12,
        doomMax: 13,
        gatesOpen: 7,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        terror: 0,
      }),
    ).toBe(true)
    expect(
      hasTrackedAwakeningCondition(rules, {
        doomCurrent: 12,
        doomMax: 13,
        gatesOpen: 6,
        monstersInArkham: 0,
        monstersInOutskirts: 0,
        terror: 0,
      }),
    ).toBe(false)
  })
})
