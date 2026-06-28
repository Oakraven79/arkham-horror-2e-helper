import { getPayload } from 'payload'

import config from '@/payload.config'
import { migrateMythosLocations } from '@/seed/migrateMythosLocations'

const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })

try {
  const result = await migrateMythosLocations(payload, apply)

  for (const change of result.changes) {
    payload.logger.info(
      `${apply ? 'Migrated' : 'Would migrate'} "${change.title}": ${change.fields.join(', ')}`,
    )
  }

  for (const unresolved of result.unresolved) {
    payload.logger.warn(`Unresolved Mythos location: ${unresolved}`)
  }

  payload.logger.info(
    `${apply ? 'Migration' : 'Dry run'} complete: ${result.changes.length} cards, ${result.unresolved.length} unresolved.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
