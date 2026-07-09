export interface InvestigatorRulesInput {
  expansionBoardCount: number
  investigatorCount: number
}

export interface InvestigatorRules {
  actualInvestigatorCount: number
  closeGateTrophiesRequired: number
  effectiveInvestigatorCount: number
  expansionBoardAdjustment: number
  finalBattleSuccessesPerDoom: number
  gateAwakeningThreshold: number
  monsterLimit: number
  monsterSurgeMinimum: number
  newGateMonsterCount: number
  outskirtsCapacity: number
  relationshipCardCount: number
  terrorTenAwakeningMonsterCount: number
}

export interface GameLimitState {
  doomCurrent: number
  doomMax: number
  gatesOpen: number
  monstersInArkham: number
  monstersInOutskirts: number
  terror: number
}

export interface GameLimitWarning {
  level: 'critical' | 'warning'
  text: string
}

function requireCount(value: number, label: string, min: number, max?: number) {
  if (!Number.isInteger(value) || value < min || (max !== undefined && value > max)) {
    throw new Error(
      `${label} must be an integer between ${min} and ${max ?? 'the supported maximum'}.`,
    )
  }
}

function gateThreshold(investigatorCount: number) {
  if (investigatorCount <= 2) return 8
  if (investigatorCount <= 4) return 7
  if (investigatorCount <= 6) return 6
  return 5
}

export function calculateInvestigatorRules(input: InvestigatorRulesInput): InvestigatorRules {
  requireCount(input.investigatorCount, 'Investigator count', 1, 8)
  requireCount(input.expansionBoardCount, 'Expansion board count', 0)

  const expansionBoardAdjustment = Math.max(0, input.expansionBoardCount - 1)
  const effectiveInvestigatorCount = Math.max(1, input.investigatorCount - expansionBoardAdjustment)
  const monsterLimit = effectiveInvestigatorCount + 3

  return {
    actualInvestigatorCount: input.investigatorCount,
    closeGateTrophiesRequired: input.investigatorCount,
    effectiveInvestigatorCount,
    expansionBoardAdjustment,
    finalBattleSuccessesPerDoom: input.investigatorCount,
    gateAwakeningThreshold: gateThreshold(effectiveInvestigatorCount),
    monsterLimit,
    monsterSurgeMinimum: input.investigatorCount,
    newGateMonsterCount: effectiveInvestigatorCount >= 5 ? 2 : 1,
    outskirtsCapacity: 8 - effectiveInvestigatorCount,
    relationshipCardCount:
      input.investigatorCount === 1
        ? 0
        : input.investigatorCount === 2
          ? 1
          : input.investigatorCount,
    terrorTenAwakeningMonsterCount: monsterLimit * 2,
  }
}

export function calculateMonsterSurgeCount(openGateCount: number, investigatorCount: number) {
  requireCount(openGateCount, 'Open gate count', 0)
  requireCount(investigatorCount, 'Investigator count', 1, 8)

  return Math.max(openGateCount, investigatorCount)
}

export function gameLimitWarnings(
  rules: InvestigatorRules,
  state: GameLimitState,
): GameLimitWarning[] {
  const warnings: GameLimitWarning[] = []

  if (state.doomCurrent >= state.doomMax) {
    warnings.push({
      level: 'critical',
      text: 'The doom track is full. The Ancient One awakens.',
    })
  } else if (state.doomCurrent === state.doomMax - 1) {
    warnings.push({
      level: 'warning',
      text: 'One more doom token will awaken the Ancient One.',
    })
  }

  if (state.gatesOpen >= rules.gateAwakeningThreshold) {
    warnings.push({
      level: 'critical',
      text: 'The open-gate threshold has been reached. The Ancient One awakens.',
    })
  } else if (state.gatesOpen === rules.gateAwakeningThreshold - 1) {
    warnings.push({
      level: 'warning',
      text: 'One more open gate will awaken the Ancient One.',
    })
  }

  if (state.terror >= 10) {
    if (state.monstersInArkham >= rules.terrorTenAwakeningMonsterCount) {
      warnings.push({
        level: 'critical',
        text: 'The terror-10 monster threshold has been reached. The Ancient One awakens.',
      })
    } else if (state.monstersInArkham === rules.terrorTenAwakeningMonsterCount - 1) {
      warnings.push({
        level: 'warning',
        text: 'One more monster in Arkham will awaken the Ancient One.',
      })
    }
  } else if (state.monstersInArkham >= rules.monsterLimit) {
    warnings.push({
      level: 'warning',
      text: 'The monster limit is full. Additional monsters are placed in the Outskirts.',
    })
  }

  if (state.monstersInOutskirts >= rules.outskirtsCapacity) {
    warnings.push({
      level: 'warning',
      text:
        rules.outskirtsCapacity === 0
          ? 'The Outskirts capacity is zero. The next monster placed there raises terror.'
          : 'The Outskirts are full. The next monster placed there raises terror.',
    })
  }

  return warnings
}

export function hasTrackedAwakeningCondition(rules: InvestigatorRules, state: GameLimitState) {
  return (
    state.doomCurrent >= state.doomMax ||
    state.gatesOpen >= rules.gateAwakeningThreshold ||
    (state.terror >= 10 && state.monstersInArkham >= rules.terrorTenAwakeningMonsterCount)
  )
}
