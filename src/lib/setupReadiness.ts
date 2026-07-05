import type { AncientOne, GameSession } from '@/payload-types'

import {
  contentIsEligibleForEnabledSets,
  relationshipID,
  relationshipIDs,
} from './gameSessionContent'

type SetupSelection = Pick<GameSession, 'activeAncientOne' | 'ancientOneSheetKey'>
type SetupEligibility = Pick<GameSession, 'ancientOneSheetKey' | 'enabledSets'>

export function requiredSetupAncientOneID(session: SetupSelection) {
  const activeAncientOneID = relationshipID(session.activeAncientOne)

  if (!activeAncientOneID || !session.ancientOneSheetKey) {
    throw new Error('Select an Ancient One before beginning the game.')
  }

  return activeAncientOneID
}

export function assertSelectedAncientOneCanBegin(
  session: SetupEligibility,
  ancientOne: AncientOne,
) {
  const sheet = ancientOne.sheets.find((candidate) => candidate.key === session.ancientOneSheetKey)

  if (!sheet) {
    throw new Error('The selected Ancient One sheet could not be found.')
  }

  if (!contentIsEligibleForEnabledSets(ancientOne, relationshipIDs(session.enabledSets))) {
    throw new Error('The selected Ancient One is not from a set enabled for this session.')
  }
}
