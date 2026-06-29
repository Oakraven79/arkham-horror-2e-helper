import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedBoxedSets } from '@/seed/boxedSets'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedBoxedSets(payload, { dryRun })

  payload.logger.info(
    `${dryRun ? 'Boxed Set seed dry run' : 'Boxed Set seed complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
