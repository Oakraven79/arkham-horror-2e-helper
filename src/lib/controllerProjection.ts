import type { Payload } from 'payload'

import { activeAncientOneBackground } from '@/lib/ancientOneBackground'
import { arkhamEncounterStateFromSession } from '@/lib/arkhamEncounterSessionState'
import { relationshipID, relationshipIDs, sourceSetWhere } from '@/lib/gameSessionContent'
import { mythosDeckStateFromSession } from '@/lib/mythosSessionState'
import { isEligibleOpeningMythosCard } from '@/lib/openingMythos'
import type { AncientOne, GameSession, MythosCard, Neighborhood } from '@/payload-types'

import type { ControllerParticipant } from './controllerAuth'

export type ControllerCommandID =
  | 'activate-environment'
  | 'activate-rumor'
  | 'advance-phase'
  | 'clear-active-environment'
  | 'clear-active-rumor'
  | 'clear-arkham-neighborhood'
  | 'discard-mythos'
  | 'draw-arkham-encounter'
  | 'draw-mythos'
  | 'flip-other-world-encounter'
  | 'resolve-opening-mythos'
  | 'reveal-mythos'
  | 'select-arkham-neighborhood'
  | 'skip-opening-mythos'

export interface ControllerCommandDescriptor {
  confirmation?: string
  group: 'primary' | 'secondary'
  id: ControllerCommandID
  label: string
  tone?: 'danger' | 'primary'
}

export interface ControllerNeighborhoodOption {
  board: string
  id: string
  name: string
}

export interface ControllerProjection {
  canAdjustTracks: boolean
  arkhamEncounter: {
    currentCardTitle: string | null
    neighborhoods: ControllerNeighborhoodOption[]
    selectedNeighborhoodID: string | null
    selectedNeighborhoodName: string | null
  }
  commands: ControllerCommandDescriptor[]
  connection: {
    expiresAt: string
    participantName: string
  }
  currentCard: {
    revealed: boolean
    title: string
    type: string
  } | null
  otherWorldEncounter: {
    currentCardTitle: string | null
  }
  persistentEffects: {
    environmentTitle: string | null
    rumorTitle: string | null
  }
  presentation: {
    tableBackgroundAlt: string | null
    tableBackgroundUrl: string | null
  }
  session: {
    id: string
    name: string
    phase: GameSession['currentPhase']
    revision: number
    turnNumber: number
  }
  tracks: GameSession['tracks']
}

function mythosCardDocument(value: GameSession['mythos']['currentDraw']) {
  return value && typeof value === 'object' ? (value as MythosCard) : null
}

function relationshipTitle(value: unknown) {
  if (!value || typeof value !== 'object') return null
  if ('title' in value && value.title) return String(value.title)
  if ('colour' in value && value.colour) return `${String(value.colour)} encounter`
  if ('cardCode' in value && value.cardCode) return 'Encounter drawn'
  return null
}

function neighborhoodDocument(
  value: NonNullable<GameSession['arkhamEncounters']>['selectedNeighborhood'],
) {
  return value && typeof value === 'object' ? (value as Neighborhood) : null
}

function ancientOneDocument(value: GameSession['activeAncientOne']) {
  return value && typeof value === 'object' ? (value as AncientOne) : null
}

function selectedAncientOneSheet(
  ancientOne: AncientOne | null,
  sheetKey: string | null | undefined,
) {
  if (!ancientOne) return null

  return (
    ancientOne.sheets.find((sheet) => sheet.key === sheetKey) ??
    ancientOne.sheets.find((sheet) => sheet.isDefault) ??
    ancientOne.sheets[0] ??
    null
  )
}

function primaryCommand(
  id: ControllerCommandID,
  label: string,
): ControllerCommandDescriptor {
  return {
    group: 'primary',
    id,
    label,
    tone: 'primary',
  }
}

