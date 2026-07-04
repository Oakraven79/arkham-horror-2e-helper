import type { Payload } from 'payload'

import { starterLocations, type StarterLocation } from '@/content/locations'
import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION } from '@/fixtures/gameData'
import {
  fixtureRequiredSetKeys,
  relationshipID,
  requireBoxedSet,
  requireBoxedSets,
} from '@/lib/boxedSetContent'
import { neighborhoodKey } from '@/content/neighborhoods'
import type { BoxedSet, Location, Neighborhood } from '@/payload-types'

import { ensureSeedMedia } from './media'

export interface SeedLocationsOptions {
  dryRun?: boolean
}

function comparableLocation(location: Location) {
  const requiredSets = (location.requiredSets ?? [])
    .map(relationshipID)
    .filter((id): id is string => Boolean(id))

  return {
    name: location.name,
    key: location.key,
    sourceSet: relationshipID(location.sourceSet) ?? undefined,
    requiredSets:
      requiredSets.length > 0
        ? requiredSets
        : [relationshipID(location.sourceSet)].filter((id): id is string => Boolean(id)),
    board: location.board,
    neighborhood: relationshipID(location.neighborhood) ?? undefined,
    encounterBackOrder: location.encounterBackOrder ?? undefined,
    stability: location.stability,
    aquatic: location.aquatic,
    encounterTypes: [...(location.encounterTypes ?? [])],
    description: location.description ?? undefined,
    specialEncounter: location.specialEncounter ?? undefined,
    homeInvestigators: (location.homeInvestigators ?? []).map((entry) => entry.name),
    fixtureNamespace: location.fixtureNamespace ?? undefined,
    fixtureVersion: location.fixtureVersion ?? undefined,
  }
}

function requireNeighborhood(
  neighborhoodsByKey: Map<string, Neighborhood>,
  location: StarterLocation,
) {
  const key = neighborhoodKey(location.board, location.neighborhood)
  const neighborhood = neighborhoodsByKey.get(key)

  if (!neighborhood) {
    throw new Error(
      `Cannot seed location "${location.name}" because neighborhood "${key}" is missing. Run the Neighborhood seed first.`,
    )
  }

  return neighborhood
}

function fixtureMetadata(
  location: StarterLocation,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
  neighborhood: Neighborhood,
) {
  return {
    name: location.name,
    key: location.key,
    sourceSet: sourceSet.id,
    requiredSets: requiredSets.map((boxedSet) => boxedSet.id),
    board: location.board,
    neighborhood: neighborhood.id,
    encounterBackOrder: location.encounterBackOrder,
    stability: location.stability,
    aquatic: location.aquatic,
    encounterTypes: [...location.encounterTypes],
    description: location.description,
    specialEncounter: location.specialEncounter,
    homeInvestigators: location.homeInvestigators.map((name) => ({ name })),
    fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
    fixtureVersion: GAME_DATA_FIXTURE_VERSION,
  }
}

function fixtureComparable(
  location: StarterLocation,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
  neighborhood: Neighborhood,
) {
  return {
    ...fixtureMetadata(location, requiredSets, sourceSet, neighborhood),
    sourceSet: String(sourceSet.id),
    requiredSets: requiredSets.map((boxedSet) => String(boxedSet.id)),
    neighborhood: String(neighborhood.id),
    homeInvestigators: [...location.homeInvestigators],
  }
}

function metadataMatches(
  existing: Location,
  fixture: StarterLocation,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
  neighborhood: Neighborhood,
) {
  return (
    JSON.stringify(comparableLocation(existing)) ===
    JSON.stringify(fixtureComparable(fixture, requiredSets, sourceSet, neighborhood))
  )
}

export async function seedLocations(payload: Payload, options: SeedLocationsOptions = {}) {
  const dryRun = options.dryRun ?? false
  const [existing, boxedSetResult, neighborhoodResult] = await Promise.all([
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
    payload.find({
      collection: 'neighborhoods',
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
  const neighborhoodsByKey = new Map(
    neighborhoodResult.docs.map((neighborhood) => [neighborhood.key, neighborhood]),
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
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category === 'custom',
    )
    const keyMatches = allKeyMatches.filter(
      (location) =>
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category !== 'custom',
    )
    const nameMatches = (byName.get(fixture.name) ?? []).filter(
      (location) =>
        boxedSetsByID.get(relationshipID(location.sourceSet) ?? '')?.category !== 'custom',
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
    const requiredSets = requireBoxedSets(boxedSetsByKey, fixtureRequiredSetKeys(fixture))
    const neighborhood = requireNeighborhood(neighborhoodsByKey, fixture)

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
          ...fixtureMetadata(fixture, requiredSets, sourceSet, neighborhood),
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
    const needsMetadata = !metadataMatches(
      existingLocation,
      fixture,
      requiredSets,
      sourceSet,
      neighborhood,
    )

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
        ...fixtureMetadata(fixture, requiredSets, sourceSet, neighborhood),
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
