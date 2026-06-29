import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.resolve('wireframes/Source data/mythos_cards.json')
const locationSourcePath = path.resolve('wireframes/Source data/locations.json')
const outputPath = path.resolve('src/content/mythosCards.generated.ts')

const expansionMap = {
  '': 'base-game',
  'Arkham Horror': 'base-game',
  'Curse of the Dark Pharaoh': 'curse-dark-pharaoh-revised',
  'Dunwich Horror': 'dunwich-horror',
  'Innsmouth Horror': 'innsmouth-horror',
  'Kingsport Horror': 'kingsport-horror',
  'Miskatonic Horror': 'miskatonic-horror',
  'The Black Goat of the Woods': 'black-goat',
  'The King in Yellow': 'king-in-yellow',
  'The Lurker at the Threshold': 'lurker-at-the-threshold',
}

const expansionCodeMap = {
  'base-game': 'base',
  'dunwich-horror': 'dunwich',
  'kingsport-horror': 'kingsport',
  'innsmouth-horror': 'innsmouth',
  'miskatonic-horror': 'miskatonic',
  'curse-dark-pharaoh-revised': 'dark-pharaoh-revised',
  'black-goat': 'black-goat',
  'king-in-yellow': 'king-in-yellow',
  'lurker-at-the-threshold': 'lurker',
}

const expansionOrder = new Map(
  Object.values(expansionMap)
    .filter((value, index, values) => values.indexOf(value) === index)
    .map((value, index) => [value, index]),
)

const monsterIconMap = {
  circle: 'circle',
  crescent: 'crescentMoon',
  diamond: 'diamond',
  hexagon: 'hexagon',
  plus: 'cross',
  slash: 'leftLean',
  square: 'square',
  star: 'star',
  triangle: 'triangle',
}

const noLocationMarkers = new Set(['', '-none-', 'no gate', 'no gate opens'])

const rulesNoteMap = {
  Clarification: 'clarification',
  Errata: 'errata',
  Misprint: 'misprint',
}

const forcedGateBursts = new Set(['The Doors of Sleep'])

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

function optionalText(value) {
  const text = String(value ?? '').trim()
  return text || undefined
}

function normalizeClueText(value) {
  const lines = String(value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*+\s*/, ''))
    .filter((line) => line && !noLocationMarkers.has(line.toLowerCase()))

  return lines.length > 0 ? lines.join('\n') : undefined
}

function physicalCopyCount(record) {
  const match = String(record.name).match(/\s+x(\d+)$/i)
  return match ? Number.parseInt(match[1], 10) : 1
}

function cardTitle(record) {
  return String(record.details?.page_title || record.name)
    .replace(/\s+x\d+$/i, '')
    .trim()
}

function sourceSetKey(record) {
  const sourceExpansion = String(record.expansion || record.details?.edition || '')
  const mapped = expansionMap[sourceExpansion]

  if (!mapped) {
    throw new Error(`Unknown Mythos expansion "${sourceExpansion}" for ${record.name}`)
  }

  return mapped
}

function cardType(record) {
  if (!record.card_type) return 'Special'

  const allowed = new Set([
    'Headline',
    'Environment (Mystic)',
    'Environment (Urban)',
    'Environment (Weather)',
    'Rumor',
  ])

  if (!allowed.has(record.card_type)) {
    throw new Error(`Unknown Mythos card type "${record.card_type}" for ${record.name}`)
  }

  return record.card_type
}

function gateLocations(record, validLocationKeys) {
  const sourceLocations = Array.isArray(record.details?.gate_locations)
    ? record.details.gate_locations
    : [record.details?.gate_location || record.gate_location]
  const keys = sourceLocations
    .map((location) => String(location ?? '').trim())
    .filter((location) => !noLocationMarkers.has(location.toLowerCase()))
    .map(slugify)

  for (const key of keys) {
    if (!validLocationKeys.has(key)) {
      throw new Error(`Unknown gate location "${key}" for ${record.name}`)
    }
  }

  return [...new Set(keys)]
}

function gateMode(record, locations) {
  const specialType = String(record.special_type ?? '')

  if (specialType === 'Monster surge') return 'surge'
  if (locations.length === 0) return 'none'
  if (specialType.includes('Alternate gates')) return 'choice'
  if (specialType === 'Two gates') return 'all'
  if (locations.length === 1) return 'single'

  throw new Error(`Cannot determine gate mode for ${record.name}`)
}

function monsterMovement(record, color) {
  const icons = Object.entries(record.details?.monster_movement ?? {})
    .filter(([, movementColor]) => movementColor === color)
    .map(([icon]) => {
      const mapped = monsterIconMap[icon]

      if (!mapped) {
        throw new Error(`Unknown monster movement icon "${icon}" for ${record.name}`)
      }

      return mapped
    })

  return icons.length > 0 ? icons : undefined
}

