import { encounterLocations } from './arkhamConstants'

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
  cross: '/images/icons/cross-icon.png',
  crescentMoon: '/images/icons/crescent-moon-icon.png',
  hexagon: '/images/icons/hexagon-icon.png',
  leftLean: '/images/icons/left-lean-icon.png',
  star: '/images/icons/star-icon.png',
  triangle: '/images/icons/triangle-icon.png',
}

export function getMonsterIconPath(icon: MonsterIcons): string {
  return monsterIconMap[icon]
}

/* The following is a list of all locations  */

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
