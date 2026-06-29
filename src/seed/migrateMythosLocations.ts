import type { Payload } from 'payload'

import { officialBoxedSets } from '@/content/boxedSets'
import { starterMythosCards } from '@/content/mythosCards'

import { ensureSeedMedia } from './media'
import { normalizeCardTitle } from './mythosCards'

const doomCounterAsset = {
  alt: 'Doom counters',
  filename: 'doomCounters.png',
  publicPath: '/images/misc/doomCounters.png',
}

function relationshipID(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id)
    }
  }

  return null
}

export async function migrateMythosLocations(payload: Payload, apply: boolean) {
  const [cards, locations, boxedSets] = await Promise.all([
    payload.find({
      collection: 'mythos-cards',
      depth: 0,
      draft: true,
      limit: 1000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'locations',
      depth: 0,
      draft: true,
      limit: 1000,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'boxed-sets',
      depth: 0,
      draft: true,
      limit: 1000,
      overrideAccess: true,
    }),
  ])

  const locationsByName = new Map(locations.docs.map((location) => [location.name, location]))
  const boxedSetKeysByID = new Map(
    boxedSets.docs.map((boxedSet) => [String(boxedSet.id), boxedSet.key]),
  )
  const boxedSetKeysByName = new Map(
    officialBoxedSets.map((boxedSet) => [boxedSet.name, boxedSet.key]),
  )
  const fixturesByIdentity = new Map(
    starterMythosCards.map((fixture) => [
      `${fixture.sourceSetKey}:${normalizeCardTitle(fixture.title)}`,
      fixture,
    ]),
  )
  const changes: { fields: string[]; title: string }[] = []
  const unresolved: string[] = []
  let doomCounterMediaID: string | null = null

  for (const card of cards.docs) {
    const data: Record<string, unknown> = {}
    const fields: string[] = []
    const sourceSetKey =
      boxedSetKeysByID.get(relationshipID(card.sourceSet) ?? '') ??
      boxedSetKeysByName.get(card.boxedset) ??
      card.boxedset
    const fixture = fixturesByIdentity.get(`${sourceSetKey}:${normalizeCardTitle(card.title)}`)

    if (!card.cardCode && fixture) {
      data.cardCode = fixture.cardCode
      fields.push('cardCode')
    } else if (!card.cardCode) {
      data.cardCode = `legacy-${normalizeCardTitle(card.boxedset)}-${normalizeCardTitle(card.title)}-${String(card.id).slice(-6)}`
      fields.push('cardCode')
    }

    if (!relationshipID(card.location) && card.encounterLocation !== 'none') {
      const location = locationsByName.get(card.encounterLocation)

      if (location) {
        data.location = location.id
        fields.push('location')
      } else {
        unresolved.push(`${card.title}: ${card.encounterLocation}`)
      }
    }

    if (
      (card.altLocationText || card.altLocationImg) &&
      !card.lowerLeftOverride?.text &&
      !relationshipID(card.lowerLeftOverride?.image)
    ) {
      let imageID: string | null = null

      if (card.altLocationImg === doomCounterAsset.publicPath && apply) {
        if (!doomCounterMediaID) {
          const mediaResult = await ensureSeedMedia(payload, doomCounterAsset)
          doomCounterMediaID = String(mediaResult.media.id)
        }

        imageID = doomCounterMediaID
      }

      data.lowerLeftOverride = {
        text: card.altLocationText,
        image: imageID,
      }
      fields.push('lowerLeftOverride')
    }

    if (fields.length === 0) {
      continue
    }

    changes.push({
      title: card.title,
      fields,
    })

    if (apply) {
      await payload.update({
        collection: 'mythos-cards',
        id: card.id,
        data: {
          ...data,
          _status: card._status,
        },
        draft: card._status === 'draft',
        overrideAccess: true,
      })
    }
  }

  return {
    apply,
    changes,
    unresolved,
  }
}
