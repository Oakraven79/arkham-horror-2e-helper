import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import {
  createGameDataArchiveBuffer,
  importGameDataArchive,
  readGameDataArchive,
} from '@/fixtures/gameDataArchive'
import { gameDataFixture } from '@/fixtures/gameData'
import { validateGameDataFixture } from '@/fixtures/gameDataLoader'
import {
  buildGameDataSnapshot,
  GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS,
  validateGameDataSnapshot,
} from '@/fixtures/gameDataSnapshot'
import { restoreGameDataSnapshot } from '@/fixtures/gameDataSnapshotLoader'
import { buildCurrentGameDataSummary } from '@/fixtures/gameDataSummary'
import type { GameDataSnapshot } from '@/fixtures/gameDataSnapshotTypes'

function sampleGameDataSnapshot(): GameDataSnapshot {
  return {
    generatedAt: '2026-07-04T00:00:00.000Z',
    excludedCollections: GAME_DATA_SNAPSHOT_EXCLUDED_COLLECTIONS,
    collections: {
      boxedSets: [
        {
          name: 'Base Game',
          key: 'base-game',
          icon: 'media-core',
          _status: 'published',
        },
      ],
      ancientOnes: [
        {
          name: 'Cthulhu',
          key: 'cthulhu',
          sourceSet: 'base-game',
          sheets: [
            {
              key: 'standard',
              sheetImage: 'media-yig-sheet',
            },
          ],
          _status: 'published',
        },
      ],
      neighborhoods: [
        {
          name: 'Uptown',
          key: 'arkham-uptown',
          sourceSet: 'base-game',
          frontFrame: 'media-core',
          _status: 'published',
        },
      ],
      locations: [
        {
          name: 'Woods',
          key: 'woods',
          sourceSet: 'base-game',
          neighborhood: 'arkham-uptown',
          cardImage: 'media-core',
          _status: 'published',
        },
      ],
      arkhamEncounterCards: [
        {
          cardCode: 'base-uptown-001',
          sourceSet: 'base-game',
          neighborhood: 'arkham-uptown',
          encounters: [
            {
              location: 'woods',
              text: 'A cold wind moves through the trees.',
            },
          ],
          _status: 'published',
        },
      ],
      mythosCards: [
        {
          title: 'The Stars Are Right',
          cardCode: 'base-mythos-001',
          sourceSet: 'base-game',
          gateInstruction: {
            mode: 'single',
            locations: ['woods'],
          },
          lowerLeftOverride: {
            image: 'media-core',
          },
          _status: 'published',
        },
      ],
      otherWorlds: [
        {
          name: 'The Abyss',
          key: 'abyss',
          sourceSet: 'base-game',
          art: 'media-core',
          _status: 'published',
        },
      ],
      otherWorldEncounterCards: [
        {
          cardCode: 'base-blue-001',
          sourceSet: 'base-game',
          encounters: [
            {
              destination: 'abyss',
              text: 'The darkness answers.',
            },
          ],
          _status: 'published',
        },
      ],
    },
  }
}

