import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { mythosCardExampleProps } from '@/content/mythosCardExamples'

import { monsterIcons, mythosCardTypesList } from './constants'
import { MythosCardFront } from './mythosCardFront'

const meta = {
  title: 'Mythos Cards/Card Front',
  component: MythosCardFront,
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
} satisfies Meta<typeof MythosCardFront>

export default meta
type Story = StoryObj<typeof meta>

export const HeadlineExample: Story = {
  args: mythosCardExampleProps('base-fourth-of-july-parade'),
}

export const EnvironmentMysticExample: Story = {
  args: mythosCardExampleProps('base-the-chill-of-the-grave'),
}

export const EnvironmentUrbanExample: Story = {
  args: mythosCardExampleProps('king-in-yellow-new-miskatonic-u-curriculum'),
}

export const EnvironmentWeatherExample: Story = {
  args: mythosCardExampleProps('king-in-yellow-two-sunsets'),
}

export const RumorExample: Story = {
  args: mythosCardExampleProps('base-disturbing-the-dead'),
}

export const LongerRumorExample: Story = {
  args: mythosCardExampleProps('base-the-terrible-experiment'),
}

export const AllMonstersRumorAltLocationExample: Story = {
  args: mythosCardExampleProps('king-in-yellow-the-tattered-king'),
}

export const NoCardTypeExample: Story = {
  args: mythosCardExampleProps('base-the-story-continues'),
}

export const AllMonstersButNoLocationExample: Story = {
  args: mythosCardExampleProps('king-in-yellow-the-next-act-begins'),
}
