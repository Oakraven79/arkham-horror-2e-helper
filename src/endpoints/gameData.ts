import type { Endpoint, PayloadRequest } from 'payload'

import {
  loadGameDataFixture,
  validateGameDataFixture,
} from '@/fixtures/gameDataLoader'

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

export const gameDataEndpoints: Endpoint[] = [
  {
    path: '/game-data/status',
    method: 'get',
    handler: async (req) => {
      if (!(await authenticatedUser(req))) return unauthorized()

      return Response.json({
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

      if (running.docs[0]) {
        const runningInstallation = running.docs[0]
        const stale =
          Date.now() - new Date(runningInstallation.startedAt).getTime() > 30 * 60 * 1000

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
      }

      const startedAt = new Date().toISOString()
      const installation = await req.payload.create({
        collection: 'fixture-installations',
        data: {
          namespace: validation.namespace,
          fixtureVersion: validation.version,
          checksum: validation.checksum,
          status: 'running',
          initiatedBy: user.id,
          startedAt,
        },
        overrideAccess: true,
      })

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
]
