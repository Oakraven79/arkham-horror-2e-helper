import type { CollectionConfig } from 'payload'

const authenticated = ({ req }: { req: { user?: unknown } }) => Boolean(req.user)

export const FixtureInstallations: CollectionConfig = {
  slug: 'fixture-installations',
  admin: {
    hidden: true,
    useAsTitle: 'namespace',
  },
  access: {
    create: () => false,
    delete: () => false,
    read: authenticated,
    update: () => false,
  },
  fields: [
    {
      name: 'namespace',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'fixtureVersion',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'checksum',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Running', value: 'running' },
        { label: 'Succeeded', value: 'succeeded' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'initiatedBy',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'completedAt',
      type: 'date',
    },
    {
      name: 'summary',
      type: 'json',
    },
    {
      name: 'error',
      type: 'textarea',
    },
  ],
}
