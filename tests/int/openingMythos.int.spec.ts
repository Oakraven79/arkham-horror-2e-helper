import { describe, expect, it } from 'vitest'

import { isHeadlineCardType } from '@/lib/openingMythos'

describe('opening Mythos', () => {
  it('accepts only Headlines for the opening card', () => {
    expect(isHeadlineCardType('Headline')).toBe(true)
    expect(isHeadlineCardType('Rumor')).toBe(false)
    expect(isHeadlineCardType('Environment (Weather)')).toBe(false)
    expect(isHeadlineCardType('Environment (Mystic)')).toBe(false)
  })
})