function cmsSnapshotDocuments(): Record<string, Record<string, unknown>[]> {
  return {
    media: [
      {
        id: 'media-1',
        assetKey: 'media-core',
        alt: 'Core art',
        createdAt: '2026-07-03T00:00:00.000Z',
      },
      {
        id: 'media-without-fixture-key',
        alt: 'Unrelated upload',
        filename: 'scratch-upload.png',
      },
      {
        id: 'media-yig-sheet',
        alt: 'Yig sheet',
        filename: 'yig-sheet.png',
      },
    ],
    'boxed-sets': [
      {
        id: 'box-1',
        name: 'Base Game',
        key: 'base-game',
        icon: 'media-1',
        fixtureNamespace: 'arkham-horror-2e',
        _status: 'published',
      },
    ],
    'ancient-ones': [
      {
        id: 'ancient-1',
        name: 'Cthulhu',
        key: 'cthulhu',
        boxedSet: 'Base Game',
        sourceSet: 'box-1',
        sheets: [
          {
            id: 'ancient-sheet-1',
            key: 'standard',
            sheetImage: 'media-yig-sheet',
          },
        ],
        updatedAt: '2026-07-03T00:00:00.000Z',
        _status: 'published',
      },
    ],
    neighborhoods: [
      {
        id: 'neighborhood-1',
        name: 'Uptown',
        key: 'arkham-uptown',
        sourceSet: 'box-1',
        frontFrame: 'media-1',
        _status: 'published',
      },
    ],
    locations: [
      {
        id: 'location-1',
        name: 'Woods',
        key: 'woods',
        customSetName: 'Legacy Custom',
        sourceSet: 'box-1',
        neighborhood: 'neighborhood-1',
        cardImage: 'media-1',
        _status: 'published',
      },
    ],
    'arkham-encounter-cards': [
      {
        id: 'arkham-card-1',
        cardCode: 'base-uptown-001',
        sourceSet: 'box-1',
        neighborhood: 'neighborhood-1',
        encounters: [
          {
            id: 'arkham-row-1',
            location: 'location-1',
            text: 'A cold wind moves through the trees.',
          },
        ],
        _status: 'published',
      },
    ],
    'mythos-cards': [
      {
        id: 'mythos-card-1',
        title: 'The Stars Are Right',
        cardCode: 'base-mythos-001',
        boxedset: 'Base Game',
        sourceSet: 'box-1',
        gateInstruction: {
          mode: 'single',
          locations: ['location-1'],
        },
        lowerLeftOverride: {
          image: 'media-1',
        },
        _status: 'published',
      },
    ],
    'other-worlds': [
      {
        id: 'other-world-1',
        name: 'The Abyss',
        key: 'abyss',
        boxedSet: 'Base Game',
        sourceSet: 'box-1',
        art: 'media-1',
        _status: 'published',
      },
    ],
    'other-world-encounter-cards': [
      {
        id: 'other-world-card-1',
        cardCode: 'base-blue-001',
        sourceSet: 'box-1',
        encounters: [
          {
            id: 'other-world-row-1',
            destination: 'other-world-1',
            text: 'The darkness answers.',
          },
        ],
        _status: 'published',
      },
    ],
    users: [
      {
        id: 'user-1',
        email: 'keeper@example.com',
      },
    ],
    'game-sessions': [
      {
        id: 'session-1',
        name: 'Do not export me',
      },
    ],
    'fixture-installations': [
      {
        id: 'fixture-installation-1',
        status: 'succeeded',
      },
    ],
  }
}

