import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedNeighborhoods } from '@/seed/neighborhoods'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedNeighborhoods(payload, { dryRun })

  payload.logger.info(
    `Neighborhood seed ${dryRun ? 'dry run' : 'complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
