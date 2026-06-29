import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.resolve('wireframes/Source data/ancient_ones.json')
const outputPath = path.resolve('src/content/ancientOnes.generated.ts')

const expansionMap = {
  'Arkham Horror': 'Base Game',
  'Dunwich Horror': 'Dunwich Horror',
  'Innsmouth Horror': 'Innsmouth Horror',
  'Kingsport Horror': 'Kingsport Horror',
  'Promotional offer': 'Promotional',
}

const expansionOrder = new Map(
  ['Base Game', 'Dunwich Horror', 'Kingsport Horror', 'Innsmouth Horror', 'Promotional'].map(
    (boxedSet, index) => [boxedSet, index],
  ),
)

function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function escapeNonASCII(value) {
  return value.replace(/[^\x20-\x7e\n\r\t]/g, (character) => {
    const code = character.charCodeAt(0).toString(16).padStart(4, '0')
    return `\\u${code}`
  })
}

function sheetIdentity(record, sheet) {
  if (/arkham nights/i.test(sheet.name)) {
    return {
      key: 'arkham-nights',
      label: 'Arkham Nights',
    }
  }

  if (/original/i.test(sheet.name) || record.details.sheets.length > 1) {
    return {
      key: 'original',
      label: 'Original',
    }
  }

  return {
    key: 'standard',
    label: 'Standard',
  }
}

function combatRating(value, owner) {
  const display = String(value).trim()

  if (/^-?\d+$/.test(display)) {
    return {
      display,
      type: 'fixed',
      modifier: Number.parseInt(display, 10),
    }
  }

  if (/x/i.test(display)) {
    return {
      display,
      type: 'variable',
    }
  }

  if (display.includes('\u221e')) {
    return {
      display,
      type: 'infinite',
    }
  }

  throw new Error(`Unknown combat rating "${display}" for ${owner}`)
}

function defenses(value, owner) {
  const printed = String(value).trim()
  const normalized = printed.toLowerCase()

  if (normalized === 'none') return []

  const mapped = [
    normalized.includes('physical resistance') ? 'physical-resistance' : null,
    normalized.includes('physical immunity') ? 'physical-immunity' : null,
    normalized.includes('magical resistance') ? 'magical-resistance' : null,
    normalized.includes('magical immunity') ? 'magical-immunity' : null,
    normalized.startsWith('special') ? 'special' : null,
  ].filter(Boolean)

  if (mapped.length === 0) {
    throw new Error(`Unknown defense "${printed}" for ${owner}`)
  }

  return mapped
}

function normalizeReference(value) {
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*+\s*/, ''))
    .filter(Boolean)
    .join('\n')
}

function rulesNotes(record) {
  const notes = []

  if (record.details.clarification) {
    notes.push({
      kind: 'clarification',
      text: record.details.clarification.trim(),
    })
  }

  if (record.details.errata) {
    notes.push({
      kind: 'errata',
      text: record.details.errata.trim(),
    })
  }

  for (const [heading, text] of Object.entries(record.details.sections ?? {})) {
    if (heading === 'See also') {
      notes.push({
        kind: 'reference',
        text: normalizeReference(text),
      })
    }
  }

  return notes.length > 0 ? notes : undefined
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
const generated = source
  .map((record) => {
    const boxedSet = expansionMap[record.expansion]

    if (!boxedSet) {
      throw new Error(`Unknown Ancient One expansion "${record.expansion}" for ${record.name}`)
    }

    const sheets = record.details.sheets.map((sheet, index) => {
      if (sheet.doom_track !== record.doom_track) {
        throw new Error(
          `Doom track mismatch for ${record.name}: ${record.doom_track} and ${sheet.doom_track}`,
        )
      }

      const identity = sheetIdentity(record, sheet)

      return {
        ...identity,
        isDefault: index === 0,
        doomTrack: sheet.doom_track,
        combatRating: combatRating(sheet.combat_rating, record.name),
        defenses: defenses(sheet.defenses, record.name),
        defenseText: sheet.defenses.trim(),
        worshippers: sheet.worshippers.trim(),
        powerName: sheet.power_name.trim(),
        power: sheet.power.trim(),
        ...(sheet.other_fields?.['start of battle']
          ? { startOfBattle: sheet.other_fields['start of battle'].trim() }
          : {}),
        attack: sheet.attack.trim(),
      }
    })
    const sheetKeys = sheets.map((sheet) => sheet.key)

    if (new Set(sheetKeys).size !== sheetKeys.length) {
      throw new Error(`Duplicate sheet keys for ${record.name}`)
    }

    return {
      name: record.name,
      key: slugify(record.name),
      boxedSet,
      lore: record.details.mythos_source.trim(),
      sheets,
      ...(rulesNotes(record) ? { rulesNotes: rulesNotes(record) } : {}),
    }
  })
  .sort(
    (left, right) =>
      expansionOrder.get(left.boxedSet) - expansionOrder.get(right.boxedSet) ||
      left.name.localeCompare(right.name),
  )

const keys = generated.map((record) => record.key)
const playableSheets = generated.reduce((total, record) => total + record.sheets.length, 0)
const imageReferences = source.reduce((total, record) => total + record.details.images.length, 0)

if (generated.length !== 25 || playableSheets !== 28 || new Set(keys).size !== generated.length) {
  throw new Error(
    `Expected 25 unique Ancient Ones and 28 playable sheets, got ${generated.length} records, ${new Set(keys).size} keys, and ${playableSheets} sheets.`,
  )
}

const output = `import type { StarterAncientOne } from './ancientOneTypes'

// Generated from wireframes/Source data/ancient_ones.json. Do not edit by hand.
export const generatedAncientOnes: readonly StarterAncientOne[] = ${JSON.stringify(generated, null, 2)}
`

await writeFile(outputPath, escapeNonASCII(output), 'utf8')
console.log(
  `Generated ${generated.length} Ancient Ones (${playableSheets} playable sheets) in ${outputPath}`,
)
console.log(`Ignored ${imageReferences} unavailable source image references.`)
