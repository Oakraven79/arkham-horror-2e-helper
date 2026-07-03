'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import { createControllerRoomCredentials } from '@/lib/controllerAuth'
import config from '@/payload.config'

async function payloadClient() {
  return getPayload({ config: await config })
}

export async function enableMobileControlsAction(sessionID: string) {
  const payload = await payloadClient()
  const session = await payload.findByID({
    collection: 'game-sessions',
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.status !== 'active') {
    throw new Error('Resume this session before enabling mobile controls.')
  }

  const credentials = createControllerRoomCredentials()

  await payload.update({
    collection: 'game-sessions',
    id: sessionID,
    overrideAccess: true,
    data: {
      mobileControlsEnabled: true,
      mobileControlExpiresAt: credentials.expiresAt,
      mobileControlVersion: credentials.roomVersion,
      mobileJoinCodeHash: credentials.joinCodeHash,
      mobileJoinSecretHash: credentials.joinSecretHash,
    },
  })

  revalidatePath('/')

  return {
    expiresAt: credentials.expiresAt,
    joinCode: credentials.joinCode,
    joinSecret: credentials.joinSecret,
  }
}

export async function disableMobileControlsAction(sessionID: string) {
  const payload = await payloadClient()

  await payload.update({
    collection: 'game-sessions',
    id: sessionID,
    overrideAccess: true,
    data: {
      mobileControlsEnabled: false,
      mobileControlExpiresAt: null,
      mobileControlVersion: null,
      mobileJoinCodeHash: null,
      mobileJoinSecretHash: null,
    },
  })

  revalidatePath('/')
}
