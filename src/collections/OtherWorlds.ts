import type { CollectionConfig } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
import {
  otherWorldEncounterColours,
  validateCustomSetName,
} from '@/lib/otherWorldContent'

const boxedSetOptions = [
  ...arkhamHorror2eBoxes.map((box) => ({ label: box.name, value: box.name })),
  { label: 'Custom / Homebrew', value: 'Custom' },
]

export const OtherWorlds: CollectionConfig = {
  slug: 'other-worlds',
  labels: {
    singular: 'Other World',
    plural: 'Other Worlds',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'preferredColours', 'sourceSet', 'updatedAt'],
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
        description: 'Stable identifier used by imports and game state, for example "abyss".',
      },
    },
    {
      name: 'preferredColours',
      label: 'Preferred Encounter Colours',
      type: 'select',
      hasMany: true,
      options: otherWorldEncounterColours.map((colour) => ({
        label: colour[0].toUpperCase() + colour.slice(1),
        value: colour,
      })),
      admin: {
        description:
          'Suggested encounter colours only. This does not restrict which cards can reference this world.',
      },
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
    {
      name: 'art',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
