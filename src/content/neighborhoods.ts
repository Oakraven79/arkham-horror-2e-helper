import type { OfficialBoxedSetKey } from './boxedSetTypes'
import type { LocationBoard } from './locationTypes'
import type { SeedMediaAsset } from '@/seed/media'

export interface NeighborhoodFixture {
  backFrame?: SeedMediaAsset
  board: Exclude<LocationBoard, 'Other'>
  colourHex?: string
  colourName?: string
  frontFrame?: SeedMediaAsset
  key: string
  name: string
  requiredSetKeys?: OfficialBoxedSetKey[]
  sourceSetKey: Extract<
    OfficialBoxedSetKey,
    'base-game' | 'dunwich-horror' | 'kingsport-horror' | 'innsmouth-horror'
  >
}

function frameAsset(
  key: string,
  colourName: string,
  side: 'back' | 'front',
  sourceFilename: string,
): SeedMediaAsset {
  const fixtureKey = `arkham-encounter-${key}-${side}`

  return {
    alt: `${colourName} Arkham encounter ${side} frame`,
    filename: sourceFilename,
    fixtureKey,
    matchFilename: sourceFilename,
    publicPath: `/fixture-assets/game-data/${sourceFilename}`,
  }
}

function arkhamNeighborhood(
  name: string,
  key: string,
  colourName: string,
  colourHex: string,
  assetColour: string,
): NeighborhoodFixture {
  return {
    name,
    key: `arkham-${key}`,
    board: 'Arkham',
    colourName,
    colourHex,
    sourceSetKey: 'base-game',
    frontFrame: frameAsset(
      `arkham-${key}`,
      colourName,
      'front',
      `arkham encounter ${assetColour} front.png`,
    ),
    backFrame: frameAsset(
      `arkham-${key}`,
      colourName,
      'back',
      `arkham encounter ${assetColour}.png`,
    ),
  }
}

export const starterNeighborhoods: NeighborhoodFixture[] = [
  arkhamNeighborhood('Downtown', 'downtown', 'Light Grey', '#a8a8a3', 'light grey'),
  arkhamNeighborhood('Easttown', 'easttown', 'Dark Grey', '#555751', 'grey'),
  arkhamNeighborhood('French Hill', 'french-hill', 'Blue', '#187fc1', 'blue'),
  arkhamNeighborhood('Merchant District', 'merchant-district', 'Green', '#2f8768', 'green'),
  arkhamNeighborhood(
    'Miskatonic University',
    'miskatonic-university',
    'Yellow',
    '#d9aa32',
    'yellow',
  ),
  arkhamNeighborhood('Northside', 'northside', 'Orange', '#c96d2d', 'orange'),
  arkhamNeighborhood('Rivertown', 'rivertown', 'Purple', '#76528e', 'purple'),
  arkhamNeighborhood('Southside', 'southside', 'Brown', '#79553c', 'brown'),
  arkhamNeighborhood('Uptown', 'uptown', 'Red', '#aa352c', 'red'),
  {
    name: 'Backwoods Country',
    key: 'dunwich-backwoods-country',
    board: 'Dunwich',
    sourceSetKey: 'dunwich-horror',
  },
  {
    name: 'Blasted Heath',
    key: 'dunwich-blasted-heath',
    board: 'Dunwich',
    sourceSetKey: 'dunwich-horror',
  },
  {
    name: 'Village Commons',
    key: 'dunwich-village-commons',
    board: 'Dunwich',
    sourceSetKey: 'dunwich-horror',
  },
  {
    name: 'Central Hill',
    key: 'kingsport-central-hill',
    board: 'Kingsport',
    sourceSetKey: 'kingsport-horror',
  },
  {
    name: 'Harborside',
    key: 'kingsport-harborside',
    board: 'Kingsport',
    sourceSetKey: 'kingsport-horror',
  },
  {
    name: 'Kingsport Head',
    key: 'kingsport-kingsport-head',
    board: 'Kingsport',
    sourceSetKey: 'kingsport-horror',
  },
  {
    name: 'South Shore',
    key: 'kingsport-south-shore',
    board: 'Kingsport',
    sourceSetKey: 'kingsport-horror',
  },
  {
    name: 'Church Green',
    key: 'innsmouth-church-green',
    board: 'Innsmouth',
    sourceSetKey: 'innsmouth-horror',
  },
  {
    name: 'Factory District',
    key: 'innsmouth-factory-district',
    board: 'Innsmouth',
    sourceSetKey: 'innsmouth-horror',
  },
  {
    name: 'Innsmouth Shore',
    key: 'innsmouth-innsmouth-shore',
    board: 'Innsmouth',
    sourceSetKey: 'innsmouth-horror',
  },
]

export const neighborhoodFrameAssets = starterNeighborhoods.flatMap((neighborhood) =>
  [neighborhood.frontFrame, neighborhood.backFrame].filter((asset): asset is SeedMediaAsset =>
    Boolean(asset),
  ),
)

export function neighborhoodKey(board: string, name: string) {
  const normalizedBoard = board.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const normalizedName = name
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${normalizedBoard}-${normalizedName}`
}
