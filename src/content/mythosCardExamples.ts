import type { MythosCardFrontProps } from '@/components/mythosCardFront'

import { getOfficialBoxedSet } from './boxedSets'
import { getStarterLocation } from './locations'
import { getStarterMythosCard } from './mythosCards'

export function mythosCardExampleProps(cardCode: string): MythosCardFrontProps {
  const card = getStarterMythosCard(cardCode)

  if (!card) {
    throw new Error(`Unknown starter Mythos card: ${cardCode}`)
  }

  const location = card.locationKey ? getStarterLocation(card.locationKey) : null
  const boxedSet = getOfficialBoxedSet(card.sourceSetKey)
  const gateLocations = card.gateInstruction.locationKeys
    .map(getStarterLocation)
    .filter((gateLocation): gateLocation is NonNullable<ReturnType<typeof getStarterLocation>> =>
      Boolean(gateLocation),
    )

  return {
    title: card.title,
    cardType: card.cardType === 'Special' ? undefined : card.cardType,
    cardDescription: card.description,
    boxedSet: boxedSet
      ? {
          name: boxedSet.name,
          abbreviation: boxedSet.abbreviation,
        }
      : undefined,
    monsterMoveWhite: card.monsterMoveWhite,
    monsterMoveBlack: card.monsterMoveBlack,
    location: location
      ? {
          text: location.cardDisplayText,
          imageUrl: location.image?.publicPath,
          imageAlt: location.image?.alt ?? location.name,
        }
      : undefined,
    gateInstruction: {
      mode: card.gateInstruction.mode,
      burst: card.gateInstruction.burst,
      locations: gateLocations.map((gateLocation) => ({
        text: gateLocation.cardDisplayText,
        imageUrl: gateLocation.image?.publicPath,
        imageAlt: gateLocation.image?.alt ?? gateLocation.name,
      })),
      doomTokens: card.doomTokens,
      terrorIncrease: card.terrorIncrease,
      reshuffleDeck: card.reshuffleDeck,
      specialInstruction: card.specialInstruction,
    },
    lowerLeftOverride: card.lowerLeftOverride
      ? {
          text: card.lowerLeftOverride.text,
          imageUrl: card.lowerLeftOverride.imagePublicPath,
          imageAlt: 'Mythos card instruction',
        }
      : undefined,
  }
}
