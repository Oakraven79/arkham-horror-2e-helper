import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { fn } from 'storybook/test'

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
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
} satisfies Meta<typeof OtherworldEncounterCardFront>

export default meta
type Story = StoryObj<typeof meta>

export const BlueOtherWorld: Story = {
  args: {
    colour: 'blue',
    textBlocks: [
      {
        header: 'Abyss',
        desc: `The caverns split. Make a **Luck(+1) check** and consult the chart below:

**Successes:**

0–1: Move to the Black Cave.  
2: Move to The Dreamlands.  
3+: You enter a dark temple. Pass a **Luck(-1) check** to draw a Unique Item.`,
      },
      {
        header: 'Celano',
        desc: `The huge book opens noiselessly at your approach. If you choose you may read it, in which case you must pass a **Fight(-1)[2] check** to defeat its guardian. If you succeed: Draw 3 Spells and keep 2 of them. If you fail: Lose 3 Stamina.
`,
      },
      { header: 'Other', desc: 'A Monster Appears!' },
    ],
  },
}

export const GreenOtherWorld: Story = {
  args: {
    colour: 'green',
    textBlocks: [
      {
        header: 'The Dreamlands',
        desc: `You encounter the talking cats of Ulthar. Pass a **Will (+0) check** to draw 1 Spell.`,
      },
      {
        header: 'City Of The Great Race',
        desc: `Pass a **Luck (-1) check** to find something useful among the incomprehensible artifacts. If so, draw 1 Unique Item.`,
      },
      { header: 'Other', desc: 'A glimpse of home give you hope. Gain 1 Sanity.' },
    ],
  },
}

export const RedOtherWorld: Story = {
  args: {
    colour: 'red',
    textBlocks: [
      {
        header: "R'lyeh",
        desc: `Pass a **Speed (-1) check** or you slip and slide down a barnacled surface, slashing your skin to ribbons. Lose 3 Stamina`,
      },
      {
        header: 'Abyss',
        desc: `Pass a **Luck (-1) check** or you are faced with an enourmouse mountain with a strange symbol carved into it, as if by the claw of a gigantic creature. The world swims around you and you lose 3 Sanity.`,
      },
      {
        header: 'Other',
        desc: 'The obsidian door refuses to open. Pass a **Fight (-1) check** or stay here next turn struggling with it. ',
      },
    ],
  },
}

export const YellowOtherWorld: Story = {
  args: {
    colour: 'yellow',
    textBlocks: [
      {
        header: "R'lyeh",
        desc: `The stink of this place is unbearable. Pass a **Will (-1) check** or lose 1 Stamina, 1 Sanity and your lunch.`,
      },
      {
        header: 'City Of The Great Race',
        desc: `In a flash of insight, you realise the purpose of the bladed artifact. Shivering, you put it back where you found it. Lose 1 Sanity but gain 1 Clue token.`,
      },
      {
        header: 'Other',
        desc: 'Time and space bend around you. Make a **Luck (-1) check**. If you pass, return to Arkham. If you fail, stay here next turn.',
      },
    ],
  },
}
