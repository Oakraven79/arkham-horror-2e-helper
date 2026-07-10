import type { Payload } from 'payload'

import { BASE_GAME_SET_KEY } from './gameSessionContent'

export const requiredGameData = [
  {
    key: 'baseGameSet',
    collection: 'boxed-sets',
    label: 'Base Game boxed set',
    where: {
      key: {
        equals: BASE_GAME_SET_KEY,
      },
    },
  },
  {
    key: 'ancientOnes',
    collection: 'ancient-ones',
    label: 'Ancient Ones',
  },
  {
    key: 'mythosCards',
    collection: 'mythos-cards',
    label: 'Mythos cards',
  },
  {
    key: 'arkhamEncounterCards',
    collection: 'arkham-encounter-cards',
    label: 'Arkham encounter cards',
  },
  {
    key: 'otherWorldEncounterCards',
    collection: 'other-world-encounter-cards',
    label: 'Other World encounter cards',
  },
] as const

export type RequiredGameData = (typeof requiredGameData)[number]
export type RequiredGameDataKey = RequiredGameData['key']

export interface GameDataReadiness {
  counts: Record<RequiredGameDataKey, number>
  missing: RequiredGameData[]
  ready: boolean
}

type FindResult = Awaited<ReturnType<Payload['find']>>

function resultCount(result: FindResult) {
  return typeof result.totalDocs === 'number' ? result.totalDocs : result.docs.length
}

function formatList(values: string[]) {
  if (values.length <= 2) return values.join(' and ')

  return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`
}

export async function getGameDataReadiness(payload: Payload): Promise<GameDataReadiness> {
  const entries = await Promise.all(
    requiredGameData.map(async (requirement) => {
      const where = 'where' in requirement ? requirement.where : undefined
      const result = await payload.find({
        collection: requirement.collection,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        ...(where ? { where } : {}),
      })

      return [requirement.key, resultCount(result)] as const
    }),
  )
  const counts = Object.fromEntries(entries) as Record<RequiredGameDataKey, number>
  const missing = requiredGameData.filter((requirement) => counts[requirement.key] === 0)

  return {
    counts,
    missing,
    ready: missing.length === 0,
  }
}

export function gameDataReadinessMessage(readiness: GameDataReadiness) {
  if (readiness.ready) return 'Game data is ready.'

  return `Load game data before creating a session. Missing: ${formatList(
    readiness.missing.map((requirement) => requirement.label),
  )}.`
}
