export interface ArkhamEncounterDrawHistoryEntry {
  cardID: string
  drawKey: string
  drawnAt: string
  neighborhoodID: string
  turnNumber: number
}

export interface ArkhamEncounterState {
  currentCardID?: string | null
  currentDrawKey?: string | null
  drawHistory?: ArkhamEncounterDrawHistoryEntry[]
  selectedNeighborhoodID?: string | null
}

export function selectArkhamEncounterNeighborhood(
  state: ArkhamEncounterState,
  neighborhoodID: string,
): ArkhamEncounterState {
  return {
    ...state,
    selectedNeighborhoodID: neighborhoodID,
    currentCardID: null,
    currentDrawKey: null,
  }
}

export function clearArkhamEncounterSelection(state: ArkhamEncounterState): ArkhamEncounterState {
  return {
    ...state,
    selectedNeighborhoodID: null,
    currentCardID: null,
    currentDrawKey: null,
  }
}

export function drawArkhamEncounterCard(
  state: ArkhamEncounterState,
  cardIDs: string[],
  options: {
    drawKey: string
    drawnAt: string
    random?: () => number
    turnNumber: number
  },
): ArkhamEncounterState {
  if (!state.selectedNeighborhoodID || cardIDs.length === 0) return state

  const random = options.random ?? Math.random
  const cardID = cardIDs[Math.floor(random() * cardIDs.length)]

  if (!cardID) return state

  return {
    ...state,
    currentCardID: cardID,
    currentDrawKey: options.drawKey,
    drawHistory: [
      ...(state.drawHistory ?? []),
      {
        cardID,
        drawKey: options.drawKey,
        drawnAt: options.drawnAt,
        neighborhoodID: state.selectedNeighborhoodID,
        turnNumber: options.turnNumber,
      },
    ],
  }
}
