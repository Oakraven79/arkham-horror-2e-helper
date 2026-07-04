import type { Where } from 'payload'

import type { BoxedSet, GameSession, MythosCard } from '@/payload-types'

import { createMythosDeckInstances, type MythosDeckState } from './mythosDeckState'

export const BASE_GAME_SET_KEY = 'base-game'

type RelationshipValue = string | number | { id?: string | number } | null | undefined
type RequiredSetDocument = {
  requiredSets?: RelationshipValue[] | null
  sourceSet?: RelationshipValue
}

export function relationshipID(value: RelationshipValue) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (value.id === undefined) return null
  return String(value.id)
}

export function relationshipIDs(values: RelationshipValue[] | null | undefined) {
  return (values ?? []).map(relationshipID).filter((id): id is string => Boolean(id))
}

export function sourceSetWhere(enabledSetIDs: string[]): Where {
  return {
    sourceSet: {
      in: enabledSetIDs,
    },
  }
}

export function requiredSetIDs(document: RequiredSetDocument) {
  const explicitRequiredSetIDs = relationshipIDs(document.requiredSets)

  if (explicitRequiredSetIDs.length > 0) {
    return [...new Set(explicitRequiredSetIDs)]
  }

  const sourceSetID = relationshipID(document.sourceSet)
  return sourceSetID ? [sourceSetID] : []
}

export function contentIsEligibleForEnabledSets(
  document: RequiredSetDocument,
  enabledSetIDs: string[],
) {
  const enabled = new Set(enabledSetIDs)
  const required = requiredSetIDs(document)

  return required.length > 0 && required.every((setID) => enabled.has(setID))
}

export function eligibleDocuments<T extends RequiredSetDocument>(
  documents: T[],
  enabledSetIDs: string[],
) {
  return documents.filter((document) => contentIsEligibleForEnabledSets(document, enabledSetIDs))
}

export function normalizeEnabledSetSelection(
  requestedIDs: string[],
  availableSets: Pick<BoxedSet, 'id' | 'key'>[],
) {
  const availableByID = new Map(availableSets.map((boxedSet) => [String(boxedSet.id), boxedSet]))
  const baseSet = availableSets.find((boxedSet) => boxedSet.key === BASE_GAME_SET_KEY)

  if (!baseSet) {
    throw new Error('The Base Game boxed set must be seeded before configuring a session.')
  }

  const requested = new Set(requestedIDs.filter(Boolean))
  requested.add(String(baseSet.id))

  const unknownIDs = [...requested].filter((id) => !availableByID.has(id))

  if (unknownIDs.length > 0) {
    throw new Error('One or more selected boxed sets are not available.')
  }

  return availableSets
    .filter((boxedSet) => requested.has(String(boxedSet.id)))
    .map((boxedSet) => String(boxedSet.id))
}

export function assertSetsCanChange(session: Pick<GameSession, 'currentPhase'>) {
  if (session.currentPhase !== 'Setup') {
    throw new Error('Sets in play are locked after setup.')
  }
}

function shuffle<T>(items: T[], random: () => number) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

export function freshMythosDeckState(
  cards: Pick<MythosCard, 'copyCount' | 'id'>[],
  random: () => number = Math.random,
): MythosDeckState {
  return {
    drawPile: shuffle(createMythosDeckInstances(cards), random),
    discardPile: [],
    drawHistory: [],
    currentDraw: null,
    currentDrawRevealed: false,
    activeEnvironment: null,
    activeRumor: null,
    shuffleCount: 0,
  }
}

export function sameSetSelection(left: string[], right: string[]) {
  if (left.length !== right.length) return false

  const rightIDs = new Set(right)
  return left.every((id) => rightIDs.has(id))
}
