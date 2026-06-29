import type { BoxedSetFixture } from './boxedSetTypes'

export const officialBoxedSets: BoxedSetFixture[] = [
  {
    name: 'Base Game',
    key: 'base-game',
    category: 'core',
    abbreviation: 'AH',
    aliases: ['Arkham Horror'],
    sortOrder: 10,
  },
  {
    name: 'Dunwich Horror',
    key: 'dunwich-horror',
    category: 'large-expansion',
    abbreviation: 'DH',
    aliases: ['Dunwich'],
    sortOrder: 20,
  },
  {
    name: 'Kingsport Horror',
    key: 'kingsport-horror',
    category: 'large-expansion',
    abbreviation: 'KH',
    aliases: ['Kingsport'],
    sortOrder: 30,
  },
  {
    name: 'Innsmouth Horror',
    key: 'innsmouth-horror',
    category: 'large-expansion',
    abbreviation: 'IH',
    aliases: ['Innsmouth'],
    sortOrder: 40,
  },
  {
    name: 'Miskatonic Horror',
    key: 'miskatonic-horror',
    category: 'large-expansion',
    abbreviation: 'MH',
    aliases: ['Miskatonic'],
    sortOrder: 50,
  },
  {
    name: 'Curse of the Dark Pharaoh (original)',
    key: 'curse-dark-pharaoh-original',
    category: 'small-expansion',
    abbreviation: 'DP',
    aliases: ['Curse of the Dark Pharaoh (Original Edition)'],
    sortOrder: 60,
  },
  {
    name: 'Curse of the Dark Pharaoh (Revised Edition)',
    key: 'curse-dark-pharaoh-revised',
    category: 'small-expansion',
    abbreviation: 'DP-R',
    aliases: ['Curse of the Dark Pharaoh', 'Curse of Dark Pharaoh', 'Dark Pharaoh'],
    sortOrder: 70,
  },
  {
    name: 'The Black Goat of the Woods',
    key: 'black-goat',
    category: 'small-expansion',
    abbreviation: 'BG',
    aliases: ['Black Goat'],
    sortOrder: 80,
  },
  {
    name: 'The King in Yellow',
    key: 'king-in-yellow',
    category: 'small-expansion',
    abbreviation: 'KiY',
    aliases: ['King in Yellow'],
    sortOrder: 90,
  },
  {
    name: 'The Lurker at the Threshold',
    key: 'lurker-at-the-threshold',
    category: 'small-expansion',
    abbreviation: 'LatT',
    aliases: ['Lurker'],
    sortOrder: 100,
  },
  {
    name: 'Promotional',
    key: 'promotional',
    category: 'promotional',
    abbreviation: 'Promo',
    aliases: ['Promotional offer'],
    sortOrder: 110,
  },
]

export function getOfficialBoxedSet(key: string) {
  return officialBoxedSets.find((boxedSet) => boxedSet.key === key)
}
