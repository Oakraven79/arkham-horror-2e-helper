import type { Payload } from 'payload'

import { starterAncientOnes, type StarterAncientOne } from '@/content/ancientOnes'
import {
  fixtureRequiredSetKeys,
  officialBoxedSetName,
  relationshipID,
  requireBoxedSet,
  requireBoxedSets,
} from '@/lib/boxedSetContent'
import type { AncientOne, BoxedSet } from '@/payload-types'

export interface SeedAncientOnesOptions {
  dryRun?: boolean
}

function fixtureSheets(fixture: StarterAncientOne, existing?: AncientOne) {
  const existingByKey = new Map((existing?.sheets ?? []).map((sheet) => [sheet.key, sheet]))

  return fixture.sheets.map((sheet) => {
    const existingSheet = existingByKey.get(sheet.key)
    const sheetImage = relationshipID(existingSheet?.sheetImage)

    return {
      key: sheet.key,
      label: sheet.label,
      isDefault: sheet.isDefault,
      doomTrack: sheet.doomTrack,
      combatRating: {
        display: sheet.combatRating.display,
        type: sheet.combatRating.type,
        modifier: sheet.combatRating.modifier,
      },
      defenses: [...sheet.defenses],
      defenseText: sheet.defenseText,
      worshippers: sheet.worshippers,
      powerName: sheet.powerName,
      power: sheet.power,
      startOfBattle: sheet.startOfBattle,
      attack: sheet.attack,
      ...(sheetImage ? { sheetImage } : {}),
      ...(existingSheet?.id ? { id: existingSheet.id } : {}),
    }
  })
}

function fixtureMetadata(
  fixture: StarterAncientOne,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
  existing?: AncientOne,
) {
  return {
    name: fixture.name,
    key: fixture.key,
    boxedSet: officialBoxedSetName(fixture.sourceSetKey) as AncientOne['boxedSet'],
    sourceSet: sourceSet.id,
    requiredSets: requiredSets.map((boxedSet) => boxedSet.id),
    lore: fixture.lore,
    sheets: fixtureSheets(fixture, existing),
    rulesNotes: fixture.rulesNotes?.map((note) => ({ ...note })),
  }
}

function comparableFixture(
  fixture: StarterAncientOne,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
) {
  return {
    name: fixture.name,
    key: fixture.key,
    boxedSet: officialBoxedSetName(fixture.sourceSetKey) as AncientOne['boxedSet'],
    sourceSet: String(sourceSet.id),
    requiredSets: requiredSets.map((boxedSet) => String(boxedSet.id)),
    lore: fixture.lore,
    sheets: fixture.sheets.map((sheet) => ({
      key: sheet.key,
      label: sheet.label,
      isDefault: sheet.isDefault,
      doomTrack: sheet.doomTrack,
      combatRating: {
        display: sheet.combatRating.display,
        type: sheet.combatRating.type,
        modifier: sheet.combatRating.modifier,
      },
      defenses: [...sheet.defenses],
      defenseText: sheet.defenseText,
      worshippers: sheet.worshippers,
      powerName: sheet.powerName,
      power: sheet.power,
      startOfBattle: sheet.startOfBattle,
      attack: sheet.attack,
    })),
    rulesNotes: fixture.rulesNotes?.map((note) => ({ ...note })),
  }
}

function comparableDocument(document: AncientOne) {
  const requiredSets = (document.requiredSets ?? [])
    .map(relationshipID)
    .filter((id): id is string => Boolean(id))
  const notes = document.rulesNotes?.map((note) => ({
    kind: note.kind,
    text: note.text,
    sheetKey: note.sheetKey ?? undefined,
  }))

  return {
    name: document.name,
    key: document.key,
    boxedSet: document.boxedSet,
    sourceSet: relationshipID(document.sourceSet) ?? undefined,
    requiredSets:
      requiredSets.length > 0
        ? requiredSets
        : [relationshipID(document.sourceSet)].filter((id): id is string => Boolean(id)),
    lore: document.lore ?? '',
    sheets: document.sheets.map((sheet) => {
      const defenses = sheet.defenses ?? []

      return {
        key: sheet.key,
        label: sheet.label,
        isDefault: sheet.isDefault,
        doomTrack: sheet.doomTrack,
        combatRating: {
          display: sheet.combatRating.display,
          type: sheet.combatRating.type,
          modifier: sheet.combatRating.modifier ?? undefined,
        },
        defenses: defenses.length > 0 ? defenses : [],
        defenseText: sheet.defenseText,
        worshippers: sheet.worshippers,
        powerName: sheet.powerName,
        power: sheet.power,
        startOfBattle: sheet.startOfBattle ?? undefined,
        attack: sheet.attack,
      }
    }),
    rulesNotes: notes && notes.length > 0 ? notes : undefined,
  }
}

