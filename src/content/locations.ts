import { generatedLocations } from './locations.generated'
import type { LocationFixture } from './locationTypes'

const curatedPresentation: Record<
  string,
  Pick<LocationFixture, 'image'> & Partial<Pick<LocationFixture, 'cardDisplayText'>>
> = {
  'the-witch-house': {
    cardDisplayText: 'The Witch  \nHouse',
    image: {
      alt: 'The Witch House',
      filename: 'old-house.jpg',
      publicPath: '/images/arkhamLocations/old-house.jpg',
    },
  },
  'unvisited-isle': {
    image: {
      alt: 'Unvisited Isle',
      filename: 'isle.jpg',
      publicPath: '/images/arkhamLocations/isle.jpg',
    },
  },
  'black-cave': {
    image: {
      alt: 'Black Cave',
      filename: 'cave.jpg',
      publicPath: '/images/arkhamLocations/cave.jpg',
    },
  },
}

export const starterLocations: LocationFixture[] = generatedLocations.map((location) => ({
  ...location,
  ...curatedPresentation[location.key],
}))

export type StarterLocation = (typeof starterLocations)[number]

export function getStarterLocation(key: string) {
  return starterLocations.find((location) => location.key === key)
}
