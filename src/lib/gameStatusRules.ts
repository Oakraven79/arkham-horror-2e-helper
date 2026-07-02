export interface TerrorMilestone {
  effect: string
  level: 3 | 6 | 9 | 10
}

export interface TerrorLevelStatus {
  activeEffects: string[]
  level: number
  nextMilestone?: TerrorMilestone
}

export interface ElderSignVictoryStatus {
  current: number
  remaining: number
  won: boolean
}

export const ELDER_SIGN_VICTORY_THRESHOLD = 6

const terrorMilestones: TerrorMilestone[] = [
  {
    level: 3,
    effect: 'The General Store is closed.',
  },
  {
    level: 6,
    effect: 'The Curiositie Shoppe is closed.',
  },
  {
    level: 9,
    effect: 'Ye Olde Magick Shoppe is closed.',
  },
  {
    level: 10,
    effect: 'Arkham is overrun and the monster limit is removed.',
  },
]

export type ThresholdState = 'exceeded' | 'full' | 'near' | 'normal'

export function elderSignVictoryStatus(current: number): ElderSignVictoryStatus {
  if (!Number.isInteger(current) || current < 0) {
    throw new Error('Elder Signs must be a non-negative integer.')
  }

  return {
    current,
    remaining: Math.max(0, ELDER_SIGN_VICTORY_THRESHOLD - current),
    won: current >= ELDER_SIGN_VICTORY_THRESHOLD,
  }
}

export function terrorLevelStatus(level: number): TerrorLevelStatus {
  if (!Number.isInteger(level) || level < 0 || level > 10) {
    throw new Error('Terror level must be an integer between 0 and 10.')
  }

  const activeEffects = terrorMilestones
    .filter((milestone) => milestone.level <= level)
    .map((milestone) => milestone.effect)

  if (level >= 10) {
    activeEffects.push('Further Terror increases add one Doom instead.')
  }

  return {
    level,
    activeEffects,
    nextMilestone: terrorMilestones.find((milestone) => milestone.level > level),
  }
}

export function thresholdState(value: number, threshold: number): ThresholdState {
  if (value > threshold) return 'exceeded'
  if (value === threshold) return 'full'
  if (value === threshold - 1) return 'near'
  return 'normal'
}
