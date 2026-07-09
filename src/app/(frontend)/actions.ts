'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import {
  clearArkhamEncounterSelection,
  drawArkhamEncounterCard,
  selectArkhamEncounterNeighborhood,
} from '@/lib/arkhamEncounterState'
import { arkhamEncounterCardsWhere } from '@/lib/arkhamEncounterContent'
import {
  arkhamEncounterStateForPayload,
  arkhamEncounterStateFromSession,
} from '@/lib/arkhamEncounterSessionState'
import {
  activateCurrentEnvironment,
  activateCurrentRumor,
  clearActiveEnvironment,
  clearActiveRumor,
  discardCurrentMythosCard,
  drawMythosCard,
  revealCurrentMythosCard,
  type MythosDeckState,
} from '@/lib/mythosDeckState'
import { calculateInvestigatorRules, hasTrackedAwakeningCondition } from '@/lib/investigatorRules'
import { mythosDeckStateForPayload, mythosDeckStateFromSession } from '@/lib/mythosSessionState'
import {
  nextGamePhase,
  openingMythosPhase,
  previousGamePhase,
  transitionFor,
  type GamePhase,
  type GamePhasePointer,
} from '@/lib/gamePhaseState'
import {
  applyExpansionTrackCommand,
  assertExpansionTrackCommand,
  commandRequiredSet,
  expansionTrackStateForPayload,
  expansionTrackStateFromSession,
  type ExpansionTrackCommand,
} from '@/lib/expansionTracks'
import {
  assertSetsCanChange,
  contentIsEligibleForEnabledSets,
  eligibleDocuments,
  freshMythosDeckState,
  normalizeEnabledSetSelection,
  relationshipID,
  relationshipIDs,
  sameSetSelection,
  sourceSetWhere,
} from '@/lib/gameSessionContent'
import {
  createGameSession,
  deleteGameSession,
  exitGameSession,
  pauseActiveGameSessions,
  resumeGameSession,
} from '@/lib/gameSessions'
import { isEligibleOpeningMythosCard, resolveOpeningMythosCard } from '@/lib/openingMythos'
import {
  discardCurrentOtherWorldEncounterCard,
  flipNextOtherWorldEncounterCard,
  freshOtherWorldEncounterDeckState,
  type OtherWorldEncounterDeckState,
} from '@/lib/otherWorldEncounterDeckState'
import {
  otherWorldEncounterDeckStateForPayload,
  otherWorldEncounterDeckStateFromSession,
} from '@/lib/otherWorldEncounterSessionState'
import {
  adjustSessionTrack,
  isAdjustableSessionTrack,
  sessionTrackLogNote,
} from '@/lib/sessionTracks'
import { assertSelectedAncientOneCanBegin, requiredSetupAncientOneID } from '@/lib/setupReadiness'
import config from '@/payload.config'
import type { GameSession } from '@/payload-types'

type SessionLogAction = NonNullable<GameSession['sessionLog']>[number]['action']
type ShuffleEventReason = NonNullable<GameSession['shuffleEvents']>[number]['reason']

const GAME_SESSIONS = 'game-sessions' as const
const BOXED_SETS = 'boxed-sets' as const
const ARKHAM_ENCOUNTER_CARDS = 'arkham-encounter-cards' as const
const MYTHOS_CARDS = 'mythos-cards' as const
const OTHER_WORLD_ENCOUNTER_CARDS = 'other-world-encounter-cards' as const
const EXPANSION_CITY_KEYS = new Set(['dunwich-horror', 'kingsport-horror', 'innsmouth-horror'])

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

function logEntry(
  session: GameSession,
  action: SessionLogAction,
  card?: string | null,
  note?: string,
): NonNullable<GameSession['sessionLog']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    action,
    ...(card ? { card } : {}),
    ...(note ? { note } : {}),
  }
}

function otherWorldEncounterLogEntry(
  session: GameSession,
  action: 'discard-other-world-encounter' | 'draw-other-world-encounter',
  card?: string | null,
  note?: string,
): NonNullable<GameSession['sessionLog']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    action,
    ...(card ? { otherWorldEncounterCard: card } : {}),
    ...(note ? { note } : {}),
  }
}

function arkhamEncounterLogEntry(
  session: GameSession,
  action: 'draw-arkham-encounter' | 'select-arkham-neighborhood',
  options: {
    card?: string | null
    neighborhood?: string | null
    note?: string
  },
): NonNullable<GameSession['sessionLog']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    action,
    ...(options.card ? { arkhamEncounterCard: options.card } : {}),
    ...(options.neighborhood ? { neighborhood: options.neighborhood } : {}),
    ...(options.note ? { note: options.note } : {}),
  }
}

