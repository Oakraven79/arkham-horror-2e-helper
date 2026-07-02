import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { AncientOneSetupFields } from './AncientOneSetupFields'
import './styles.css'

const options = [
  {
    value: 'cthulhu::standard',
    label: 'Cthulhu - Standard (13 doom)',
    imageUrl: '/images/mythosBacking.jpg',
    imageAlt: 'Cthulhu sheet artwork is available.',
  },
  {
    value: 'azathoth::standard',
    label: 'Azathoth - Standard (14 doom)',
  },
]

const meta = {
  title: 'Game Table/Ancient One Background Setup',
  component: AncientOneSetupFields,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <main className="mythos-table">
        <section className="setup-workspace">
          <form className="ancient-one-selector">
            <div className="setup-form-fields">
              <Story />
              <div className="setup-form-field investigator-count-field">
                <label>Investigators</label>
                <strong>4</strong>
              </div>
              <button type="button">Save setup</button>
            </div>
          </form>
        </section>
      </main>
    ),
  ],
  args: {
    currentSelection: 'cthulhu::standard',
    initialUseBackground: true,
    options,
  },
} satisfies Meta<typeof AncientOneSetupFields>

export default meta
type Story = StoryObj<typeof meta>

export const ArtworkAvailable: Story = {}

export const DefaultFallback: Story = {
  args: {
    currentSelection: 'azathoth::standard',
    initialUseBackground: true,
  },
}
