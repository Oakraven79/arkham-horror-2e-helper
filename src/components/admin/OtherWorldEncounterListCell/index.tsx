import type { DefaultCellComponentProps } from 'payload'
import type { ReactNode } from 'react'

import { EncounterListCellLayout } from '@/components/admin/EncounterListCellLayout'

type EncounterRow = {
  destination?: {
    name?: string | null
  } | string | null
  id?: string | null
  isOther?: boolean | null
  text?: string | null
}

function encounterHeading(encounter: EncounterRow, index: number): string {
  if (encounter.isOther) return 'Other'

  if (
    encounter.destination &&
    typeof encounter.destination === 'object' &&
    'name' in encounter.destination &&
    encounter.destination.name
  ) {
    return encounter.destination.name
  }

  return `Encounter ${index + 1}`
}

export default function OtherWorldEncounterListCell({
  cellData,
}: DefaultCellComponentProps): ReactNode {
  if (!Array.isArray(cellData) || cellData.length === 0) {
    return <span>No encounters</span>
  }

  return (
    <EncounterListCellLayout
      blocks={(cellData as EncounterRow[]).map((encounter, index) => ({
        heading: encounterHeading(encounter, index),
        key: encounter.id ?? index,
        text: encounter.text,
      }))}
    />
  )
}
