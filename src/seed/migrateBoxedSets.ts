import type { Payload } from 'payload'

import type { BoxedSet } from '@/payload-types'

type ContentCollection =
  | 'ancient-ones'
  | 'locations'
  | 'mythos-cards'
  | 'other-world-encounter-cards'
  | 'other-worlds'

type LegacyContentDocument = {
  _status?: 'draft' | 'published' | null
  boxedSet?: string | null
  boxedset?: string | null
  cardCode?: string
  customSetName?: string | null
  id: string
  key?: string
  name?: string
  sourceSet?: BoxedSet | string | null
  title?: string
}

const contentTargets: {
  collection: ContentCollection
  legacyField: 'boxedSet' | 'boxedset'
}[] = [
  { collection: 'ancient-ones', legacyField: 'boxedSet' },
  { collection: 'locations', legacyField: 'boxedSet' },
  { collection: 'mythos-cards', legacyField: 'boxedset' },
  { collection: 'other-world-encounter-cards', legacyField: 'boxedSet' },
  { collection: 'other-worlds', legacyField: 'boxedSet' },
]

function relationshipID(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id)
    }
  }

  return null
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function customKey(name: string) {
  return `custom-${slugify(name)}`
}

function abbreviation(name: string) {
  const words = name.match(/[a-z0-9]+/gi) ?? []
  const initials = words
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return initials.slice(0, 6) || 'Custom'
}

function documentLabel(document: LegacyContentDocument) {
  return document.title ?? document.name ?? document.cardCode ?? document.key ?? document.id
}

function buildLookups(boxedSets: BoxedSet[]) {
  const byID = new Map(boxedSets.map((boxedSet) => [String(boxedSet.id), boxedSet]))
  const byKey = new Map(boxedSets.map((boxedSet) => [boxedSet.key, boxedSet]))
  const byName = new Map<string, BoxedSet>()
  const collisions: string[] = []

  for (const boxedSet of boxedSets) {
    const names = [
      boxedSet.name,
      boxedSet.key,
      ...(boxedSet.aliases ?? []).map((alias) => alias.name),
    ]

    for (const name of names) {
      const normalized = normalize(name)
      const existing = byName.get(normalized)

      if (existing && existing.id !== boxedSet.id) {
        collisions.push(`${name}: ${existing.name} / ${boxedSet.name}`)
        continue
      }

      byName.set(normalized, boxedSet)
    }
  }

  return {
    byID,
    byKey,
    byName,
    collisions,
  }
}

function legacyName(document: LegacyContentDocument, legacyField: 'boxedSet' | 'boxedset') {
  return legacyField === 'boxedset' ? (document.boxedset ?? '') : (document.boxedSet ?? '')
}

async function loadContent(payload: Payload) {
  const loaded = await Promise.all(
    contentTargets.map(async (target) => {
      const result = await payload.find({
        collection: target.collection,
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      })

      return {
        ...target,
        documents: result.docs as unknown as LegacyContentDocument[],
      }
    }),
  )

  return loaded
}

