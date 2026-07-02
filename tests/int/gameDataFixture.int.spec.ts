import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import { gameDataFixture } from '@/fixtures/gameData'
import { validateGameDataFixture } from '@/fixtures/gameDataLoader'
import { restoreGameDataSnapshot } from '@/fixtures/gameDataSnapshotLoader'

describe('Game data fixture', () => {
  it('is complete and internally valid', () => {
    const validation = validateGameDataFixture()

    expect(validation.valid).toBe(true)
    expect(validation.errors).toEqual([])
    expect(validation.counts).toEqual({
      ancientOnes: 25,
      arkhamEncounterCards: 9,
      boxedSets: 11,
      locations: 57,
      media: 102,
      mythosCards: 287,
      neighborhoods: 19,
      otherWorldEncounterCards: 4,
      otherWorlds: 12,
    })
    expect(validation.checksum).toMatch(/^[a-f0-9]{64}$/)
  })

  it('stores portable relationship keys instead of Payload IDs', () => {
    const serialized = JSON.stringify(gameDataFixture)

    expect(serialized).not.toContain('"id":')
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
