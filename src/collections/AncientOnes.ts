import type { CollectionConfig } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
import {
  ancientOneCombatRatingTypes,
  ancientOneDefenses,
  ancientOneRulesNoteKinds,
} from '@/content/ancientOneTypes'
import { validateAncientOneSheets } from '@/lib/ancientOneContent'
import { validateCustomSetName } from '@/lib/otherWorldContent'

const boxedSetOptions = [
  ...arkhamHorror2eBoxes.map((box) => ({ label: box.name, value: box.name })),
  { label: 'Promotional', value: 'Promotional' },
  { label: 'Custom / Homebrew', value: 'Custom' },
]

const combatRatingLabels = {
  fixed: 'Fixed Modifier',
  variable: 'Variable',
  infinite: 'Infinite',
}

const defenseLabels = {
  'physical-resistance': 'Physical Resistance',
  'physical-immunity': 'Physical Immunity',
  'magical-resistance': 'Magical Resistance',
  'magical-immunity': 'Magical Immunity',
  special: 'Special',
}

export const AncientOnes: CollectionConfig = {
  slug: 'ancient-ones',
  labels: {
    singular: 'Ancient One',
    plural: 'Ancient Ones',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'boxedSet', 'key', 'updatedAt'],
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
        description: 'Stable identifier used by imports and saved games, for example "cthulhu".',
      },
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
    {
      name: 'lore',
      type: 'textarea',
      admin: {
        description: 'Optional source lore. Gameplay instructions belong to a playable sheet.',
        rows: 4,
      },
    },
    {
      name: 'sheets',
      label: 'Playable Sheets',
      type: 'array',
      required: true,
      minRows: 1,
      validate: validateAncientOneSheets,
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          admin: {
            description: 'Stable variant key such as "standard", "original", or "arkham-nights".',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'isDefault',
          label: 'Default Sheet',
          type: 'checkbox',
          required: true,
          defaultValue: false,
        },
        {
          name: 'doomTrack',
          label: 'Doom Track Length',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'combatRating',
          label: 'Combat Rating',
          type: 'group',
          fields: [
            {
              name: 'display',
              label: 'Printed Value',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              options: ancientOneCombatRatingTypes.map((type) => ({
                label: combatRatingLabels[type],
                value: type,
              })),
            },
            {
              name: 'modifier',
              type: 'number',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'fixed',
              },
            },
          ],
        },
        {
          name: 'defenses',
          type: 'select',
          hasMany: true,
          options: ancientOneDefenses.map((defense) => ({
            label: defenseLabels[defense],
            value: defense,
          })),
        },
        {
          name: 'defenseText',
          label: 'Printed Defense Text',
          type: 'text',
          required: true,
        },
        {
          name: 'worshippers',
          type: 'textarea',
          required: true,
          admin: {
            rows: 6,
          },
        },
        {
          name: 'powerName',
          label: 'Power Name',
          type: 'text',
          required: true,
        },
        {
          name: 'power',
          type: 'textarea',
          required: true,
          admin: {
            rows: 8,
          },
        },
        {
          name: 'startOfBattle',
          label: 'Start of Battle',
          type: 'textarea',
          admin: {
            rows: 5,
          },
        },
        {
          name: 'attack',
          type: 'textarea',
          required: true,
          admin: {
            rows: 8,
          },
        },
        {
          name: 'sheetImage',
          label: 'Sheet Image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'rulesNotes',
      label: 'Rules Notes',
      type: 'array',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          options: ancientOneRulesNoteKinds.map((kind) => ({
            label: kind[0].toUpperCase() + kind.slice(1),
            value: kind,
          })),
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
        {
          name: 'sheetKey',
          label: 'Sheet Key',
          type: 'text',
          admin: {
            description: 'Optional variant key when this note applies to only one playable sheet.',
          },
        },
      ],
    },
  ],
}
