import { describe, expect, it } from 'vitest'

import type { AncientOneSetupOption } from '@/app/(frontend)/AncientOneSetupFields'
import { resolveAncientOneSetupSelection } from '@/app/(frontend)/ancientOneSetupSelection'

const options: AncientOneSetupOption[] = [
  {
    ancientOneID: 'cthulhu-db-id',
    ancientOneKey: 'cthulhu',
    sheetKey: 'standard',
    value: 'cthulhu-db-id::standard',
    label: 'Cthulhu - Standard (13 doom)',
  },
  {
    ancientOneID: 'azathoth-db-id',
    ancientOneKey: 'azathoth',
    sheetKey: 'standard',
    value: 'azathoth-db-id::standard',
    label: 'Azathoth - Standard (14 doom)',
  },
]

describe('Ancient One setup selection', () => {
  it('SETUP-06 resolves the saved selection to a rendered option value', () => {
    expect(
      resolveAncientOneSetupSelection(options, {
        ancientOneID: 'azathoth-db-id',
        ancientOneKey: 'azathoth',
        sheetKey: 'standard',
      }),
    ).toBe('azathoth-db-id::standard')
  })

  it('SETUP-06 falls back to the stable Ancient One key when a populated id does not match', () => {
    expect(
      resolveAncientOneSetupSelection(options, {
        ancientOneID: 'stale-populated-id',
        ancientOneKey: 'azathoth',
        sheetKey: 'standard',
      }),
    ).toBe('azathoth-db-id::standard')
  })

  it('SETUP-06 returns no selection when the saved sheet is unavailable', () => {
    expect(
      resolveAncientOneSetupSelection(options, {
        ancientOneID: 'azathoth-db-id',
        ancientOneKey: 'azathoth',
        sheetKey: 'missing',
      }),
    ).toBe('')
  })
})
