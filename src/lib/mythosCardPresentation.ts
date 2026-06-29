import type {
  MythosCardGateInstructionDisplay,
  MythosCardLocationDisplay,
  MythosCardLowerLeftOverride,
  MythosCardFrontProps,
} from '@/components/mythosCardFront'
import type { Location, Media, MythosCard } from '@/payload-types'
import { isBoxedSet, isMedia as isBoxedSetMedia } from '@/lib/boxedSetContent'

function isLocation(value: unknown): value is Location {
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

function lowerLeftOverride(card: MythosCard): MythosCardLowerLeftOverride | undefined {
  const image = isMedia(card.lowerLeftOverride?.image) ? card.lowerLeftOverride.image : null
  const text = card.lowerLeftOverride?.text ?? undefined
  const imageUrl = image?.url ?? undefined

  if (!text && !imageUrl) return undefined

  return {
    text,
    imageUrl,
    imageAlt: image?.alt ?? 'Mythos card instruction',
  }
}

function gateInstruction(card: MythosCard): MythosCardGateInstructionDisplay | undefined {
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
    mode: mode ?? 'none',
    locations,
    burst: card.gateInstruction?.burst ?? false,
    doomTokens: card.doomTokens ?? undefined,
    terrorIncrease: card.terrorIncrease ?? undefined,
    reshuffleDeck: card.reshuffleDeck ?? undefined,
    specialInstruction: card.specialInstruction ?? undefined,
  }
}

export function mythosCardFrontProps(card: MythosCard): MythosCardFrontProps {
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
    gateInstruction: gateInstruction(card),
    lowerLeftOverride: lowerLeftOverride(card),
  }
}
