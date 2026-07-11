export const turnPhases = [
  'Upkeep',
  'Movement',
  'Arkham Encounters',
  'Other World Encounters',
  'Mythos',
] as const

export const openingMythosPhase = 'Opening Mythos' as const

export const gamePhases = ['Setup', openingMythosPhase, ...turnPhases, 'Final Battle'] as const

export type GamePhase = (typeof gamePhases)[number]
export type TurnPhase = (typeof turnPhases)[number]

export interface GamePhasePointer {
  currentPhase: GamePhase
  turnNumber: number
}

export interface GamePhaseTransition {
  fromPhase: GamePhase
  fromTurn: number
  toPhase: GamePhase
  toTurn: number
}

export function nextGamePhase(state: GamePhasePointer): GamePhasePointer {
  if (state.currentPhase === 'Setup') {
    return {
      currentPhase: openingMythosPhase,
      turnNumber: Math.max(1, state.turnNumber),
    }
  }

  if (state.currentPhase === openingMythosPhase) {
    return {
      currentPhase: 'Upkeep',
      turnNumber: Math.max(1, state.turnNumber),
    }
  }

  if (state.currentPhase === 'Final Battle') {
    return state
  }

  const phaseIndex = turnPhases.indexOf(state.currentPhase)

  if (phaseIndex === turnPhases.length - 1) {
    return {
      currentPhase: 'Upkeep',
      turnNumber: state.turnNumber + 1,
    }
  }

  return {
    currentPhase: turnPhases[phaseIndex + 1],
    turnNumber: state.turnNumber,
  }
}

export function previousGamePhase(state: GamePhasePointer): GamePhasePointer {
  if (state.currentPhase === 'Setup') {
    return state
  }

  if (state.currentPhase === openingMythosPhase) {
    return state
  }

  if (state.currentPhase === 'Final Battle') {
    return {
      currentPhase: 'Mythos',
      turnNumber: state.turnNumber,
    }
  }

  const phaseIndex = turnPhases.indexOf(state.currentPhase)

  if (phaseIndex === 0) {
    if (state.turnNumber === 1) {
      return {
        currentPhase: openingMythosPhase,
        turnNumber: 1,
      }
    }

    return {
      currentPhase: 'Mythos',
      turnNumber: state.turnNumber - 1,
    }
  }

  return {
    currentPhase: turnPhases[phaseIndex - 1],
    turnNumber: state.turnNumber,
  }
}

export function expansionTracksAvailableForPhase(phase: GamePhase): boolean {
  return phase !== 'Setup' && phase !== openingMythosPhase
}

export function transitionFor(
  current: GamePhasePointer,
  next: GamePhasePointer,
): GamePhaseTransition {
  return {
    fromPhase: current.currentPhase,
    fromTurn: current.turnNumber,
    toPhase: next.currentPhase,
    toTurn: next.turnNumber,
  }
}