function shuffleEvent(
  session: GameSession,
  reason: ShuffleEventReason,
  note: string,
): NonNullable<GameSession['shuffleEvents']>[number] {
  return {
    turnNumber: session.turnNumber,
    phase: session.currentPhase,
    reason,
    note,
  }
}

async function getPayloadClient() {
  const payloadConfig = await config
  return getPayload({ config: payloadConfig })
}

function sessionNameFrom(formData: FormData) {
  const value = formData.get('sessionName')

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Enter a name for the session.')
  }

  const name = value.trim()

  if (name.length > 80) {
    throw new Error('Session names must be 80 characters or fewer.')
  }

  return name
}

export async function startNewSessionAction(formData: FormData) {
  const payload = await getPayloadClient()
  const sessionName = sessionNameFrom(formData)
  await pauseActiveGameSessions(payload)

  const session = await createGameSession(payload, sessionName)

  redirect(`/?session=${session.id}`)
}

export async function renameSessionAction(sessionID: string, formData: FormData) {
  const payload = await getPayloadClient()

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    data: {
      name: sessionNameFrom(formData),
    },
    overrideAccess: true,
  })

  revalidatePath('/')
  revalidatePath('/sessions')
}

export async function resumeSessionAction(formData: FormData) {
  const sessionID = formData.get('sessionID')

  if (typeof sessionID !== 'string' || !sessionID) {
    throw new Error('Select a saved session to resume.')
  }

  const payload = await getPayloadClient()
  await resumeGameSession(payload, sessionID)

  redirect(`/?session=${sessionID}`)
}

export async function exitGameAction(sessionID: string) {
  const payload = await getPayloadClient()
  await exitGameSession(payload, sessionID)

  revalidatePath('/sessions')
  redirect('/sessions')
}

export async function deleteSessionAction(sessionID: string) {
  const payload = await getPayloadClient()
  await deleteGameSession(payload, sessionID)

  revalidatePath('/sessions')
}

