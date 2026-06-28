import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedOtherWorlds } from '@/seed/otherWorlds'

const payload = await getPayload({ config })

try {
  const result = await seedOtherWorlds(payload)

  payload.logger.info(
    `Other World seed complete: ${result.created.length} created, ${result.existing.length} already present.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