function rulesNotes(record) {
  const notes = Object.entries(record.details?.sections ?? {})
    .filter(([heading]) => heading in rulesNoteMap)
    .map(([heading, text]) => ({
      kind: rulesNoteMap[heading],
      text: String(text).trim(),
    }))

  return notes.length > 0 ? notes : undefined
}

function descriptionFor(card) {
  const sections = []

  if (card.flavorText) sections.push(`*${card.flavorText}*`)
  if (card.effectText) sections.push(card.effectText)
  if (card.ongoingEffect) sections.push(`**Ongoing Effect:** ${card.ongoingEffect}`)
  if (card.passCondition) sections.push(`**Pass:** ${card.passCondition}`)
  if (card.failCondition) sections.push(`**Fail:** ${card.failCondition}`)
  if (card.clueText) sections.push(`### Clue Appears At:\n${card.clueText}`)

  return sections.join('\n\n')
}

const [source, locationSource] = await Promise.all([
  readFile(sourcePath, 'utf8').then(JSON.parse),
  readFile(locationSourcePath, 'utf8').then(JSON.parse),
])
const validLocationKeys = new Set(locationSource.map((record) => slugify(record.name)))
const generated = source
  .map((record) => {
    const title = cardTitle(record)
    const set = sourceSetKey(record)
    const locations = gateLocations(record, validLocationKeys)
    const effectText = optionalText(record.details?.mythos_ability)
    const ongoingEffect = optionalText(record.details?.ongoing_effect)
    const passCondition = optionalText(record.details?.pass_condition)
    const failCondition = optionalText(record.details?.fail_condition)
    const flavorText = optionalText(record.details?.flavor_text)
    const clueText = normalizeClueText(record.details?.clue_locations)
    const doomTokens = Number.parseInt(record.details?.doom_tokens, 10)
    const card = {
      title,
      cardCode: `${expansionCodeMap[set]}-${slugify(title)}`,
      cardType: cardType(record),
      sourceSetKey: set,
      copyCount: physicalCopyCount(record),
      ...(flavorText ? { flavorText } : {}),
      ...(effectText ? { effectText } : {}),
      ...(ongoingEffect ? { ongoingEffect } : {}),
      ...(passCondition ? { passCondition } : {}),
      ...(failCondition ? { failCondition } : {}),
      ...(clueText ? { clueText } : {}),
      gateInstruction: {
        mode: gateMode(record, locations),
        locationKeys: locations,
        burst: Boolean(record.details?.gate_burst) || forcedGateBursts.has(title),
      },
      ...(locations[0] ? { locationKey: locations[0] } : {}),
      ...(Number.isNaN(doomTokens) ? {} : { doomTokens }),
      ...(record.special_type === 'Two terror level increases' ? { terrorIncrease: 2 } : {}),
      ...(record.special_type === 'Reshuffle deck' ? { reshuffleDeck: true } : {}),
      ...(record.special_type === 'Infamous play'
        ? { specialInstruction: 'Put the top card of the Act deck into play.' }
        : {}),
      ...(monsterMovement(record, 'white')
        ? { monsterMoveWhite: monsterMovement(record, 'white') }
        : {}),
      ...(monsterMovement(record, 'black')
        ? { monsterMoveBlack: monsterMovement(record, 'black') }
        : {}),
      ...(rulesNotes(record) ? { rulesNotes: rulesNotes(record) } : {}),
    }

    return {
      ...card,
      description: descriptionFor(card),
    }
  })
  .sort(
    (left, right) =>
      expansionOrder.get(left.sourceSetKey) - expansionOrder.get(right.sourceSetKey) ||
      left.title.localeCompare(right.title),
  )

const cardCodes = generated.map((card) => card.cardCode)
const physicalCards = generated.reduce((total, card) => total + card.copyCount, 0)
const gateModeCounts = Object.fromEntries(
  ['none', 'single', 'choice', 'all', 'surge'].map((mode) => [
    mode,
    generated.filter((card) => card.gateInstruction.mode === mode).length,
  ]),
)

if (
  generated.length !== 287 ||
  physicalCards !== 294 ||
  new Set(cardCodes).size !== generated.length
) {
  throw new Error(
    `Expected 287 unique Mythos cards and 294 physical cards, got ${generated.length} records, ${new Set(cardCodes).size} codes, and ${physicalCards} physical cards.`,
  )
}

const output = `import type { StarterMythosCard } from './mythosCardTypes'

// Generated from wireframes/Source data/mythos_cards.json. Do not edit by hand.
export const generatedMythosCards: readonly StarterMythosCard[] = ${JSON.stringify(generated, null, 2)}
`

await writeFile(outputPath, escapeNonASCII(output), 'utf8')
console.log(
  `Generated ${generated.length} Mythos records (${physicalCards} physical cards) in ${outputPath}`,
)
console.log(`Gate modes: ${JSON.stringify(gateModeCounts)}`)
