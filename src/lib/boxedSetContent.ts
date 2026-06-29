import { getOfficialBoxedSet } from '@/content/boxedSets'
import type { OfficialBoxedSetKey, OfficialBoxedSetName } from '@/content/boxedSetTypes'
import type { BoxedSet, Media } from '@/payload-types'

export function relationshipID(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = value.id

    if (typeof id === 'string' || typeof id === 'number') {
      return String(id)
    }
  }

  return null
}

export function isBoxedSet(value: unknown): value is BoxedSet {
  return Boolean(value && typeof value === 'object' && 'key' in value && 'abbreviation' in value)
}

export function isMedia(value: unknown): value is Media {
  return Boolean(value && typeof value === 'object' && 'url' in value)
}

export function officialBoxedSetName(key: OfficialBoxedSetKey): OfficialBoxedSetName {
  const boxedSet = getOfficialBoxedSet(key)

  if (!boxedSet) {
    throw new Error(`Unknown official boxed-set key: ${key}`)
  }

  return boxedSet.name
}

export function requireBoxedSet(boxedSetsByKey: Map<string, BoxedSet>, key: OfficialBoxedSetKey) {
  const boxedSet = boxedSetsByKey.get(key)

  if (!boxedSet) {
    throw new Error(
      `Cannot seed content because boxed set "${key}" is missing. Run the Boxed Set seed first.`,
    )
  }

  return boxedSet
}
