import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { ArkhamEncounterCardFront } from '@/components/arkhamEncounterCardFront'
import { ArkhamEncounterDeckBack } from '@/components/arkhamEncounterDeckBack'
import { MythosCardFront } from '@/components/mythosCardFront'
import { OtherworldEncounterCardFront } from '@/components/otherworldEncounterCardFront'
import {
  arkhamEncounterCardFrontProps,
  arkhamEncounterDeckBackProps,
} from '@/lib/arkhamEncounterPresentation'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import { otherWorldEncounterCardFrontProps } from '@/lib/otherWorldEncounterCardPresentation'
import config from '@/payload.config'

import { RefreshRouteOnSave } from '../../RefreshRouteOnSave'

const previewCollections = [
  'mythos-cards',
  'other-world-encounter-cards',
  'arkham-encounter-cards',
  'neighborhoods',
] as const
type PreviewCollection = (typeof previewCollections)[number]

function isPreviewCollection(value: string): value is PreviewCollection {
  return previewCollections.some((collection) => collection === value)
}

interface Props {
  params: Promise<{ collection: string; id: string }>
}

export default async function CardPreview({ params }: Props) {
  const { collection, id } = await params

  if (!isPreviewCollection(collection)) notFound()

  const payload = await getPayload({ config })

  if (collection === 'mythos-cards') {
    const card = await payload.findByID({
      collection,
      draft: true,
      id,
      depth: 2,
    })

    return (
      <PreviewFrame title={card.title}>
        <MythosCardFront {...mythosCardFrontProps(card)} />
      </PreviewFrame>
    )
  }

  if (collection === 'arkham-encounter-cards') {
    const card = await payload.findByID({
      collection,
      draft: true,
      id,
      depth: 2,
    })

    return (
      <PreviewFrame title={card.cardCode}>
        <ArkhamEncounterCardFront {...arkhamEncounterCardFrontProps(card)} />
      </PreviewFrame>
    )
  }

  if (collection === 'neighborhoods') {
    const neighborhood = await payload.findByID({
      collection,
      draft: true,
      id,
      depth: 2,
    })
    const locations = await payload.find({
      collection: 'locations',
      depth: 1,
      draft: true,
      limit: 100,
      overrideAccess: true,
      where: {
        neighborhood: {
          equals: id,
        },
      },
    })

    return (
      <PreviewFrame title={`${neighborhood.name} deck back`}>
        <ArkhamEncounterDeckBack {...arkhamEncounterDeckBackProps(neighborhood, locations.docs)} />
      </PreviewFrame>
    )
  }

  const card = await payload.findByID({
    collection,
    draft: true,
    id,
    depth: 2,
  })

  return (
    <PreviewFrame title={card.cardCode}>
      <OtherworldEncounterCardFront {...otherWorldEncounterCardFrontProps(card)} />
    </PreviewFrame>
  )
}

function PreviewFrame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <main className="card-preview">
      <RefreshRouteOnSave />
      <div className="card-preview__content">
        <header className="card-preview__header">
          <p className="card-preview__eyebrow">Live CMS preview</p>
          <h1 className="card-preview__title">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  )
}
