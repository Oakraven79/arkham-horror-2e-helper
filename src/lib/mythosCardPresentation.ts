import { starterLocations } from '@/content/locations'
import type {
  MythosCardGateInstructionDisplay,
  MythosCardLocationDisplay,
  MythosCardLowerLeftOverride,
  MythosCardFrontProps,
} from '@/components/mythosCardFront'
import type { Location, Media, MythosCard } from '@/payload-types'
import { isBoxedSet, isMedia as isBoxedSetMedia } from '@/lib/boxedSetContent'

function isLocation(value: MythosCard['location']): value is Location {
  return Boolean(value && typeof value === 'object' && 'cardDisplayText' in value)
}

function isMedia(value: Location['cardImage'] | Media | string | null | undefined): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

function populatedLocationDisplay(location: Location): MythosCardLocationDisplay {
  const image = isMedia(location.cardImage) ? location.cardImage : null

  return {
    text: location.cardDisplayText,
    imageUrl: image?.url ?? undefined,
    imageAlt: image?.alt ?? location.name,
  }
}

function legacyLocationDisplay(card: MythosCard): MythosCardLocationDisplay | undefined {
  if (card.encounterLocation === 'none') return undefined

  const fixture = starterLocations.find((location) => location.name === card.encounterLocation)

  if (!fixture) return undefined

  return {
    text: fixture.cardDisplayText,
    imageUrl: fixture.image?.publicPath,
    imageAlt: fixture.image?.alt ?? fixture.name,
  }
}

function lowerLeftOverride(card: MythosCard): MythosCardLowerLeftOverride | undefined {
  const image = isMedia(card.lowerLeftOverride?.image) ? card.lowerLeftOverride.image : null
  const text = card.lowerLeftOverride?.text ?? card.altLocationText ?? undefined
  const imageUrl = image?.url ?? card.altLocationImg ?? undefined

  if (!text && !imageUrl) return undefined

  return {
    text,
    imageUrl,
    imageAlt: image?.alt ?? 'Mythos card instruction',
  }
}

function gateInstruction(
  card: MythosCard,
  legacyLocation: MythosCardLocationDisplay | undefined,
): MythosCardGateInstructionDisplay | undefined {
  const locations = (card.gateInstruction?.locations ?? [])
    .filter(isLocation)
    .map(populatedLocationDisplay)
  const mode = card.gateInstruction?.mode

  if (
    !mode &&
    !card.doomTokens &&
    !card.terrorIncrease &&
    !card.reshuffleDeck &&
    !card.specialInstruction
  ) {
    return undefined
  }

  return {
    mode: mode ?? (legacyLocation ? 'single' : 'none'),
    locations: locations.length > 0 ? locations : legacyLocation ? [legacyLocation] : [],
    burst: card.gateInstruction?.burst ?? false,
    doomTokens: card.doomTokens ?? undefined,
    terrorIncrease: card.terrorIncrease ?? undefined,
    reshuffleDeck: card.reshuffleDeck ?? undefined,
    specialInstruction: card.specialInstruction ?? undefined,
  }
}

export function mythosCardFrontProps(card: MythosCard): MythosCardFrontProps {
  const location = isLocation(card.location)
    ? populatedLocationDisplay(card.location)
    : legacyLocationDisplay(card)

  return {
    title: card.title,
    cardType: card.cardType === 'Special' ? undefined : card.cardType,
    cardDescription: card.desc ?? '',
    boxedSet: isBoxedSet(card.sourceSet)
      ? {
          name: card.sourceSet.name,
          abbreviation: card.sourceSet.abbreviation,
          iconUrl: isBoxedSetMedia(card.sourceSet.icon)
            ? (card.sourceSet.icon.url ?? undefined)
            : undefined,
          iconAlt: isBoxedSetMedia(card.sourceSet.icon)
            ? (card.sourceSet.icon.alt ?? undefined)
            : undefined,
        }
      : undefined,
    monsterMoveWhite: card.monsterMoveWhite ?? undefined,
    monsterMoveBlack: card.monsterMoveBlack ?? undefined,
    location,
    gateInstruction: gateInstruction(card, location),
    lowerLeftOverride: lowerLeftOverride(card),
  }
}
