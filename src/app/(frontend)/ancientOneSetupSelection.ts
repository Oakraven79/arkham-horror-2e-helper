import type { AncientOneSetupOption } from './AncientOneSetupFields'

interface AncientOneSetupSelection {
  ancientOneID?: string | null
  ancientOneKey?: string | null
  sheetKey?: string | null
}

export function resolveAncientOneSetupSelection(
  options: AncientOneSetupOption[],
  selection: AncientOneSetupSelection,
) {
  if (!selection.sheetKey) return ''

  const matchingID = selection.ancientOneID
    ? options.find(
        (option) =>
          option.ancientOneID === selection.ancientOneID &&
          option.sheetKey === selection.sheetKey,
      )
    : null

  if (matchingID) return matchingID.value

  const matchingKey = selection.ancientOneKey
    ? options.find(
        (option) =>
          option.ancientOneKey === selection.ancientOneKey &&
          option.sheetKey === selection.sheetKey,
      )
    : null

  return matchingKey?.value ?? ''
}
