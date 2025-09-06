import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { fn } from 'storybook/test'

import { MythosCardFront } from './mythosCardFront'
import { monsterIcons } from './constants'

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
  },
}

export const EnvironmentExample: Story = {
  args: {
    title: 'The Chill of the Grave',
    cardType: 'Environment (Mystic)',
  },
}
