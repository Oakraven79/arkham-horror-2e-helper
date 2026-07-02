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
      'Set the number of investigators and review the resulting table limits.',
      'Prepare investigators, decks, clues, monsters, and gates.',
      'Continue to Opening Mythos before the first turn.',
    ],
  },
  'Opening Mythos': {
    title: 'Opening Mythos',
    summary: 'Draw until a Headline appears, then resolve it before the first turn.',
    steps: [
      'Draw and reveal the top Mythos card.',
      'Discard Rumors and Environments without resolving them, then draw again.',
      'For the first Headline, open its gate and spawn monsters.',
      'Place its clue and move monsters.',
      'Resolve the Headline ability, discard it, and begin turn one.',
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
      'At a location without a gate, shuffle the matching neighborhood deck and draw one card.',
      'Resolve the entry for the investigator’s location, then return the card to its deck.',
      'At an open gate, enter it unless returning with an explored marker.',
      'With an explored marker, attempt to close or seal the gate.',
      'Investigators in streets or Other Worlds do not have an Arkham encounter.',
    ],
  },
  'Other World Encounters': {
    title: 'Other World Encounters',
    summary: 'Flip cards until every investigator in an Other World has resolved an encounter.',
    steps: [
      'Flip the top Other World encounter card.',
      'Resolve an applicable named entry, or the Other entry when appropriate.',
      'Flip again to discard the current card and reveal the next encounter.',
      'Return encounter-only monsters to the cup after resolution.',
      'Complete the phase after every Other World encounter is resolved.',
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
