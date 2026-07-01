import type { BoxedSetDisplay } from '@/components/boxedSetMark'
import type { BoxedSet } from '@/payload-types'

import { isBoxedSet, isMedia } from './boxedSetContent'

export function boxedSetDisplay(
  sourceSet: BoxedSet | null | string | undefined,
): BoxedSetDisplay | undefined {
  if (!isBoxedSet(sourceSet)) return undefined

  const icon = isMedia(sourceSet.icon) ? sourceSet.icon : null

  return {
    name: sourceSet.name,
    abbreviation: sourceSet.abbreviation,
    iconUrl: icon?.url ?? undefined,
    iconAlt: icon?.alt ?? undefined,
  }
}
