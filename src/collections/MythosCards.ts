import type { CollectionConfig } from 'payload'

import { mythosCardTypesList, monsterIcons } from '@/components/constants'
import { encounterLocations, arkhamHorror2eBoxes } from '@/components/arkhamConstants'

export const MythosCards: CollectionConfig = {
  slug: 'mythos-cards',
  admin: {
    useAsTitle: 'title',
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
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'cardCode',
      label: 'Card Code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable identifier used by seeds and saved deck instances.',
      },
    },
    {
      name: 'copyCount',
      label: 'Physical Copies',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'cardType',
      type: 'select',
      options: mythosCardTypesList.map((t) => ({ label: t, value: t })),
      required: true,
    },
    {
      name: 'desc',
      type: 'textarea',
      admin: {
        rows: 20, // ✅ makes it taller (default is ~3–4)
        style: { width: '100%' }, // ✅ make it span the full width
        className: 'large-textarea', // ✅ custom CSS if you want
      },
    },
    {
      name: 'flavorText',
      label: 'Flavor Text',
      type: 'textarea',
      admin: {
        rows: 4,
      },
    },
    {
      name: 'effectText',
      label: 'Primary Effect',
      type: 'textarea',
      admin: {
        rows: 8,
      },
    },
    {
      name: 'ongoingEffect',
      label: 'Ongoing Effect',
      type: 'textarea',
      admin: {
        rows: 8,
      },
    },
    {
      name: 'passCondition',
      label: 'Pass Condition',
      type: 'textarea',
      admin: {
        rows: 6,
      },
    },
    {
      name: 'failCondition',
      label: 'Fail Condition',
      type: 'textarea',
      admin: {
        rows: 6,
      },
    },
    {
      name: 'clueText',
      label: 'Clue Placement',
      type: 'textarea',
      admin: {
        description:
          'Printed clue placement text. Street areas remain text until board spaces are modeled.',
        rows: 3,
      },
    },
    {
      name: 'gateInstruction',
      label: 'Gate Instruction',
      type: 'group',
      fields: [
        {
          name: 'mode',
          type: 'select',
          required: true,
          defaultValue: 'none',
          options: [
            { label: 'No Gate', value: 'none' },
            { label: 'Open One Gate', value: 'single' },
            { label: 'Choose One Location', value: 'choice' },
            { label: 'Open All Listed Gates', value: 'all' },
            { label: 'Monster Surge', value: 'surge' },
          ],
        },
        {
          name: 'locations',
          type: 'relationship',
          relationTo: 'locations',
          hasMany: true,
          admin: {
            description:
              'All printed gate destinations. Choice and all modes may contain multiple locations.',
          },
        },
        {
          name: 'burst',
          label: 'Gate Burst',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'doomTokens',
      label: 'Doom Tokens',
      type: 'number',
      min: 0,
      admin: {
        description:
          'Explicit doom-token instruction when the card differs from normal gate resolution.',
      },
    },
    {
      name: 'terrorIncrease',
      label: 'Terror Increase',
      type: 'number',
      min: 0,
    },
    {
      name: 'reshuffleDeck',
      label: 'Reshuffle Mythos Deck',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'specialInstruction',
      label: 'Special Resolution',
      type: 'textarea',
      admin: {
        rows: 4,
      },
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
          options: [
            { label: 'Clarification', value: 'clarification' },
            { label: 'Errata', value: 'errata' },
            { label: 'Misprint', value: 'misprint' },
          ],
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      admin: {
        description:
          'Legacy primary location retained while card rendering migrates to Gate Instruction.',
      },
    },
    {
      name: 'lowerLeftOverride',
      label: 'Special Lower-Left Panel',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'textarea',
          admin: {
            rows: 4,
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'encounterLocation',
      label: 'Legacy Encounter Location',
      type: 'select',
      options: encounterLocations.map((t) => ({ label: t.location, value: t.location })),
      required: true,
      admin: {
        hidden: true,
        description: 'Legacy field retained until location relationships have been migrated.',
      },
    },
    {
      name: 'altLocationText',
      label: 'Alternate Location Text',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'altLocationImg',
      label: 'Alternate Location Image location',
      type: 'text',
      admin: {
        hidden: true,
      },
    },

    {
      name: 'monsterMoveWhite',
      label: 'Monster Move White',
      type: 'select',
      hasMany: true,
      options: monsterIcons.map((icon) => ({
        label: icon,
        value: icon,
      })),
    },
    {
      name: 'monsterMoveBlack',
      label: 'Monster Move Black',
      type: 'select',
      hasMany: true,
      options: monsterIcons.map((icon) => ({
        label: icon,
        value: icon,
      })),
    },
    {
      name: 'boxedset',
      type: 'select',
      options: arkhamHorror2eBoxes.map((t) => ({ label: t.name, value: t.name })),
      required: true,
      defaultValue: 'Base Game',
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
  ],
}
