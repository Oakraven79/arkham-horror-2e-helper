import { getPayload } from 'payload'

import config from '@/payload.config'
import { seedMythosCards } from '@/seed/mythosCards'

const payload = await getPayload({ config })

try {
  const result = await seedMythosCards(payload)

  payload.logger.info(
    `Mythos seed complete: ${result.created.length} created, ${result.linked.length} existing cards linked, ${result.existing.length} already present.`,
  )
} finally {
  await payload.destroy()
}

process.exit(0)
