import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedLocations } from '@/seed/locations'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedLocations(payload, { dryRun })

  payload.logger.info(
    `${dryRun ? 'Location seed dry run' : 'Location seed complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged, ${result.ambiguous.length} ambiguous, ${result.mediaCreated} media created.`,
  )

  for (const name of result.ambiguous) {
    payload.logger.warn(`Ambiguous location seed match: ${name}`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
