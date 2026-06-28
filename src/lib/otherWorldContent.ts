import type { TextFieldValidation } from 'payload'

export const otherWorldEncounterColours = ['blue', 'green', 'red', 'yellow'] as const

export type OtherWorldEncounterColour = (typeof otherWorldEncounterColours)[number]

type EncounterRow = {
  destination?: unknown
  isOther?: boolean | null
}

function getRelationshipID(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id)
    }
  }

  return null
}

export function validateOtherWorldEncounterRows(value: unknown): true | string {
  if (!Array.isArray(value) || value.length !== 3) {
    return 'An Other World encounter card must have exactly three encounter entries.'
  }

  const rows = value as EncounterRow[]
  const fallbackCount = rows.filter((row) => row?.isOther === true).length

  if (fallbackCount !== 1) {
    return 'An Other World encounter card must have exactly one "Other" fallback entry.'
  }

  const destinationIDs: string[] = []

  for (const row of rows) {
    if (row?.isOther) {
      continue
    }

    const destinationID = getRelationshipID(row?.destination)

    if (!destinationID) {
      return 'Each named encounter entry must select an Other World destination.'
    }

    destinationIDs.push(destinationID)
  }

  if (new Set(destinationIDs).size !== destinationIDs.length) {
    return 'The named encounter entries must use different Other World destinations.'
  }

  return true
}

export const validateCustomSetName: TextFieldValidation = (value, { siblingData }) => {
  const data = siblingData as { boxedSet?: string }

  if (data.boxedSet === 'Custom' && !value?.trim()) {
    return 'Enter a name for the custom set.'
  }

  return true
}
