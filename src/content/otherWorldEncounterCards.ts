import type { OfficialBoxedSetKey } from './boxedSetTypes'

export interface OtherWorldEncounterCardFixture {
  cardCode: string
  clarifications?: string
  copyCount?: number
  colour: 'blue' | 'green' | 'red' | 'yellow'
  encounters: (
    | {
        destinationKey: string
        isOther?: false
        text: string
      }
    | {
        destinationKey?: never
        isOther: true
        text: string
      }
  )[]
  requiredSetKeys?: OfficialBoxedSetKey[]
  sourceSetKey: OfficialBoxedSetKey
}

export const starterOtherWorldEncounterCards: OtherWorldEncounterCardFixture[] = [
  {
    cardCode: 'base-blue-001',
    colour: 'blue',
    sourceSetKey: 'base-game',
    encounters: [
      {
        destinationKey: 'abyss',
        text: `The caverns split. Make a **Luck(+1) check** and consult the chart below:

**Successes:**

0-1: Move to the Black Cave.  
2: Move to The Dreamlands.  
3+: You enter a dark temple. Pass a **Luck(-1) check** to draw a Unique Item.`,
      },
      {
        destinationKey: 'celano',
        text: `The huge book opens noiselessly at your approach. If you choose you may read it, in which case you must pass a **Fight(-1)[2] check** to defeat its guardian. If you succeed: Draw 3 Spells and keep 2 of them. If you fail: Lose 3 Stamina.`,
      },
      {
        isOther: true,
        text: 'A Monster Appears!',
      },
    ],
  },
  {
    cardCode: 'base-green-001',
    colour: 'green',
    sourceSetKey: 'base-game',
    encounters: [
      {
        destinationKey: 'the-dreamlands',
        text: 'You encounter the talking cats of Ulthar. Pass a **Will (+0) check** to draw 1 Spell.',
      },
      {
        destinationKey: 'city-of-the-great-race',
        text: 'Pass a **Luck (-1) check** to find something useful among the incomprehensible artifacts. If so, draw 1 Unique Item.',
      },
      {
        isOther: true,
        text: 'A glimpse of home gives you hope. Gain 1 Sanity.',
      },
    ],
  },
  {
    cardCode: 'base-red-001',
    colour: 'red',
    sourceSetKey: 'base-game',
    encounters: [
      {
        destinationKey: 'rlyeh',
        text: 'Pass a **Speed (-1) check** or you slip and slide down a barnacled surface, slashing your skin to ribbons. Lose 3 Stamina.',
      },
      {
        destinationKey: 'abyss',
        text: 'Pass a **Luck (-1) check** or you are faced with an enormous mountain with a strange symbol carved into it, as if by the claw of a gigantic creature. The world swims around you and you lose 3 Sanity.',
      },
      {
        isOther: true,
        text: 'The obsidian door refuses to open. Pass a **Fight (-1) check** or stay here next turn struggling with it.',
      },
    ],
  },
  {
    cardCode: 'base-yellow-001',
    colour: 'yellow',
    sourceSetKey: 'base-game',
    encounters: [
      {
        destinationKey: 'rlyeh',
        text: 'The stink of this place is unbearable. Pass a **Will (-1) check** or lose 1 Stamina, 1 Sanity, and your lunch.',
      },
      {
        destinationKey: 'city-of-the-great-race',
        text: 'In a flash of insight, you realize the purpose of the bladed artifact. Shivering, you put it back where you found it. Lose 1 Sanity but gain 1 Clue token.',
      },
      {
        isOther: true,
        text: 'Time and space bend around you. Make a **Luck (-1) check**. If you pass, return to Arkham. If you fail, stay here next turn.',
      },
    ],
  },
]
