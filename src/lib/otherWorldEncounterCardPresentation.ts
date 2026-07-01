import type { OtherworldEncounterCardFrontProps } from '@/components/otherworldEncounterCardFront'
import type { OtherWorld, OtherWorldEncounterCard } from '@/payload-types'

import { boxedSetDisplay } from './boxedSetPresentation'

function isOtherWorld(value: unknown): value is OtherWorld {
  return Boolean(
    value && typeof value === 'object' && 'name' in value && typeof value.name === 'string',
  )
}

export function otherWorldEncounterCardFrontProps(
  card: OtherWorldEncounterCard,
): OtherworldEncounterCardFrontProps {
  return {
    boxedSet: boxedSetDisplay(card.sourceSet),
    colour: card.colour,
    textBlocks: card.encounters.map((encounter) => ({
      header: encounter.isOther
        ? 'Other'
        : isOtherWorld(encounter.destination)
          ? encounter.destination.name
          : 'Unresolved destination',
      desc: encounter.text,
    })),
  }
}
