export const SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT =
  'arkham:setup-investigator-count-preview'

export interface SetupInvestigatorCountPreview {
  investigatorCount: number
  sessionID: string
}

export function publishSetupInvestigatorCountPreview(detail: SetupInvestigatorCountPreview) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT, { detail }))
}
