import type { Payload } from 'payload'

import { getStarterLocation } from '@/content/locations'
import { starterMythosCards, type StarterMythosCard } from '@/content/mythosCards'
import type { Location, MythosCard } from '@/payload-types'

import { ensureSeedMedia } from './media'

const doomCounterAsset = {
  alt: 'Doom counters',
  filename: 'doomCounters.png',
  publicPath: '/images/misc/doomCounters.png',
}

export interface SeedMythosCardsOptions {
  dryRun?: boolean
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

function fixtureRulesNotes(fixture: StarterMythosCard) {
  return fixture.rulesNotes?.map((note) => ({ ...note }))
}

function fixtureMetadata(fixture: StarterMythosCard, locationsByKey: Map<string, Location>) {
  const gateLocations = fixture.gateInstruction.locationKeys.map(
    (key) => locationsByKey.get(key) as Location,
  )
  const primaryLocation = fixture.locationKey ? locationsByKey.get(fixture.locationKey) : undefined
  const locationName = fixture.locationKey ? getStarterLocation(fixture.locationKey)?.name : null
  const legacyLocation: MythosCard['encounterLocation'] =
    locationName === 'The Witch House' ||
    locationName === 'Unvisited Isle' ||
    locationName === 'Black Cave'
      ? locationName
      : 'none'

  return {
    cardCode: fixture.cardCode,
    copyCount: fixture.copyCount,
    cardType: fixture.cardType,
    flavorText: fixture.flavorText,
    effectText: fixture.effectText,
    ongoingEffect: fixture.ongoingEffect,
    passCondition: fixture.passCondition,
    failCondition: fixture.failCondition,
    clueText: fixture.clueText,
    gateInstruction: {
      mode: fixture.gateInstruction.mode,
      locations: gateLocations.map((location) => location.id),
      burst: fixture.gateInstruction.burst,
    },
    doomTokens: fixture.doomTokens,
    terrorIncrease: fixture.terrorIncrease,
    reshuffleDeck: fixture.reshuffleDeck ?? false,
    specialInstruction: fixture.specialInstruction,
    rulesNotes: fixtureRulesNotes(fixture),
    location: primaryLocation?.id,
    encounterLocation: legacyLocation,
    monsterMoveWhite: fixture.monsterMoveWhite,
    monsterMoveBlack: fixture.monsterMoveBlack,
    boxedset: fixture.boxedSet,
  }
}

function comparableDocument(card: MythosCard) {
  const notes = card.rulesNotes?.map((note) => ({
    kind: note.kind,
    text: note.text,
  }))
  const monsterMoveWhite = card.monsterMoveWhite ?? []
  const monsterMoveBlack = card.monsterMoveBlack ?? []

  return {
    cardCode: card.cardCode,
    copyCount: card.copyCount,
    cardType: card.cardType,
    flavorText: card.flavorText ?? undefined,
    effectText: card.effectText ?? undefined,
    ongoingEffect: card.ongoingEffect ?? undefined,
    passCondition: card.passCondition ?? undefined,
    failCondition: card.failCondition ?? undefined,
    clueText: card.clueText ?? undefined,
    gateInstruction: {
      mode: card.gateInstruction?.mode ?? 'none',
      locations: (card.gateInstruction?.locations ?? [])
        .map(relationshipID)
        .filter((id): id is string => Boolean(id)),
      burst: card.gateInstruction?.burst ?? false,
    },
    doomTokens: card.doomTokens ?? undefined,
    terrorIncrease: card.terrorIncrease ?? undefined,
    reshuffleDeck: card.reshuffleDeck ?? false,
    specialInstruction: card.specialInstruction ?? undefined,
    rulesNotes: notes && notes.length > 0 ? notes : undefined,
    location: relationshipID(card.location) ?? undefined,
    encounterLocation: card.encounterLocation,
    monsterMoveWhite: monsterMoveWhite.length > 0 ? monsterMoveWhite : undefined,
    monsterMoveBlack: monsterMoveBlack.length > 0 ? monsterMoveBlack : undefined,
    boxedset: card.boxedset,
  }
}

function comparableFixture(fixture: StarterMythosCard, locationsByKey: Map<string, Location>) {
  const metadata = fixtureMetadata(fixture, locationsByKey)

  return {
    ...metadata,
    gateInstruction: {
      ...metadata.gateInstruction,
      locations: metadata.gateInstruction.locations.map(String),
    },
    location: metadata.location ? String(metadata.location) : undefined,
  }
}

function metadataDifferences(
  card: MythosCard,
  fixture: StarterMythosCard,
  locationsByKey: Map<string, Location>,
) {
  const document = comparableDocument(card)
  const expected = comparableFixture(fixture, locationsByKey)

  return Object.keys(expected).filter(
    (field) =>
      JSON.stringify(document[field as keyof typeof document]) !==
      JSON.stringify(expected[field as keyof typeof expected]),
  )
}

export async function seedMythosCards(payload: Payload, options: SeedMythosCardsOptions = {}) {
  const dryRun = options.dryRun ?? false
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

  const cardsByCode = new Map<string, MythosCard[]>()
  const cardsByIdentity = new Map<string, MythosCard[]>()
  const locationsByKey = new Map(locations.docs.map((location) => [location.key, location]))

  for (const card of existingCards.docs) {
    cardsByCode.set(card.cardCode, [...(cardsByCode.get(card.cardCode) ?? []), card])
    const identity = documentIdentity(card)
    cardsByIdentity.set(identity, [...(cardsByIdentity.get(identity) ?? []), card])
  }

  const unresolvedLocations = [
    ...new Set(
      starterMythosCards.flatMap((fixture) =>
        [fixture.locationKey, ...fixture.gateInstruction.locationKeys].filter(
          (key): key is string => Boolean(key && !locationsByKey.has(key)),
        ),
      ),
    ),
  ]
  const matches = starterMythosCards.map((fixture) => {
    const codeMatches = cardsByCode.get(fixture.cardCode) ?? []
    const identityMatches = cardsByIdentity.get(fixtureIdentity(fixture)) ?? []

    return {
      fixture,
      candidates: codeMatches.length > 0 ? codeMatches : identityMatches,
    }
  })
  const ambiguous = matches
    .filter((match) => match.candidates.length > 1)
    .map((match) => match.fixture.title)

  if (!dryRun && unresolvedLocations.length > 0) {
    throw new Error(
      `Cannot seed Mythos cards because locations are missing: ${unresolvedLocations.join(', ')}`,
    )
  }

  if (!dryRun && ambiguous.length > 0) {
    throw new Error(`Ambiguous official Mythos card matches: ${ambiguous.join(', ')}`)
  }

  const created: string[] = []
  const enriched: string[] = []
  const enrichmentDetails: { fields: string[]; title: string }[] = []
  const unchanged: string[] = []
  let mediaCreated = 0
  let doomCounterMediaID: string | null = null

  async function getDoomCounterMediaID() {
    if (doomCounterMediaID) return doomCounterMediaID

    const result = await ensureSeedMedia(payload, doomCounterAsset)
    doomCounterMediaID = String(result.media.id)

    if (result.created) {
      mediaCreated += 1
    }

    return doomCounterMediaID
  }

  if (unresolvedLocations.length > 0) {
    return {
      ambiguous,
      created,
      dryRun,
      enriched,
      enrichmentDetails,
      mediaCreated,
      physicalCards: starterMythosCards.reduce((total, card) => total + card.copyCount, 0),
      unchanged,
      unresolvedLocations,
    }
  }

  for (const match of matches) {
    if (match.candidates.length > 1) continue

    const { fixture } = match
    const existingCard = match.candidates[0]
    const metadata = fixtureMetadata(fixture, locationsByKey)

    if (!existingCard) {
      created.push(fixture.title)

      if (dryRun) continue

      const lowerLeftImageID = fixture.lowerLeftOverride?.imagePublicPath
        ? await getDoomCounterMediaID()
        : null

      await payload.create({
        collection: 'mythos-cards',
        data: {
          title: fixture.title,
          desc: fixture.description,
          ...metadata,
          lowerLeftOverride: fixture.lowerLeftOverride
            ? {
                text: fixture.lowerLeftOverride.text,
                image: lowerLeftImageID,
              }
            : undefined,
          altLocationText: fixture.lowerLeftOverride?.text,
          altLocationImg: fixture.lowerLeftOverride?.imagePublicPath,
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    const changedMetadata = metadataDifferences(existingCard, fixture, locationsByKey)
    const needsMetadata = changedMetadata.length > 0
    const needsDescription = !existingCard.desc && Boolean(fixture.description)
    const needsLowerLeft =
      Boolean(fixture.lowerLeftOverride) &&
      !existingCard.lowerLeftOverride?.text &&
      !relationshipID(existingCard.lowerLeftOverride?.image)

    if (!needsMetadata && !needsDescription && !needsLowerLeft) {
      unchanged.push(fixture.title)
      continue
    }

    enriched.push(fixture.title)
    enrichmentDetails.push({
      title: fixture.title,
      fields: [
        ...changedMetadata,
        ...(needsDescription ? ['desc'] : []),
        ...(needsLowerLeft ? ['lowerLeftOverride'] : []),
      ],
    })

    if (dryRun) continue

    const lowerLeftImageID =
      needsLowerLeft && fixture.lowerLeftOverride?.imagePublicPath
        ? await getDoomCounterMediaID()
        : null

    await payload.update({
      collection: 'mythos-cards',
      id: existingCard.id,
      data: {
        ...metadata,
        ...(needsDescription ? { desc: fixture.description } : {}),
        ...(needsLowerLeft
          ? {
              lowerLeftOverride: {
                text: fixture.lowerLeftOverride?.text,
                image: lowerLeftImageID,
              },
            }
          : {}),
        _status: existingCard._status,
      },
      draft: existingCard._status === 'draft',
      overrideAccess: true,
    })
  }

  return {
    ambiguous,
    created,
    dryRun,
    enriched,
    enrichmentDetails,
    mediaCreated,
    physicalCards: starterMythosCards.reduce((total, card) => total + card.copyCount, 0),
    unchanged,
    unresolvedLocations,
  }
}
