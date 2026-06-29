export const boxedSetCategories = [
  'core',
  'large-expansion',
  'small-expansion',
  'promotional',
  'custom',
] as const

export type BoxedSetCategory = (typeof boxedSetCategories)[number]

export type OfficialBoxedSetKey =
  | 'base-game'
  | 'dunwich-horror'
  | 'kingsport-horror'
  | 'innsmouth-horror'
  | 'miskatonic-horror'
  | 'curse-dark-pharaoh-original'
  | 'curse-dark-pharaoh-revised'
  | 'black-goat'
  | 'king-in-yellow'
  | 'lurker-at-the-threshold'
  | 'promotional'

export type OfficialBoxedSetName =
  | 'Base Game'
  | 'Dunwich Horror'
  | 'Kingsport Horror'
  | 'Innsmouth Horror'
  | 'Miskatonic Horror'
  | 'Curse of the Dark Pharaoh (original)'
  | 'Curse of the Dark Pharaoh (Revised Edition)'
  | 'The Black Goat of the Woods'
  | 'The King in Yellow'
  | 'The Lurker at the Threshold'
  | 'Promotional'

export interface BoxedSetFixture {
  abbreviation: string
  aliases: string[]
  category: Exclude<BoxedSetCategory, 'custom'>
  key: OfficialBoxedSetKey
  name: OfficialBoxedSetName
  sortOrder: number
}
