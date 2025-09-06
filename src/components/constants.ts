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
