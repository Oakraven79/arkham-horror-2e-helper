import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { Payload } from 'payload'

import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION } from './gameData'
import {
  buildGameDataSnapshot,
  currentGameDataMediaKeys,
  gameDataSnapshotMediaKeys,
  portableMediaKeysByID,
  validateGameDataSnapshot,
} from './gameDataSnapshot'
import { restoreGameDataSnapshot } from './gameDataSnapshotLoader'
import type { GameDataSnapshot } from './gameDataSnapshotTypes'

const ARCHIVE_FORMAT = 'arkham-horror-2e-game-data-archive'
const ARCHIVE_VERSION = 1
const utf8Flag = 0x0800

interface ZipFile {
  data: Buffer
  name: string
}

export interface GameDataArchiveMediaFile {
  alt?: string | null
  data: Buffer
  filename: string
  key: string
  mimeType?: string | null
}

interface GameDataArchiveManifestMedia {
  alt?: string | null
  archivePath: string
  filename: string
  key: string
  mimeType?: string | null
  sha256: string
  size: number
}

interface GameDataArchiveManifest {
  format: typeof ARCHIVE_FORMAT
  generatedAt: string
  media: GameDataArchiveManifestMedia[]
  version: typeof ARCHIVE_VERSION
}

export interface ParsedGameDataArchive {
  files: Map<string, Buffer>
  manifest: GameDataArchiveManifest
  snapshot: GameDataSnapshot
}

const crcTable = new Uint32Array(256)
for (let index = 0; index < crcTable.length; index += 1) {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  crcTable[index] = value >>> 0
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function writeUInt16(value: number) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value)
  return buffer
}

function writeUInt32(value: number) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value)
  return buffer
}

function normalizedArchivePath(value: string) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '')
}

function safeFilename(value: string) {
  return path
    .basename(value)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function archiveMediaPath(key: string, filename: string) {
  const extension = path.extname(filename)
  const safeKey = safeFilename(key) || 'media'

  return `media/${safeKey}${extension}`
}

function sha256(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function jsonBuffer(value: unknown) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

export function writeZipArchive(files: ZipFile[]) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const file of files) {
    const name = Buffer.from(normalizedArchivePath(file.name), 'utf8')
    const checksum = crc32(file.data)
    const localHeader = Buffer.concat([
      writeUInt32(0x04034b50),
      writeUInt16(20),
      writeUInt16(utf8Flag),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(checksum),
      writeUInt32(file.data.length),
      writeUInt32(file.data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      name,
    ])
    const centralHeader = Buffer.concat([
      writeUInt32(0x02014b50),
      writeUInt16(20),
      writeUInt16(20),
      writeUInt16(utf8Flag),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(checksum),
      writeUInt32(file.data.length),
      writeUInt32(file.data.length),
      writeUInt16(name.length),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt16(0),
      writeUInt32(0),
      writeUInt32(offset),
      name,
    ])

    localParts.push(localHeader, file.data)
    centralParts.push(centralHeader)
    offset += localHeader.length + file.data.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endOfCentralDirectory = Buffer.concat([
    writeUInt32(0x06054b50),
    writeUInt16(0),
    writeUInt16(0),
    writeUInt16(files.length),
    writeUInt16(files.length),
    writeUInt32(centralDirectory.length),
    writeUInt32(offset),
    writeUInt16(0),
  ])

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory])
}

function findEndOfCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset
  }

  throw new Error('Archive is not a supported zip file.')
}

