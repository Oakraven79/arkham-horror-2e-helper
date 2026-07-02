import type { AncientOne, Media } from '@/payload-types'

type AncientOneSheet = AncientOne['sheets'][number]

export interface AncientOneBackgroundMedia {
  alt: string
  url: string
}

function isMedia(value: AncientOneSheet['sheetImage']): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

export function ancientOneSheetBackground(
  sheet: AncientOneSheet | null,
): AncientOneBackgroundMedia | null {
  if (!sheet || !isMedia(sheet.sheetImage) || !sheet.sheetImage.url) return null

  return {
    url: sheet.sheetImage.url,
    alt: sheet.sheetImage.alt || `${sheet.label} Ancient One artwork`,
  }
}

export function activeAncientOneBackground(
  enabled: boolean,
  sheet: AncientOneSheet | null,
): AncientOneBackgroundMedia | null {
  return enabled ? ancientOneSheetBackground(sheet) : null
}

export function cssBackgroundImageValue(url: string) {
  return `url(${JSON.stringify(url)})`
}
