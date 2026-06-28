import type { Payload } from 'payload'

import { getStarterLocation } from '@/content/locations'
import { starterMythosCards, type StarterMythosCard } from '@/content/mythosCards'
import type { MythosCard } from '@/payload-types'

import { ensureSeedMedia } from './media'

const doomCounterAsset = {
  alt: 'Doom counters',
  filename: 'doomCounters.png',
  publicPath: '/images/misc/doomCounters.png',
}

export function normalizeCardTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function fixtureIdentity(card: Pick<StarterMythosCard, 'boxedSet' | 'title'>) {
  return `${card.boxedSet}:${normalizeCardTitle(card.title)}`
}

function documentIdentity(card: Pick<MythosCard, 'boxedset' | 'title'>) {
  return `${card.boxedset}:${normalizeCardTitle(card.title)}`
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

export async function seedMythosCards(payload: Payload) {
  const [existingCards, locations] = await Promise.all([
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
  ])

  const cardsByCode = new Map(
    existingCards.docs
      .filter((card) => card.cardCode)
      .map((card) => [card.cardCode as string, card]),
  )
  const cardsByIdentity = new Map(
    existingCards.docs.map((card) => [documentIdentity(card), card]),
  )
  const locationsByKey = new Map(locations.docs.map((location) => [location.key, location]))
  const created: string[] = []
  const linked: string[] = []
  const existing: string[] = []
  let doomCounterMediaID: string | null = null

  async function getDoomCounterMediaID() {
    if (doomCounterMediaID) return doomCounterMediaID

    const result = await ensureSeedMedia(payload, doomCounterAsset)
    doomCounterMediaID = String(result.media.id)
    return doomCounterMediaID
  }

  for (const fixture of starterMythosCards) {
    if (cardsByCode.has(fixture.cardCode)) {
      existing.push(fixture.title)
      continue
    }

    const location = fixture.locationKey ? locationsByKey.get(fixture.locationKey) : null

    if (fixture.locationKey && !location) {
      throw new Error(
        `Cannot seed "${fixture.title}" because location "${fixture.locationKey}" is missing.`,
      )
    }

    const lowerLeftImageID = fixture.lowerLeftOverride?.imagePublicPath
      ? await getDoomCounterMediaID()
      : null
    const matchingCard = cardsByIdentity.get(fixtureIdentity(fixture))

    if (matchingCard) {
      await payload.update({
        collection: 'mythos-cards',
        id: matchingCard.id,
        data: {
          cardCode: fixture.cardCode,
          copyCount: matchingCard.copyCount ?? fixture.copyCount,
          ...(location && !relationshipID(matchingCard.location)
            ? { location: location.id }
            : {}),
          ...(fixture.lowerLeftOverride && !matchingCard.lowerLeftOverride
            ? {
                lowerLeftOverride: {
                  text: fixture.lowerLeftOverride.text,
                  image: lowerLeftImageID,
                },
              }
            : {}),
          _status: matchingCard._status,
        },
        draft: matchingCard._status === 'draft',
        overrideAccess: true,
      })

      linked.push(fixture.title)
      continue
    }

    const legacyLocation = fixture.locationKey
      ? (getStarterLocation(fixture.locationKey)?.name ?? 'none')
      : 'none'

    await payload.create({
      collection: 'mythos-cards',
      data: {
        title: fixture.title,
        cardCode: fixture.cardCode,
        copyCount: fixture.copyCount,
        cardType: fixture.cardType,
        desc: fixture.description,
        location: location?.id,
        lowerLeftOverride: fixture.lowerLeftOverride
          ? {
              text: fixture.lowerLeftOverride.text,
              image: lowerLeftImageID,
            }
          : undefined,
        encounterLocation: legacyLocation,
        altLocationText: fixture.lowerLeftOverride?.text,
        altLocationImg: fixture.lowerLeftOverride?.imagePublicPath,
        monsterMoveWhite: fixture.monsterMoveWhite,
        monsterMoveBlack: fixture.monsterMoveBlack,
        boxedset: fixture.boxedSet,
        _status: 'published',
      },
      draft: false,
      overrideAccess: true,
    })

    created.push(fixture.title)
  }

  return {
    created,
    existing,
    linked,
  }
}