function metadataMatches(
  document: AncientOne,
  fixture: StarterAncientOne,
  requiredSets: BoxedSet[],
  sourceSet: BoxedSet,
) {
  return (
    JSON.stringify(comparableDocument(document)) ===
    JSON.stringify(comparableFixture(fixture, requiredSets, sourceSet))
  )
}

export async function seedAncientOnes(payload: Payload, options: SeedAncientOnesOptions = {}) {
  const dryRun = options.dryRun ?? false
  const [existing, boxedSetResult] = await Promise.all([
    payload.find({
      collection: 'ancient-ones',
      depth: 0,
      draft: true,
      limit: 100,
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
  const boxedSetsByKey = new Map(boxedSetResult.docs.map((boxedSet) => [boxedSet.key, boxedSet]))
  const boxedSetsByID = new Map(
    boxedSetResult.docs.map((boxedSet) => [String(boxedSet.id), boxedSet]),
  )
  const byKey = new Map<string, AncientOne[]>()
  const byName = new Map<string, AncientOne[]>()

  for (const ancientOne of existing.docs) {
    byKey.set(ancientOne.key, [...(byKey.get(ancientOne.key) ?? []), ancientOne])
    byName.set(ancientOne.name, [...(byName.get(ancientOne.name) ?? []), ancientOne])
  }

  const matches = starterAncientOnes.map((fixture) => {
    const allKeyMatches = byKey.get(fixture.key) ?? []
    const customKeyConflict = allKeyMatches.some(
      (ancientOne) =>
        boxedSetsByID.get(relationshipID(ancientOne.sourceSet) ?? '')?.category === 'custom' ||
        ancientOne.boxedSet === 'Custom',
    )
    const keyMatches = allKeyMatches.filter(
      (ancientOne) =>
        boxedSetsByID.get(relationshipID(ancientOne.sourceSet) ?? '')?.category !== 'custom' &&
        ancientOne.boxedSet !== 'Custom',
    )
    const nameMatches = (byName.get(fixture.name) ?? []).filter(
      (ancientOne) =>
        boxedSetsByID.get(relationshipID(ancientOne.sourceSet) ?? '')?.category !== 'custom' &&
        ancientOne.boxedSet !== 'Custom',
    )

    return {
      fixture,
      customKeyConflict,
      candidates: keyMatches.length > 0 ? keyMatches : nameMatches,
    }
  })
  const ambiguous = matches
    .filter((match) => match.customKeyConflict || match.candidates.length > 1)
    .map((match) => match.fixture.name)

  if (!dryRun && ambiguous.length > 0) {
    throw new Error(`Ambiguous official Ancient One matches: ${ambiguous.join(', ')}`)
  }

  const created: string[] = []
  const enriched: string[] = []
  const unchanged: string[] = []

  for (const match of matches) {
    if (match.customKeyConflict || match.candidates.length > 1) continue

    const { fixture } = match
    const existingAncientOne = match.candidates[0]
    const sourceSet = requireBoxedSet(boxedSetsByKey, fixture.sourceSetKey)
    const requiredSets = requireBoxedSets(boxedSetsByKey, fixtureRequiredSetKeys(fixture))

    if (!existingAncientOne) {
      created.push(fixture.name)

      if (dryRun) continue

      await payload.create({
        collection: 'ancient-ones',
        data: {
          ...fixtureMetadata(fixture, requiredSets, sourceSet),
          _status: 'published',
        },
        draft: false,
        overrideAccess: true,
      })
      continue
    }

    if (metadataMatches(existingAncientOne, fixture, requiredSets, sourceSet)) {
      unchanged.push(fixture.name)
      continue
    }

    enriched.push(fixture.name)

    if (dryRun) continue

    await payload.update({
      collection: 'ancient-ones',
      id: existingAncientOne.id,
      data: {
        ...fixtureMetadata(fixture, requiredSets, sourceSet, existingAncientOne),
        _status: existingAncientOne._status,
      },
      draft: existingAncientOne._status === 'draft',
      overrideAccess: true,
    })
  }

  return {
    ambiguous,
    created,
    dryRun,
    enriched,
    playableSheets: starterAncientOnes.reduce(
      (total, ancientOne) => total + ancientOne.sheets.length,
      0,
    ),
    unchanged,
  }
}
