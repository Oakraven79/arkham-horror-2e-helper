import path from 'node:path'

import type { Payload } from 'payload'

export interface SeedMediaAsset {
  alt: string
  filename: string
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
  const existing = await findMediaByFilename(payload, asset.filename)

  if (existing) {
    return {
      created: false,
      media: existing,
    }
  }

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: asset.alt,
    },
    filePath: path.resolve(process.cwd(), 'public', asset.publicPath.replace(/^\/+/, '')),
    overrideAccess: true,
  })

  return {
    created: true,
    media,
  }
}
