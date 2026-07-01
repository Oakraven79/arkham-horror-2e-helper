import type { ArkhamEncounterCardFrontProps } from '@/components/arkhamEncounterCardFront'
import type { ArkhamEncounterDeckProps } from '@/components/arkhamEncounterDeck'
import type { ArkhamEncounterDeckBackProps } from '@/components/arkhamEncounterDeckBack'
import { generatedGameDataMedia } from '@/fixtures/gameDataMedia.generated'

import { starterArkhamEncounterCards } from './arkhamEncounterCards'
import { starterLocations } from './locations'
import { starterNeighborhoods } from './neighborhoods'

const baseGameBoxedSet = {
  name: 'Base Game',
  abbreviation: 'AH',
}

const mediaByKey = new Map<string, (typeof generatedGameDataMedia.assets)[number]>(
  generatedGameDataMedia.assets.map((asset) => [asset.fixtureKey, asset]),
)

function neighborhoodExample(neighborhoodKey: string) {
  const fixture = starterNeighborhoods.find((neighborhood) => neighborhood.key === neighborhoodKey)

  if (!fixture) throw new Error(`Unknown neighborhood fixture: ${neighborhoodKey}`)

  return {
    name: fixture.name,
    colourName: fixture.colourName,
    colourHex: fixture.colourHex,
    frontFrameUrl: fixture.frontFrame?.publicPath,
    backFrameUrl: fixture.backFrame?.publicPath,
  }
}

export function arkhamEncounterDeckBackExampleProps(
  neighborhoodKey: string,
): ArkhamEncounterDeckBackProps {
  const neighborhood = starterNeighborhoods.find((candidate) => candidate.key === neighborhoodKey)

  if (!neighborhood) throw new Error(`Unknown neighborhood fixture: ${neighborhoodKey}`)

  const panels = starterLocations
    .filter(
      (location) =>
        location.board === neighborhood.board &&
        location.neighborhood === neighborhood.name &&
        typeof location.encounterBackOrder === 'number',
    )
    .sort(
      (left, right) =>
        (left.encounterBackOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.encounterBackOrder ?? Number.MAX_SAFE_INTEGER),
    )
    .map((location) => {
      const assetKey = (
        generatedGameDataMedia.relationships.locationImages as Record<string, string>
      )[location.key]
      const asset = assetKey ? mediaByKey.get(assetKey) : null

      return {
        name: location.name,
        imageUrl: asset?.publicPath,
        imageAlt: asset?.alt ?? location.name,
      }
    })

  return {
    neighborhood: neighborhoodExample(neighborhoodKey),
    panels,
  }
}

export function arkhamEncounterCardExampleProps(cardCode: string): ArkhamEncounterCardFrontProps {
  const card = starterArkhamEncounterCards.find((candidate) => candidate.cardCode === cardCode)

  if (!card) throw new Error(`Unknown Arkham encounter card fixture: ${cardCode}`)

  return {
    boxedSet: baseGameBoxedSet,
    neighborhood: neighborhoodExample(card.neighborhoodKey),
    encounters: card.encounters.map((encounter) => ({
      header:
        starterLocations.find((location) => location.key === encounter.locationKey)?.name ??
        encounter.locationKey,
      text: encounter.text,
    })),
  }
}

export function arkhamEncounterDeckExampleProps(
  cardCode: string,
): Omit<ArkhamEncounterDeckProps, 'onFlip'> {
  const front = arkhamEncounterCardExampleProps(cardCode)
  const card = starterArkhamEncounterCards.find((candidate) => candidate.cardCode === cardCode)

  if (!card) throw new Error(`Unknown Arkham encounter card fixture: ${cardCode}`)

  return {
    ...front,
    panels: arkhamEncounterDeckBackExampleProps(card.neighborhoodKey).panels,
  }
}
