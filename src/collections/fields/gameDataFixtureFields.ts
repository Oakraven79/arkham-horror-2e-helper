import type { Field } from 'payload'

export const gameDataFixtureFields: Field[] = [
  {
    name: 'fixtureNamespace',
    type: 'text',
    index: true,
    admin: {
      hidden: true,
      readOnly: true,
    },
  },
  {
    name: 'fixtureVersion',
    type: 'number',
    min: 1,
    admin: {
      hidden: true,
      readOnly: true,
    },
  },
]
