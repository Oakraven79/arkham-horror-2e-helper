import { notFound } from 'next/navigation'

import { RefreshRouteOnSave } from './RefreshRouteOnSave'

import { getPayload } from 'payload'
import config from '../../../payload.config'

import { MythosCardFront } from '@/components/mythosCardFront'
import { Fragment } from 'react'

interface Props {
  params: { id: string }
  searchParams: Record<string, string | string[] | undefined>
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
        cardDescription={doc.desc}
        monsterMoveWhite={doc.monsterMoveWhite}
        monsterMoveBlack={doc.monsterMoveBlack}
        portalLocation={doc.encounterLocation}
        portalLocationAltImg={doc.altLocationImg}
        portalLocationAltText={doc.altLocationText}
      />

      <h2>Payload Document</h2>
      <pre>{JSON.stringify(doc, null, 2)}</pre>
    </Fragment>
  )
}
