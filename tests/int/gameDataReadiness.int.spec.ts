import type { Payload } from 'payload'
import { describe, expect, it } from 'vitest'

import { gameDataReadinessMessage, getGameDataReadiness } from '@/lib/gameDataReadiness'

type ReadinessCountKey =
  | 'ancientOnes'
  | 'arkhamEncounterCards'
  | 'baseGameSet'
  | 'mythosCards'
  | 'otherWorldEncounterCards'

const collectionCountKeys: Record<string, ReadinessCountKey> = {
  'ancient-ones': 'ancientOnes',
  'arkham-encounter-cards': 'arkhamEncounterCards',
  'boxed-sets': 'baseGameSet',
  'mythos-cards': 'mythosCards',
  'other-world-encounter-cards': 'otherWorldEncounterCards',
}

function payloadWithCounts(counts: Record<ReadinessCountKey, number>) {
  return {
    find: async (args: { collection: string }) => ({
      docs: [],
      totalDocs: counts[collectionCountKeys[args.collection]],
    }),
  } as unknown as Payload
}

describe('game data readiness', () => {
  it('marks the game data ready when every required setup collection has records', async () => {
    const readiness = await getGameDataReadiness(
      payloadWithCounts({
        ancientOnes: 2,
        arkhamEncounterCards: 1,
        baseGameSet: 1,
        mythosCards: 1,
        otherWorldEncounterCards: 1,
      }),
    )

    expect(readiness.ready).toBe(true)
    expect(readiness.missing).toEqual([])
  })

  it('SETUP-07 names the missing data needed before a session can be created', async () => {
    const readiness = await getGameDataReadiness(
      payloadWithCounts({
        ancientOnes: 0,
        arkhamEncounterCards: 1,
        baseGameSet: 1,
        mythosCards: 0,
        otherWorldEncounterCards: 1,
      }),
    )

    expect(readiness.ready).toBe(false)
    expect(readiness.missing.map((requirement) => requirement.label)).toEqual([
      'Ancient Ones',
      'Mythos cards',
    ])
    expect(gameDataReadinessMessage(readiness)).toBe(
      'Load game data before creating a session. Missing: Ancient Ones and Mythos cards.',
    )
  })
})
