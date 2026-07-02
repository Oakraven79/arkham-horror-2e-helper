import type { ArkhamEncounterState } from './arkhamEncounterState'
import { relationshipID } from './gameSessionContent'
import type { GameSession } from '@/payload-types'

export function arkhamEncounterStateFromSession(session: GameSession): ArkhamEncounterState {
  const state = session.arkhamEncounters

  return {
    selectedNeighborhoodID: relationshipID(state?.selectedNeighborhood),
    currentCardID: relationshipID(state?.currentDraw),
    currentDrawKey: state?.currentDrawKey ?? null,
    drawHistory: (state?.drawHistory ?? []).flatMap((entry) => {
      const cardID = relationshipID(entry.card)
      const neighborhoodID = relationshipID(entry.neighborhood)

      if (!cardID || !neighborhoodID) return []

      return [
        {
          cardID,
          neighborhoodID,
          drawKey: entry.drawKey,
          drawnAt: entry.drawnAt,
          turnNumber: entry.turnNumber,
        },
      ]
    }),
  }
}

export function arkhamEncounterStateForPayload(state: ArkhamEncounterState) {
  return {
    selectedNeighborhood: state.selectedNeighborhoodID ?? null,
    currentDraw: state.currentCardID ?? null,
    currentDrawKey: state.currentDrawKey ?? null,
    drawHistory: (state.drawHistory ?? []).map((entry) => ({
      card: entry.cardID,
      neighborhood: entry.neighborhoodID,
      drawKey: entry.drawKey,
      drawnAt: entry.drawnAt,
      turnNumber: entry.turnNumber,
    })),
  }
}
