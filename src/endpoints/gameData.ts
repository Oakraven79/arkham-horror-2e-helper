import { createHash } from 'node:crypto'

import type { Endpoint, PayloadRequest } from 'payload'

import { buildGameDataArchive, importGameDataArchive } from '@/fixtures/gameDataArchive'
import { GAME_DATA_FIXTURE_NAMESPACE, GAME_DATA_FIXTURE_VERSION } from '@/fixtures/gameData'
import { loadGameDataFixture, validateGameDataFixture } from '@/fixtures/gameDataLoader'
import { buildCurrentGameDataSummary } from '@/fixtures/gameDataSummary'

function unauthorized() {
  return Response.json({ error: 'Payload authentication is required.' }, { status: 401 })
}

async function authenticatedUser(req: PayloadRequest) {
  if (req.user) return req.user

  const result = await req.payload.auth({
    headers: req.headers,
    req,
  })

  return result.user
}

async function latestInstallation(req: PayloadRequest) {
  const result = await req.payload.find({
    collection: 'fixture-installations',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
  })

  return result.docs[0] ?? null
}

async function runningInstallationConflict(req: PayloadRequest) {
  const running = await req.payload.find({
    collection: 'fixture-installations',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      status: {
        equals: 'running',
      },
    },
  })

  if (!running.docs[0]) return null

  const runningInstallation = running.docs[0]
  const stale = Date.now() - new Date(runningInstallation.startedAt).getTime() > 30 * 60 * 1000

  if (!stale) {
    return Response.json(
      {
        error: 'A game-data load is already running.',
        installation: runningInstallation,
      },
      { status: 409 },
    )
  }

  await req.payload.update({
    collection: 'fixture-installations',
    id: runningInstallation.id,
    data: {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: 'The fixture load did not complete within 30 minutes.',
    },
    overrideAccess: true,
  })

  return null
}

async function createInstallation(
  req: PayloadRequest,
  userID: string | number,
  checksum: string,
  namespace = GAME_DATA_FIXTURE_NAMESPACE,
  fixtureVersion = GAME_DATA_FIXTURE_VERSION,
) {
  return req.payload.create({
    collection: 'fixture-installations',
    data: {
      namespace,
      fixtureVersion,
      checksum,
      status: 'running',
      initiatedBy: String(userID),
      startedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })
}

function archiveDownloadName() {
  return `game-data-archive-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`
}

function checksumBuffer(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function binaryBody(req: PayloadRequest) {
  if (typeof req.arrayBuffer !== 'function') return null

  try {
    return Buffer.from(await req.arrayBuffer())
  } catch {
    return null
  }
}

async function currentGameDataSummary(req: PayloadRequest) {
  try {
    return await buildCurrentGameDataSummary(req.payload)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown current game-data summary error'

    req.payload.logger.error({
      err: error,
      msg: 'Current game-data summary failed',
    })

    return {
      available: false,
      error: message,
    }
  }
}

export const gameDataEndpoints: Endpoint[] = [
  {
    path: '/game-data/status',
    method: 'get',
    handler: async (req) => {
      if (!(await authenticatedUser(req))) return unauthorized()

      return Response.json({
        current: await currentGameDataSummary(req),
        fixture: validateGameDataFixture(),
        latestInstallation: await latestInstallation(req),
      })
    },
  },
  {
    path: '/game-data/validate',
    method: 'post',
    handler: async (req) => {
      if (!(await authenticatedUser(req))) return unauthorized()

      const fixture = validateGameDataFixture()

      return Response.json(
        { fixture },
        {
          status: fixture.valid ? 200 : 422,
        },
      )
    },
  },
  {
    path: '/game-data/load',
    method: 'post',
    handler: async (req) => {
      const user = await authenticatedUser(req)

      if (!user) return unauthorized()

      const validation = validateGameDataFixture()

      if (!validation.valid) {
        return Response.json({ fixture: validation }, { status: 422 })
      }

      const conflict = await runningInstallationConflict(req)
      if (conflict) return conflict

      const installation = await createInstallation(
        req,
        user.id,
        validation.checksum,
        validation.namespace,
        validation.version,
      )

      try {
        const summary = await loadGameDataFixture(req.payload)
        const completed = await req.payload.update({
          collection: 'fixture-installations',
          id: installation.id,
          data: {
            status: 'succeeded',
            completedAt: new Date().toISOString(),
            summary,
          },
          overrideAccess: true,
        })

        return Response.json({
          installation: completed,
          summary,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown fixture loading error'

        await req.payload.update({
          collection: 'fixture-installations',
          id: installation.id,
          data: {
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: message,
          },
          overrideAccess: true,
        })

        req.payload.logger.error({
          err: error,
          msg: 'Game data fixture load failed',
        })

        return Response.json({ error: message }, { status: 500 })
      }
    },
  },
  {
    path: '/game-data/archive',
    method: 'get',
    handler: async (req) => {
      if (!(await authenticatedUser(req))) return unauthorized()

      try {
        const archive = await buildGameDataArchive(req.payload)

        return new Response(archive, {
          headers: {
            'Content-Disposition': `attachment; filename="${archiveDownloadName()}"`,
            'Content-Type': 'application/zip',
          },
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown game-data archive export error'

        req.payload.logger.error({
          err: error,
          msg: 'Game data archive export failed',
        })

        return Response.json({ error: message }, { status: 500 })
      }
    },
  },
  {
    path: '/game-data/archive',
    method: 'post',
    handler: async (req) => {
      const user = await authenticatedUser(req)

      if (!user) return unauthorized()

      const archive = await binaryBody(req)

      if (!archive || archive.length === 0) {
        return Response.json({ error: 'Upload a game-data archive zip.' }, { status: 400 })
      }

      const conflict = await runningInstallationConflict(req)
      if (conflict) return conflict

      const installation = await createInstallation(req, user.id, checksumBuffer(archive))

      try {
        const summary = await importGameDataArchive(req.payload, archive)
        const completed = await req.payload.update({
          collection: 'fixture-installations',
          id: installation.id,
          data: {
            status: 'succeeded',
            completedAt: new Date().toISOString(),
            summary,
          },
          overrideAccess: true,
        })

        return Response.json({
          installation: completed,
          summary,
        })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown game-data archive import error'

        await req.payload.update({
          collection: 'fixture-installations',
          id: installation.id,
          data: {
            status: 'failed',
            completedAt: new Date().toISOString(),
            error: message,
          },
          overrideAccess: true,
        })

        req.payload.logger.error({
          err: error,
          msg: 'Game data archive import failed',
        })

        return Response.json({ error: message }, { status: 500 })
      }
    },
  },
]
