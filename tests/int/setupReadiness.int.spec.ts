import { describe, expect, it } from 'vitest'

import { assertSelectedAncientOneCanBegin, requiredSetupAncientOneID } from '@/lib/setupReadiness'
import type { AncientOne, GameSession } from '@/payload-types'

function session(overrides: Partial<GameSession> = {}) {
  return {
    activeAncientOne: 'azathoth',
    ancientOneSheetKey: 'standard',
    enabledSets: ['base-set'],
    ...overrides,
  } as GameSession
}

function ancientOne(overrides: Partial<AncientOne> = {}) {
  return {
    id: 'azathoth',
    name: 'Azathoth',
    sourceSet: 'base-set',
    sheets: [
      {
        key: 'standard',
        label: 'Standard',
        isDefault: true,
        doomTrack: 14,
      },
    ],
    ...overrides,
  } as AncientOne
}

describe('setup readiness', () => {
  it('requires an Ancient One and sheet before setup can advance', () => {
    expect(() => requiredSetupAncientOneID(session({ activeAncientOne: null }))).toThrow(
      'Select an Ancient One before beginning the game.',
    )
    expect(() => requiredSetupAncientOneID(session({ ancientOneSheetKey: null }))).toThrow(
      'Select an Ancient One before beginning the game.',
    )
  })

  it('rejects a selected Ancient One sheet that cannot be found', () => {
    expect(() =>
      assertSelectedAncientOneCanBegin(
        session({ ancientOneSheetKey: 'missing-sheet' }),
        ancientOne(),
      ),
    ).toThrow('The selected Ancient One sheet could not be found.')
  })

  it('rejects an Ancient One outside the enabled setup sets', () => {
    expect(() =>
      assertSelectedAncientOneCanBegin(
        session({ enabledSets: ['base-set'] }),
        ancientOne({ sourceSet: 'dunwich-set' }),
      ),
    ).toThrow('The selected Ancient One is not from a set enabled for this session.')
  })

  it('accepts a selected Ancient One and sheet from an enabled set', () => {
    expect(() => assertSelectedAncientOneCanBegin(session(), ancientOne())).not.toThrow()
  })
})
