import type { Payload } from 'payload'

import { starterLocations, type StarterLocation } from '@/content/locations'
import { officialBoxedSetName, relationshipID, requireBoxedSet } from '@/lib/boxedSetContent'
import type { BoxedSet, Location } from '@/payload-types'

import { ensureSeedMedia } from './media'

export interface SeedLocationsOptions {
  dryRun?: boolean
}

function comparableLocation(location: Location) {
  return {
    name: location.name,
    key: location.key,
    boxedSet: location.boxedSet,
    sourceSet: relationshipID(location.sourceSet) ?? undefined,
    board: location.board,
    neighborhood: location.neighborhood,
    stability: location.stability,
    aquatic: location.aquatic,
    encounterTypes: [...(location.encounterTypes ?? [])],
    description: location.description ?? undefined,
    specialEncounter: location.specialEncounter ?? undefined,
    homeInvestigators: (location.homeInvestigators ?? []).map((entry) => entry.name),
  }
}

function fixtureMetadata(location: StarterLocation, sourceSet: BoxedSet) {
  return {
    name: location.name,
    key: location.key,
    boxedSet: officialBoxedSetName(location.sourceSetKey) as Location['boxedSet'],
    sourceSet: sourceSet.id,
    board: location.board,
    neighborhood: location.neighborhood,
    stability: location.stability,
    aquatic: location.aquatic,
    encounterTypes: [...location.encounterTypes],
    description: location.description,
    specialEncounter: location.specialEncounter,
    homeInvestigators: location.homeInvestigators.map((name) => ({ name })),
  }
}

function fixtureComparable(location: StarterLocation, sourceSet: BoxedSet) {
  return {
    ...fixtureMetadata(location, sourceSet),
    sourceSet: String(sourceSet.id),
    homeInvestigators: [...location.homeInvestigators],
  }
}

function metadataMatches(existing: Location, fixture: StarterLocation, sourceSet: BoxedSet) {
  return (
    JSON.stringify(comparableLocation(existing)) ===
    JSON.stringify(fixtureComparable(fixture, sourceSet))
  )
}

export async function seedLocations(payload: Payload, options: SeedLocationsOptions = {}) {
  const dryRun = options.dryRun ?? false
  const [existing, boxedSetResult] = await Promise.all([
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
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const boxedSetsByID = new Map(
    boxedSetResult.docs.map((boxedSet) => [String(boxedSet.id), boxedSet]),
  )
  const byKey = new Map<string, Location[]>()
  const byName = new Map<string, Location[]>()

  for (const location of existing.docs) {
    byKey.set(location.key, [...(byKey.get(location.key) ?? []), location])
    byName.set(location.name, [...(byName.get(location.name) ?? []), location])
  }

  const matches = starterLocations.map((fixture) => {
    const allKeyMatches = byKey.get(fixture.key) ?? []
    const customKeyConflict = allKeyMatches.some(
      (location) =>
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category === 'custom' ||
        location.boxedSet === 'Custom',
    )
    const keyMatches = allKeyMatches.filter(
      (location) =>
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category !== 'custom' &&
        location.boxedSet !== 'Custom',
    )
    const nameMatches = (byName.get(fixture.name) ?? []).filter(
      (location) =>
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category !== 'custom' &&
        location.boxedSet !== 'Custom',
    )
    const candidates = keyMatches.length > 0 ? keyMatches : nameMatches

    return {
      candidates,
      customKeyConflict,
      fixture,
      matchedBy: keyMatches.length > 0 ? 'key' : nameMatches.length > 0 ? 'name' : null,
    }
  })
  const ambiguous = matches
    .filter((match) => match.customKeyConflict || match.candidates.length > 1)
    .map((match) => match.fixture.name)

  if (ambiguous.length > 0 && !dryRun) {
    throw new Error(`Ambiguous official location matches: ${ambiguous.join(', ')}`)
  }

  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []
  let mediaCreated = 0

  for (const match of matches) {
    if (match.customKeyConflict || match.candidates.length > 1) {
      continue
    }

    const { fixture } = match
    const existingLocation = match.candidates[0]
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)

    if (!existingLocation) {
      created.push(fixture.name)

      if (dryRun) continue

      const mediaResult = fixture.image ? await ensureSeedMedia(payload, fixture.image) : null

      if (mediaResult?.created) {
        mediaCreated += 1
      }

      await payload.create({
        collection: 'locations',
        data: {
          ...fixtureMetadata(fixture, sourceSet),
          cardDisplayText: fixture.cardDisplayText,
          cardImage: mediaResult?.media.id,
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    const needsDisplayText = !existingLocation.cardDisplayText
    const needsImage = Boolean(fixture.image && !existingLocation.cardImage)
    const needsMetadata = !metadataMatches(existingLocation, fixture, sourceSet)

    if (!needsDisplayText && !needsImage && !needsMetadata) {
      unchanged.push(fixture.name)
      continue
    }

    enriched.push(fixture.name)

    if (dryRun) continue

    const mediaResult =
      needsImage && fixture.image ? await ensureSeedMedia(payload, fixture.image) : null

    if (mediaResult?.created) {
      mediaCreated += 1
    }

    await payload.update({
      collection: 'locations',
      id: existingLocation.id,
      data: {
        ...fixtureMetadata(fixture, sourceSet),
        ...(needsDisplayText ? { cardDisplayText: fixture.cardDisplayText } : {}),
        ...(mediaResult ? { cardImage: mediaResult.media.id } : {}),
        _status: existingLocation._status,
      },
      draft: existingLocation._status === 'draft',
      overrideAccess: true,
    })
  }

  return {
    ambiguous,
    created,
    dryRun,
    enriched,
    mediaCreated,
    unchanged,
  }
}
