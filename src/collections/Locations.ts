import type { CollectionConfig } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
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
    defaultColumns: ['name', 'key', 'boxedSet', 'updatedAt'],
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
      name: 'boxedSet',
      label: 'Boxed Set',
      type: 'select',
      required: true,
      defaultValue: 'Base Game',
      options: boxedSetOptions,
    },
    {
      name: 'customSetName',
      label: 'Custom Set Name',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.boxedSet === 'Custom',
      },
      validate: validateCustomSetName,
    },
  ],
}
