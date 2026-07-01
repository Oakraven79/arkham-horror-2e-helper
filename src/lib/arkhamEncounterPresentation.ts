import type { ArkhamEncounterCardFrontProps } from '@/components/arkhamEncounterCardFront'
import type { ArkhamEncounterDeckBackProps } from '@/components/arkhamEncounterDeckBack'
import type { ArkhamEncounterNeighborhoodDisplay } from '@/components/arkhamEncounterCardTypes'
import { boxedSetDisplay } from '@/lib/boxedSetPresentation'
import type { ArkhamEncounterCard, Location, Media, Neighborhood } from '@/payload-types'

function isMedia(value: unknown): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

function isNeighborhood(value: unknown): value is Neighborhood {
  return Boolean(value && typeof value === 'object' && 'name' in value && 'key' in value)
}

function isLocation(value: unknown): value is Location {
  return Boolean(value && typeof value === 'object' && 'name' in value && 'key' in value)
}

export function arkhamEncounterNeighborhoodDisplay(
  neighborhood: Neighborhood,
): ArkhamEncounterNeighborhoodDisplay {
  const frontFrame = isMedia(neighborhood.frontFrame) ? neighborhood.frontFrame : null
  const backFrame = isMedia(neighborhood.backFrame) ? neighborhood.backFrame : null

  return {
    name: neighborhood.name,
    colourName: neighborhood.colourName ?? undefined,
    colourHex: neighborhood.colourHex ?? undefined,
    frontFrameUrl: frontFrame?.url ?? undefined,
    backFrameUrl: backFrame?.url ?? undefined,
  }
}

export function arkhamEncounterCardFrontProps(
  card: ArkhamEncounterCard,
): ArkhamEncounterCardFrontProps {
  if (!isNeighborhood(card.neighborhood)) {
    throw new Error('Arkham encounter card preview requires a populated neighborhood.')
  }

  return {
    neighborhood: arkhamEncounterNeighborhoodDisplay(card.neighborhood),
    boxedSet: boxedSetDisplay(card.sourceSet),
    encounters: card.encounters.map((encounter) => ({
      header: isLocation(encounter.location) ? encounter.location.name : 'Unresolved location',
      text: encounter.text,
    })),
  }
}

export function arkhamEncounterDeckBackProps(
  neighborhood: Neighborhood,
  locations: Location[],
): ArkhamEncounterDeckBackProps {
  return {
    neighborhood: arkhamEncounterNeighborhoodDisplay(neighborhood),
    panels: locations
      .filter((location) => typeof location.encounterBackOrder === 'number')
      .sort(
        (left, right) =>
          (left.encounterBackOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.encounterBackOrder ?? Number.MAX_SAFE_INTEGER),
      )
      .map((location) => {
        const image = isMedia(location.cardImage) ? location.cardImage : null

        return {
          name: location.name,
          imageUrl: image?.url ?? undefined,
          imageAlt: image?.alt ?? location.name,
        }
      }),
  }
}
