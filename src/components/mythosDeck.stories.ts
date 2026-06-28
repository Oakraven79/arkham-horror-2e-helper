import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { mythosCardExampleProps } from '@/content/mythosCardExamples'
import { fn } from 'storybook/test'

import { monsterIcons, mythosCardTypesList } from './constants'
import { MythosDeck } from './mythosDeck'

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
  },
  args: {
    onFlip: fn(),
  },
} satisfies Meta<typeof MythosDeck>

export default meta
type Story = StoryObj<typeof meta>

export const FaceDownDeck: Story = {
  args: mythosCardExampleProps('base-fourth-of-july-parade'),
}

export const RevealedCard: Story = {
  args: {
    ...mythosCardExampleProps('base-disturbing-the-dead'),
    initiallyRevealed: true,
  },
}
