import type { Payload } from 'payload'

import { starterLocations } from '@/content/locations'

import { ensureSeedMedia } from './media'

export async function seedLocations(payload: Payload) {
  const existing = await payload.find({
    collection: 'locations',
    depth: 0,
    draft: true,
    limit: starterLocations.length,
    overrideAccess: true,
    where: {
      key: {
        in: starterLocations.map((location) => location.key),
      },
    },
  })

  const existingKeys = new Set(existing.docs.map((location) => location.key))
  const created: string[] = []
  let mediaCreated = 0

  for (const location of starterLocations) {
    if (existingKeys.has(location.key)) {
      continue
    }

    const mediaResult = await ensureSeedMedia(payload, location.image)

    if (mediaResult.created) {
      mediaCreated += 1
    }

    await payload.create({
      collection: 'locations',
      data: {
        name: location.name,
        key: location.key,
        cardDisplayText: location.cardDisplayText,
        cardImage: mediaResult.media.id,
        boxedSet: location.boxedSet,
        _status: 'published',
      },
      draft: false,
      overrideAccess: true,
    })

    created.push(location.name)
  }

  return {
    created,
    existing: existing.docs.map((location) => location.name),
    mediaCreated,
  }
}
