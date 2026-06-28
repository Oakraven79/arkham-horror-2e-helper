export const locationBoards = ['Arkham', 'Dunwich', 'Kingsport', 'Innsmouth', 'Other'] as const
export const locationStabilities = ['stable', 'unstable', 'n/a'] as const
export const locationEncounterTypes = [
  'Ally',
  'Blessing',
  'Clue',
  'Common Item',
  'Money',
  'Sanity',
  'Skill',
  'Spell',
  'Stamina',
  'Unique Item',
] as const

export type LocationBoard = (typeof locationBoards)[number]
export type LocationStability = (typeof locationStabilities)[number]
export type LocationEncounterType = (typeof locationEncounterTypes)[number]

export type LocationFixtureBoxedSet =
  | 'Base Game'
  | 'Dunwich Horror'
  | 'Kingsport Horror'
  | 'Innsmouth Horror'

export interface LocationFixture {
  aquatic: boolean
  board: Exclude<LocationBoard, 'Other'>
  boxedSet: LocationFixtureBoxedSet
  cardDisplayText: string
  description?: string
  encounterTypes: LocationEncounterType[]
  homeInvestigators: string[]
  image?: {
    alt: string
    filename: string
    publicPath: string
  }
  key: string
  name: string
  neighborhood: string
  specialEncounter?: string
  stability: LocationStability
}
