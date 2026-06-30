import type { CollectionConfig, Field } from 'payload'

import { arkhamHorror2eBoxes } from '@/components/arkhamConstants'
import { gamePhases } from '@/lib/gamePhaseState'

const phaseOptions = gamePhases

const mythosCardRelationship = {
  type: 'relationship',
  relationTo: 'mythos-cards',
} as const

const mythosCardInstanceFields: Field[] = [
  {
    name: 'instanceKey',
    type: 'text',
    required: true,
  },
  {
    name: 'card',
    ...mythosCardRelationship,
    required: true,
  },
]

export const GameSessions: CollectionConfig = {
  slug: 'game-sessions',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'turnNumber', 'currentPhase', 'updatedAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      defaultValue: 'Arkham Horror Session',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Complete', value: 'complete' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
    },
    {
      name: 'playerCount',
      type: 'number',
      required: true,
      defaultValue: 4,
      min: 1,
      max: 8,
    },
    {
      name: 'activeExpansions',
      type: 'select',
      hasMany: true,
      options: arkhamHorror2eBoxes.map((box) => ({ label: box.name, value: box.name })),
      defaultValue: ['Base Game'],
      admin: {
        hidden: true,
      },
    },
    {
      name: 'enabledSets',
      label: 'Active Expansions',
      type: 'relationship',
      relationTo: 'boxed-sets',
      hasMany: true,
      required: true,
      admin: {
        description: 'Sets enabled for this saved game.',
      },
    },
    {
      name: 'turnNumber',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'activeAncientOne',
      label: 'Active Ancient One',
      type: 'relationship',
      relationTo: 'ancient-ones',
      admin: {
        description: 'Selected during setup and used to determine the session doom track.',
      },
    },
    {
      name: 'ancientOneSheetKey',
      label: 'Ancient One Sheet',
      type: 'text',
      admin: {
        description: 'The playable sheet variant selected for this session.',
      },
    },
    {
      name: 'currentPhase',
      type: 'select',
      required: true,
      defaultValue: 'Setup',
      options: phaseOptions.map((phase) => ({ label: phase, value: phase })),
    },
    {
      name: 'phaseHistory',
      type: 'array',
      admin: {
        description:
          'Phase transitions used to restore the previous table phase without undoing game actions.',
      },
      fields: [
        {
          name: 'fromTurn',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'fromPhase',
          type: 'select',
          required: true,
          options: phaseOptions.map((phase) => ({ label: phase, value: phase })),
        },
        {
          name: 'toTurn',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'toPhase',
          type: 'select',
          required: true,
          options: phaseOptions.map((phase) => ({ label: phase, value: phase })),
        },
      ],
    },
    {
      name: 'firstPlayer',
      type: 'text',
      admin: {
        description: 'Player or investigator currently holding the first player marker.',
      },
    },
    {
      name: 'tracks',
      type: 'group',
      fields: [
        {
          name: 'doomCurrent',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
        {
          name: 'doomMax',
          type: 'number',
          defaultValue: 10,
          min: 1,
        },
        {
          name: 'terror',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          max: 10,
        },
        {
          name: 'gatesOpen',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
        {
          name: 'elderSigns',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
        {
          name: 'monstersInArkham',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
        {
          name: 'monstersInOutskirts',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      name: 'mythos',
      type: 'group',
      admin: {
        description:
          'Deck state for drawing without repeats. Shuffle events should rebuild the draw pile from the discard pile.',
      },
      fields: [
        {
          name: 'drawPile',
          label: 'Draw Pile',
          ...mythosCardRelationship,
          hasMany: true,
          admin: {
            description: 'Cards still available to draw this cycle, in draw order.',
          },
        },
        {
          name: 'discardPile',
          label: 'Discard Pile',
          ...mythosCardRelationship,
          hasMany: true,
          admin: {
            description: 'Resolved cards that can return to the deck after a shuffle event.',
          },
        },
        {
          name: 'drawHistory',
          label: 'Draw History',
          ...mythosCardRelationship,
          hasMany: true,
          admin: {
            description:
              'Every Mythos card drawn during this session. This is preserved even after shuffles.',
          },
        },
        {
          name: 'drawPileInstances',
          label: 'Draw Pile Instances',
          type: 'array',
          fields: mythosCardInstanceFields,
          admin: {
            description:
              'Copy-aware draw order. Each physical copy has its own stable instance key.',
          },
        },
        {
          name: 'discardPileInstances',
          label: 'Discard Pile Instances',
          type: 'array',
          fields: mythosCardInstanceFields,
        },
        {
          name: 'drawHistoryInstances',
          label: 'Draw History Instances',
          type: 'array',
          fields: mythosCardInstanceFields,
        },
        {
          name: 'currentDraw',
          label: 'Current Mythos Draw',
          ...mythosCardRelationship,
          admin: {
            description: 'The card currently being revealed/resolved this Mythos phase.',
          },
        },
        {
          name: 'currentDrawInstanceKey',
          type: 'text',
        },
        {
          name: 'currentDrawRevealed',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'activeEnvironment',
          label: 'Active Environment',
          ...mythosCardRelationship,
          admin: {
            description: 'Only one Environment card should be active at a time.',
          },
        },
        {
          name: 'activeEnvironmentInstanceKey',
          type: 'text',
        },
        {
          name: 'activeRumor',
          label: 'Active Rumor',
          ...mythosCardRelationship,
          admin: {
            description: 'Only one Rumor card should be active at a time.',
          },
        },
        {
          name: 'activeRumorInstanceKey',
          type: 'text',
        },
        {
          name: 'shuffleCount',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
        },
      ],
    },
    {
      name: 'shuffleEvents',
      type: 'array',
      admin: {
        description: 'Records when the discard pile was shuffled back into the draw pile.',
      },
      fields: [
        {
          name: 'turnNumber',
          type: 'number',
          min: 1,
        },
        {
          name: 'phase',
          type: 'select',
          options: phaseOptions.map((phase) => ({ label: phase, value: phase })),
        },
        {
          name: 'reason',
          type: 'select',
          required: true,
          defaultValue: 'manual',
          options: [
            { label: 'Manual', value: 'manual' },
            { label: 'Deck Empty', value: 'deck-empty' },
            { label: 'Card Effect', value: 'card-effect' },
            { label: 'Setup', value: 'setup' },
          ],
        },
        {
          name: 'note',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'sessionLog',
      type: 'array',
      admin: {
        description: 'Recoverable history for restore, undo, and table audit.',
      },
      fields: [
        {
          name: 'turnNumber',
          type: 'number',
          min: 1,
        },
        {
          name: 'phase',
          type: 'select',
          options: phaseOptions.map((phase) => ({ label: phase, value: phase })),
        },
        {
          name: 'action',
          type: 'select',
          required: true,
          options: [
            { label: 'Select Ancient One', value: 'select-ancient-one' },
            { label: 'Advance Phase', value: 'advance-phase' },
            { label: 'Previous Phase', value: 'previous-phase' },
            { label: 'Draw Mythos', value: 'draw-mythos' },
            { label: 'Reveal Card', value: 'reveal-card' },
            { label: 'Resolve Card', value: 'resolve-card' },
            { label: 'Activate Environment', value: 'activate-environment' },
            { label: 'Activate Rumor', value: 'activate-rumor' },
            { label: 'Pass Rumor', value: 'pass-rumor' },
            { label: 'Fail Rumor', value: 'fail-rumor' },
            { label: 'Discard Card', value: 'discard-card' },
            { label: 'Shuffle Deck', value: 'shuffle-deck' },
            { label: 'Undo', value: 'undo' },
            { label: 'Note', value: 'note' },
          ],
        },
        {
          name: 'card',
          ...mythosCardRelationship,
        },
        {
          name: 'note',
          type: 'textarea',
        },
      ],
    },
  ],
}
