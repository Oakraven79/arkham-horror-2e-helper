import { ValidationError, type CollectionConfig } from 'payload'

import { gameDataFixtureFields } from './fields/gameDataFixtureFields'
import { cardPreviewField } from './fields/cardPreviewField'
import { validateArkhamEncounterRows } from '@/lib/arkhamEncounterContent'
import { relationshipID } from '@/lib/boxedSetContent'
import { requiredSetsField } from './fields/requiredSetsField'

export const ArkhamEncounterCards: CollectionConfig = {
  slug: 'arkham-encounter-cards',
  labels: {
    singular: 'Arkham Encounter Card',
    plural: 'Arkham Encounter Cards',
  },
  admin: {
    useAsTitle: 'cardCode',
    defaultColumns: ['cardCode', 'cardPreview', 'neighborhood', 'sourceSet', 'updatedAt'],
    listSearchableFields: ['cardCode', 'encounters.text'],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        const neighborhoodID = relationshipID(data?.neighborhood ?? originalDoc?.neighborhood)
        const encounters = data?.encounters ?? originalDoc?.encounters

        if (!neighborhoodID || !Array.isArray(encounters)) return data

        const mismatchedLocations: string[] = []

        for (const encounter of encounters) {
          const locationID = relationshipID(encounter.location)
          if (!locationID) continue

          const location =
            encounter.location &&
            typeof encounter.location === 'object' &&
            'neighborhood' in encounter.location
              ? encounter.location
              : await req.payload.findByID({
                  collection: 'locations',
                  id: locationID,
                  depth: 0,
                  overrideAccess: true,
                })

          if (relationshipID(location.neighborhood) !== neighborhoodID) {
            mismatchedLocations.push(location.name)
          }
        }

        if (mismatchedLocations.length > 0) {
          throw new ValidationError({
            collection: 'arkham-encounter-cards',
            req,
            errors: [
              {
                path: 'encounters',
                message: `Encounter locations must belong to the selected neighborhood: ${mismatchedLocations.join(', ')}.`,
              },
            ],
          })
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'cardCode',
      label: 'Card Code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Stable internal identifier, for example "base-uptown-001".',
      },
    },
    cardPreviewField(),
    {
      name: 'neighborhood',
      type: 'relationship',
      relationTo: 'neighborhoods',
      required: true,
      index: true,
      admin: {
        description: 'Determines this card’s deck, colour, front frame, and card back.',
      },
    },
    {
      name: 'encounters',
      type: 'array',
      required: true,
      minRows: 1,
      validate: validateArkhamEncounterRows,
      admin: {
        components: {
          Cell: '/components/admin/ArkhamEncounterListCell',
        },
      },
      fields: [
        {
          name: 'location',
          type: 'relationship',
          relationTo: 'locations',
          required: true,
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          admin: {
            rows: 8,
            description: 'Markdown is supported by the encounter card component.',
          },
        },
      ],
    },
    {
      name: 'sourceSet',
      label: 'Boxed Set',
      type: 'relationship',
      relationTo: 'boxed-sets',
      required: true,
      index: true,
    },
    requiredSetsField,
    {
      name: 'clarifications',
      type: 'textarea',
      admin: {
        rows: 5,
        description: 'Optional helper notes. These are not printed on the rendered card.',
      },
    },
    ...gameDataFixtureFields,
  ],
}
