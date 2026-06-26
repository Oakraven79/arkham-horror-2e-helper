import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { fn } from 'storybook/test'

import { MythosDeck } from './mythosDeck'
import { monsterIcons, encounterLocationNames, mythosCardTypesList } from './constants'

const meta = {
  title: 'Mythos Cards/Clickable Deck',
  component: MythosDeck,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    cardType: {
      control: { type: 'select' },
      options: mythosCardTypesList,
    },
    monsterMoveWhite: {
      control: { type: 'multi-select' },
      options: monsterIcons,
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
  args: {
    onFlip: fn(),
  },
} satisfies Meta<typeof MythosDeck>

export default meta
type Story = StoryObj<typeof meta>

export const FaceDownDeck: Story = {
  args: {
    title: 'Fourth Of July Parade!',
    cardType: 'Headline',
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

export const RevealedCard: Story = {
  args: {
    initiallyRevealed: true,
    title: 'Disturbing the Dead',
    cardType: 'Rumor',
    cardDescription: `**Ongoing Effect:** Roll a die at the end of every **Mythos Phase** while this is in play. On a 1 or 2, increase the terror level by 1.

**Pass:** If a player discards 2 gate trophies during the **Arkham Encounter Phase** while in the Rivertown Streets, return this card to the box. Each player draws 1 Spell.

**Fail:** If the terror level reaches 10, return the card to the box. Every investigator is *Cursed*.

### Activity at:
Rivertown Streets`,
    monsterMoveWhite: ['leftLean', 'triangle', 'star'],
    monsterMoveBlack: ['hexagon'],
    portalLocation: 'Black Cave',
  },
}

