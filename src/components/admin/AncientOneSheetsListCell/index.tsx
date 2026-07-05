import type { DefaultServerCellComponentProps } from 'payload'
import type { CSSProperties, ReactNode } from 'react'

import type { AncientOne, Media } from '@/payload-types'

type AncientOneSheet = AncientOne['sheets'][number]

type SheetImage = AncientOneSheet['sheetImage']

type SheetDisplay = {
  id?: string | null
  image?: Media | null
  isDefault?: boolean | null
  label?: string | null
}

const cellStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  minWidth: '28rem',
  whiteSpace: 'normal',
} satisfies CSSProperties

const sheetStyle = {
  display: 'grid',
  gap: '6px',
  justifyItems: 'center',
  width: '9rem',
} satisfies CSSProperties

const imageFrameStyle = {
  position: 'relative',
  width: '8.5rem',
  aspectRatio: '5 / 7',
  overflow: 'hidden',
  border: '1px solid var(--theme-elevation-250)',
  borderRadius: '4px',
  background: 'var(--theme-elevation-100)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.18)',
} satisfies CSSProperties

const imageStyle = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'top center',
} satisfies CSSProperties

const placeholderStyle = {
  display: 'grid',
  width: '100%',
  height: '100%',
  placeItems: 'center',
  color: 'var(--theme-elevation-500)',
  fontSize: '13px',
  fontWeight: 700,
  lineHeight: 1.1,
  textAlign: 'center',
} satisfies CSSProperties

const defaultMarkerStyle = {
  position: 'absolute',
  top: '6px',
  right: '6px',
  padding: '2px 6px',
  borderRadius: '999px',
  background: 'var(--theme-success-500)',
  color: 'var(--theme-success-50)',
  fontSize: '10px',
  fontWeight: 700,
  lineHeight: 1.2,
} satisfies CSSProperties

const labelStyle = {
  maxWidth: '100%',
  color: 'var(--theme-text)',
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: 1.15,
  overflowWrap: 'anywhere',
  textAlign: 'center',
} satisfies CSSProperties

function mediaID(image: SheetImage): string | null {
  if (!image) return null
  if (typeof image === 'string') return image
  return image.id ?? null
}

function mediaFromImage(image: SheetImage): Media | null {
  if (!image || typeof image === 'string') return null
  return image.url || image.thumbnailURL ? image : null
}

async function mediaByID(
  sheets: AncientOneSheet[],
  payload: DefaultServerCellComponentProps['payload'],
) {
  const ids = Array.from(
    new Set(
      sheets.map((sheet) => mediaID(sheet.sheetImage)).filter((id): id is string => Boolean(id)),
    ),
  )

  if (ids.length === 0) return new Map<string, Media>()

  try {
    const result = await payload.find({
      collection: 'media',
      depth: 0,
      limit: ids.length,
      overrideAccess: true,
      pagination: false,
      select: {
        alt: true,
        filename: true,
        thumbnailURL: true,
        url: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
    })

    return new Map(result.docs.map((media) => [media.id, media as Media]))
  } catch {
    return new Map<string, Media>()
  }
}

function sheetDisplays(sheets: AncientOneSheet[], mediaLookup: Map<string, Media>): SheetDisplay[] {
  return sheets.map((sheet) => {
    const image =
      mediaFromImage(sheet.sheetImage) ?? mediaLookup.get(mediaID(sheet.sheetImage) ?? '') ?? null

    return {
      id: sheet.id,
      image,
      isDefault: sheet.isDefault,
      label: sheet.label,
    }
  })
}

export default async function AncientOneSheetsListCell({
  cellData,
  payload,
}: DefaultServerCellComponentProps): Promise<ReactNode> {
  if (!Array.isArray(cellData) || cellData.length === 0) {
    return <span>No sheets</span>
  }

  const sheets = cellData as AncientOneSheet[]
  const mediaLookup = await mediaByID(sheets, payload)

  return (
    <div style={cellStyle}>
      {sheetDisplays(sheets, mediaLookup).map((sheet, index) => {
        const imageURL = sheet.image?.thumbnailURL ?? sheet.image?.url ?? null
        const label = sheet.label || `Sheet ${index + 1}`

        return (
          <div key={sheet.id ?? index} style={sheetStyle}>
            <div style={imageFrameStyle}>
              {imageURL ? (
                // Payload media may be local or externally hosted, so it cannot use a fixed Next image loader.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={sheet.image?.alt ?? sheet.image?.filename ?? label}
                  src={imageURL}
                  style={imageStyle}
                />
              ) : (
                <span style={placeholderStyle}>No image</span>
              )}
              {sheet.isDefault && <span style={defaultMarkerStyle}>Default</span>}
            </div>
            <span style={labelStyle}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
