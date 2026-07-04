import type { OfficialBoxedSetKey } from './boxedSetTypes'

export const ancientOneCombatRatingTypes = ['fixed', 'variable', 'infinite'] as const

export const ancientOneDefenses = [
  'physical-resistance',
  'physical-immunity',
  'magical-resistance',
  'magical-immunity',
  'special',
] as const

export const ancientOneRulesNoteKinds = ['clarification', 'errata', 'reference'] as const

export type AncientOneCombatRatingType = (typeof ancientOneCombatRatingTypes)[number]
export type AncientOneDefense = (typeof ancientOneDefenses)[number]
export type AncientOneRulesNoteKind = (typeof ancientOneRulesNoteKinds)[number]

export interface StarterAncientOne {
  key: string
  lore: string
  name: string
  requiredSetKeys?: OfficialBoxedSetKey[]
  rulesNotes?: {
    kind: AncientOneRulesNoteKind
    sheetKey?: string
    text: string
  }[]
  sheets: StarterAncientOneSheet[]
  sourceSetKey: Extract<
    OfficialBoxedSetKey,
    'base-game' | 'dunwich-horror' | 'kingsport-horror' | 'innsmouth-horror' | 'promotional'
  >
}

export interface StarterAncientOneSheet {
  attack: string
  combatRating: {
    display: string
    modifier?: number
    type: AncientOneCombatRatingType
  }
  defenseText: string
  defenses: AncientOneDefense[]
  doomTrack: number
  isDefault: boolean
  key: string
  label: string
  power: string
  powerName: string
  startOfBattle?: string
  worshippers: string
}
