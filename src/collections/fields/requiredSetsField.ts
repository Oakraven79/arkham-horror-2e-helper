import type { Field } from 'payload'

export const requiredSetsField: Field = {
  name: 'requiredSets',
  label: 'Required Sets',
  type: 'relationship',
  relationTo: 'boxed-sets',
  hasMany: true,
  index: true,
  admin: {
    description:
      'All boxed sets that must be enabled before this content is included. Empty legacy records fall back to the source set.',
  },
}
