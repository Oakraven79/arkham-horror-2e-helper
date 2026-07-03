import type { MythosCard } from '@/payload-types'

import {
  activateCurrentEnvironment,
  discardCurrentMythosCard,
  type MythosDeckState,
} from './mythosDeckState'

export function isHeadlineCardType(cardType: string | null | undefined) {
  return cardType === 'Headline'
}

export function isEligibleOpeningMythosCard(
  card: Pick<MythosCard, 'cardType' | 'gateInstruction'>,
) {
  return (
    card.cardType !== 'Rumor' &&
    card.gateInstruction.mode !== 'none' &&
    card.gateInstruction.mode !== 'surge' &&
    Boolean(card.gateInstruction.locations?.length)
  )
}

export function resolveOpeningMythosCard(
  state: MythosDeckState,
  cardType: MythosCard['cardType'],
) {
  return String(cardType).startsWith('Environment')
    ? activateCurrentEnvironment(state)
    : discardCurrentMythosCard(state)
}
