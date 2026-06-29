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

export type StarterAncientOneBoxedSet =
  | 'Base Game'
  | 'Dunwich Horror'
  | 'Kingsport Horror'
  | 'Innsmouth Horror'
  | 'Promotional'

export interface StarterAncientOne {
  boxedSet: StarterAncientOneBoxedSet
  key: string
  lore: string
  name: string
  rulesNotes?: {
    kind: AncientOneRulesNoteKind
    sheetKey?: string
    text: string
  }[]
  sheets: StarterAncientOneSheet[]
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
