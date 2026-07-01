import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { arkhamEncounterDeckExampleProps } from '@/content/arkhamEncounterCardExamples'
import { fn } from 'storybook/test'

import { ArkhamEncounterDeck } from './arkhamEncounterDeck'

const meta = {
  title: 'Arkham Encounter/Clickable Deck',
  component: ArkhamEncounterDeck,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onFlip: fn(),
  },
} satisfies Meta<typeof ArkhamEncounterDeck>

export default meta
type Story = StoryObj<typeof meta>

export const FaceDownUptownDeck: Story = {
  args: arkhamEncounterDeckExampleProps('base-uptown-001'),
}

export const RevealedFrenchHillCard: Story = {
  args: {
    ...arkhamEncounterDeckExampleProps('base-french-hill-001'),
    initiallyRevealed: true,
  },
}
