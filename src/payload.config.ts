// storage-adapter-import-placeholder
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { BoxedSets } from './collections/BoxedSets'
import { AncientOnes } from './collections/AncientOnes'
import { MythosCards } from './collections/MythosCards'
import { GameSessions } from './collections/GameSessions'
import { OtherWorldEncounterCards } from './collections/OtherWorldEncounterCards'
import { OtherWorlds } from './collections/OtherWorlds'
import { Locations } from './collections/Locations'
import { FixtureInstallations } from './collections/FixtureInstallations'
import { gameDataEndpoints } from './endpoints/gameData'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    components: {
      afterNavLinks: ['/components/admin/GameDataNavLink'],
      views: {
        gameData: {
          Component: '/components/admin/GameDataView',
          path: '/game-data',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ collectionConfig, data, req }) =>
        `${req.protocol}//${req.host}/preview/${collectionConfig?.slug ?? 'mythos-cards'}/${data.id}/`,
      collections: ['mythos-cards', 'other-world-encounter-cards'],
    },
  },
  collections: [
    Users,
    Media,
    BoxedSets,
    AncientOnes,
    Locations,
    MythosCards,
    OtherWorlds,
    OtherWorldEncounterCards,
    GameSessions,
    FixtureInstallations,
  ],
  editor: lexicalEditor(),
  endpoints: gameDataEndpoints,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
  ],
})
