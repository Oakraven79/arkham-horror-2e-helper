import { getPayload } from 'payload'

import config from '@/payload.config'
import { migrateBoxedSetRelationships } from '@/seed/migrateBoxedSets'

const payload = await getPayload({ config })
const apply = process.argv.includes('--apply')

try {
  const result = await migrateBoxedSetRelationships(payload, apply)
  const contentChanges = Object.entries(result.contentChanges)
    .map(([collection, count]) => `${collection}: ${count}`)
    .join(', ')

  payload.logger.info(
    `Boxed Set migration ${apply ? 'complete' : 'dry run'}: ${result.boxedSets} sets, ${contentChanges}, game-sessions: ${result.sessionsChanged}, ${result.customSetsPlanned.length} custom sets planned, ${result.customSetsCreated.length} custom sets created, ${result.unresolved.length} unresolved.`,
  )

  for (const issue of result.unresolved) {
    payload.logger.warn(`Boxed Set migration issue: ${issue}`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
