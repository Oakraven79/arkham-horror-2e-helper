import type { GameSession } from '@/payload-types'

import type {
  OtherWorldEncounterCardInstance,
  OtherWorldEncounterDeckState,
} from './otherWorldEncounterDeckState'

type RelationshipValue = string | { id?: string | number } | null | undefined
type StoredDeckState = GameSession['otherWorldEncounters']

function relationshipID(value: RelationshipValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.id === undefined) return null
  return String(value.id)
}

function storedInstances(
  values:
    | {
        card: RelationshipValue
        instanceKey: string
      }[]
    | null
    | undefined,
): OtherWorldEncounterCardInstance[] {
  return (values ?? []).flatMap((value) => {
    const cardID = relationshipID(value.card)

    return cardID && value.instanceKey
      ? [
          {
            cardID,
            instanceKey: value.instanceKey,
          },
        ]
      : []
  })
}

function slotInstance(
  card: RelationshipValue,
  instanceKey: string | null | undefined,
): OtherWorldEncounterCardInstance | null {
  const cardID = relationshipID(card)

  if (!cardID) return null

  return {
    cardID,
    instanceKey: instanceKey || `${cardID}:1`,
  }
}

export function otherWorldEncounterDeckStateFromSession(
  session: GameSession,
): OtherWorldEncounterDeckState {
  const deck = session.otherWorldEncounters ?? {}

  return {
    initialized: deck.initialized ?? false,
    drawPile: storedInstances(deck.drawPileInstances),
    discardPile: storedInstances(deck.discardPileInstances),
    drawHistory: storedInstances(deck.drawHistoryInstances),
    currentDraw: slotInstance(deck.currentDraw, deck.currentDrawInstanceKey),
    shuffleCount: deck.shuffleCount ?? 0,
  }
}

function storedRows(instances: OtherWorldEncounterCardInstance[] | null | undefined) {
  return (instances ?? []).map((instance) => ({
    instanceKey: instance.instanceKey,
    card: instance.cardID,
  }))
}

export function otherWorldEncounterDeckStateForPayload(
  state: OtherWorldEncounterDeckState,
): StoredDeckState {
  return {
    initialized: state.initialized ?? false,
    drawPileInstances: storedRows(state.drawPile),
    discardPileInstances: storedRows(state.discardPile),
    drawHistoryInstances: storedRows(state.drawHistory),
    currentDraw: state.currentDraw?.cardID ?? null,
    currentDrawInstanceKey: state.currentDraw?.instanceKey ?? null,
    shuffleCount: state.shuffleCount ?? 0,
  }
}
