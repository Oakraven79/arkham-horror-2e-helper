import { officialBoxedSets } from '@/content/boxedSets'
import { starterLocations } from '@/content/locations'
import { starterMythosCards } from '@/content/mythosCards'
import { starterOtherWorldEncounterCards } from '@/content/otherWorldEncounterCards'
import { starterOtherWorlds } from '@/content/otherWorlds'
import type { SeedMediaAsset } from '@/seed/media'

import { generatedGameDataMedia } from './gameDataMedia.generated'

export const GAME_DATA_FIXTURE_NAMESPACE = 'arkham-horror-2e'
export const GAME_DATA_FIXTURE_VERSION = 1

export const gameDataFixtureMedia: SeedMediaAsset[] = generatedGameDataMedia.assets.map(
  (asset) => ({ ...asset }),
)

export const doomCounterAsset = gameDataFixtureMedia.find(
  (asset) => asset.fixtureKey === 'mythos-doom-counters',
) as SeedMediaAsset

export const gameDataFixture = {
  namespace: GAME_DATA_FIXTURE_NAMESPACE,
  version: GAME_DATA_FIXTURE_VERSION,
  media: gameDataFixtureMedia,
  boxedSets: officialBoxedSets,
  locations: starterLocations,
  mythosCards: starterMythosCards,
  otherWorlds: starterOtherWorlds,
  otherWorldEncounterCards: starterOtherWorldEncounterCards,
  mediaRelationships: generatedGameDataMedia.relationships,
}
