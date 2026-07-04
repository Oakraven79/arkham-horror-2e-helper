import { describe, expect, it } from 'vitest'

import {
  assertSetsCanChange,
  contentIsEligibleForEnabledSets,
  eligibleDocuments,
  freshMythosDeckState,
  normalizeEnabledSetSelection,
  relationshipIDs,
  requiredSetIDs,
  sameSetSelection,
  sourceSetWhere,
} from '@/lib/gameSessionContent'
import type { BoxedSet, GameSession, MythosCard } from '@/payload-types'

const availableSets = [
  { id: 'set-base', key: 'base-game' },
  { id: 'set-dunwich', key: 'dunwich-horror' },
  { id: 'set-custom', key: 'custom-set' },
] as Pick<BoxedSet, 'id' | 'key'>[]

describe('game session content', () => {
  it('normalizes relationship IDs and builds the shared source-set query', () => {
    const ids = relationshipIDs(['set-base', { id: 'set-dunwich' }, null])

    expect(ids).toEqual(['set-base', 'set-dunwich'])
    expect(sourceSetWhere(ids)).toEqual({
      sourceSet: {
        in: ['set-base', 'set-dunwich'],
      },
    })
  })

  it('requires every required boxed set before content is eligible', () => {
    const baseCard = { id: 'base-card', sourceSet: 'set-base' }
    const miskatonicDunwichCard = {
      id: 'misk-card',
      sourceSet: 'set-miskatonic',
      requiredSets: ['set-miskatonic', { id: 'set-dunwich' }],
    }
    const legacyCard = {
      id: 'legacy-card',
      sourceSet: { id: 'set-dunwich' },
      requiredSets: [],
    }

    expect(requiredSetIDs(miskatonicDunwichCard)).toEqual([
      'set-miskatonic',
      'set-dunwich',
    ])
    expect(contentIsEligibleForEnabledSets(baseCard, ['set-base'])).toBe(true)
    expect(contentIsEligibleForEnabledSets(miskatonicDunwichCard, ['set-dunwich'])).toBe(false)
    expect(
      contentIsEligibleForEnabledSets(miskatonicDunwichCard, [
        'set-dunwich',
        'set-miskatonic',
      ]),
    ).toBe(true)
    expect(contentIsEligibleForEnabledSets(legacyCard, ['set-dunwich'])).toBe(true)
    expect(
      eligibleDocuments([baseCard, miskatonicDunwichCard, legacyCard], [
        'set-base',
        'set-dunwich',
      ]).map((card) => card.id),
    ).toEqual(['base-card', 'legacy-card'])
  })

  it('always includes the Base Game and rejects unknown set IDs', () => {
    expect(normalizeEnabledSetSelection(['set-dunwich'], availableSets)).toEqual([
      'set-base',
      'set-dunwich',
    ])
    expect(() => normalizeEnabledSetSelection(['unknown'], availableSets)).toThrow(
      'One or more selected boxed sets are not available.',
    )
  })

  it('locks set changes after Setup', () => {
    expect(() =>
      assertSetsCanChange({ currentPhase: 'Setup' } as Pick<GameSession, 'currentPhase'>),
    ).not.toThrow()
    expect(() =>
      assertSetsCanChange({ currentPhase: 'Mythos' } as Pick<GameSession, 'currentPhase'>),
    ).toThrow('Sets in play are locked after setup.')
  })

  it('rebuilds a clean copy-aware Mythos deck from the eligible cards', () => {
    const cards = [
      { id: 'card-one', copyCount: 1 },
      { id: 'card-two', copyCount: 2 },
    ] as Pick<MythosCard, 'copyCount' | 'id'>[]
    const state = freshMythosDeckState(cards, () => 0)
    const drawPile = state.drawPile ?? []

    expect(drawPile).toHaveLength(3)
    expect(drawPile.map((card) => card.instanceKey).sort()).toEqual([
      'card-one:1',
      'card-two:1',
      'card-two:2',
    ])
    expect(state.discardPile).toEqual([])
    expect(state.drawHistory).toEqual([])
    expect(state.currentDraw).toBeNull()
    expect(state.activeEnvironment).toBeNull()
    expect(state.activeRumor).toBeNull()
    expect(state.shuffleCount).toBe(0)
  })

  it('compares set selections without depending on relationship order', () => {
    expect(sameSetSelection(['set-base', 'set-dunwich'], ['set-dunwich', 'set-base'])).toBe(true)
    expect(sameSetSelection(['set-base'], ['set-base', 'set-dunwich'])).toBe(false)
  })
})
