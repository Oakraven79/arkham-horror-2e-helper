import type { Payload } from 'payload'

import {
  mythosDeckStateForPayload,
  mythosDeckStateFromSession,
} from '@/lib/mythosSessionState'

export async function migrateMythosDeckInstances(payload: Payload, apply: boolean) {
  const sessions = await payload.find({
    collection: 'game-sessions',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
  })
  const changes: string[] = []

  for (const session of sessions.docs) {
    const mythos = session.mythos
    const alreadyMigrated =
      mythos?.drawPileInstances != null ||
      mythos?.discardPileInstances != null ||
      mythos?.drawHistoryInstances != null

    if (alreadyMigrated) {
      continue
    }

    changes.push(session.name)

    if (apply) {
      await payload.update({
        collection: 'game-sessions',
        id: session.id,
        data: {
          mythos: mythosDeckStateForPayload(mythosDeckStateFromSession(session)),
        },
        overrideAccess: true,
      })
    }
  }

  return {
    apply,
    changes,
  }
}
