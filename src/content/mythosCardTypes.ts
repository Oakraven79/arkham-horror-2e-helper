import type { MonsterIcons, MythosCardType } from '@/components/constants'
import type { OfficialBoxedSetKey } from './boxedSetTypes'

export type MythosGateMode = 'none' | 'single' | 'choice' | 'all' | 'surge'
export type MythosRulesNoteKind = 'clarification' | 'errata' | 'misprint'

export interface StarterMythosCard {
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
  sourceSetKey: Exclude<OfficialBoxedSetKey, 'curse-dark-pharaoh-original' | 'promotional'>
  terrorIncrease?: number
  title: string
}
