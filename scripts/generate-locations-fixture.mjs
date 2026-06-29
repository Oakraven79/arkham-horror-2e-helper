import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.resolve('wireframes/Source data/locations.json')
const outputPath = path.resolve('src/content/locations.generated.ts')

const expansionMap = {
  'Arkham Horror': { board: 'Arkham', sourceSetKey: 'base-game' },
  'Dunwich Horror': { board: 'Dunwich', sourceSetKey: 'dunwich-horror' },
  'Kingsport Horror': { board: 'Kingsport', sourceSetKey: 'kingsport-horror' },
  'Innsmouth Horror': { board: 'Innsmouth', sourceSetKey: 'innsmouth-horror' },
}

const boardOrder = new Map(
  ['Arkham', 'Dunwich', 'Kingsport', 'Innsmouth'].map((board, index) => [board, index]),
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

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
const normalized = source
  .map((record) => {
    const expansion = expansionMap[record.expansion]

    if (!expansion) {
      throw new Error(`Unknown location expansion: ${record.expansion}`)
    }

    const details = record.details ?? {}
    const stability = record.stability.toLowerCase()

    if (!['stable', 'unstable', 'n/a'].includes(stability)) {
      throw new Error(`Unknown stability for ${record.name}: ${record.stability}`)
    }

    return {
      name: record.name,
      key: slugify(record.name),
      cardDisplayText: record.name,
      sourceSetKey: expansion.sourceSetKey,
      board: details.city || expansion.board,
      neighborhood: record.neighborhood,
      stability,
      aquatic: details.aquatic ?? false,
      encounterTypes: record.encounter_types,
      ...(details.description ? { description: details.description } : {}),
      ...(details.special_encounter ? { specialEncounter: details.special_encounter } : {}),
      homeInvestigators: details.home_investigators ?? [],
    }
  })
  .sort(
    (left, right) =>
      boardOrder.get(left.board) - boardOrder.get(right.board) ||
      left.neighborhood.localeCompare(right.neighborhood) ||
      left.name.localeCompare(right.name),
  )

const keys = normalized.map((location) => location.key)

if (normalized.length !== 57 || new Set(keys).size !== normalized.length) {
  throw new Error(
    `Expected 57 uniquely keyed locations, got ${normalized.length} records and ${new Set(keys).size} keys.`,
  )
}

const output = `import type { LocationFixture } from './locationTypes'

// Generated from wireframes/Source data/locations.json. Do not edit by hand.
export const generatedLocations = ${JSON.stringify(normalized, null, 2)} as const satisfies readonly LocationFixture[]
`

await writeFile(outputPath, escapeNonASCII(output), 'utf8')
console.log(`Generated ${normalized.length} locations in ${outputPath}`)
