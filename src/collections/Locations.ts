import type { CollectionConfig } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
import {
  locationBoards,
  locationEncounterTypes,
  locationStabilities,
} from '@/content/locationTypes'
import { validateCustomSetName } from '@/lib/otherWorldContent'

const boxedSetOptions = [
  ...arkhamHorror2eBoxes.map((box) => ({ label: box.name, value: box.name })),
  { label: 'Custom / Homebrew', value: 'Custom' },
]

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: {
    singular: 'Location',
    plural: 'Locations',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'board', 'neighborhood', 'stability', 'sourceSet'],
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
        description: 'Stable identifier used by cards and imports, for example "black-cave".',
      },
    },
    {
      name: 'cardDisplayText',
      type: 'textarea',
      required: true,
      admin: {
        rows: 3,
        description: 'Markdown-capable location label rendered on the Mythos card.',
      },
    },
    {
      name: 'cardImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'board',
      type: 'select',
      required: true,
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
      name: 'neighborhood',
      type: 'text',
      required: true,
    },
    {
      name: 'stability',
      type: 'select',
      required: true,
      options: locationStabilities.map((stability) => ({
        label:
          stability === 'n/a'
            ? 'Not Applicable'
            : stability[0].toUpperCase() + stability.slice(1),
        value: stability,
      })),
    },
    {
      name: 'aquatic',
      type: 'checkbox',
      required: true,
      defaultValue: false,
    },
    {
      name: 'encounterTypes',
      type: 'select',
      hasMany: true,
      options: locationEncounterTypes.map((encounterType) => ({
        label: encounterType,
        value: encounterType,
      })),
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        rows: 5,
      },
    },
    {
      name: 'specialEncounter',
      type: 'textarea',
      admin: {
        rows: 5,
      },
    },
    {
      name: 'homeInvestigators',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'boxedSet',
      label: 'Boxed Set',
      type: 'select',
      required: true,
      defaultValue: 'Base Game',
      options: boxedSetOptions,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'sourceSet',
      label: 'Boxed Set',
      type: 'relationship',
      relationTo: 'boxed-sets',
      required: true,
      index: true,
      admin: {
        description: 'Set provenance and card icon.',
      },
    },
    {
      name: 'customSetName',
      label: 'Custom Set Name',
      type: 'text',
      admin: {
        hidden: true,
        condition: (_, siblingData) => siblingData?.boxedSet === 'Custom',
      },
      validate: validateCustomSetName,
    },
  ],
}
