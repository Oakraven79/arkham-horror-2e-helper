import type { MythosCardFrontProps } from '@/components/mythosCardFront'

import { getStarterLocation } from './locations'
import { getStarterMythosCard } from './mythosCards'

export function mythosCardExampleProps(cardCode: string): MythosCardFrontProps {
  const card = getStarterMythosCard(cardCode)

  if (!card) {
    throw new Error(`Unknown starter Mythos card: ${cardCode}`)
  }

  const location = card.locationKey ? getStarterLocation(card.locationKey) : null

  return {
    title: card.title,
    cardType: card.cardType === 'Special' ? undefined : card.cardType,
    cardDescription: card.description,
    monsterMoveWhite: card.monsterMoveWhite,
    monsterMoveBlack: card.monsterMoveBlack,
    location: location
      ? {
          text: location.cardDisplayText,
          imageUrl: location.image?.publicPath,
          imageAlt: location.image?.alt ?? location.name,
        }
      : undefined,
    lowerLeftOverride: card.lowerLeftOverride
      ? {
          text: card.lowerLeftOverride.text,
          imageUrl: card.lowerLeftOverride.imagePublicPath,
          imageAlt: 'Mythos card instruction',
        }
      : undefined,
  }
}
