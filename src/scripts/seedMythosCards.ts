import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedMythosCards } from '@/seed/mythosCards'

const payload = await getPayload({ config })
const dryRun = process.argv.includes('--dry-run')

try {
  const result = await seedMythosCards(payload, { dryRun })

  payload.logger.info(
    `${dryRun ? 'Mythos seed dry run' : 'Mythos seed complete'}: ${result.created.length} created, ${result.enriched.length} enriched, ${result.unchanged.length} unchanged, ${result.ambiguous.length} ambiguous, ${result.unresolvedLocations.length} unresolved locations, ${result.mediaCreated} media created; ${result.physicalCards} physical cards represented.`,
  )

  for (const title of result.ambiguous) {
    payload.logger.warn(`Ambiguous Mythos card seed match: ${title}`)
  }

  for (const key of result.unresolvedLocations) {
    payload.logger.warn(`Missing Mythos gate location: ${key}`)
  }

  if (dryRun) {
    for (const detail of result.enrichmentDetails.slice(0, 10)) {
      payload.logger.info(
        `Mythos card would be enriched: ${detail.title} (${detail.fields.join(', ')})`,
      )
    }
  }
} finally {
  await payload.destroy()
}

process.exit(0)
