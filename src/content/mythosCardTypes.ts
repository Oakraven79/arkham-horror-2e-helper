import type { MonsterIcons, MythosCardType } from '@/components/constants'

export type StarterMythosBoxedSet =
  | 'Base Game'
  | 'Dunwich Horror'
  | 'Kingsport Horror'
  | 'Innsmouth Horror'
  | 'Miskatonic Horror'
  | 'Curse of the Dark Pharaoh (Revised Edition)'
  | 'The Black Goat of the Woods'
  | 'The King in Yellow'
  | 'The Lurker at the Threshold'

export type MythosGateMode = 'none' | 'single' | 'choice' | 'all' | 'surge'
export type MythosRulesNoteKind = 'clarification' | 'errata' | 'misprint'

export interface StarterMythosCard {
  boxedSet: StarterMythosBoxedSet
  cardCode: string
  cardType: MythosCardType
  clueText?: string
  copyCount: number
  description: string
  doomTokens?: number
  effectText?: string
  failCondition?: string
  flavorText?: string
  gateInstruction: {
    burst: boolean
    locationKeys: string[]
    mode: MythosGateMode
  }
  locationKey?: string
  lowerLeftOverride?: {
    imagePublicPath?: string
    text?: string
  }
  monsterMoveBlack?: MonsterIcons[]
  monsterMoveWhite?: MonsterIcons[]
  ongoingEffect?: string
  passCondition?: string
  reshuffleDeck?: boolean
  rulesNotes?: {
    kind: MythosRulesNoteKind
    text: string
  }[]
  specialInstruction?: string
  terrorIncrease?: number
  title: string
}