export async function migrateBoxedSetRelationships(payload: Payload, apply: boolean) {
  const [initialBoxedSets, content, sessionResult] = await Promise.all([
    payload.find({
      collection: 'boxed-sets',
      depth: 0,
      draft: true,
      limit: 1000,
      overrideAccess: true,
    }),
    loadContent(payload),
    payload.find({
      collection: 'game-sessions',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
    }),
  ])
  const initialLookups = buildLookups(initialBoxedSets.docs)
  const unresolved: string[] = [...initialLookups.collisions]
  const customNames = new Map<string, string>()

  for (const target of content) {
    for (const document of target.documents) {
      const currentID = relationshipID(document.sourceSet)

      if (currentID && initialLookups.byID.has(currentID)) {
        continue
      }

      const name = legacyName(document, target.legacyField)

      if (name === 'Custom') {
        const customName = document.customSetName?.trim()

        if (!customName) {
          unresolved.push(
            `${target.collection}/${documentLabel(document)}: missing custom set name`,
          )
          continue
        }

        customNames.set(normalize(customName), customName)
        continue
      }

      if (!initialLookups.byName.has(normalize(name))) {
        unresolved.push(`${target.collection}/${documentLabel(document)}: unknown set "${name}"`)
      }
    }
  }

  for (const session of sessionResult.docs) {
    const currentIDs = (session.enabledSets ?? [])
      .map(relationshipID)
      .filter((id): id is string => Boolean(id))

    if (currentIDs.length > 0 && currentIDs.every((id) => initialLookups.byID.has(id))) {
      continue
    }

    for (const name of session.activeExpansions ?? []) {
      if (!initialLookups.byName.has(normalize(name))) {
        unresolved.push(`game-sessions/${session.name}: unknown enabled set "${name}"`)
      }
    }
  }

  for (const customName of customNames.values()) {
    const normalizedName = normalize(customName)
    const existingName = initialLookups.byName.get(normalizedName)
    const key = customKey(customName)
    const existingKey = initialLookups.byKey.get(key)

    if (existingName && existingName.category !== 'custom') {
      unresolved.push(
        `custom set "${customName}" conflicts with official set "${existingName.name}"`,
      )
    }

    if (existingKey && normalize(existingKey.name) !== normalizedName) {
      unresolved.push(
        `custom set "${customName}" conflicts with key owned by "${existingKey.name}"`,
      )
    }
  }

  if (unresolved.length > 0 && apply) {
    throw new Error(`Cannot migrate boxed-set relationships:\n${unresolved.join('\n')}`)
  }

  const customSetsCreated: string[] = []

  if (apply) {
    for (const customName of customNames.values()) {
      const existing =
        initialLookups.byName.get(normalize(customName)) ??
        initialLookups.byKey.get(customKey(customName))

      if (existing) continue

      await payload.create({
        collection: 'boxed-sets',
        data: {
          name: customName,
          key: customKey(customName),
          category: 'custom',
          abbreviation: abbreviation(customName),
          addsExpansionBoard: false,
          sortOrder: 1000,
          aliases: [],
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      customSetsCreated.push(customName)
    }
  }

  const boxedSetResult = apply
    ? await payload.find({
        collection: 'boxed-sets',
        depth: 0,
        draft: true,
        limit: 1000,
        overrideAccess: true,
      })
    : initialBoxedSets
  const lookups = buildLookups(boxedSetResult.docs)
  const contentChanges: Record<ContentCollection, number> = {
    'ancient-ones': 0,
    locations: 0,
    'mythos-cards': 0,
    'other-world-encounter-cards': 0,
    'other-worlds': 0,
  }

  for (const target of content) {
    for (const document of target.documents) {
      const currentID = relationshipID(document.sourceSet)

      if (currentID && lookups.byID.has(currentID)) {
        continue
      }

      const name = legacyName(document, target.legacyField)
      const customName = name === 'Custom' ? (document.customSetName?.trim() ?? '') : ''
      const expected = customName
        ? lookups.byName.get(normalize(customName))
        : lookups.byName.get(normalize(name))
      const expectedID =
        expected?.id ?? (customName && !apply ? `pending:${customKey(customName)}` : null)

      if (!expectedID || currentID === String(expectedID)) continue

      contentChanges[target.collection] += 1

      if (!apply || !expected) continue

      await payload.update({
        collection: target.collection,
        id: document.id,
        data: {
          sourceSet: expected.id,
          _status: document._status,
        },
        draft: document._status === 'draft',
        overrideAccess: true,
      })
    }
  }

  let sessionsChanged = 0

  for (const session of sessionResult.docs) {
    const currentIDs = (session.enabledSets ?? [])
      .map(relationshipID)
      .filter((id): id is string => Boolean(id))

    if (currentIDs.length > 0 && currentIDs.every((id) => lookups.byID.has(id))) {
      continue
    }

    const expectedIDs = (session.activeExpansions ?? [])
      .map((name) => lookups.byName.get(normalize(name)))
      .filter((boxedSet): boxedSet is BoxedSet => Boolean(boxedSet))
      .map((boxedSet) => String(boxedSet.id))
    if (JSON.stringify(currentIDs) === JSON.stringify(expectedIDs)) continue

    sessionsChanged += 1

    if (!apply) continue

    await payload.update({
      collection: 'game-sessions',
      id: session.id,
      data: {
        enabledSets: expectedIDs,
      },
      overrideAccess: true,
    })
  }

  return {
    apply,
    boxedSets: boxedSetResult.docs.length,
    contentChanges,
    customSetsCreated,
    customSetsPlanned: [...customNames.values()],
    sessionsChanged,
    unresolved,
  }
}
