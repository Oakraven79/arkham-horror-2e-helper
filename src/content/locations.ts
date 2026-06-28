export const starterLocations = [
  {
    key: 'the-witch-house',
    name: 'The Witch House',
    cardDisplayText: 'The Witch  \nHouse',
    image: {
      alt: 'The Witch House',
      filename: 'old-house.jpg',
      publicPath: '/images/arkhamLocations/old-house.jpg',
    },
    boxedSet: 'Base Game',
  },
  {
    key: 'unvisited-isle',
    name: 'Unvisited Isle',
    cardDisplayText: 'Unvisited Isle',
    image: {
      alt: 'Unvisited Isle',
      filename: 'isle.jpg',
      publicPath: '/images/arkhamLocations/isle.jpg',
    },
    boxedSet: 'Base Game',
  },
  {
    key: 'black-cave',
    name: 'Black Cave',
    cardDisplayText: 'Black Cave',
    image: {
      alt: 'Black Cave',
      filename: 'cave.jpg',
      publicPath: '/images/arkhamLocations/cave.jpg',
    },
    boxedSet: 'Base Game',
  },
] as const

export type StarterLocation = (typeof starterLocations)[number]

export function getStarterLocation(key: string) {
  return starterLocations.find((location) => location.key === key)
}
