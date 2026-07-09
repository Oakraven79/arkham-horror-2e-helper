import type { DefaultServerCellComponentProps } from 'payload'
import type { CSSProperties, ReactNode } from 'react'

import {
  ArkhamEncounterCardFront,
  type ArkhamEncounterCardFrontProps,
} from '@/components/arkhamEncounterCardFront'
import { MythosCardFront, type MythosCardFrontProps } from '@/components/mythosCardFront'
import {
  OtherworldEncounterCardFront,
  type OtherworldEncounterCardFrontProps,
} from '@/components/otherworldEncounterCardFront'
import { arkhamEncounterCardFrontProps } from '@/lib/arkhamEncounterPresentation'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import { otherWorldEncounterCardFrontProps } from '@/lib/otherWorldEncounterCardPresentation'

const cardPreviewCollections = [
  'arkham-encounter-cards',
  'mythos-cards',
  'other-world-encounter-cards',
] as const

type CardPreviewCollection = (typeof cardPreviewCollections)[number]

type CardPreview =
  | {
      kind: 'arkham'
      props: ArkhamEncounterCardFrontProps
    }
  | {
      kind: 'mythos'
      props: MythosCardFrontProps
    }
  | {
      kind: 'otherWorld'
      props: OtherworldEncounterCardFrontProps
    }

const fallbackStyle = {
  color: 'var(--theme-elevation-600)',
  fontSize: '13px',
  fontWeight: 600,
  whiteSpace: 'normal',
} satisfies CSSProperties

function isCardPreviewCollection(value: string): value is CardPreviewCollection {
  return cardPreviewCollections.some((collection) => collection === value)
}

function rowID(rowData: DefaultServerCellComponentProps['rowData']): number | string | null {
  const id = rowData?.id
  return typeof id === 'number' || typeof id === 'string' ? id : null
}

function renderCardPreview(preview: CardPreview): ReactNode {
  if (preview.kind === 'arkham') {
    return (
      <div className="card-preview-list-cell">
        <ArkhamEncounterCardFront {...preview.props} />
      </div>
    )
  }

  if (preview.kind === 'mythos') {
    return (
      <div className="card-preview-list-cell">
        <MythosCardFront {...preview.props} />
      </div>
    )
  }

  return (
    <div className="card-preview-list-cell">
      <OtherworldEncounterCardFront {...preview.props} />
    </div>
  )
}

export default async function CardPreviewListCell({
  collectionSlug,
  payload,
  rowData,
}: DefaultServerCellComponentProps): Promise<ReactNode> {
  const id = rowID(rowData)

  if (!id || !isCardPreviewCollection(collectionSlug)) {
    return <span style={fallbackStyle}>No preview</span>
  }

  let preview: CardPreview

  try {
    if (collectionSlug === 'arkham-encounter-cards') {
      const card = await payload.findByID({
        collection: 'arkham-encounter-cards',
        depth: 2,
        draft: true,
        id,
        overrideAccess: true,
      })

      preview = {
        kind: 'arkham',
        props: arkhamEncounterCardFrontProps(card),
      }
    } else if (collectionSlug === 'mythos-cards') {
      const card = await payload.findByID({
        collection: 'mythos-cards',
        depth: 2,
        draft: true,
        id,
        overrideAccess: true,
      })

      preview = {
        kind: 'mythos',
        props: mythosCardFrontProps(card),
      }
    } else {
      const card = await payload.findByID({
        collection: 'other-world-encounter-cards',
        depth: 2,
        draft: true,
        id,
        overrideAccess: true,
      })

      preview = {
        kind: 'otherWorld',
        props: otherWorldEncounterCardFrontProps(card),
      }
    }
  } catch {
    return <span style={fallbackStyle}>Preview unavailable</span>
  }

  return renderCardPreview(preview)
}