describe('Game data fixture', () => {
  it('is complete and internally valid', () => {
    const validation = validateGameDataFixture()

    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.counts).toEqual({
      ancientOnes: 25,
      arkhamEncounterCards: 63,
      boxedSets: 11,
      locations: 57,
      media: 133,
      mythosCards: 287,
      neighborhoods: 19,
      otherWorldEncounterCards: 48,
      otherWorlds: 12,
    })
    expect(validation.checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(gameDataFixture.mediaRelationships.boxedSetIcons).toEqual({
      'black-goat': 'media-black-goat',
      'curse-dark-pharaoh-original': 'media-dark-pharoah-1st',
      'curse-dark-pharaoh-revised': 'media-dark-pharoah-revised',
      'dunwich-horror': 'media-dunwich',
      'innsmouth-horror': 'media-innsmouth',
      'king-in-yellow': 'media-king-in-yellow',
      'kingsport-horror': 'media-kingsport',
      'lurker-at-the-threshold': 'media-lurker',
      'miskatonic-horror': 'media-miskatonic',
      promotional: 'media-arkham-nights',
    })
    expect(
      Object.fromEntries(
        gameDataFixture.snapshot.collections.boxedSets.flatMap((boxedSet) =>
          boxedSet.icon ? [[boxedSet.key, boxedSet.icon]] : [],
        ),
      ),
    ).toEqual(gameDataFixture.mediaRelationships.boxedSetIcons)
    expect(gameDataFixture.media.map((asset) => asset.fixtureKey)).toEqual(
      expect.arrayContaining([
        'media-abhoth',
        'media-arkham-nights',
        'media-bokrug',
        'media-chaugnah-faugri',
        'media-cthuga',
        'media-daloth',
        'media-eihort',
        'media-ghatanotha',
        'media-glaaki',
        'media-golon',
        'media-hastur-2',
        'media-ithaqua',
        'media-nacha',
        'media-nyogtha',
        'media-quachil-uttaus-1',
        'media-rhan-tegoth',
        'media-shudde-mell',
        'media-tsathogga',
        'media-yibb',
        'media-yig2',
        'media-yog-sothoth',
        'media-zhar',
      ]),
    )
    expect(
      gameDataFixture.snapshot.collections.arkhamEncounterCards.map((card) => card.cardCode),
    ).toEqual(
      expect.arrayContaining([
        'base-downtown-002',
        'base-downtown-003',
        'base-downtown-004',
        'base-downtown-005',
        'base-downtown-006',
        'base-downtown-007',
        'base-northside-002',
        'base-northside-003',
        'base-northside-004',
        'base-northside-005',
        'base-northside-006',
        'base-northside-007',
        'base-rivertown-002',
        'base-rivertown-003',
        'base-rivertown-004',
        'base-rivertown-005',
        'base-rivertown-006',
        'base-rivertown-007',
        'base-southside-002',
        'base-southside-003',
        'base-southside-004',
        'base-southside-005',
        'base-southside-006',
        'base-southside-007',
        'base-uptown-002',
        'base-uptown-003',
        'base-uptown-004',
        'base-uptown-005',
        'base-uptown-006',
        'base-uptown-007',
      ]),
    )
    expect(
      gameDataFixture.snapshot.collections.otherWorldEncounterCards.map((card) => card.cardCode),
    ).toEqual(
      expect.arrayContaining([
        'base-blue-002',
        'base-blue-003',
        'base-blue-004',
        'base-blue-005',
        'base-blue-006',
        'base-blue-007',
        'base-blue-008',
        'base-blue-009',
        'base-blue-010',
        'base-blue-011',
        'base-blue-012',
        'base-green-002',
        'base-green-003',
        'base-green-004',
        'base-green-005',
        'base-green-006',
        'base-green-007',
        'base-green-008',
        'base-green-009',
        'base-green-010',
        'base-green-011',
        'base-green-012',
        'base-red-002',
        'base-red-003',
        'base-red-004',
        'base-red-005',
        'base-red-006',
        'base-red-007',
        'base-red-008',
        'base-red-009',
        'base-red-010',
        'base-red-011',
        'base-red-012',
        'base-yellow-002',
        'base-yellow-003',
        'base-yellow-004',
        'base-yellow-005',
        'base-yellow-006',
        'base-yellow-007',
        'base-yellow-008',
        'base-yellow-009',
        'base-yellow-010',
        'base-yellow-011',
        'base-yellow-012',
      ]),
    )
  })

  it('stores portable relationship keys instead of Payload IDs', () => {
    const serialized = JSON.stringify(gameDataFixture)

    expect(serialized).not.toContain('"id":')
    expect(serialized).not.toContain('"boxedSet":')
    expect(serialized).not.toContain('"boxedset":')
    expect(serialized).not.toContain('"customSetName":')
    expect(serialized).not.toContain('/media/')
    expect(serialized).not.toContain('/api/media/')
    expect(
      gameDataFixture.media.every((asset) =>
        asset.publicPath.startsWith('/fixture-assets/game-data/'),
      ),
    ).toBe(true)
    expect(gameDataFixture.snapshot.excludedCollections).toEqual([
      'users',
      'game-sessions',
      'fixture-installations',
    ])
    expect(
      gameDataFixture.otherWorldEncounterCards.flatMap((card) =>
        card.encounters
          .map((encounter) => encounter.destinationKey)
          .filter((key): key is string => Boolean(key)),
      ),
    ).toEqual(
      expect.arrayContaining([
        'abyss',
        'celano',
        'the-dreamlands',
        'city-of-the-great-race',
        'rlyeh',
      ]),
    )
  })

  it('builds a downloadable CMS snapshot with only portable game data', async () => {
    const calls: string[] = []
    const documents = cmsSnapshotDocuments()
    const payload = {
      find: async ({ collection }: { collection: string }) => {
        calls.push(collection)
        return {
          docs: documents[collection] ?? [],
        }
      },
    } as unknown as Payload

    const snapshot = await buildGameDataSnapshot(payload, {
      generatedAt: '2026-07-04T00:00:00.000Z',
    })
    const validation = validateGameDataSnapshot(snapshot, ['media-core', 'media-yig-sheet'])
    const serializedCollections = JSON.stringify(snapshot.collections)

    expect(calls).not.toEqual(
      expect.arrayContaining(['users', 'game-sessions', 'fixture-installations']),
    )
    expect(snapshot.excludedCollections).toEqual([
      'users',
      'game-sessions',
      'fixture-installations',
    ])
    expect(serializedCollections).not.toContain('"id":')
    expect(serializedCollections).not.toContain('fixtureNamespace')
    expect(serializedCollections).not.toContain('"boxedSet":')
    expect(serializedCollections).not.toContain('"boxedset":')
    expect(serializedCollections).not.toContain('"customSetName":')
    expect(serializedCollections).not.toContain('scratch-upload.png')
    expect(snapshot.collections.boxedSets[0].icon).toBe('media-core')
    expect(snapshot.collections.ancientOnes[0].sheets[0].sheetImage).toBe('media-yig-sheet')
    expect(snapshot.collections.locations[0].sourceSet).toBe('base-game')
    expect(snapshot.collections.locations[0].neighborhood).toBe('arkham-uptown')
    expect(snapshot.collections.arkhamEncounterCards[0].encounters[0].location).toBe('woods')
    expect(snapshot.collections.otherWorldEncounterCards[0].encounters[0].destination).toBe('abyss')
    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
  })

  it('summarizes current CMS game data and referenced media disk usage', async () => {
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'game-data-summary-'))
    const documents = cmsSnapshotDocuments()
    const coreMedia = documents.media.find((document) => document.id === 'media-1')
    const coreBytes = Buffer.from('core image bytes')

    if (coreMedia) coreMedia.filename = 'core.webp'

    await writeFile(path.join(temporaryDirectory, 'core.webp'), coreBytes)

    const payload = {
      find: async ({ collection }: { collection: string }) => ({
        docs: documents[collection] ?? [],
      }),
    } as unknown as Payload

    try {
      const summary = await buildCurrentGameDataSummary(payload, {
        generatedAt: '2026-07-04T00:00:00.000Z',
        mediaDirectory: temporaryDirectory,
      })

      expect(summary.available).toBe(true)
      expect(summary.counts).toEqual({
        ancientOnes: 1,
        arkhamEncounterCards: 1,
        boxedSets: 1,
        locations: 1,
        media: 2,
        mythosCards: 1,
        neighborhoods: 1,
        otherWorldEncounterCards: 1,
        otherWorlds: 1,
      })
      expect(summary.totalRecords).toBe(10)
      expect(summary.media.available).toBe(1)
      expect(summary.media.bytes).toBe(coreBytes.length)
      expect(summary.media.missingKeys).toEqual(['media-yig-sheet'])
      expect(summary.media.referenced).toBe(2)
      expect(summary.media.unreferenced).toBe(1)
      expect(summary.snapshotBytes).toBeGreaterThan(0)
      expect(summary.totalBytes).toBe(summary.snapshotBytes + coreBytes.length)
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  })

  it('summarizes legacy boxed sets that predate the portable key field', async () => {
    const documents = cmsSnapshotDocuments()
    const boxedSet = documents['boxed-sets'][0]

    delete boxedSet.key
    documents['boxed-sets'].push({
      id: 'blank-boxed-set-draft',
      _status: 'draft',
    })

    const payload = {
      find: async ({ collection }: { collection: string }) => ({
        docs: documents[collection] ?? [],
      }),
    } as unknown as Payload

    const snapshot = await buildGameDataSnapshot(payload, {
      generatedAt: '2026-07-04T00:00:00.000Z',
    })
    const summary = await buildCurrentGameDataSummary(payload, {
      generatedAt: '2026-07-04T00:00:00.000Z',
    })

    expect(snapshot.collections.boxedSets[0].key).toBe('base-game')
    expect(snapshot.collections.boxedSets).toHaveLength(1)
    expect(snapshot.collections.locations[0].sourceSet).toBe('base-game')
    expect(summary.available).toBe(true)
    expect(summary.counts.boxedSets).toBe(1)
  })

  it('rejects uploaded snapshots that include Payload IDs or excluded collection data', () => {
    const snapshot = {
      ...sampleGameDataSnapshot(),
      collections: {
        ...sampleGameDataSnapshot().collections,
        boxedSets: [
          {
            id: 'box-1',
            key: 'base-game',
          },
        ],
      },
      users: [
        {
          id: 'user-1',
        },
      ],
    }

    const validation = validateGameDataSnapshot(snapshot, ['media-core', 'media-yig-sheet'])

    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain(
      'The game-data snapshot contains Payload document or row IDs.',
    )
    expect(validation.errors).toContain('Snapshot contains unsupported top-level key users.')
  })

  it('restores an uploaded snapshot object through the fixture loader', async () => {
    let nextID = 1
    const snapshot = sampleGameDataSnapshot()
    snapshot.collections.locations[0].boxedSet = 'Base Game'
    snapshot.collections.mythosCards[0].boxedset = 'Base Game'
    snapshot.collections.otherWorlds[0].customSetName = 'Legacy Custom'
    const collections = new Map<string, Map<string, Record<string, unknown>>>()
    const collection = (slug: string) => {
      const existing = collections.get(slug)
      if (existing) return existing

      const created = new Map<string, Record<string, unknown>>()
      collections.set(slug, created)
      return created
    }

    collection('media').set('media-existing', {
      id: 'media-existing',
      assetKey: 'media-core',
    })
    collection('media').set('media-yig-existing', {
      id: 'media-yig-existing',
      filename: 'yig-sheet.png',
    })

    const payload = {
      find: async ({ collection: slug }: { collection: string }) => ({
        docs: [...collection(slug).values()],
      }),
      create: async ({
        collection: slug,
        data,
      }: {
        collection: string
        data: Record<string, unknown>
      }) => {
        const id = `${slug}-${nextID++}`
        const document = { ...structuredClone(data), id }
        collection(slug).set(id, document)
        return document
      },
      update: async ({
        collection: slug,
        data,
        id,
      }: {
        collection: string
        data: Record<string, unknown>
        id: string
      }) => {
        const document = { ...structuredClone(data), id }
        collection(slug).set(id, document)
        return document
      },
    } as unknown as Payload

    const firstLoad = await restoreGameDataSnapshot(payload, snapshot)
    const secondLoad = await restoreGameDataSnapshot(payload, snapshot)
    const ancientOne = [...collection('ancient-ones').values()][0]
    const location = [...collection('locations').values()][0]
    const mythosCard = [...collection('mythos-cards').values()][0]
    const otherWorld = [...collection('other-worlds').values()][0]
    const otherWorldEncounter = [...collection('other-world-encounter-cards').values()][0]

    expect(firstLoad.boxedSets.created).toEqual(['base-game'])
    expect(firstLoad.mythosCards.created).toEqual(['base-mythos-001'])
    expect(secondLoad.boxedSets.unchanged).toEqual(['base-game'])
    expect((ancientOne.sheets as Record<string, unknown>[])[0].sheetImage).toBe(
      'media-yig-existing',
    )
    expect(location.neighborhood).toBe([...collection('neighborhoods').keys()][0])
    expect(location.boxedSet).toBeUndefined()
    expect(mythosCard.boxedset).toBeUndefined()
    expect(otherWorld.customSetName).toBeUndefined()
    expect((otherWorldEncounter.encounters as Record<string, unknown>[])[0].destination).toBe(
      [...collection('other-worlds').keys()][0],
    )
  })

  it('imports a game-data archive with media before restoring documents', async () => {
    let nextID = 1
    const snapshot = sampleGameDataSnapshot()
    const archive = createGameDataArchiveBuffer(snapshot, [
      {
        key: 'media-core',
        filename: 'core.webp',
        alt: 'Core art',
        mimeType: 'image/webp',
        data: Buffer.from('core image bytes'),
      },
      {
        key: 'media-yig-sheet',
        filename: 'yig-sheet.png',
        alt: 'Yig sheet',
        mimeType: 'image/png',
        data: Buffer.from('yig sheet bytes'),
      },
    ])
    const parsedArchive = readGameDataArchive(archive)
    const collections = new Map<string, Map<string, Record<string, unknown>>>()
    const collection = (slug: string) => {
      const existing = collections.get(slug)
      if (existing) return existing

      const created = new Map<string, Record<string, unknown>>()
      collections.set(slug, created)
      return created
    }

    const payload = {
      find: async ({
        collection: slug,
        where,
      }: {
        collection: string
        where?: { assetKey?: { equals?: string } }
      }) => {
        const docs = [...collection(slug).values()]
        const assetKey = where?.assetKey?.equals

        return {
          docs: assetKey ? docs.filter((document) => document.assetKey === assetKey) : docs,
        }
      },
      create: async ({
        collection: slug,
        data,
        filePath,
      }: {
        collection: string
        data: Record<string, unknown>
        filePath?: string
      }) => {
        const id = `${slug}-${nextID++}`
        const document = {
          ...structuredClone(data),
          id,
          ...(filePath ? { filename: filePath.split('/').pop() } : {}),
        }
        collection(slug).set(id, document)
        return document
      },
      update: async ({
        collection: slug,
        data,
        filePath,
        id,
      }: {
        collection: string
        data: Record<string, unknown>
        filePath?: string
        id: string
      }) => {
        const document = {
          ...collection(slug).get(id),
          ...structuredClone(data),
          id,
          ...(filePath ? { filename: filePath.split('/').pop() } : {}),
        }
        collection(slug).set(id, document)
        return document
      },
    } as unknown as Payload

    const summary = await importGameDataArchive(payload, archive)
    const ancientOne = [...collection('ancient-ones').values()][0]
    const mediaDocuments = [...collection('media').values()]

    expect(parsedArchive.manifest.media.map((entry) => entry.key).sort()).toEqual([
      'media-core',
      'media-yig-sheet',
    ])
    expect(summary.collections.media.created.sort()).toEqual(['media-core', 'media-yig-sheet'])
    expect(mediaDocuments.map((document) => document.assetKey).sort()).toEqual([
      'media-core',
      'media-yig-sheet',
    ])
    expect((ancientOne.sheets as Record<string, unknown>[])[0].sheetImage).toBe(
      mediaDocuments.find((document) => document.assetKey === 'media-yig-sheet')?.id,
    )
  })

  it('restores every portable relationship and is idempotent', async () => {
    let nextID = 1
    const collections = new Map<string, Map<string, Record<string, unknown>>>()
    const collection = (slug: string) => {
      const existing = collections.get(slug)
      if (existing) return existing

      const created = new Map<string, Record<string, unknown>>()
      collections.set(slug, created)
      return created
    }

    for (const asset of gameDataFixture.media) {
      const id = `media-${nextID++}`
      collection('media').set(id, {
        id,
        assetKey: asset.fixtureKey,
      })
    }

    const payload = {
      find: async ({ collection: slug }: { collection: string }) => ({
        docs: [...collection(slug).values()],
      }),
      create: async ({
        collection: slug,
        data,
      }: {
        collection: string
        data: Record<string, unknown>
      }) => {
        const id = `${slug}-${nextID++}`
        const document = { ...structuredClone(data), id }
        collection(slug).set(id, document)
        return document
      },
      update: async ({
        collection: slug,
        data,
        id,
      }: {
        collection: string
        data: Record<string, unknown>
        id: string
      }) => {
        const document = { ...structuredClone(data), id }
        collection(slug).set(id, document)
        return document
      },
    } as unknown as Payload

    const firstLoad = await restoreGameDataSnapshot(payload)
    const secondLoad = await restoreGameDataSnapshot(payload)

    expect(firstLoad.ancientOnes.created).toHaveLength(25)
    expect(firstLoad.mythosCards.created).toHaveLength(287)
    expect(firstLoad.otherWorlds.created).toHaveLength(12)
    expect(secondLoad.ancientOnes.unchanged).toHaveLength(25)
    expect(secondLoad.mythosCards.unchanged).toHaveLength(287)
    expect(secondLoad.otherWorlds.unchanged).toHaveLength(12)

    const ancientOneWithArt = [...collection('ancient-ones').values()].find((document) =>
      (document.sheets as Record<string, unknown>[]).some((sheet) => sheet.sheetImage),
    )
    const locationWithImage = [...collection('locations').values()].find(
      (document) => document.cardImage,
    )

    expect(ancientOneWithArt).toBeDefined()
    expect(
      (ancientOneWithArt?.sheets as Record<string, unknown>[]).some(
        (sheet) =>
          typeof sheet.sheetImage === 'string' && collection('media').has(sheet.sheetImage),
      ),
    ).toBe(true)
    expect(
      typeof locationWithImage?.cardImage === 'string' &&
        collection('media').has(locationWithImage.cardImage),
    ).toBe(true)
  })
})
