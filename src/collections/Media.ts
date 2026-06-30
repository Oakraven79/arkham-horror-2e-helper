import type { CollectionConfig } from 'payload'

import { gameDataFixtureFields } from './fields/gameDataFixtureFields'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'assetKey',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
    },
    ...gameDataFixtureFields,
  ],
  upload: true,
}
