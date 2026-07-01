import type { CollectionConfig } from 'payload'

import { locationBoards } from '@/content/locationTypes'
import { gameDataFixtureFields } from './fields/gameDataFixtureFields'

function validateHexColour(value: unknown) {
  if (!value) return true

  return /^#[0-9a-f]{6}$/i.test(String(value))
    ? true
    : 'Use a six-digit hexadecimal colour, for example #a82f25.'
}

export const Neighborhoods: CollectionConfig = {
  slug: 'neighborhoods',
  labels: {
    singular: 'Neighborhood',
    plural: 'Neighborhoods',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'board', 'colourName', 'sourceSet', 'updatedAt'],
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
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable board-qualified identifier, for example "arkham-uptown".',
      },
    },
    {
      name: 'board',
      type: 'select',
      required: true,
      index: true,
      options: locationBoards.map((board) => ({ label: board, value: board })),
    },
    {
      name: 'customBoardName',
      label: 'Custom Board Name',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.board === 'Other',
      },
    },
    {
      name: 'colourName',
      label: 'Encounter Deck Colour',
      type: 'text',
      admin: {
        description: 'Printed deck colour, such as Red, Dark Grey, or Purple.',
      },
    },
    {
      name: 'colourHex',
      label: 'Colour Swatch',
      type: 'text',
      validate: validateHexColour,
      admin: {
        description: 'CSS fallback used when custom frame artwork is not available.',
      },
    },
    {
      name: 'frontFrame',
      label: 'Encounter Card Front Frame',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'backFrame',
      label: 'Encounter Deck Back Frame',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'sourceSet',
      label: 'Introduced In',
      type: 'relationship',
      relationTo: 'boxed-sets',
      required: true,
      index: true,
    },
    ...gameDataFixtureFields,
  ],
}
