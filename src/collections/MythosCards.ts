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
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      admin: {
        description: 'Location text and image rendered in the lower-left corner.',
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
    },
  ],
}
