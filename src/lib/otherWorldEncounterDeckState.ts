import type { OtherWorldEncounterCard } from '@/payload-types'

export interface OtherWorldEncounterCardInstance {
  cardID: string
  instanceKey: string
}

export interface OtherWorldEncounterDeckState {
  currentDraw?: OtherWorldEncounterCardInstance | null
  discardPile?: OtherWorldEncounterCardInstance[]
  drawHistory?: OtherWorldEncounterCardInstance[]
  drawPile?: OtherWorldEncounterCardInstance[]
  initialized?: boolean
  shuffleCount?: number
}

export interface FlipOtherWorldEncounterResult {
  didShuffle: boolean
  drawnCardID: string | null
  drawnInstanceKey: string | null
  state: OtherWorldEncounterDeckState
}

function shuffle<T>(items: T[], random: () => number) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

export function createOtherWorldEncounterDeckInstances(
  cards: Pick<OtherWorldEncounterCard, 'copyCount' | 'id'>[],
): OtherWorldEncounterCardInstance[] {
  return cards.flatMap((card) => {
    const copyCount = Math.max(1, Math.floor(card.copyCount ?? 1))

    return Array.from({ length: copyCount }, (_, index) => ({
      cardID: String(card.id),
      instanceKey: `${String(card.id)}:${index + 1}`,
    }))
  })
}

export function freshOtherWorldEncounterDeckState(
  cards: Pick<OtherWorldEncounterCard, 'copyCount' | 'id'>[],
  random: () => number = Math.random,
): OtherWorldEncounterDeckState {
  return {
    initialized: true,
    drawPile: shuffle(createOtherWorldEncounterDeckInstances(cards), random),
    discardPile: [],
    drawHistory: [],
    currentDraw: null,
    shuffleCount: 0,
  }
}

export function flipNextOtherWorldEncounterCard(
  state: OtherWorldEncounterDeckState,
  shuffledDiscardPile?: OtherWorldEncounterCardInstance[],
): FlipOtherWorldEncounterResult {
  let drawPile = [...(state.drawPile ?? [])]
  let discardPile = [
    ...(state.discardPile ?? []),
    ...(state.currentDraw ? [state.currentDraw] : []),
  ]
  const drawHistory = [...(state.drawHistory ?? [])]
  let didShuffle = false

  if (drawPile.length === 0 && discardPile.length > 0) {
    drawPile = [...(shuffledDiscardPile ?? discardPile)]
    discardPile = []
    didShuffle = true
  }

  const [drawnCard, ...remainingDrawPile] = drawPile

  if (!drawnCard) {
    return {
      state: {
        ...state,
        initialized: true,
        drawPile: remainingDrawPile,
        discardPile,
        currentDraw: null,
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
      initialized: true,
      drawPile: remainingDrawPile,
      discardPile,
      drawHistory: [...drawHistory, drawnCard],
      currentDraw: drawnCard,
      shuffleCount: (state.shuffleCount ?? 0) + (didShuffle ? 1 : 0),
    },
    drawnCardID: drawnCard.cardID,
    drawnInstanceKey: drawnCard.instanceKey,
    didShuffle,
  }
}

export function discardCurrentOtherWorldEncounterCard(
  state: OtherWorldEncounterDeckState,
): OtherWorldEncounterDeckState {
  if (!state.currentDraw) return state

  return {
    ...state,
    discardPile: [...(state.discardPile ?? []), state.currentDraw],
    currentDraw: null,
  }
}
