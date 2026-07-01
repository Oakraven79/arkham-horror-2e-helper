import { generatedLocations } from './locations.generated'
import type { LocationFixture } from './locationTypes'

const curatedPresentation: Record<
  string,
  Partial<Pick<LocationFixture, 'cardDisplayText' | 'encounterBackOrder' | 'image'>>
> = {
  'administration-building': { encounterBackOrder: 1 },
  'arkham-asylum': { encounterBackOrder: 3 },
  'bank-of-arkham': { encounterBackOrder: 1 },
  'general-store': { encounterBackOrder: 2 },
  graveyard: { encounterBackOrder: 1 },
  'hibbs-roadhouse': { encounterBackOrder: 1 },
  'historical-society': { encounterBackOrder: 1 },
  'independence-square': { encounterBackOrder: 2 },
  library: { encounterBackOrder: 2 },
  'mas-boarding-house': { encounterBackOrder: 2 },
  newspaper: { encounterBackOrder: 3 },
  'police-station': { encounterBackOrder: 2 },
  'river-docks': { encounterBackOrder: 2 },
  'science-building': { encounterBackOrder: 3 },
  'silver-twilight-lodge': { encounterBackOrder: 2 },
  'south-church': { encounterBackOrder: 3 },
  'st-marys-hospital': { encounterBackOrder: 1 },
  'the-unnamable': { encounterBackOrder: 3 },
  'the-witch-house': {
    cardDisplayText: 'The Witch  \nHouse',
    encounterBackOrder: 1,
    image: {
      alt: 'The Witch House',
      filename: 'old-house.jpg',
      fixtureKey: 'location-the-witch-house',
      publicPath: '/images/arkhamLocations/old-house.jpg',
    },
  },
  'train-station': { encounterBackOrder: 2 },
  'unvisited-isle': {
    encounterBackOrder: 1,
    image: {
      alt: 'Unvisited Isle',
      filename: 'isle.jpg',
      fixtureKey: 'location-unvisited-isle',
      publicPath: '/images/arkhamLocations/isle.jpg',
    },
  },
  'velmas-diner': { encounterBackOrder: 3 },
  woods: { encounterBackOrder: 2 },
  'ye-olde-magick-shoppe': { encounterBackOrder: 3 },
  'black-cave': {
    encounterBackOrder: 3,
    image: {
      alt: 'Black Cave',
      filename: 'cave.jpg',
      fixtureKey: 'location-black-cave',
      publicPath: '/images/arkhamLocations/cave.jpg',
    },
  },
  'curiositie-shoppe': { encounterBackOrder: 1 },
}

export const starterLocations: LocationFixture[] = generatedLocations.map((location) => ({
  ...location,
  ...curatedPresentation[location.key],
}))

export type StarterLocation = (typeof starterLocations)[number]

export function getStarterLocation(key: string) {
  return starterLocations.find((location) => location.key === key)
}
