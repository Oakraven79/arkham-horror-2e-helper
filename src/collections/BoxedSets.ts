import type { CollectionConfig } from 'payload'

import { boxedSetCategories } from '@/content/boxedSetTypes'
import { gameDataFixtureFields } from './fields/gameDataFixtureFields'

const categoryLabels = {
  core: 'Core Game',
  'large-expansion': 'Large Expansion',
  'small-expansion': 'Small Expansion',
  promotional: 'Promotional',
  custom: 'Custom / Homebrew',
}

export const BoxedSets: CollectionConfig = {
  slug: 'boxed-sets',
  labels: {
    singular: 'Boxed Set',
    plural: 'Boxed Sets',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'abbreviation', 'category', 'icon', 'sortOrder'],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'Stable identifier used by fixtures and saved games, for example "dunwich-horror".',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: boxedSetCategories.map((category) => ({
        label: categoryLabels[category],
        value: category,
      })),
    },
    {
      name: 'abbreviation',
      type: 'text',
      required: true,
      admin: {
        description: 'Short fallback shown on cards when no icon has been uploaded.',
      },
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Transparent PNG, WebP, or SVG mark used to identify this set on cards.',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 1000,
    },
    {
      name: 'aliases',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Alternate source names accepted by import and migration tools.',
      },
    },
    ...gameDataFixtureFields,
  ],
}
