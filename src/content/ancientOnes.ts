import { generatedAncientOnes } from './ancientOnes.generated'
import type { StarterAncientOne } from './ancientOneTypes'

export type { StarterAncientOne } from './ancientOneTypes'

const curatedOverrides: Record<
  string,
  Partial<Pick<StarterAncientOne, 'lore' | 'name' | 'rulesNotes'>>
> = {}

export const starterAncientOnes: StarterAncientOne[] = generatedAncientOnes.map((ancientOne) => ({
  ...ancientOne,
  sheets: ancientOne.sheets.map((sheet) => ({
    ...sheet,
    combatRating: { ...sheet.combatRating },
    defenses: [...sheet.defenses],
  })),
  ...(ancientOne.rulesNotes
    ? {
        rulesNotes: ancientOne.rulesNotes.map((note) => ({ ...note })),
      }
    : {}),
  ...curatedOverrides[ancientOne.key],
}))

export function getStarterAncientOne(key: string) {
  return starterAncientOnes.find((ancientOne) => ancientOne.key === key)
}
