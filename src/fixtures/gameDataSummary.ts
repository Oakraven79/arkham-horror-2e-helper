import { stat } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import {
  buildGameDataSnapshot,
  checksumGameDataSnapshot,
  gameDataSnapshotMediaKeys,
  portableMediaKeysByID,
} from './gameDataSnapshot'
import type { GameDataSnapshot } from './gameDataSnapshotTypes'

type SnapshotCollectionName = keyof GameDataSnapshot['collections']
type GameDataCountName = SnapshotCollectionName | 'media'

interface BuildCurrentGameDataSummaryOptions {
  generatedAt?: string
  mediaDirectory?: string
}

export interface CurrentGameDataSummary {
  available: true
  checksum: string
  counts: Record<GameDataCountName, number>
  generatedAt: string
  media: {
    available: number
    bytes: number
    missing: number
    missingKeys: string[]
    referenced: number
    unreferenced: number
  }
  snapshotBytes: number
  totalBytes: number
  totalRecords: number
}

function jsonBytes(value: unknown) {
  return Buffer.byteLength(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function mediaDocuments(payload: Payload) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
  })

  return result.docs as unknown as Record<string, unknown>[]
}

async function fileSize(filePath: string) {
  try {
    const stats = await stat(filePath)
    return stats.isFile() ? stats.size : null
  } catch {
    return null
  }
}

export async function buildCurrentGameDataSummary(
  payload: Payload,
  options: BuildCurrentGameDataSummaryOptions = {},
): Promise<CurrentGameDataSummary> {
  const mediaDirectory = options.mediaDirectory ?? path.resolve(process.cwd(), 'media')
  const mediaDocs = await mediaDocuments(payload)
  const mediaKeysByID = portableMediaKeysByID(mediaDocs)
  const snapshot = await buildGameDataSnapshot(payload, {
    generatedAt: options.generatedAt,
    mediaKeysByID,
  })
  const referencedMediaKeys = gameDataSnapshotMediaKeys(snapshot)
  const mediaByKey = new Map(
    mediaDocs.flatMap((document) => {
      const id = document.id
      const key =
        (typeof id === 'string' || typeof id === 'number') && mediaKeysByID.get(String(id))

      return key ? [[key, document] as const] : []
    }),
  )
  const missingKeys: string[] = []
  let mediaBytes = 0
  let availableMedia = 0

  for (const key of [...referencedMediaKeys].sort((left, right) => left.localeCompare(right))) {
    const document = mediaByKey.get(key)
    const filename = document?.filename

    if (typeof filename !== 'string' || filename.length === 0) {
      missingKeys.push(key)
      continue
    }

    const size = await fileSize(path.resolve(mediaDirectory, filename))

    if (size === null) {
      missingKeys.push(key)
      continue
    }

    availableMedia += 1
    mediaBytes += size
  }

  const counts = {
    ancientOnes: snapshot.collections.ancientOnes.length,
    arkhamEncounterCards: snapshot.collections.arkhamEncounterCards.length,
    boxedSets: snapshot.collections.boxedSets.length,
    locations: snapshot.collections.locations.length,
    media: referencedMediaKeys.size,
    mythosCards: snapshot.collections.mythosCards.length,
    neighborhoods: snapshot.collections.neighborhoods.length,
    otherWorldEncounterCards: snapshot.collections.otherWorldEncounterCards.length,
    otherWorlds: snapshot.collections.otherWorlds.length,
  }
  const snapshotSize = jsonBytes(snapshot)
  const totalRecords = Object.values(counts).reduce((total, count) => total + count, 0)

  return {
    available: true,
    checksum: checksumGameDataSnapshot(snapshot),
    counts,
    generatedAt: snapshot.generatedAt,
    media: {
      available: availableMedia,
      bytes: mediaBytes,
      missing: missingKeys.length,
      missingKeys,
      referenced: referencedMediaKeys.size,
      unreferenced: Math.max(0, mediaByKey.size - referencedMediaKeys.size),
    },
    snapshotBytes: snapshotSize,
    totalBytes: snapshotSize + mediaBytes,
    totalRecords,
  }
}
