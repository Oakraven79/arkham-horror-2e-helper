import type { DefaultServerCellComponentProps, Payload } from 'payload'
import type { ReactNode } from 'react'

import { EncounterListCellLayout } from '@/components/admin/EncounterListCellLayout'

type EncounterRow = {
  id?: string | null
  location?:
    | {
        id?: string | null
        name?: string | null
      }
    | string
    | null
  text?: string | null
}

function locationID(location: EncounterRow['location']): string | null {
  if (!location) return null
  if (typeof location === 'string') return location
  return location.id ?? null
}

function locationName(location: EncounterRow['location']): string | null {
  if (!location || typeof location === 'string') return null
  return location.name ?? null
}

async function locationNamesByID(encounters: EncounterRow[], payload: Payload) {
  const ids = Array.from(
    new Set(
      encounters
        .map((encounter) => locationID(encounter.location))
        .filter((id): id is string => Boolean(id)),
    ),
  )

  if (ids.length === 0) return new Map<string, string>()

  try {
    const result = await payload.find({
      collection: 'locations',
      depth: 0,
      limit: ids.length,
      overrideAccess: true,
      pagination: false,
      select: {
        name: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
    })

    return new Map(result.docs.map((location) => [location.id, location.name]))
  } catch {
    return new Map<string, string>()
  }
}

function encounterHeading(
  encounter: EncounterRow,
  index: number,
  namesByID: Map<string, string>,
): string {
  const name = locationName(encounter.location)
  if (name) return name

  const id = locationID(encounter.location)
  if (id) return namesByID.get(id) ?? `Encounter ${index + 1}`

  return `Encounter ${index + 1}`
}

export default async function ArkhamEncounterListCell({
  cellData,
  payload,
}: DefaultServerCellComponentProps): Promise<ReactNode> {
  if (!Array.isArray(cellData) || cellData.length === 0) {
    return <span>No encounters</span>
  }

  const encounters = cellData as EncounterRow[]
  const namesByID = await locationNamesByID(encounters, payload)

  return (
    <EncounterListCellLayout
      blocks={encounters.map((encounter, index) => ({
        heading: encounterHeading(encounter, index, namesByID),
        key: encounter.id ?? index,
        text: encounter.text,
      }))}
    />
  )
}
