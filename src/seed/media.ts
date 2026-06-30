import path from 'node:path'

import type { Payload } from 'payload'

import {
  GAME_DATA_FIXTURE_NAMESPACE,
  GAME_DATA_FIXTURE_VERSION,
} from '@/fixtures/gameData'

export interface SeedMediaAsset {
  alt: string
  filename: string
  fixtureKey: string
  matchFilename?: string
  publicPath: string
}

export async function findMediaByFilename(payload: Payload, filename: string) {
  const existing = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      filename: {
        equals: filename,
      },
    },
  })

  return existing.docs[0] ?? null
}

export async function ensureSeedMedia(payload: Payload, asset: SeedMediaAsset) {
  const byAssetKey = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      assetKey: {
        equals: asset.fixtureKey,
      },
    },
  })
  const existing =
    byAssetKey.docs[0] ??
    (await findMediaByFilename(payload, asset.matchFilename ?? asset.filename))

  if (existing) {
    if (
      existing.assetKey !== asset.fixtureKey ||
      existing.alt !== asset.alt ||
      existing.fixtureNamespace !== GAME_DATA_FIXTURE_NAMESPACE ||
      existing.fixtureVersion !== GAME_DATA_FIXTURE_VERSION
    ) {
      const media = await payload.update({
        collection: 'media',
        id: existing.id,
        data: {
          assetKey: asset.fixtureKey,
          alt: asset.alt,
          fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
          fixtureVersion: GAME_DATA_FIXTURE_VERSION,
        },
        overrideAccess: true,
      })

      return {
        created: false,
        media,
        updated: true,
      }
    }

    return {
      created: false,
      media: existing,
      updated: false,
    }
  }

  const media = await payload.create({
    collection: 'media',
    data: {
      assetKey: asset.fixtureKey,
      alt: asset.alt,
      fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
      fixtureVersion: GAME_DATA_FIXTURE_VERSION,
    },
    filePath: path.resolve(process.cwd(), 'public', asset.publicPath.replace(/^\/+/, '')),
    overrideAccess: true,
  })

  return {
    created: true,
    media,
    updated: false,
  }
}
