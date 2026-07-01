import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedArkhamEncounterCards } from '@/seed/arkhamEncounterCards'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedArkhamEncounterCards(payload, { dryRun })

  payload.logger.info(
    `Arkham encounter card seed ${dryRun ? 'dry run' : 'complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
