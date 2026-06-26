import { RefreshRouteOnSave } from './RefreshRouteOnSave'

import { getPayload } from 'payload'
import config from '../../../payload.config'

import { MythosCardFront } from '@/components/mythosCardFront'
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
    depth: 1,
  })

  return (
    <Fragment>
      <RefreshRouteOnSave />
      <h2>Rendered Card</h2>

      <MythosCardFront
        title={doc.title}
        cardType={doc.cardType}
        cardDescription={doc.desc ?? ''}
        monsterMoveWhite={doc.monsterMoveWhite?.slice().reverse()}
        monsterMoveBlack={doc.monsterMoveBlack?.slice().reverse()}
        portalLocation={doc.encounterLocation}
        portalLocationAltImg={doc.altLocationImg ?? undefined}
        portalLocationAltText={doc.altLocationText ?? undefined}
      />
    </Fragment>
  )
}
