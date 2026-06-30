import type { OfficialBoxedSetKey } from './boxedSetTypes'

export interface OtherWorldFixture {
  key: string
  name: string
  preferredColours: ('blue' | 'green' | 'red' | 'yellow')[]
  sourceSetKey: OfficialBoxedSetKey
}

export const starterOtherWorlds: OtherWorldFixture[] = [
  {
    key: 'abyss',
    name: 'Abyss',
    preferredColours: ['blue', 'red'],
    sourceSetKey: 'base-game',
  },
  {
    key: 'celano',
    name: 'Celano',
    preferredColours: ['blue'],
    sourceSetKey: 'base-game',
  },
  {
    key: 'the-dreamlands',
    name: 'The Dreamlands',
    preferredColours: ['green'],
    sourceSetKey: 'base-game',
  },
  {
    key: 'city-of-the-great-race',
    name: 'City Of The Great Race',
    preferredColours: ['green', 'yellow'],
    sourceSetKey: 'base-game',
  },
  {
    key: 'rlyeh',
    name: "R'lyeh",
    preferredColours: ['red', 'yellow'],
    sourceSetKey: 'base-game',
  },
]
