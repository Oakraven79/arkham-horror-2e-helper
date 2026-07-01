import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { starterOtherWorldEncounterCards } from '@/content/otherWorldEncounterCards'
import { starterOtherWorlds } from '@/content/otherWorlds'
import { otherWorldEncounterCardFrontProps } from '@/lib/otherWorldEncounterCardPresentation'
import type { BoxedSet, OtherWorld, OtherWorldEncounterCard } from '@/payload-types'

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

const timestamp = '2025-01-01T00:00:00.000Z'

const baseGameBoxedSet: BoxedSet = {
  id: 'base-game',
  name: 'Base Game',
  key: 'base-game',
  category: 'core',
  abbreviation: 'AH',
  addsExpansionBoard: false,
  sortOrder: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
}

function encounterCardArgs(cardCode: string) {
  const fixture = starterOtherWorldEncounterCards.find((card) => card.cardCode === cardCode)

  if (!fixture) {
    throw new Error(`Unknown Other World encounter card fixture: ${cardCode}`)
  }

  const card: OtherWorldEncounterCard = {
    id: fixture.cardCode,
    cardCode: fixture.cardCode,
    copyCount: fixture.copyCount ?? 1,
    colour: fixture.colour,
    encounters: fixture.encounters.map((encounter) => {
      if (encounter.isOther) {
        return {
          isOther: true,
          text: encounter.text,
        }
      }

      const world = starterOtherWorlds.find(
        (candidate) => candidate.key === encounter.destinationKey,
      )

      if (!world) {
        throw new Error(`Unknown Other World fixture: ${encounter.destinationKey}`)
      }

      const destination: OtherWorld = {
        id: world.key,
        key: world.key,
        name: world.name,
        preferredColours: world.preferredColours,
        boxedSet: 'Base Game',
        sourceSet: baseGameBoxedSet,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      return {
        destination,
        text: encounter.text,
      }
    }),
    boxedSet: 'Base Game',
    sourceSet: baseGameBoxedSet,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return otherWorldEncounterCardFrontProps(card)
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

export const CompactLongContent: Story = {
  args: {
    ...encounterCardArgs('base-blue-001'),
    textBlocks: encounterCardArgs('base-blue-001').textBlocks.map((block, index) => ({
      ...block,
      desc:
        index === 1
          ? `${block.desc} If you remain to study the shelves, lose 1 Sanity and draw another Spell.`
          : block.desc,
    })),
  },
}
