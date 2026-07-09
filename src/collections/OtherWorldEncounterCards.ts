import type { CollectionConfig } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
import {
  otherWorldEncounterColours,
  validateCustomSetName,
  validateOtherWorldEncounterRows,
} from '@/lib/otherWorldContent'
import { cardPreviewField } from './fields/cardPreviewField'
import { gameDataFixtureFields } from './fields/gameDataFixtureFields'
import { requiredSetsField } from './fields/requiredSetsField'

const boxedSetOptions = [
  ...arkhamHorror2eBoxes.map((box) => ({ label: box.name, value: box.name })),
  { label: 'Custom / Homebrew', value: 'Custom' },
]

export const OtherWorldEncounterCards: CollectionConfig = {
  slug: 'other-world-encounter-cards',
  labels: {
    singular: 'Other World Encounter Card',
    plural: 'Other World Encounter Cards',
  },
  admin: {
    useAsTitle: 'cardCode',
    defaultColumns: ['cardCode', 'cardPreview', 'colour', 'sourceSet', 'updatedAt'],
    listSearchableFields: ['cardCode', 'encounters.text'],
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
      name: 'cardCode',
      label: 'Card Code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable internal identifier, for example "base-blue-001".',
      },
    },
    cardPreviewField(),
    {
      name: 'copyCount',
      label: 'Physical Copies',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'colour',
      type: 'select',
      required: true,
      index: true,
      options: otherWorldEncounterColours.map((colour) => ({
        label: colour[0].toUpperCase() + colour.slice(1),
        value: colour,
      })),
    },
    {
      name: 'encounters',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 3,
      validate: validateOtherWorldEncounterRows,
      admin: {
        components: {
          Cell: '/components/admin/OtherWorldEncounterListCell',
        },
        description:
          'The two named destination encounters and the single "Other" fallback printed on the card.',
      },
      fields: [
        {
          name: 'isOther',
          label: 'Use the "Other" fallback',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'destination',
          type: 'relationship',
          relationTo: 'other-worlds',
          admin: {
            condition: (_, siblingData) => !siblingData?.isOther,
          },
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          admin: {
            rows: 8,
            description: 'Markdown is supported by the existing card component.',
          },
        },
      ],
    },
    {
      name: 'boxedSet',
      label: 'Boxed Set',
      type: 'select',
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
    requiredSetsField,
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
    {
      name: 'clarifications',
      type: 'textarea',
      admin: {
        rows: 5,
        description: 'Optional helper notes. These are not printed on the rendered card.',
      },
    },
    ...gameDataFixtureFields,
  ],
}
