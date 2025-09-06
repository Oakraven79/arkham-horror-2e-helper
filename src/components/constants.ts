export const monsterIcons = [
  'cross',
  'crescentMoon',
  'hexagon',
  'leftLean',
  'star',
  'triangle',
] as const

export type MonsterIcons = (typeof monsterIcons)[number]
