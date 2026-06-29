import { describe, expect, it } from 'vitest'

import { getStarterAncientOne, starterAncientOnes } from '@/content/ancientOnes'
import { validateAncientOneSheets } from '@/lib/ancientOneContent'

describe('Ancient One starter content', () => {
  it('contains 25 unique Ancient Ones and 28 playable sheets', () => {
    expect(starterAncientOnes).toHaveLength(25)
    expect(new Set(starterAncientOnes.map((ancientOne) => ancientOne.key)).size).toBe(25)
    expect(
      starterAncientOnes.reduce((total, ancientOne) => total + ancientOne.sheets.length, 0),
    ).toBe(28)

    for (const ancientOne of starterAncientOnes) {
      expect(ancientOne.sheets.filter((sheet) => sheet.isDefault)).toHaveLength(1)
      expect(new Set(ancientOne.sheets.map((sheet) => sheet.key)).size).toBe(
        ancientOne.sheets.length,
      )
    }
  })

  it('preserves the three multi-sheet Ancient Ones', () => {
    const multiSheetAncientOnes = starterAncientOnes.filter(
      (ancientOne) => ancientOne.sheets.length > 1,
    )

    expect(multiSheetAncientOnes.map((ancientOne) => ancientOne.name)).toEqual([
      'Cthulhu',
      'Hastur',
      'Yig',
    ])

    for (const ancientOne of multiSheetAncientOnes) {
      expect(ancientOne.sheets.map((sheet) => sheet.key)).toEqual(['original', 'arkham-nights'])
    }
  })

  it('normalizes expansions, combat ratings, defenses, and rules notes', () => {
    expect(getStarterAncientOne('daoloth')?.boxedSet).toBe('Promotional')
    expect(getStarterAncientOne('azathoth')?.sheets[0].combatRating).toEqual({
      display: '-\u221e',
      type: 'infinite',
    })
    expect(getStarterAncientOne('hastur')?.sheets[0].combatRating).toEqual({
      display: '-X',
      type: 'variable',
    })
    expect(getStarterAncientOne('cthulhu')?.sheets[0]).toMatchObject({
      combatRating: {
        display: '-6',
        modifier: -6,
        type: 'fixed',
      },
      defenses: ['special'],
    })
    expect(getStarterAncientOne('atlach-nacha')?.sheets[0].defenses).toEqual([
      'physical-resistance',
      'magical-resistance',
    ])

    const notes = starterAncientOnes.flatMap((ancientOne) => ancientOne.rulesNotes ?? [])

    expect(notes.filter((note) => note.kind === 'clarification')).toHaveLength(4)
    expect(notes.filter((note) => note.kind === 'errata')).toHaveLength(2)
    expect(notes.filter((note) => note.kind === 'reference')).toHaveLength(1)
  })

  it('validates stable sheet keys and exactly one default', () => {
    const validSheet = {
      key: 'standard',
      isDefault: true,
      combatRating: {
        type: 'fixed',
        modifier: -4,
      },
    }

    expect(validateAncientOneSheets([validSheet])).toBe(true)
    expect(
      validateAncientOneSheets([
        validSheet,
        {
          ...validSheet,
          isDefault: false,
        },
      ]),
    ).toBe('Ancient One sheet keys must be unique within the document.')
    expect(
      validateAncientOneSheets([
        {
          ...validSheet,
          isDefault: false,
        },
      ]),
    ).toBe('Exactly one Ancient One sheet must be the default.')
    expect(
      validateAncientOneSheets([
        {
          ...validSheet,
          combatRating: {
            type: 'fixed',
          },
        },
      ]),
    ).toBe('Fixed combat ratings require a numeric modifier.')
  })
})