export async function adjustSessionTrackAction(
  sessionID: string,
  trackValue: string,
  delta: number,
) {
  if (!isAdjustableSessionTrack(trackValue)) {
    throw new Error('That session counter cannot be adjusted.')
  }

  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (!relationshipID(session.activeAncientOne)) {
    throw new Error('Complete setup before adjusting game counters.')
  }

  const adjustment = adjustSessionTrack(session.tracks, trackValue, delta)

  if (adjustment.nextValue === adjustment.previousValue) return

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      tracks: adjustment.tracks,
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          session,
          'adjust-track',
          null,
          sessionTrackLogNote(trackValue, adjustment.previousValue, adjustment.nextValue),
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function adjustExpansionTrackAction(
  sessionID: string,
  command: ExpansionTrackCommand,
) {
  assertExpansionTrackCommand(command)

  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (!relationshipID(session.activeAncientOne)) {
    throw new Error('Complete setup before adjusting expansion tracks.')
  }

  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const enabledSets = await payload.find({
    collection: 'boxed-sets',
    where: {
      id: {
        in: enabledSetIDs,
      },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const enabledSetKeys = new Set(enabledSets.docs.map((boxedSet) => boxedSet.key))
  const requiredSet = commandRequiredSet(command)

  if (!enabledSetKeys.has(requiredSet)) {
    throw new Error('That expansion track is not active for this session.')
  }

  const transition = applyExpansionTrackCommand(
    expansionTrackStateFromSession(session.expansionTracks),
    command,
  )
  const tracks = {
    ...session.tracks,
  }

  if (transition.terrorIncrease > 0) {
    if (tracks.terror < 10) {
      tracks.terror = Math.min(10, tracks.terror + transition.terrorIncrease)
    } else {
      tracks.doomCurrent = Math.min(
        tracks.doomMax ?? 10,
        tracks.doomCurrent + transition.terrorIncrease,
      )
    }
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      expansionTracks: expansionTrackStateForPayload(transition.state),
      tracks,
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(session, 'adjust-expansion-track', null, transition.note),
      ],
    },
  })

  revalidatePath('/')
}

export async function updateEnabledSetsAction(sessionID: string, formData: FormData) {
  const requestedSetIDs = formData
    .getAll('enabledSet')
    .filter((value): value is string => typeof value === 'string')
  const payload = await getPayloadClient()
  const [session, boxedSetResult] = await Promise.all([
    payload.findByID({
      collection: GAME_SESSIONS,
      id: sessionID,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'boxed-sets',
      limit: 100,
      sort: 'sortOrder',
      depth: 0,
      overrideAccess: true,
    }),
  ])

  assertSetsCanChange(session)

  const enabledSetIDs = normalizeEnabledSetSelection(requestedSetIDs, boxedSetResult.docs)
  const currentSetIDs = relationshipIDs(session.enabledSets)

  if (sameSetSelection(currentSetIDs, enabledSetIDs)) {
    revalidatePath('/')
    return
  }

  const [cards, otherWorldEncounterCards] = await Promise.all([
    payload.find({
      collection: MYTHOS_CARDS,
      where: sourceSetWhere(enabledSetIDs),
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: OTHER_WORLD_ENCOUNTER_CARDS,
      where: sourceSetWhere(enabledSetIDs),
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const eligibleMythosCards = eligibleDocuments(cards.docs, enabledSetIDs)
  const eligibleOtherWorldEncounterCards = eligibleDocuments(
    otherWorldEncounterCards.docs,
    enabledSetIDs,
  )
  const activeAncientOneID = relationshipID(session.activeAncientOne)
  const activeAncientOne = activeAncientOneID
    ? await payload.findByID({
        collection: 'ancient-ones',
        id: activeAncientOneID,
        depth: 0,
        overrideAccess: true,
      })
    : null
  const keepAncientOne = Boolean(
    activeAncientOne && contentIsEligibleForEnabledSets(activeAncientOne, enabledSetIDs),
  )
  const enabledSetNames = boxedSetResult.docs
    .filter((boxedSet) => enabledSetIDs.includes(String(boxedSet.id)))
    .map((boxedSet) => boxedSet.name)
  const note = `Sets in play changed to ${enabledSetNames.join(', ')}. The Mythos and Other World encounter decks were rebuilt and shuffled.`

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      enabledSets: enabledSetIDs,
      activeExpansions: [],
      openingHeadlineResolved: false,
      activeAncientOne: keepAncientOne ? activeAncientOneID : null,
      ancientOneSheetKey: keepAncientOne ? session.ancientOneSheetKey : null,
      tracks: {
        ...session.tracks,
        ...(keepAncientOne
          ? {}
          : {
              doomCurrent: 0,
              doomMax: 10,
            }),
      },
      mythos: mythosDeckStateForPayload(freshMythosDeckState(eligibleMythosCards)),
      otherWorldEncounters: otherWorldEncounterDeckStateForPayload(
        freshOtherWorldEncounterDeckState(eligibleOtherWorldEncounterCards),
      ),
      arkhamEncounters: arkhamEncounterStateForPayload(
        clearArkhamEncounterSelection(arkhamEncounterStateFromSession(session)),
      ),
      sessionLog: [...(session.sessionLog ?? []), logEntry(session, 'shuffle-deck', null, note)],
      shuffleEvents: [...(session.shuffleEvents ?? []), shuffleEvent(session, 'setup', note)],
    },
  })

  revalidatePath('/')
}

function phasePointer(session: GameSession): GamePhasePointer {
  return {
    currentPhase: session.currentPhase as GamePhase,
    turnNumber: session.turnNumber,
  }
}

function boxedSetAddsExpansionBoard(boxedSet: {
  addsExpansionBoard?: boolean | null
  key?: string | null
}) {
  return Boolean(boxedSet.addsExpansionBoard || EXPANSION_CITY_KEYS.has(boxedSet.key ?? ''))
}

async function sessionExpansionBoardCount(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  session: GameSession,
) {
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const enabledSets = await payload.find({
    collection: BOXED_SETS,
    where: {
      id: {
        in: enabledSetIDs,
      },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  return enabledSets.docs.filter(boxedSetAddsExpansionBoard).length
}

async function assertSetupCanBegin(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  session: GameSession,
) {
  if (session.currentPhase !== 'Setup') return

  const activeAncientOneID = requiredSetupAncientOneID(session)
  const ancientOne = await payload.findByID({
    collection: 'ancient-ones',
    id: activeAncientOneID,
    depth: 0,
    overrideAccess: true,
  })

  assertSelectedAncientOneCanBegin(session, ancientOne)
}

export async function selectAncientOneAction(sessionID: string, formData: FormData) {
  const selectionValue = formData.get('ancientOneSelection')
  const selection = typeof selectionValue === 'string' ? selectionValue : ''
  const investigatorCountValue = formData.get('investigatorCount')
  const useAncientOneBackground = formData.get('useAncientOneBackground') === 'on'

  const investigatorCount = Number(investigatorCountValue)

  if (!Number.isInteger(investigatorCount) || investigatorCount < 1 || investigatorCount > 8) {
    throw new Error('Investigator count must be between 1 and 8.')
  }

  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase !== 'Setup') {
    throw new Error('The Ancient One is locked after setup.')
  }

  if (!selection) {
    const setupChanged =
      session.playerCount !== investigatorCount ||
      Boolean(session.useAncientOneBackground) !== useAncientOneBackground

    if (!setupChanged) {
      revalidatePath('/')
      return
    }

    await payload.update({
      collection: GAME_SESSIONS,
      id: sessionID,
      overrideAccess: true,
      data: {
        playerCount: investigatorCount,
        useAncientOneBackground,
        sessionLog: [
          ...(session.sessionLog ?? []),
          logEntry(
            session,
            'select-ancient-one',
            null,
            `Setup updated with ${investigatorCount} investigators. Ancient One background ${useAncientOneBackground ? 'enabled' : 'disabled'}.`,
          ),
        ],
      },
    })

    revalidatePath('/')
    return
  }

  const [ancientOneID, sheetKey] = selection.split('::')

  if (!ancientOneID || !sheetKey) {
    throw new Error('The selected Ancient One sheet is invalid.')
  }

  const ancientOne = await payload.findByID({
    collection: 'ancient-ones',
    id: ancientOneID,
    depth: 0,
    overrideAccess: true,
  })
  const sheet = ancientOne.sheets.find((candidate) => candidate.key === sheetKey)

  if (!sheet) {
    throw new Error('The selected Ancient One sheet could not be found.')
  }

  if (!contentIsEligibleForEnabledSets(ancientOne, relationshipIDs(session.enabledSets))) {
    throw new Error('The selected Ancient One is not from a set enabled for this session.')
  }

  const previousAncientOneID = relationshipID(session.activeAncientOne)
  const ancientOneChanged =
    previousAncientOneID !== String(ancientOne.id) || session.ancientOneSheetKey !== sheet.key
  const setupChanged =
    ancientOneChanged ||
    session.playerCount !== investigatorCount ||
    Boolean(session.useAncientOneBackground) !== useAncientOneBackground ||
    session.tracks?.doomMax !== sheet.doomTrack

  if (!setupChanged) {
    revalidatePath('/')
    return
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      activeAncientOne: ancientOne.id,
      ancientOneSheetKey: sheet.key,
      useAncientOneBackground,
      currentPhase: 'Setup',
      playerCount: investigatorCount,
      tracks: {
        ...session.tracks,
        ...(ancientOneChanged ? { doomCurrent: 0 } : {}),
        doomMax: sheet.doomTrack,
      },
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          { ...session, currentPhase: 'Setup' },
          'select-ancient-one',
          null,
          `${ancientOne.name} - ${sheet.label} selected with ${investigatorCount} investigators and a ${sheet.doomTrack}-space doom track. Ancient One background ${useAncientOneBackground ? 'enabled' : 'disabled'}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function advancePhaseAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase === 'Setup') {
    await assertSetupCanBegin(payload, session)
  } else if (!relationshipID(session.activeAncientOne)) {
    return
  }

  if (session.currentPhase === openingMythosPhase && !session.openingHeadlineResolved) {
    return
  }

  const current = phasePointer(session)
  const next = nextGamePhase(current)

  if (next.currentPhase === current.currentPhase && next.turnNumber === current.turnNumber) {
    return
  }

  const transition = transitionFor(current, next)
  const completingArkhamEncounters = session.currentPhase === 'Arkham Encounters'
  const arkhamEncounterState = completingArkhamEncounters
    ? arkhamEncounterStateFromSession(session)
    : null
  const completingOtherWorldEncounters = session.currentPhase === 'Other World Encounters'
  const otherWorldState = completingOtherWorldEncounters
    ? otherWorldEncounterDeckStateFromSession(session)
    : null
  const displayedOtherWorldCard = otherWorldState?.currentDraw?.cardID ?? null
  const completionLogEntries: NonNullable<GameSession['sessionLog']> =
    completingOtherWorldEncounters && displayedOtherWorldCard
      ? [
          otherWorldEncounterLogEntry(
            session,
            'discard-other-world-encounter',
            displayedOtherWorldCard,
            'Displayed encounter card discarded when the phase completed.',
          ),
        ]
      : []

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      currentPhase: next.currentPhase,
      turnNumber: next.turnNumber,
      phaseHistory: [...(session.phaseHistory ?? []), transition],
      ...(otherWorldState
        ? {
            otherWorldEncounters: otherWorldEncounterDeckStateForPayload(
              discardCurrentOtherWorldEncounterCard(otherWorldState),
            ),
          }
        : {}),
      ...(arkhamEncounterState
        ? {
            arkhamEncounters: arkhamEncounterStateForPayload(
              clearArkhamEncounterSelection(arkhamEncounterState),
            ),
          }
        : {}),
      sessionLog: [
        ...(session.sessionLog ?? []),
        ...completionLogEntries,
        logEntry(
          session,
          'advance-phase',
          null,
          `Advanced to ${next.currentPhase}, turn ${next.turnNumber}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function startFinalBattleAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (!relationshipID(session.activeAncientOne) || session.currentPhase === 'Final Battle') {
    return
  }

  const expansionBoardCount = await sessionExpansionBoardCount(payload, session)
  const rules = calculateInvestigatorRules({
    investigatorCount: session.playerCount,
    expansionBoardCount,
  })
  const tracks = session.tracks
  const doomMax = tracks.doomMax ?? 10
  const limitState = {
    doomCurrent: tracks.doomCurrent ?? 0,
    doomMax,
    gatesOpen: tracks.gatesOpen ?? 0,
    monstersInArkham: tracks.monstersInArkham ?? 0,
    monstersInOutskirts: tracks.monstersInOutskirts ?? 0,
    terror: tracks.terror ?? 0,
  }

  if (!hasTrackedAwakeningCondition(rules, limitState)) {
    return
  }

  const current = phasePointer(session)
  const next = {
    currentPhase: 'Final Battle' as const,
    turnNumber: current.turnNumber,
  }
  const mythosState = clearActiveRumor(
    clearActiveEnvironment(discardCurrentMythosCard(mythosDeckStateFromSession(session))),
  )

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      currentPhase: next.currentPhase,
      turnNumber: next.turnNumber,
      phaseHistory: [...(session.phaseHistory ?? []), transitionFor(current, next)],
      // Core rulebook, PDF p. 20: awakening from a non-doom condition fills Doom before battle.
      tracks: {
        ...tracks,
        doomCurrent: doomMax,
        finalBattleRound: 1,
      },
      mythos: mythosDeckStateForPayload(mythosState),
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(session, 'advance-phase', null, 'Ancient One awakened. Advanced to Final Battle.'),
      ],
    },
  })

  revalidatePath('/')
}

async function eligibleArkhamEncounterCards(
  payload: Awaited<ReturnType<typeof getPayloadClient>>,
  session: GameSession,
  neighborhoodID: string,
) {
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const neighborhood = await payload.findByID({
    collection: 'neighborhoods',
    id: neighborhoodID,
    depth: 0,
    overrideAccess: true,
  })

  if (!contentIsEligibleForEnabledSets(neighborhood, enabledSetIDs)) {
    throw new Error('That neighborhood is not available for the boxed sets in this session.')
  }

  const cards = await payload.find({
    collection: ARKHAM_ENCOUNTER_CARDS,
    where: arkhamEncounterCardsWhere(neighborhoodID, enabledSetIDs),
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  return {
    cards: eligibleDocuments(cards.docs, enabledSetIDs),
    neighborhood,
  }
}

export async function selectArkhamNeighborhoodAction(sessionID: string, neighborhoodID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase !== 'Arkham Encounters') return

  const { cards, neighborhood } = await eligibleArkhamEncounterCards(
    payload,
    session,
    neighborhoodID,
  )

  if (cards.length === 0) {
    throw new Error(`No active encounter cards are available for ${neighborhood.name}.`)
  }

  const nextState = selectArkhamEncounterNeighborhood(
    arkhamEncounterStateFromSession(session),
    neighborhoodID,
  )

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
    data: {
      arkhamEncounters: arkhamEncounterStateForPayload(nextState),
      sessionLog: [
        ...(session.sessionLog ?? []),
        arkhamEncounterLogEntry(session, 'select-arkham-neighborhood', {
          neighborhood: neighborhoodID,
          note: `${neighborhood.name} encounter deck selected.`,
        }),
      ],
    },
  })

  revalidatePath('/')
}