export function controllerCommandsForSession(
  session: GameSession,
): ControllerCommandDescriptor[] {
  const commands: ControllerCommandDescriptor[] = []
  const mythos = mythosDeckStateFromSession(session)
  const currentCard = mythosCardDocument(session.mythos.currentDraw)
  const arkham = arkhamEncounterStateFromSession(session)
  const mythosResolvedThisPhase = (session.sessionLog ?? []).some(
    (entry) =>
      entry.turnNumber === session.turnNumber &&
      entry.phase === 'Mythos' &&
      ['activate-environment', 'activate-rumor', 'discard-card'].includes(entry.action),
  )

  switch (session.currentPhase) {
    case 'Opening Mythos':
      if (!mythos.currentDraw) {
        commands.push(primaryCommand('draw-mythos', 'Draw opening Mythos card'))
      } else if (!mythos.currentDrawRevealed) {
        commands.push(primaryCommand('reveal-mythos', 'Reveal opening Mythos card'))
      } else if (currentCard) {
        commands.push(
          isEligibleOpeningMythosCard(currentCard)
            ? primaryCommand('resolve-opening-mythos', 'Opening Mythos resolved')
            : primaryCommand('skip-opening-mythos', 'Discard and draw again'),
        )
      }
      break

    case 'Upkeep':
      commands.push(primaryCommand('advance-phase', 'Upkeep complete'))
      break

    case 'Movement':
      commands.push(primaryCommand('advance-phase', 'Movement complete'))
      break

    case 'Arkham Encounters':
      if (!arkham.selectedNeighborhoodID) {
        commands.push(
          primaryCommand('select-arkham-neighborhood', 'Choose a neighborhood'),
        )
      } else {
        commands.push(
          primaryCommand('draw-arkham-encounter', 'Draw encounter'),
          {
            group: 'secondary',
            id: 'clear-arkham-neighborhood',
            label: 'Choose another neighborhood',
          },
        )
      }
      commands.push({
        confirmation: 'Confirm that every investigator has completed this phase.',
        group: 'secondary',
        id: 'advance-phase',
        label: 'Encounters complete',
      })
      break

    case 'Other World Encounters':
      commands.push(
        primaryCommand(
          'flip-other-world-encounter',
          session.otherWorldEncounters.currentDraw ? 'Flip next encounter' : 'Flip encounter',
        ),
        {
          confirmation: 'Confirm that every investigator has completed this phase.',
          group: 'secondary',
          id: 'advance-phase',
          label: 'Encounters complete',
        },
      )
      break

    case 'Mythos':
      if (!mythos.currentDraw) {
        commands.push(
          mythosResolvedThisPhase
            ? {
                ...primaryCommand('advance-phase', 'Complete turn'),
                confirmation:
                  'Confirm that the Mythos card and all triggered effects are complete.',
              }
            : primaryCommand('draw-mythos', 'Draw Mythos card'),
        )
      } else if (!mythos.currentDrawRevealed) {
        commands.push(primaryCommand('reveal-mythos', 'Reveal Mythos card'))
      } else if (currentCard) {
        if (String(currentCard.cardType).startsWith('Environment')) {
          commands.push(primaryCommand('activate-environment', 'Set as Environment'))
        } else if (currentCard.cardType === 'Rumor') {
          commands.push(
            primaryCommand(
              'activate-rumor',
              mythos.activeRumor ? 'Ignore new Rumor' : 'Set as Rumor',
            ),
          )
        } else {
          commands.push(primaryCommand('discard-mythos', 'Discard after resolving'))
        }
      }

      break
  }

  if (mythos.activeEnvironment) {
    commands.push({
      confirmation: 'Remove the active Environment from play?',
      group: 'secondary',
      id: 'clear-active-environment',
      label: 'Clear Environment',
    })
  }

  if (mythos.activeRumor) {
    commands.push({
      confirmation: 'Mark the active Rumor as passed and remove it from play?',
      group: 'secondary',
      id: 'clear-active-rumor',
      label: 'Clear Rumor',
    })
  }

  return commands
}

async function controllerNeighborhoods(payload: Payload, session: GameSession) {
  if (session.currentPhase !== 'Arkham Encounters') return []

  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const [neighborhoods, cards] = await Promise.all([
    payload.find({
      collection: 'neighborhoods',
      where: sourceSetWhere(enabledSetIDs),
      limit: 100,
      sort: 'name',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'arkham-encounter-cards',
      where: sourceSetWhere(enabledSetIDs),
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const neighborhoodIDsWithCards = new Set(
    cards.docs.map((card) => relationshipID(card.neighborhood)).filter(Boolean),
  )

  return neighborhoods.docs
    .filter((neighborhood) => neighborhoodIDsWithCards.has(String(neighborhood.id)))
    .map((neighborhood) => ({
      board: neighborhood.board ?? 'Arkham',
      id: String(neighborhood.id),
      name: neighborhood.name,
    }))
}

export async function controllerProjection(
  payload: Payload,
  session: GameSession,
  participant: ControllerParticipant,
): Promise<ControllerProjection> {
  const mythos = mythosDeckStateFromSession(session)
  const currentCard = mythosCardDocument(session.mythos.currentDraw)
  const storedArkhamEncounter = session.arkhamEncounters ?? {}
  const selectedNeighborhood = neighborhoodDocument(
    storedArkhamEncounter.selectedNeighborhood,
  )
  const tableBackground = activeAncientOneBackground(
    Boolean(session.useAncientOneBackground),
    selectedAncientOneSheet(
      ancientOneDocument(session.activeAncientOne),
      session.ancientOneSheetKey,
    ),
  )

  return {
    canAdjustTracks: Boolean(session.activeAncientOne),
    arkhamEncounter: {
      currentCardTitle:
        relationshipTitle(storedArkhamEncounter.currentDraw) ??
        (relationshipID(storedArkhamEncounter.currentDraw) ? 'Encounter drawn' : null),
      neighborhoods: await controllerNeighborhoods(payload, session),
      selectedNeighborhoodID:
        relationshipID(storedArkhamEncounter.selectedNeighborhood) ?? null,
      selectedNeighborhoodName: selectedNeighborhood?.name ?? null,
    },
    commands: controllerCommandsForSession(session),
    connection: {
      expiresAt: new Date(participant.expiresAt).toISOString(),
      participantName: participant.name,
    },
    currentCard: currentCard
      ? {
          revealed: Boolean(mythos.currentDrawRevealed),
          title: currentCard.title,
          type: currentCard.cardType,
        }
      : null,
    otherWorldEncounter: {
      currentCardTitle:
        relationshipTitle(session.otherWorldEncounters.currentDraw) ??
        (relationshipID(session.otherWorldEncounters.currentDraw)
          ? 'Other World encounter drawn'
          : null),
    },
    persistentEffects: {
      environmentTitle: relationshipTitle(session.mythos.activeEnvironment),
      rumorTitle: relationshipTitle(session.mythos.activeRumor),
    },
    presentation: {
      tableBackgroundAlt: tableBackground?.alt ?? null,
      tableBackgroundUrl: tableBackground?.url ?? null,
    },
    session: {
      id: String(session.id),
      name: session.name,
      phase: session.currentPhase,
      revision: session.stateRevision ?? 0,
      turnNumber: session.turnNumber,
    },
    tracks: session.tracks,
  }
}
