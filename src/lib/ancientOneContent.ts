type AncientOneSheetRow = {
  combatRating?: {
    modifier?: number | null
    type?: string | null
  }
  isDefault?: boolean | null
  key?: string | null
}

export function validateAncientOneSheets(value: unknown): true | string {
  if (!Array.isArray(value) || value.length === 0) {
    return 'An Ancient One must have at least one playable sheet.'
  }

  const sheets = value as AncientOneSheetRow[]
  const keys = sheets.map((sheet) => sheet.key?.trim()).filter(Boolean)

  if (keys.length !== sheets.length) {
    return 'Every Ancient One sheet must have a stable key.'
  }

  if (new Set(keys).size !== keys.length) {
    return 'Ancient One sheet keys must be unique within the document.'
  }

  if (sheets.filter((sheet) => sheet.isDefault).length !== 1) {
    return 'Exactly one Ancient One sheet must be the default.'
  }

  const invalidFixedRating = sheets.some(
    (sheet) =>
      sheet.combatRating?.type === 'fixed' && typeof sheet.combatRating.modifier !== 'number',
  )

  if (invalidFixedRating) {
    return 'Fixed combat ratings require a numeric modifier.'
  }

  return true
}
