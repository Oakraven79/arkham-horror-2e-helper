export const monsterIcons = [
  'cross',
  'crescentMoon',
  'hexagon',
  'leftLean',
  'star',
  'triangle',
  'circle',
  'square',
  'diamond',
] as const

export type MonsterIcons = (typeof monsterIcons)[number]

const monsterIconMap: Record<MonsterIcons, string> = {
  cross: '/images/icons/cross-icon.png',
  crescentMoon: '/images/icons/crescent-moon-icon.png',
  hexagon: '/images/icons/hexagon-icon.png',
  leftLean: '/images/icons/left-lean-icon.png',
  star: '/images/icons/star-icon.png',
  triangle: '/images/icons/triangle-icon.png',
  circle: '/images/icons/circle-icon.png',
  square: '/images/icons/square-icon.png',
  diamond: '/images/icons/diamond-icon.png',
}

export function getMonsterIconPath(icon: MonsterIcons): string {
  return monsterIconMap[icon]
}

export const mythosCardTypesList = [
  'Headline',
  'Environment',
  'Environment (Mystic)',
  'Environment (Urban)',
  'Environment (Weather)',
  'Rumor',
  'Special',
] as const

export type MythosCardType = (typeof mythosCardTypesList)[number]
