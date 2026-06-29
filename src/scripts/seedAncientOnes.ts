import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedAncientOnes } from '@/seed/ancientOnes'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedAncientOnes(payload, { dryRun })

  payload.logger.info(
    `${dryRun ? 'Ancient One seed dry run' : 'Ancient One seed complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged, ${result.ambiguous.length} ambiguous; ${result.playableSheets} playable sheets represented.`,
  )

  for (const name of result.ambiguous) {
    payload.logger.warn(`Ambiguous Ancient One seed match: ${name}`)
  }
} finally {
  await payload.destroy()
}

process.exit(0)
