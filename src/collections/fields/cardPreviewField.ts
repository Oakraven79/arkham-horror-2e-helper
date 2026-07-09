import type { UIField } from 'payload'

export function cardPreviewField(): UIField {
  return {
    name: 'cardPreview',
    label: 'Preview',
    type: 'ui',
    admin: {
      components: {
        Cell: '/components/admin/CardPreviewListCell',
      },
      disableListColumn: false,
    },
  }
}
