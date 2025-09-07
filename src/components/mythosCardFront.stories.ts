import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { fn } from 'storybook/test'

import { MythosCardFront } from './mythosCardFront'
import { monsterIcons, encounterLocationNames } from './constants'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Mythos Cards/MythosCardFront',
  component: MythosCardFront,
  parameters: {},
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    monsterMoveWhite: {
      control: { type: 'multi-select' },
      options: monsterIcons, // 👈 auto-synced with your type
    },
    monsterMoveBlack: {
      control: { type: 'multi-select' },
      options: monsterIcons,
    },

    portalLocation: {
      control: { type: 'select' },
      options: encounterLocationNames,
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof MythosCardFront>

export default meta
type Story = StoryObj<typeof meta>

export const HeadlineExample: Story = {
  args: {
    title: 'Fourth Of July Parade!',
    cardType: 'HeadLine',
    cardDescription: `Investigators cannot move into or out of the Merchant District street until the end of the next turn. Leave this card in play until then to indicate this.  

### Close:
Merchant District Streets  

### Clue Appears at:
Black Cave`,
    monsterMoveWhite: ['crescentMoon'],
    monsterMoveBlack: ['cross'],
    portalLocation: 'The Witch House',
  },
}

export const EnvironmentExample: Story = {
  args: {
    title: 'The Chill of the Grave',
    cardType: 'Environment (Mystic)',
    cardDescription: `All *Undead* Monsters have their toughness increased by 1.

### Clue Appears at:
Science Building`,
    monsterMoveWhite: ['cross'],
    monsterMoveBlack: ['crescentMoon'],
    portalLocation: 'Unvisited Isle',
  },
}

export const RumorExample: Story = {
  args: {
    title: 'Disturbing the Dead',
    cardType: 'Rumor',
    cardDescription: `A**Ongoing Effect:** Roll a die at the end of every **Mythos Phase** while this is in play (Beginning the turn after it entered play). On a 1 or 2, increase the terror level by 1.

**Pass:** If a player discards 2 gate trophies during the **Arkham Encounter Phase** while in the Rivertown Streets, return this card to the box. Each player draws 1 Spell.

**Fail:** If the terror level reaches 10, return the card to the box. Every investigator is *Cursed*.

### Activity at:
Rivertown Streets`,
    monsterMoveWhite: ['leftLean', 'triangle', 'star'],
    monsterMoveBlack: ['hexagon'],
    portalLocation: 'Black Cave',
  },
}
