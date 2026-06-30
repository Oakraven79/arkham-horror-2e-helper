import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { starterOtherWorldEncounterCards } from '@/content/otherWorldEncounterCards'
import { starterOtherWorlds } from '@/content/otherWorlds'

import { OtherworldEncounterCardFront } from './otherworldEncounterCardFront'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Otherworld Encounter/Card Front',
  component: OtherworldEncounterCardFront,
  parameters: {},
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
} satisfies Meta<typeof OtherworldEncounterCardFront>

export default meta
type Story = StoryObj<typeof meta>

const baseGameBoxedSet = {
  name: 'Base Game',
  abbreviation: 'AH',
}

function encounterCardArgs(cardCode: string) {
  const card = starterOtherWorldEncounterCards.find((fixture) => fixture.cardCode === cardCode)

  if (!card) {
    throw new Error(`Unknown Other World encounter card fixture: ${cardCode}`)
  }

  return {
    boxedSet: baseGameBoxedSet,
    colour: card.colour,
    textBlocks: card.encounters.map((encounter) => ({
      header: encounter.isOther
        ? 'Other'
        : (starterOtherWorlds.find((world) => world.key === encounter.destinationKey)?.name ??
          encounter.destinationKey),
      desc: encounter.text,
    })),
  }
}

export const BlueOtherWorld: Story = {
  args: encounterCardArgs('base-blue-001'),
}

export const GreenOtherWorld: Story = {
  args: encounterCardArgs('base-green-001'),
}

export const RedOtherWorld: Story = {
  args: encounterCardArgs('base-red-001'),
}

export const YellowOtherWorld: Story = {
  args: encounterCardArgs('base-yellow-001'),
}
