import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'

import { freshExpansionTrackState } from '@/lib/expansionTracks'

import { ExpansionTrackPanel } from './ExpansionTrackPanel'
import './styles.css'

const allExpansionKeys = ['base-game', 'dunwich-horror', 'innsmouth-horror', 'kingsport-horror']

const meta = {
  title: 'Game Table/Expansion Tracks',
  component: ExpansionTrackPanel,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className="mythos-table">
        <div className="table-layout">
          <Story />
        </div>
      </main>
    ),
  ],
  args: {
    enabledSetKeys: allExpansionKeys,
    onCommand: fn(),
    phase: 'Upkeep',
    state: freshExpansionTrackState(),
  },
} satisfies Meta<typeof ExpansionTrackPanel>

export default meta
type Story = StoryObj<typeof meta>

export const AllExpansionBoards: Story = {}

export const EscalatingThreats: Story = {
  args: {
    state: {
      ...freshExpansionTrackState(),
      dunwichHorrorTokens: 3,
      deepOnesRising: 5,
      fedsRaid: {
        'church-green': 2,
        'factory-district': 1,
        'innsmouth-shore': 2,
      },
    },
  },
}

export const KingsportMythos: Story = {
  args: {
    enabledSetKeys: ['base-game', 'kingsport-horror'],
    phase: 'Mythos',
    mythosMovement: {
      white: ['circle', 'moon'],
      black: ['square', 'hex'],
    },
    state: {
      ...freshExpansionTrackState(),
      kingsportRifts: [
        {
          trackKey: 'rift-1',
          progress: 4,
          open: true,
          investigated: 2,
          currentLocation: 'Independence Square',
        },
        {
          trackKey: 'rift-2',
          progress: 3,
          open: false,
          investigated: 0,
        },
        {
          trackKey: 'rift-3',
          progress: 1,
          open: false,
          investigated: 0,
        },
      ],
    },
  },
}