export function readZipArchive(buffer: Buffer) {
  const endOffset = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(endOffset + 10)
  const centralOffset = buffer.readUInt32LE(endOffset + 16)
  const files = new Map<string, Buffer>()
  let offset = centralOffset

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Archive central directory is invalid.')
    }

    const flags = buffer.readUInt16LE(offset + 8)
    const method = buffer.readUInt16LE(offset + 10)
    const expectedCrc = buffer.readUInt32LE(offset + 16)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const uncompressedSize = buffer.readUInt32LE(offset + 24)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString(flags & utf8Flag ? 'utf8' : 'binary')

    if (flags & 1) throw new Error(`Archive file ${name} is encrypted.`)
    if (method !== 0) throw new Error(`Archive file ${name} uses unsupported compression.`)
    if (compressedSize !== uncompressedSize) {
      throw new Error(`Archive file ${name} has inconsistent stored sizes.`)
    }
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Archive file ${name} has an invalid local header.`)
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localOffset + 28)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const data = buffer.subarray(dataStart, dataStart + compressedSize)

    if (crc32(data) !== expectedCrc) throw new Error(`Archive file ${name} failed checksum.`)
    if (!name.endsWith('/')) files.set(normalizedArchivePath(name), Buffer.from(data))

    offset += 46 + nameLength + extraLength + commentLength
  }

  return files
}

function stringFromArchive(files: Map<string, Buffer>, name: string) {
  const file = files.get(name)
  if (!file) throw new Error(`Archive is missing ${name}.`)
  return file.toString('utf8')
}

function parseJSONFile(files: Map<string, Buffer>, name: string) {
  try {
    return JSON.parse(stringFromArchive(files, name)) as unknown
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    throw new Error(`Archive ${name} is invalid: ${message}`)
  }
}

function requireManifest(value: unknown): GameDataArchiveManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('Archive media manifest must be an object.')
  }

  const manifest = value as Partial<GameDataArchiveManifest>

  if (manifest.format !== ARCHIVE_FORMAT || manifest.version !== ARCHIVE_VERSION) {
    throw new Error('Archive media manifest has an unsupported format.')
  }

  if (typeof manifest.generatedAt !== 'string') {
    throw new Error('Archive media manifest is missing generatedAt.')
  }

  if (!Array.isArray(manifest.media)) {
    throw new Error('Archive media manifest is missing media entries.')
  }

  for (const entry of manifest.media) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.key !== 'string' ||
      typeof entry.archivePath !== 'string' ||
      typeof entry.filename !== 'string' ||
      typeof entry.sha256 !== 'string' ||
      typeof entry.size !== 'number'
    ) {
      throw new Error('Archive media manifest contains an invalid media entry.')
    }
  }

  return manifest as GameDataArchiveManifest
}

export function createGameDataArchiveBuffer(
  snapshot: GameDataSnapshot,
  mediaFiles: GameDataArchiveMediaFile[],
) {
  const usedPaths = new Set<string>()
  const media = mediaFiles.map((file) => {
    let archivePath = archiveMediaPath(file.key, file.filename)
    let suffix = 2

    while (usedPaths.has(archivePath)) {
      const extension = path.extname(file.filename)
      archivePath = `media/${safeFilename(file.key)}-${suffix}${extension}`
      suffix += 1
    }
    usedPaths.add(archivePath)

    return {
      key: file.key,
      filename: file.filename,
      archivePath,
      alt: file.alt ?? undefined,
      mimeType: file.mimeType ?? undefined,
      size: file.data.length,
      sha256: sha256(file.data),
      data: file.data,
    }
  })
  const manifest: GameDataArchiveManifest = {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_VERSION,
    generatedAt: snapshot.generatedAt,
    media: media.map(({ data: _data, ...entry }) => entry),
  }

  return writeZipArchive([
    { name: 'snapshot.json', data: jsonBuffer(snapshot) },
    { name: 'media-manifest.json', data: jsonBuffer(manifest) },
    ...media.map((file) => ({ name: file.archivePath, data: file.data })),
  ])
}

export async function buildGameDataArchive(payload: Payload) {
  const mediaResult = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 10000,
    overrideAccess: true,
  })
  const mediaDocuments = mediaResult.docs as unknown as Record<string, unknown>[]
  const mediaKeysByID = portableMediaKeysByID(mediaDocuments)
  const snapshot = await buildGameDataSnapshot(payload, { mediaKeysByID })
  const referencedKeys = gameDataSnapshotMediaKeys(snapshot)
  const mediaByKey = new Map(
    mediaDocuments.flatMap((document) => {
      const id = document.id
      const key =
        (typeof id === 'string' || typeof id === 'number') && mediaKeysByID.get(String(id))

      return key ? [[key, document] as const] : []
    }),
  )
  const mediaFiles: GameDataArchiveMediaFile[] = []

  for (const key of [...referencedKeys].sort((left, right) => left.localeCompare(right))) {
    const document = mediaByKey.get(key)
    if (!document) throw new Error(`Snapshot references missing media ${key}.`)

    const filename = document.filename
    if (typeof filename !== 'string' || filename.length === 0) {
      throw new Error(`Snapshot media ${key} has no stored filename.`)
    }

    const filePath = path.resolve(process.cwd(), 'media', filename)
    const data = await readFile(filePath)

    mediaFiles.push({
      key,
      filename,
      alt: typeof document.alt === 'string' ? document.alt : null,
      mimeType: typeof document.mimeType === 'string' ? document.mimeType : null,
      data,
    })
  }

  return createGameDataArchiveBuffer(snapshot, mediaFiles)
}

export function readGameDataArchive(buffer: Buffer): ParsedGameDataArchive {
  const files = readZipArchive(buffer)
  const snapshot = parseJSONFile(files, 'snapshot.json') as GameDataSnapshot
  const manifest = requireManifest(parseJSONFile(files, 'media-manifest.json'))
  const validation = validateGameDataSnapshot(snapshot)

  if (!validation.valid) {
    throw new Error(`Archive snapshot is invalid: ${validation.errors.join('; ')}`)
  }

  for (const entry of manifest.media) {
    const archivePath = normalizedArchivePath(entry.archivePath)
    const file = files.get(archivePath)

    if (!file) throw new Error(`Archive is missing media file ${archivePath}.`)
    if (file.length !== entry.size) throw new Error(`Archive media ${entry.key} has wrong size.`)
    if (sha256(file) !== entry.sha256) {
      throw new Error(`Archive media ${entry.key} failed checksum validation.`)
    }
  }

  return { files, manifest, snapshot }
}

async function findMediaByAssetKey(payload: Payload, assetKey: string) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      assetKey: {
        equals: assetKey,
      },
    },
  })

  return result.docs[0] ?? null
}

export async function importGameDataArchive(payload: Payload, buffer: Buffer) {
  const archive = readGameDataArchive(buffer)
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'game-data-archive-'))
  const media = {
    created: [] as string[],
    updated: [] as string[],
  }

  try {
    for (const entry of archive.manifest.media) {
      const archivePath = normalizedArchivePath(entry.archivePath)
      const file = archive.files.get(archivePath)
      if (!file) throw new Error(`Archive is missing media file ${archivePath}.`)

      const importPath = path.join(
        temporaryDirectory,
        `${safeFilename(entry.key) || 'media'}-${safeFilename(entry.filename) || 'upload'}`,
      )
      await writeFile(importPath, file)

      const existing = await findMediaByAssetKey(payload, entry.key)
      const data = {
        assetKey: entry.key,
        alt: entry.alt ?? entry.filename,
        fixtureNamespace: GAME_DATA_FIXTURE_NAMESPACE,
        fixtureVersion: GAME_DATA_FIXTURE_VERSION,
      }

      if (existing) {
        await payload.update({
          collection: 'media',
          id: existing.id,
          data,
          filePath: importPath,
          overrideAccess: true,
        } as never)
        media.updated.push(entry.key)
      } else {
        await payload.create({
          collection: 'media',
          data,
          filePath: importPath,
          overrideAccess: true,
        })
        media.created.push(entry.key)
      }
    }

    const mediaKeys = await currentGameDataMediaKeys(payload)
    const snapshotValidation = validateGameDataSnapshot(archive.snapshot, mediaKeys)

    if (!snapshotValidation.valid) {
      throw new Error(
        `Archive snapshot references missing media: ${snapshotValidation.errors.join('; ')}`,
      )
    }

    const restoredCollections = await restoreGameDataSnapshot(payload, archive.snapshot)

    return {
      validation: snapshotValidation,
      collections: {
        media,
        ...restoredCollections,
      },
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
}
