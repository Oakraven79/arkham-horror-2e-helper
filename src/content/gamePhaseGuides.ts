import type { GamePhase } from '@/lib/gamePhaseState'

export interface GamePhaseGuide {
  summary: string
  steps: string[]
  title: string
}

export const gamePhaseGuides: Record<GamePhase, GamePhaseGuide> = {
  Setup: {
    title: 'Game Setup',
    summary: 'Choose the Ancient One and prepare the decks before the first turn.',
    steps: [
      'Choose the Ancient One and playable sheet.',
      'Prepare investigators, decks, clues, monsters, and gates.',
      'Draw and resolve the initial non-Rumor Mythos card.',
    ],
  },
  Upkeep: {
    title: 'Upkeep',
    summary: 'Complete the table upkeep sequence in order.',
    steps: [
      'Refresh exhausted cards.',
      'Resolve mandatory Upkeep actions and rolls.',
      "Adjust skill sliders within each investigator's Focus.",
    ],
  },
  Movement: {
    title: 'Movement',
    summary: 'Resolve investigator movement and anything encountered along the way.',
    steps: [
      'Stand delayed investigators instead of moving them.',
      'Move through Arkham using Speed and resolve monsters when leaving or stopping.',
      'Move Other World investigators to the next area or return through a matching gate.',
      'Collect clues when movement ends at their location.',
    ],
  },
  'Arkham Encounters': {
    title: 'Arkham Encounters',
    summary: 'Resolve encounters for investigators at Arkham locations.',
    steps: [
      'At a location without a gate, draw the matching neighborhood encounter card.',
      'At an open gate, enter it unless returning with an explored marker.',
      'With an explored marker, attempt to close or seal the gate.',
      'Investigators in streets or Other Worlds do not have an Arkham encounter.',
    ],
  },
  'Other World Encounters': {
    title: 'Other World Encounters',
    summary: 'Resolve one matching encounter for each investigator in an Other World.',
    steps: [
      'Choose the Other World and one of its encounter colours.',
      'Draw until a card of that colour is found.',
      'Resolve the named destination entry, or the Other entry when it is not listed.',
      'Return encounter-only monsters to the cup after resolution.',
    ],
  },
  Mythos: {
    title: 'Mythos',
    summary: 'The first player draws one Mythos card and resolves it in order.',
    steps: [
      'Open a gate and spawn monsters, or resolve a monster surge.',
      'Place the clue token.',
      'Move monsters using the white and black movement symbols.',
      'Resolve the Headline, Environment, or Rumor ability.',
      'Pass the first-player marker after the card is resolved.',
    ],
  },
  'Final Battle': {
    title: 'Final Battle',
    summary: 'Resolve the Ancient One battle instead of the normal turn sequence.',
    steps: [
      'Refresh investigators and resolve Upkeep.',
      'Resolve investigator attacks.',
      'Resolve the Ancient One attack.',
    ],
  },
}
