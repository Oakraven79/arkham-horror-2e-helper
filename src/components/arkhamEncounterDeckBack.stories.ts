import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { arkhamEncounterDeckBackExampleProps } from '@/content/arkhamEncounterCardExamples'

import { ArkhamEncounterDeckBack } from './arkhamEncounterDeckBack'

const meta = {
  title: 'Arkham Encounter/Neighborhood Deck Back',
  component: ArkhamEncounterDeckBack,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ArkhamEncounterDeckBack>

export default meta
type Story = StoryObj<typeof meta>

export const ThreePanelUptown: Story = {
  args: arkhamEncounterDeckBackExampleProps('arkham-uptown'),
}

export const TwoPanelFrenchHill: Story = {
  args: arkhamEncounterDeckBackExampleProps('arkham-french-hill'),
}

export const CustomFallback: Story = {
  args: {
    neighborhood: {
      name: 'Custom District',
      colourName: 'Teal',
      colourHex: '#2b7775',
    },
    panels: [{ name: 'Observatory' }, { name: 'Canal House' }, { name: 'Old Market' }],
  },
}
