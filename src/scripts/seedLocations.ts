import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedLocations } from '@/seed/locations'

const payload = await getPayload({ config })

try {
  const result = await seedLocations(payload)

  payload.logger.info(
    `Location seed complete: ${result.created.length} created, ${result.existing.length} already present, ${result.mediaCreated} media created.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
