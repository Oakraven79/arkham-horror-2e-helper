import type { CollectionConfig } from 'payload'

import { mythosCardTypesList, monsterIcons } from '@/components/constants'
import { encounterLocations, arkhamHorror2eBoxes } from '@/components/arkhamConstants'

export const MythosCards: CollectionConfig = {
  slug: 'mythos-cards',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
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
      name: 'encounterLocation',
      type: 'select',
      options: encounterLocations.map((t) => ({ label: t.location, value: t.location })),
      required: true,
    },
    {
      name: 'altLocationText',
      label: 'Alternate Location Text',
      type: 'text',
    },
    {
      name: 'altLocationImg',
      label: 'Alternate Location Image location',
      type: 'text',
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
