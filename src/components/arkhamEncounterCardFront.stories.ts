import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { arkhamEncounterCardExampleProps } from '@/content/arkhamEncounterCardExamples'

import { ArkhamEncounterCardFront } from './arkhamEncounterCardFront'

const meta = {
  title: 'Arkham Encounter/Card Front',
  component: ArkhamEncounterCardFront,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ArkhamEncounterCardFront>

export default meta
type Story = StoryObj<typeof meta>

export const Uptown: Story = {
  args: arkhamEncounterCardExampleProps('base-uptown-001'),
}

export const FrenchHill: Story = {
  args: arkhamEncounterCardExampleProps('base-french-hill-001'),
}

export const LongSouthsideCard: Story = {
  args: arkhamEncounterCardExampleProps('base-southside-001'),
}
