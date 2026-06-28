import { getPayload } from 'payload'

import config from '@/payload.config'
import { migrateMythosDeckInstances } from '@/seed/migrateMythosDeckInstances'

const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })

try {
  const result = await migrateMythosDeckInstances(payload, apply)

  for (const session of result.changes) {
    payload.logger.info(`${apply ? 'Migrated' : 'Would migrate'} session "${session}".`)
  }

  payload.logger.info(
    `${apply ? 'Migration' : 'Dry run'} complete: ${result.changes.length} sessions.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
