import { relationshipID } from './boxedSetContent'

type EncounterRow = {
  location?: unknown
}

export function validateArkhamEncounterRows(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return 'An Arkham encounter card must contain at least one encounter.'
  }

  const locationIDs = (value as EncounterRow[])
    .map((encounter) => relationshipID(encounter.location))
    .filter((id): id is string => Boolean(id))

  if (locationIDs.length !== value.length) {
    return 'Every encounter must identify a location.'
  }

  if (new Set(locationIDs).size !== locationIDs.length) {
    return 'Each location may appear only once on an Arkham encounter card.'
  }

  return true
}
