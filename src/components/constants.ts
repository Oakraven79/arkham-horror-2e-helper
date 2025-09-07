export const monsterIcons = [
  'cross',
  'crescentMoon',
  'hexagon',
  'leftLean',
  'star',
  'triangle',
] as const

export type MonsterIcons = (typeof monsterIcons)[number]

const monsterIconMap: Record<MonsterIcons, string> = {
  cross: '/images/cross-icon.png',
  crescentMoon: '/images/crescent-moon-icon.png',
  hexagon: '/images/hexagon-icon.png',
  leftLean: '/images/left-lean-icon.png',
  star: '/images/star-icon.png',
  triangle: '/images/triangle-icon.png',
}

export function getMonsterIconPath(icon: MonsterIcons): string {
  return monsterIconMap[icon]
}

/* The following is a list of all locations  */

export const encounterLocations = [
  {
    location: 'The Witch House',
    file: '/images/old-house.jpg',
    display: `The Witch  
    House`,
  },
  {
    location: 'Unvisited Isle',
    file: '/images/isle.jpg',
    display: `Unvisited Isle`,
  },
  {
    location: 'Black Cave',
    file: '/images/cave.jpg',
    display: `Black Cave`,
  },
] as const

export const encounterLocationNames = encounterLocations.map((loc) => loc.location)

export type EncounterLocation = (typeof encounterLocationNames)[number]

// Build a look up so i can retrieve the details by name
export const encounterLocationMap: Record<
  EncounterLocation,
  Omit<(typeof encounterLocations)[number], 'location'>
> = encounterLocations.reduce((acc, loc) => {
  acc[loc.location] = { file: loc.file, display: loc.display }
  return acc
}, {} as any)