export async function drawArkhamEncounterAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase !== 'Arkham Encounters') return

  const state = arkhamEncounterStateFromSession(session)

  if (!state.selectedNeighborhoodID) {
    throw new Error('Select a neighborhood before drawing an encounter card.')
  }

  const { cards, neighborhood } = await eligibleArkhamEncounterCards(
    payload,
    session,
    state.selectedNeighborhoodID,
  )
  const drawKey = randomUUID()
  const nextState = drawArkhamEncounterCard(
    state,
    cards.map((card) => String(card.id)),
    {
      drawKey,
      drawnAt: new Date().toISOString(),
      turnNumber: session.turnNumber,
    },
  )

  if (!nextState.currentCardID || nextState.currentDrawKey !== drawKey) {
    throw new Error(`No active encounter cards are available for ${neighborhood.name}.`)
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
    data: {
      arkhamEncounters: arkhamEncounterStateForPayload(nextState),
      sessionLog: [
        ...(session.sessionLog ?? []),
        arkhamEncounterLogEntry(session, 'draw-arkham-encounter', {
          card: nextState.currentCardID,
          neighborhood: state.selectedNeighborhoodID,
          note: `${neighborhood.name} deck shuffled and an encounter card drawn.`,
        }),
      ],
    },
  })

  revalidatePath('/')
}

export async function clearArkhamNeighborhoodAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase !== 'Arkham Encounters') return

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
    data: {
      arkhamEncounters: arkhamEncounterStateForPayload(
        clearArkhamEncounterSelection(arkhamEncounterStateFromSession(session)),
      ),
    },
  })

  revalidatePath('/')
}

async function updateSessionOtherWorldEncounters(
  sessionID: string,
  state: OtherWorldEncounterDeckState,
  entries: NonNullable<GameSession['sessionLog']>,
  extraData: Partial<Pick<GameSession, 'shuffleEvents'>> = {},
) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      otherWorldEncounters: otherWorldEncounterDeckStateForPayload(state),
      sessionLog: [...(session.sessionLog ?? []), ...entries],
      ...extraData,
    },
  })

  revalidatePath('/')
}

export async function flipNextOtherWorldEncounterAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (session.currentPhase !== 'Other World Encounters') return

  const state = otherWorldEncounterDeckStateFromSession(session)
  const discardedCardID = state.currentDraw?.cardID ?? null
  const availableDiscard = [
    ...(state.discardPile ?? []),
    ...(state.currentDraw ? [state.currentDraw] : []),
  ]
  const result = flipNextOtherWorldEncounterCard(state, shuffle(availableDiscard))
  const entries: NonNullable<GameSession['sessionLog']> = [
    ...(discardedCardID
      ? [otherWorldEncounterLogEntry(session, 'discard-other-world-encounter', discardedCardID)]
      : []),
    ...(result.didShuffle
      ? [logEntry(session, 'shuffle-deck', null, 'Other World encounter deck empty.')]
      : []),
    ...(result.drawnCardID
      ? [otherWorldEncounterLogEntry(session, 'draw-other-world-encounter', result.drawnCardID)]
      : []),
  ]

  await updateSessionOtherWorldEncounters(sessionID, result.state, entries, {
    shuffleEvents: result.didShuffle
      ? [
          ...(session.shuffleEvents ?? []),
          shuffleEvent(
            session,
            'deck-empty',
            'Discard pile shuffled into the Other World encounter draw pile.',
          ),
        ]
      : session.shuffleEvents,
  })
}

export async function shuffleOtherWorldEncounterDiscardAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const state = otherWorldEncounterDeckStateFromSession(session)
  const nextState: OtherWorldEncounterDeckState = {
    ...state,
    drawPile: [...(state.drawPile ?? []), ...shuffle(state.discardPile ?? [])],
    discardPile: [],
    shuffleCount: (state.shuffleCount ?? 0) + 1,
  }
  const note = 'Discard pile manually shuffled into the Other World encounter draw pile.'

  await updateSessionOtherWorldEncounters(
    sessionID,
    nextState,
    [logEntry(session, 'shuffle-deck', null, note)],
    {
      shuffleEvents: [...(session.shuffleEvents ?? []), shuffleEvent(session, 'manual', note)],
    },
  )
}

export async function resetOtherWorldEncounterDeckAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const cards = await payload.find({
    collection: OTHER_WORLD_ENCOUNTER_CARDS,
    where: sourceSetWhere(relationshipIDs(session.enabledSets)),
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const nextState = freshOtherWorldEncounterDeckState(eligibleDocuments(cards.docs, enabledSetIDs))

  await updateSessionOtherWorldEncounters(sessionID, nextState, [
    logEntry(
      session,
      'shuffle-deck',
      null,
      'Other World encounter deck reset from the sets enabled for this session.',
    ),
  ])
}

export async function previousPhaseAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const current = phasePointer(session)
  const history = session.phaseHistory ?? []
  const latest = history.at(-1)
  const canReverseLatest =
    latest?.toPhase === current.currentPhase && latest.toTurn === current.turnNumber
  const previous = canReverseLatest
    ? {
        currentPhase: latest.fromPhase as GamePhase,
        turnNumber: latest.fromTurn,
      }
    : previousGamePhase(current)

  if (previous.currentPhase === 'Setup' && current.currentPhase !== 'Setup') {
    return
  }

  if (
    previous.currentPhase === current.currentPhase &&
    previous.turnNumber === current.turnNumber
  ) {
    return
  }

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      currentPhase: previous.currentPhase,
      turnNumber: previous.turnNumber,
      phaseHistory: canReverseLatest ? history.slice(0, -1) : history,
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          session,
          'previous-phase',
          null,
          `Returned to ${previous.currentPhase}, turn ${previous.turnNumber}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

async function updateSessionMythos(
  sessionID: string,
  state: MythosDeckState,
  action: SessionLogAction,
  card?: string | null,
  note?: string,
  extraData: Partial<Pick<GameSession, 'shuffleEvents'>> = {},
) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: mythosDeckStateForPayload(state),
      sessionLog: [...(session.sessionLog ?? []), logEntry(session, action, card, note)],
      ...extraData,
    },
  })

  revalidatePath('/')
}

export async function drawMythosAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })

  if (
    (session.currentPhase !== 'Mythos' && session.currentPhase !== openingMythosPhase) ||
    (session.currentPhase === openingMythosPhase && session.openingHeadlineResolved)
  ) {
    return
  }

  const state = mythosDeckStateFromSession(session)
  const result = drawMythosCard(state, shuffle(state.discardPile ?? []))
  const shuffleEvents = result.didShuffle
    ? [
        ...(session.shuffleEvents ?? []),
        shuffleEvent(session, 'deck-empty', 'Discard pile shuffled into the Mythos draw pile.'),
      ]
    : session.shuffleEvents

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: mythosDeckStateForPayload(result.state),
      sessionLog: [
        ...(session.sessionLog ?? []),
        ...(result.didShuffle ? [logEntry(session, 'shuffle-deck', null, 'Deck empty.')] : []),
        logEntry(session, 'draw-mythos', result.drawnCardID),
      ],
      shuffleEvents,
    },
  })

  revalidatePath('/')
}

export async function revealCurrentDrawAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const state = revealCurrentMythosCard(mythosDeckStateFromSession(session))

  await updateSessionMythos(sessionID, state, 'reveal-card', state.currentDraw?.cardID)
}

export async function discardCurrentDrawAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = mythosDeckStateFromSession(session).currentDraw?.cardID
  const state = discardCurrentMythosCard(mythosDeckStateFromSession(session))

  await updateSessionMythos(sessionID, state, 'discard-card', currentDraw)
}

export async function skipOpeningMythosCardAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const currentDraw = sessionState.currentDraw

  if (
    session.currentPhase !== openingMythosPhase ||
    !currentDraw ||
    !sessionState.currentDrawRevealed
  ) {
    throw new Error('Reveal an opening Mythos card before skipping it.')
  }

  const card = await payload.findByID({
    collection: MYTHOS_CARDS,
    id: currentDraw.cardID,
    depth: 0,
    overrideAccess: true,
  })

  if (isEligibleOpeningMythosCard(card)) {
    throw new Error('The opening Mythos card depicts a gate and must be resolved.')
  }

  const skippedState = discardCurrentMythosCard(sessionState)
  const result = drawMythosCard(skippedState, shuffle(skippedState.discardPile ?? []))
  const skipReason = card.cardType === 'Rumor' ? 'Rumor' : 'Mythos card without a gate location'
  const skipNote = `Opening ${skipReason} discarded during Game Setup.`

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: mythosDeckStateForPayload(result.state),
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(session, 'discard-card', currentDraw.cardID, skipNote),
        ...(result.didShuffle ? [logEntry(session, 'shuffle-deck', null, 'Deck empty.')] : []),
        logEntry(session, 'draw-mythos', result.drawnCardID, 'Next opening Mythos card drawn.'),
      ],
      shuffleEvents: result.didShuffle
        ? [
            ...(session.shuffleEvents ?? []),
            shuffleEvent(
              session,
              'deck-empty',
              'Discard pile shuffled into the opening Mythos draw pile.',
            ),
          ]
        : session.shuffleEvents,
    },
  })

  revalidatePath('/')
}

export async function resolveOpeningHeadlineAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const currentDraw = sessionState.currentDraw

  if (
    session.currentPhase !== openingMythosPhase ||
    !currentDraw ||
    !sessionState.currentDrawRevealed
  ) {
    throw new Error('Reveal an eligible opening Mythos card before completing setup.')
  }

  const card = await payload.findByID({
    collection: MYTHOS_CARDS,
    id: currentDraw.cardID,
    depth: 0,
    overrideAccess: true,
  })

  if (!isEligibleOpeningMythosCard(card)) {
    throw new Error('The opening Mythos card must not be a Rumor and must depict a gate location.')
  }

  const current = phasePointer(session)
  const next = nextGamePhase(current)
  const transition = transitionFor(current, next)
  const isEnvironment = String(card.cardType).startsWith('Environment')
  const resolvedState = resolveOpeningMythosCard(sessionState, card.cardType)

  await payload.update({
    collection: GAME_SESSIONS,
    id: sessionID,
    overrideAccess: true,
    data: {
      mythos: mythosDeckStateForPayload(resolvedState),
      openingHeadlineResolved: true,
      currentPhase: next.currentPhase,
      turnNumber: next.turnNumber,
      phaseHistory: [...(session.phaseHistory ?? []), transition],
      sessionLog: [
        ...(session.sessionLog ?? []),
        logEntry(
          session,
          isEnvironment ? 'activate-environment' : 'resolve-card',
          currentDraw.cardID,
          isEnvironment
            ? 'Opening Mythos Environment fully resolved and left in play.'
            : 'Opening Mythos card fully resolved and discarded.',
        ),
        logEntry(
          session,
          'advance-phase',
          null,
          `Opening Mythos complete. Advanced to ${next.currentPhase}, turn ${next.turnNumber}.`,
        ),
      ],
    },
  })

  revalidatePath('/')
}

export async function activateCurrentEnvironmentAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const currentDraw = mythosDeckStateFromSession(session).currentDraw?.cardID
  const state = activateCurrentEnvironment(mythosDeckStateFromSession(session))

  await updateSessionMythos(sessionID, state, 'activate-environment', currentDraw)
}

export async function clearActiveEnvironmentAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const activeEnvironment = sessionState.activeEnvironment?.cardID
  const state = clearActiveEnvironment(sessionState)

  await updateSessionMythos(sessionID, state, 'clear-environment', activeEnvironment)
}

export async function activateCurrentRumorAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const currentDraw = sessionState.currentDraw?.cardID
  const hadActiveRumor = Boolean(sessionState.activeRumor)
  const state = activateCurrentRumor(sessionState)

  await updateSessionMythos(
    sessionID,
    state,
    hadActiveRumor ? 'discard-card' : 'activate-rumor',
    currentDraw,
    hadActiveRumor ? 'A Rumor was already active, so this Rumor text was ignored.' : undefined,
  )
}

export async function clearActiveRumorAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const sessionState = mythosDeckStateFromSession(session)
  const activeRumor = sessionState.activeRumor?.cardID
  const state = clearActiveRumor(sessionState)

  await updateSessionMythos(sessionID, state, 'pass-rumor', activeRumor)
}

export async function shuffleDiscardIntoDeckAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const state = mythosDeckStateFromSession(session)
  const shuffledDiscard = shuffle(state.discardPile ?? [])
  const nextState = {
    ...state,
    drawPile: [...(state.drawPile ?? []), ...shuffledDiscard],
    discardPile: [],
    shuffleCount: (state.shuffleCount ?? 0) + 1,
  }

  await updateSessionMythos(
    sessionID,
    nextState,
    'shuffle-deck',
    null,
    'Discard pile manually shuffled into the Mythos draw pile.',
    {
      shuffleEvents: [
        ...(session.shuffleEvents ?? []),
        shuffleEvent(
          session,
          'manual',
          'Discard pile manually shuffled into the Mythos draw pile.',
        ),
      ],
    },
  )
}

export async function resetMythosDeckAction(sessionID: string) {
  const payload = await getPayloadClient()
  const session = await payload.findByID({
    collection: GAME_SESSIONS,
    id: sessionID,
    depth: 0,
    overrideAccess: true,
  })
  const cards = await payload.find({
    collection: MYTHOS_CARDS,
    where: sourceSetWhere(relationshipIDs(session.enabledSets)),
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const nextState = freshMythosDeckState(eligibleDocuments(cards.docs, enabledSetIDs))

  await updateSessionMythos(
    sessionID,
    nextState,
    'shuffle-deck',
    null,
    'Mythos deck reset from the sets enabled for this session.',
  )
}
