import type { GameSession } from '@/payload-types'

import type { MythosCardInstance, MythosDeckState } from './mythosDeckState'

type RelationshipValue = string | { id?: string | number } | null | undefined
type MythosSessionState = GameSession['mythos']

function relationshipID(value: RelationshipValue): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value.id === undefined) return null
  return String(value.id)
}

function legacyInstances(values: RelationshipValue[] | null | undefined): MythosCardInstance[] {
  const copyCounts = new Map<string, number>()

  return (values ?? []).flatMap((value) => {
    const cardID = relationshipID(value)

    if (!cardID) return []

    const copyNumber = (copyCounts.get(cardID) ?? 0) + 1
    copyCounts.set(cardID, copyNumber)

    return [
      {
        cardID,
        instanceKey: `${cardID}:${copyNumber}`,
      },
    ]
  })
}

function storedInstances(
  values:
    | {
        card: RelationshipValue
        instanceKey: string
      }[]
    | null
    | undefined,
): MythosCardInstance[] {
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
): MythosCardInstance | null {
  const cardID = relationshipID(card)

  if (!cardID) return null

  return {
    cardID,
    instanceKey: instanceKey || `${cardID}:1`,
  }
}

export function mythosDeckStateFromSession(session: GameSession): MythosDeckState {
  const mythos = session.mythos ?? {}

  return {
    drawPile: mythos.drawPileInstances
      ? storedInstances(mythos.drawPileInstances)
      : legacyInstances(mythos.drawPile),
    discardPile: mythos.discardPileInstances
      ? storedInstances(mythos.discardPileInstances)
      : legacyInstances(mythos.discardPile),
    drawHistory: mythos.drawHistoryInstances
      ? storedInstances(mythos.drawHistoryInstances)
      : legacyInstances(mythos.drawHistory),
    currentDraw: slotInstance(mythos.currentDraw, mythos.currentDrawInstanceKey),
    currentDrawRevealed: mythos.currentDrawRevealed ?? false,
    activeEnvironment: slotInstance(
      mythos.activeEnvironment,
      mythos.activeEnvironmentInstanceKey,
    ),
    activeRumor: slotInstance(mythos.activeRumor, mythos.activeRumorInstanceKey),
    shuffleCount: mythos.shuffleCount ?? 0,
  }
}

function storedRows(instances: MythosCardInstance[] | null | undefined) {
  return (instances ?? []).map((instance) => ({
    instanceKey: instance.instanceKey,
    card: instance.cardID,
  }))
}

export function mythosDeckStateForPayload(state: MythosDeckState): MythosSessionState {
  return {
    drawPile: (state.drawPile ?? []).map((instance) => instance.cardID),
    discardPile: (state.discardPile ?? []).map((instance) => instance.cardID),
    drawHistory: (state.drawHistory ?? []).map((instance) => instance.cardID),
    drawPileInstances: storedRows(state.drawPile),
    discardPileInstances: storedRows(state.discardPile),
    drawHistoryInstances: storedRows(state.drawHistory),
    currentDraw: state.currentDraw?.cardID ?? null,
    currentDrawInstanceKey: state.currentDraw?.instanceKey ?? null,
    currentDrawRevealed: state.currentDrawRevealed ?? false,
    activeEnvironment: state.activeEnvironment?.cardID ?? null,
    activeEnvironmentInstanceKey: state.activeEnvironment?.instanceKey ?? null,
    activeRumor: state.activeRumor?.cardID ?? null,
    activeRumorInstanceKey: state.activeRumor?.instanceKey ?? null,
    shuffleCount: state.shuffleCount ?? 0,
  }
}
