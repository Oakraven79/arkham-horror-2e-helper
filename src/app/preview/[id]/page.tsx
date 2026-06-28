import { RefreshRouteOnSave } from './RefreshRouteOnSave'

import { getPayload } from 'payload'
import config from '../../../payload.config'

import { MythosCardFront } from '@/components/mythosCardFront'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import { Fragment } from 'react'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DebugPreview({ params }: Props) {
  // Fetch the document from Payload

  const payload = await getPayload({ config })

  const { id } = await params

  const doc = await payload.findByID({
    collection: 'mythos-cards',
    draft: true,
    id: id,
    depth: 2,
  })

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <h2>Rendered Card</h2>

      <MythosCardFront
        {...mythosCardFrontProps(doc)}
        monsterMoveWhite={doc.monsterMoveWhite?.slice().reverse()}
        monsterMoveBlack={doc.monsterMoveBlack?.slice().reverse()}
      />
    </Fragment>
  )
}
