export type MythosCardID = string

export interface MythosDeckState {
  drawPile?: MythosCardID[]
  discardPile?: MythosCardID[]
  drawHistory?: MythosCardID[]
  currentDraw?: MythosCardID | null
  currentDrawRevealed?: boolean
  activeEnvironment?: MythosCardID | null
  activeRumor?: MythosCardID | null
  shuffleCount?: number
}

export interface DrawMythosResult {
  state: MythosDeckState
  drawnCardID: MythosCardID | null
  didShuffle: boolean
}

export function drawMythosCard(
  state: MythosDeckState,
  shuffledDiscardPile?: MythosCardID[],
): DrawMythosResult {
  const drawPile = [...(state.drawPile ?? [])]
  const discardPile = [...(state.discardPile ?? [])]
  const drawHistory = [...(state.drawHistory ?? [])]
  let nextDrawPile = drawPile
  let nextDiscardPile = discardPile
  let didShuffle = false

  if (nextDrawPile.length === 0 && nextDiscardPile.length > 0) {
    nextDrawPile = [...(shuffledDiscardPile ?? nextDiscardPile)]
    nextDiscardPile = []
    didShuffle = true
  }

  const [drawnCardID, ...remainingDrawPile] = nextDrawPile

  if (!drawnCardID) {
    return {
      state: {
        ...state,
        drawPile: remainingDrawPile,
        discardPile: nextDiscardPile,
        currentDraw: null,
        currentDrawRevealed: false,
        shuffleCount: state.shuffleCount ?? 0,
      },
      drawnCardID: null,
      didShuffle,
    }
  }

  return {
    state: {
      ...state,
      drawPile: remainingDrawPile,
      discardPile: nextDiscardPile,
      drawHistory: [...drawHistory, drawnCardID],
      currentDraw: drawnCardID,
      currentDrawRevealed: false,
      shuffleCount: (state.shuffleCount ?? 0) + (didShuffle ? 1 : 0),
    },
    drawnCardID,
    didShuffle,
  }
}

export function revealCurrentMythosCard(state: MythosDeckState): MythosDeckState {
  return {
    ...state,
    currentDrawRevealed: true,
  }
}

export function discardCurrentMythosCard(state: MythosDeckState): MythosDeckState {
  if (!state.currentDraw) return state

  return {
    ...state,
    discardPile: [...(state.discardPile ?? []), state.currentDraw],
    currentDraw: null,
    currentDrawRevealed: false,
  }
}

export function activateCurrentEnvironment(state: MythosDeckState): MythosDeckState {
  if (!state.currentDraw) return state

  return {
    ...state,
    discardPile: [
      ...(state.discardPile ?? []),
      ...(state.activeEnvironment ? [state.activeEnvironment] : []),
    ],
    activeEnvironment: state.currentDraw,
    currentDraw: null,
    currentDrawRevealed: false,
  }
}

export function activateCurrentRumor(state: MythosDeckState): MythosDeckState {
  if (!state.currentDraw) return state

  if (state.activeRumor) {
    return discardCurrentMythosCard(state)
  }

  return {
    ...state,
    activeRumor: state.currentDraw,
    currentDraw: null,
    currentDrawRevealed: false,
  }
}

export function clearActiveRumor(state: MythosDeckState): MythosDeckState {
  if (!state.activeRumor) return state

  return {
    ...state,
    discardPile: [...(state.discardPile ?? []), state.activeRumor],
    activeRumor: null,
  }
}
