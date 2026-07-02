import { officialBoxedSets } from '@/content/boxedSets'
import { starterArkhamEncounterCards } from '@/content/arkhamEncounterCards'
import { starterLocations } from '@/content/locations'
import { starterMythosCards } from '@/content/mythosCards'
import { neighborhoodFrameAssets, starterNeighborhoods } from '@/content/neighborhoods'
import { starterOtherWorldEncounterCards } from '@/content/otherWorldEncounterCards'
import { starterOtherWorlds } from '@/content/otherWorlds'
import type { SeedMediaAsset } from '@/seed/media'

import { generatedGameDataMedia } from './gameDataMedia.generated'
import { generatedGameDataSnapshot } from './gameDataSnapshot.generated'

export const GAME_DATA_FIXTURE_NAMESPACE = 'arkham-horror-2e'
export const GAME_DATA_FIXTURE_VERSION = 5

const generatedMediaKeys = new Set<string>(
  generatedGameDataMedia.assets.map((asset) => asset.fixtureKey),
)

export const gameDataFixtureMedia: SeedMediaAsset[] = [
  ...generatedGameDataMedia.assets.map((asset) => ({ ...asset })),
  ...neighborhoodFrameAssets.filter((asset) => !generatedMediaKeys.has(asset.fixtureKey)),
]

export const doomCounterAsset = gameDataFixtureMedia.find(
  (asset) => asset.fixtureKey === 'mythos-doom-counters',
) as SeedMediaAsset

export const gameDataFixture = {
  namespace: GAME_DATA_FIXTURE_NAMESPACE,
  version: GAME_DATA_FIXTURE_VERSION,
  media: gameDataFixtureMedia,
  boxedSets: officialBoxedSets,
  neighborhoods: starterNeighborhoods,
  locations: starterLocations,
  arkhamEncounterCards: starterArkhamEncounterCards,
  mythosCards: starterMythosCards,
  otherWorlds: starterOtherWorlds,
  otherWorldEncounterCards: starterOtherWorldEncounterCards,
  mediaRelationships: generatedGameDataMedia.relationships,
  snapshot: generatedGameDataSnapshot,
}
