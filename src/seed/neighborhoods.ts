import type { Payload } from 'payload'

import { starterNeighborhoods, type NeighborhoodFixture } from '@/content/neighborhoods'
import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION } from '@/fixtures/gameData'
import {
  fixtureRequiredSetKeys,
  relationshipID,
  requireBoxedSet,
  requireBoxedSets,
} from '@/lib/boxedSetContent'
import type { BoxedSet, Neighborhood } from '@/payload-types'

import { ensureSeedMedia } from './media'

export interface SeedNeighborhoodsOptions {
  dryRun?: boolean
}

function fixtureMetadata(
  fixture: NeighborhoodFixture,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
) {
  return {
    name: fixture.name,
    key: fixture.key,
    board: fixture.board,
    colourName: fixture.colourName,
    colourHex: fixture.colourHex,
    sourceSet: sourceSet.id,
    requiredSets: requiredSets.map((boxedSet) => boxedSet.id),
    fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
    fixtureVersion: GAME_DATA_FIXTURE_VERSION,
  }
}

function comparableNeighborhood(neighborhood: Neighborhood) {
  const requiredSets = (neighborhood.requiredSets ?? [])
    .map(relationshipID)
    .filter((id): id is string => Boolean(id))

  return {
    name: neighborhood.name,
    key: neighborhood.key,
    board: neighborhood.board,
    colourName: neighborhood.colourName ?? undefined,
    colourHex: neighborhood.colourHex ?? undefined,
    sourceSet: relationshipID(neighborhood.sourceSet) ?? undefined,
    requiredSets:
      requiredSets.length > 0
        ? requiredSets
        : [relationshipID(neighborhood.sourceSet)].filter((id): id is string => Boolean(id)),
    fixtureNamespace: neighborhood.fixtureNamespace ?? undefined,
    fixtureVersion: neighborhood.fixtureVersion ?? undefined,
  }
}

export async function seedNeighborhoods(payload: Payload, options: SeedNeighborhoodsOptions = {}) {
  const dryRun = options.dryRun ?? false
  const [existingResult, boxedSetResult] = await Promise.all([
    payload.find({
      collection: 'neighborhoods',
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
  const neighborhoodsByKey = new Map(
    existingResult.docs.map((neighborhood) => [neighborhood.key, neighborhood]),
  )
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []
  let mediaCreated = 0

  for (const fixture of starterNeighborhoods) {
    const existing = neighborhoodsByKey.get(fixture.key)
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)
    const requiredSets = requireBoxedSets(boxedSetsByKey, fixtureRequiredSetKeys(fixture))
    const metadata = fixtureMetadata(fixture, requiredSets, sourceSet)
    const metadataMatches =
      existing &&
      JSON.stringify(comparableNeighborhood(existing)) ===
        JSON.stringify({
          ...metadata,
          sourceSet: String(sourceSet.id),
          requiredSets: requiredSets.map((boxedSet) => String(boxedSet.id)),
        })
    const needsFrontFrame = Boolean(fixture.frontFrame && !existing?.frontFrame)
    const needsBackFrame = Boolean(fixture.backFrame && !existing?.backFrame)

    if (!existing) {
      created.push(fixture.key)
    } else if (!metadataMatches || needsFrontFrame || needsBackFrame) {
      enriched.push(fixture.key)
    } else {
      unchanged.push(fixture.key)
      continue
    }

    if (dryRun) continue

    const [frontFrame, backFrame] = await Promise.all([
      fixture.frontFrame ? ensureSeedMedia(payload, fixture.frontFrame) : null,
      fixture.backFrame ? ensureSeedMedia(payload, fixture.backFrame) : null,
    ])

    if (frontFrame?.created) mediaCreated += 1
    if (backFrame?.created) mediaCreated += 1

    if (!existing) {
      await payload.create({
        collection: 'neighborhoods',
        data: {
          ...metadata,
          frontFrame: frontFrame?.media.id,
          backFrame: backFrame?.media.id,
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    await payload.update({
      collection: 'neighborhoods',
      id: existing.id,
      data: {
        ...metadata,
        frontFrame: relationshipID(existing.frontFrame) ?? frontFrame?.media.id,
        backFrame: relationshipID(existing.backFrame) ?? backFrame?.media.id,
        _status: existing._status,
      },
      draft: existing._status === 'draft',
      overrideAccess: true,
    })
  }

  return {
    created,
    dryRun,
    enriched,
    mediaCreated,
    unchanged,
  }
}
