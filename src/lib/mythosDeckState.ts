export type MythosCardID = string

export interface MythosCardInstance {
  cardID: MythosCardID
  instanceKey: string
}

export interface MythosDeckState {
  drawPile?: MythosCardInstance[]
  discardPile?: MythosCardInstance[]
  drawHistory?: MythosCardInstance[]
  currentDraw?: MythosCardInstance | null
  currentDrawRevealed?: boolean
  activeEnvironment?: MythosCardInstance | null
  activeRumor?: MythosCardInstance | null
  shuffleCount?: number
}

export interface DrawMythosResult {
  state: MythosDeckState
  drawnCardID: MythosCardID | null
  drawnInstanceKey: string | null
  didShuffle: boolean
}

export function createMythosDeckInstances(
  cards: { copyCount?: number | null; id: string | number }[],
): MythosCardInstance[] {
  return cards.flatMap((card) => {
    const copyCount = Math.max(1, Math.floor(card.copyCount ?? 1))

    return Array.from({ length: copyCount }, (_, index) => ({
      cardID: String(card.id),
      instanceKey: `${String(card.id)}:${index + 1}`,
    }))
  })
}

export function drawMythosCard(
  state: MythosDeckState,
  shuffledDiscardPile?: MythosCardInstance[],
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

  const [drawnCard, ...remainingDrawPile] = nextDrawPile

  if (!drawnCard) {
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
      drawnInstanceKey: null,
      didShuffle,
    }
  }

  return {
    state: {
      ...state,
      drawPile: remainingDrawPile,
      discardPile: nextDiscardPile,
      drawHistory: [...drawHistory, drawnCard],
      currentDraw: drawnCard,
      currentDrawRevealed: false,
      shuffleCount: (state.shuffleCount ?? 0) + (didShuffle ? 1 : 0),
    },
    drawnCardID: drawnCard.cardID,
    drawnInstanceKey: drawnCard.instanceKey,
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
