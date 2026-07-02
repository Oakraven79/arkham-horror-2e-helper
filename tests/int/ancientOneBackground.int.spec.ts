import { describe, expect, it } from 'vitest'

import {
  activeAncientOneBackground,
  ancientOneSheetBackground,
  cssBackgroundImageValue,
} from '@/lib/ancientOneBackground'
import type { AncientOne } from '@/payload-types'

function sheet(sheetImage: AncientOne['sheets'][number]['sheetImage']) {
  return {
    key: 'standard',
    label: 'Standard',
    isDefault: true,
    doomTrack: 13,
    combatRating: {
      display: '-6',
      type: 'fixed',
      modifier: -6,
    },
    defenses: [],
    defenseText: 'None',
    worshippers: 'None',
    powerName: 'The Sleeper',
    power: 'A persistent power.',
    attack: 'An attack.',
    sheetImage,
  } satisfies AncientOne['sheets'][number]
}

describe('Ancient One table backgrounds', () => {
  it('resolves populated sheet media', () => {
    const background = ancientOneSheetBackground(
      sheet({
        id: 'media',
        alt: 'Cthulhu rising from the sea',
        url: '/api/media/file/cthulhu.jpg',
        updatedAt: '2026-07-03T00:00:00.000Z',
        createdAt: '2026-07-03T00:00:00.000Z',
      }),
    )

    expect(background).toEqual({
      alt: 'Cthulhu rising from the sea',
      url: '/api/media/file/cthulhu.jpg',
    })
  })

  it('falls back when the preference is disabled or artwork is missing', () => {
    const withImage = sheet({
      id: 'media',
      alt: null,
      url: '/api/media/file/azathoth.jpg',
      updatedAt: '2026-07-03T00:00:00.000Z',
      createdAt: '2026-07-03T00:00:00.000Z',
    })

    expect(activeAncientOneBackground(false, withImage)).toBeNull()
    expect(activeAncientOneBackground(true, sheet(null))).toBeNull()
    expect(activeAncientOneBackground(true, sheet('media-id'))).toBeNull()
  })

  it('creates a quoted CSS image value', () => {
    expect(cssBackgroundImageValue('/api/media/file/ancient one.jpg')).toBe(
      'url("/api/media/file/ancient one.jpg")',
    )
  })
})
