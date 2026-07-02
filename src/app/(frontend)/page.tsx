import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import type { ArkhamEncounterCardFrontProps } from '@/components/arkhamEncounterCardFront'
import { MythosCardFront, type MythosCardFrontProps } from '@/components/mythosCardFront'
import type { OtherworldEncounterCardFrontProps } from '@/components/otherworldEncounterCardFront'
import { gamePhaseGuides } from '@/content/gamePhaseGuides'
import {
  arkhamEncounterCardFrontProps,
  arkhamEncounterDeckBackProps,
} from '@/lib/arkhamEncounterPresentation'
import { arkhamEncounterStateFromSession } from '@/lib/arkhamEncounterSessionState'
import { boxedSetDisplay } from '@/lib/boxedSetPresentation'
import { openingMythosPhase, turnPhases, type GamePhase } from '@/lib/gamePhaseState'
import { calculateInvestigatorRules, gameLimitWarnings } from '@/lib/investigatorRules'
import { relationshipID, relationshipIDs, sourceSetWhere } from '@/lib/gameSessionContent'
import {
  repairLegacyOpeningHeadline,
  repairLegacyOtherWorldEncounterDeck,
  repairLegacySessionEnabledSets,
} from '@/lib/gameSessions'
import { mythosCardFrontProps } from '@/lib/mythosCardPresentation'
import { mythosDeckStateFromSession } from '@/lib/mythosSessionState'
import { otherWorldEncounterCardFrontProps } from '@/lib/otherWorldEncounterCardPresentation'
import { otherWorldEncounterDeckStateFromSession } from '@/lib/otherWorldEncounterSessionState'
import { isHeadlineCardType } from '@/lib/openingMythos'
import config from '@/payload.config'
import type {
  AncientOne,
  ArkhamEncounterCard,
  BoxedSet,
  GameSession,
  Location,
  MythosCard,
  Neighborhood,
  OtherWorldEncounterCard,
} from '@/payload-types'

import {
  activateCurrentEnvironmentAction,
  activateCurrentRumorAction,
  advancePhaseAction,
  clearActiveEnvironmentAction,
  clearActiveRumorAction,
  clearArkhamNeighborhoodAction,
  discardCurrentDrawAction,
  exitGameAction,
  previousPhaseAction,
  renameSessionAction,
  resetMythosDeckAction,
  resetOtherWorldEncounterDeckAction,
  resolveOpeningHeadlineAction,
  selectAncientOneAction,
  shuffleDiscardIntoDeckAction,
  shuffleOtherWorldEncounterDiscardAction,
  skipOpeningMythosCardAction,
  updateEnabledSetsAction,
} from './actions'
import { ArkhamEncounterDeckSlot } from './ArkhamEncounterDeckSlot'
import {
  ArkhamNeighborhoodShelf,
  type ArkhamNeighborhoodDeckOption,
} from './ArkhamNeighborhoodShelf'
import { GameRulesContext } from './GameRulesContext'
import { InvestigatorCountInput } from './InvestigatorCountInput'
import { MythosDeckSlot } from './MythosDeckSlot'
import { OtherWorldEncounterDeckSlot } from './OtherWorldEncounterDeckSlot'
import { SessionTrackControls } from './SessionTrackControls'
import './styles.css'

export const dynamic = 'force-dynamic'

type RelationshipValue = string | MythosCard | null | undefined
type AncientOneSheet = AncientOne['sheets'][number]

const MYTHOS_CARDS = 'mythos-cards' as const
const ARKHAM_ENCOUNTER_CARDS = 'arkham-encounter-cards' as const
const OTHER_WORLD_ENCOUNTER_CARDS = 'other-world-encounter-cards' as const
const EXPANSION_CITY_KEYS = new Set(['dunwich-horror', 'kingsport-horror', 'innsmouth-horror'])
const BOARD_ORDER = ['Arkham', 'Dunwich', 'Kingsport', 'Innsmouth', 'Other']
const BOXED_SET_CATEGORY_LABELS: Record<BoxedSet['category'], string> = {
  core: 'Core Game',
  'large-expansion': 'Large Expansions',
  'small-expansion': 'Small Expansions',
  promotional: 'Promotional',
  custom: 'Custom Sets',
}

function formatSessionTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Melbourne',
  }).format(new Date(value))
}

function isCardDocument(value: RelationshipValue): value is MythosCard {
  return Boolean(value && typeof value === 'object' && value.id !== undefined && 'title' in value)
}

function cardProps(card: MythosCard | null): MythosCardFrontProps | null {
  if (!card) return null
  return mythosCardFrontProps(card)
}

function otherWorldEncounterCardProps(
  card: OtherWorldEncounterCard | null,
): OtherworldEncounterCardFrontProps | null {
  if (!card) return null
  return otherWorldEncounterCardFrontProps(card)
}

function arkhamEncounterCardProps(
  card: ArkhamEncounterCard | null,
): ArkhamEncounterCardFrontProps | null {
  if (!card) return null
  return arkhamEncounterCardFrontProps(card)
}

async function getAllMythosCards(
  payload: Awaited<ReturnType<typeof getPayload>>,
  enabledSetIDs: string[],
) {
  const cards = await payload.find({
    collection: MYTHOS_CARDS,
    where: sourceSetWhere(enabledSetIDs),
    limit: 1000,
    depth: 2,
    overrideAccess: true,
  })

  return cards.docs
}

async function getAllOtherWorldEncounterCards(
  payload: Awaited<ReturnType<typeof getPayload>>,
  enabledSetIDs: string[],
) {
  const cards = await payload.find({
    collection: OTHER_WORLD_ENCOUNTER_CARDS,
    where: sourceSetWhere(enabledSetIDs),
    limit: 1000,
    depth: 2,
    overrideAccess: true,
  })

  return cards.docs
}

async function getAllArkhamEncounterCards(
  payload: Awaited<ReturnType<typeof getPayload>>,
  enabledSetIDs: string[],
) {
  const cards = await payload.find({
    collection: ARKHAM_ENCOUNTER_CARDS,
    where: sourceSetWhere(enabledSetIDs),
    limit: 1000,
    depth: 2,
    overrideAccess: true,
  })

  return cards.docs
}

async function getReferenceData(
  payload: Awaited<ReturnType<typeof getPayload>>,
  enabledSetIDs: string[],
) {
  const where = sourceSetWhere(enabledSetIDs)
  const [ancientOnes, locations, neighborhoods, media] = await Promise.all([
    payload.find({
      collection: 'ancient-ones',
      where,
      limit: 100,
      sort: 'name',
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'locations',
      where,
      limit: 500,
      sort: 'name',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'neighborhoods',
      where,
      limit: 100,
      sort: 'name',
      depth: 2,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'media',
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const mediaByID = new Map(media.docs.map((asset) => [String(asset.id), asset]))

  return {
    ancientOnes: ancientOnes.docs,
    locations: locations.docs.map((location) => ({
      ...location,
      cardImage:
        mediaByID.get(relationshipID(location.cardImage) ?? '') ?? location.cardImage ?? null,
    })),
    neighborhoods: neighborhoods.docs,
  }
}

async function getActiveSession(
  payload: Awaited<ReturnType<typeof getPayload>>,
  requestedSessionID?: string,
): Promise<GameSession | null> {
  if (requestedSessionID) {
    try {
      const requestedSession = await payload.findByID({
        collection: 'game-sessions',
        id: requestedSessionID,
        depth: 2,
        overrideAccess: true,
      })

      return requestedSession.status === 'active' ? requestedSession : null
    } catch {
      return null
    }
  }

  const existing = await payload.find({
    collection: 'game-sessions',
    where: {
      status: {
        equals: 'active',
      },
    },
    sort: '-updatedAt',
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  return existing.docs[0] ?? null
}

function resolveCard(value: RelationshipValue, cardsByID: Map<string, MythosCard>) {
  if (isCardDocument(value)) return value

  const id = relationshipID(value)
  if (!id) return null

  return cardsByID.get(id) ?? null
}

function selectedAncientOne(
  session: GameSession,
  ancientOnesByID: Map<string, AncientOne>,
): AncientOne | null {
  if (session.activeAncientOne && typeof session.activeAncientOne === 'object') {
    return session.activeAncientOne
  }

  const id = relationshipID(session.activeAncientOne)
  return id ? (ancientOnesByID.get(id) ?? null) : null
}

function selectedAncientOneSheet(
  ancientOne: AncientOne | null,
  sheetKey: string | null | undefined,
): AncientOneSheet | null {
  if (!ancientOne) return null

  return (
    ancientOne.sheets.find((sheet) => sheet.key === sheetKey) ??
    ancientOne.sheets.find((sheet) => sheet.isDefault) ??
    ancientOne.sheets[0] ??
    null
  )
}

function isBoxedSetDocument(value: BoxedSet | string): value is BoxedSet {
  return typeof value === 'object' && value !== null && 'key' in value
}

function addsExpansionBoard(boxedSet: BoxedSet) {
  return Boolean(boxedSet.addsExpansionBoard || EXPANSION_CITY_KEYS.has(boxedSet.key))
}

function neighborhoodBoardName(neighborhood: Neighborhood) {
  return neighborhood.board === 'Other'
    ? neighborhood.customBoardName || 'Other'
    : neighborhood.board
}

function neighborhoodSort(left: Neighborhood, right: Neighborhood) {
  const leftBoard = neighborhoodBoardName(left)
  const rightBoard = neighborhoodBoardName(right)
  const leftIndex = BOARD_ORDER.indexOf(leftBoard)
  const rightIndex = BOARD_ORDER.indexOf(rightBoard)
  const boardDifference =
    (leftIndex === -1 ? BOARD_ORDER.length : leftIndex) -
    (rightIndex === -1 ? BOARD_ORDER.length : rightIndex)

  return (
    boardDifference || leftBoard.localeCompare(rightBoard) || left.name.localeCompare(right.name)
  )
}

function locationBelongsToNeighborhood(location: Location, neighborhood: Neighborhood) {
  const neighborhoodReference = relationshipID(location.neighborhood)

  return (
    neighborhoodReference === String(neighborhood.id) ||
    neighborhoodReference === neighborhood.name ||
    neighborhoodReference === neighborhood.key
  )
}

function CardSlot({
  title,
  card,
  emptyText,
  action,
  actionLabel,
  effectCard,
}: {
  title: string
  card: MythosCardFrontProps | null
  emptyText: string
  action?: () => Promise<void>
  actionLabel?: string
  effectCard?: MythosCard | null
}) {
  return (
    <section className="table-card-slot">
      <div className="slot-heading">
        <h2>{title}</h2>
        {action && actionLabel && (
          <form action={action}>
            <button className="text-button" type="submit">
              {actionLabel}
            </button>
          </form>
        )}
      </div>
      {card ? (
        <div className="table-card-frame">
          <MythosCardFront {...card} />
        </div>
      ) : (
        <div className="empty-card-slot">{emptyText}</div>
      )}
      {effectCard && (
        <div className="slot-effects">
          <ActiveEffect title={`${title.replace('Active ', '')} Effect`} card={effectCard} />
        </div>
      )}
    </section>
  )
}

function ActiveEffect({ title, card }: { title: string; card: MythosCard | null }) {
  const details = card
    ? [
        { label: 'Effect', text: card.effectText },
        { label: 'Ongoing', text: card.ongoingEffect },
        { label: 'Pass', text: card.passCondition },
        { label: 'Fail', text: card.failCondition },
      ].filter((detail): detail is { label: string; text: string } => Boolean(detail.text))
    : []

  return (
    <section className="active-effect">
      <p>{title}</p>
      <h3>{card?.title ?? 'None active'}</h3>
      {details.map((detail) => (
        <div className="active-effect-detail" key={detail.label}>
          <strong>{detail.label}</strong>
          <span>{detail.text}</span>
        </div>
      ))}
    </section>
  )
}

function AncientOneSetup({
  ancientOnes,
  boxedSets,
  activeAncientOne,
  activeSheet,
  investigatorCount,
  currentSession,
  sessionID,
}: {
  ancientOnes: AncientOne[]
  boxedSets: BoxedSet[]
  activeAncientOne: AncientOne | null
  activeSheet: AncientOneSheet | null
  investigatorCount: number
  currentSession: GameSession
  sessionID: string
}) {
  const currentSelection =
    activeAncientOne && activeSheet ? `${activeAncientOne.id}::${activeSheet.key}` : ''
  const enabledSetIDs = new Set(relationshipIDs(currentSession.enabledSets))
  const boxedSetsByCategory = Object.entries(BOXED_SET_CATEGORY_LABELS).map(
    ([category, label]) => ({
      category: category as BoxedSet['category'],
      label,
      sets: boxedSets.filter((boxedSet) => boxedSet.category === category),
    }),
  )

  return (
    <section className="setup-workspace">
      <div className="setup-copy">
        <p className="eyebrow">Game Setup</p>
        <h2>Prepare the game</h2>
        <p>Choose the Ancient One sheet and number of investigators before the first turn.</p>
      </div>

      <section className="current-session-setup">
        <div className="current-session-details">
          <p className="eyebrow">Current Table</p>
          <h3>{currentSession.name}</h3>
          <time dateTime={currentSession.createdAt}>
            Started {formatSessionTimestamp(currentSession.createdAt)}
          </time>
        </div>
        <form action={renameSessionAction.bind(null, sessionID)} className="session-name-form">
          <label htmlFor="current-session-name">Session name</label>
          <input
            defaultValue={currentSession.name}
            id="current-session-name"
            maxLength={80}
            name="sessionName"
            required
            type="text"
          />
          <button type="submit">Rename</button>
        </form>
        <Link href="/sessions">All sessions</Link>
      </section>

      <form action={updateEnabledSetsAction.bind(null, sessionID)} className="expansion-selector">
        <div className="setup-section-heading">
          <div>
            <p className="eyebrow">Game Content</p>
            <h3>Sets in play</h3>
          </div>
          <button type="submit">Apply sets</button>
        </div>
        <div className="boxed-set-groups">
          {boxedSetsByCategory.map(
            (group) =>
              group.sets.length > 0 && (
                <div
                  aria-labelledby={`boxed-set-group-${group.category}`}
                  className="boxed-set-group"
                  key={group.category}
                  role="group"
                >
                  <h4 id={`boxed-set-group-${group.category}`}>{group.label}</h4>
                  <div className="boxed-set-options">
                    {group.sets.map((boxedSet) => {
                      const isBaseGame = boxedSet.key === 'base-game'
                      const icon =
                        boxedSet.icon && typeof boxedSet.icon === 'object' ? boxedSet.icon : null

                      return (
                        <label className="boxed-set-option" key={boxedSet.id}>
                          {isBaseGame && (
                            <input name="enabledSet" type="hidden" value={boxedSet.id} />
                          )}
                          <input
                            defaultChecked={isBaseGame || enabledSetIDs.has(String(boxedSet.id))}
                            disabled={isBaseGame}
                            name="enabledSet"
                            type="checkbox"
                            value={boxedSet.id}
                          />
                          <span className="setup-boxed-set-mark" aria-hidden="true">
                            {icon?.url ? (
                              // Payload media may be local or externally hosted.
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={icon.url} alt="" />
                            ) : (
                              boxedSet.abbreviation
                            )}
                          </span>
                          <span>
                            <strong>{boxedSet.name}</strong>
                            {isBaseGame && <small>Required</small>}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ),
          )}
        </div>
      </form>

      {ancientOnes.length > 0 ? (
        <form
          action={selectAncientOneAction.bind(null, sessionID)}
          className="ancient-one-selector"
        >
          <div className="setup-form-fields">
            <div className="setup-form-field ancient-one-field">
              <label htmlFor="ancient-one-selection">Ancient One and sheet</label>
              <select
                defaultValue={currentSelection}
                id="ancient-one-selection"
                name="ancientOneSelection"
                required
              >
                <option disabled value="">
                  Select an Ancient One
                </option>
                {ancientOnes.flatMap((ancientOne) =>
                  ancientOne.sheets.map((sheet) => (
                    <option
                      key={`${ancientOne.id}-${sheet.key}`}
                      value={`${ancientOne.id}::${sheet.key}`}
                    >
                      {ancientOne.name} - {sheet.label} ({sheet.doomTrack} doom)
                    </option>
                  )),
                )}
              </select>
            </div>
            <div className="setup-form-field investigator-count-field">
              <label>Investigators</label>
              <InvestigatorCountInput initialValue={investigatorCount} />
            </div>
            <button type="submit">Save setup</button>
          </div>
        </form>
      ) : (
        <div className="setup-empty-state">
          <p>No Ancient Ones are available.</p>
          <Link href="/admin/collections/ancient-ones">Open Ancient Ones</Link>
        </div>
      )}
    </section>
  )
}

function PhaseGuide({ phase }: { phase: GamePhase }) {
  const guide = gamePhaseGuides[phase]

  return (
    <section className="phase-guide">
      <p className="eyebrow">Current Phase</p>
      <h2>{guide.title}</h2>
      <p className="phase-summary">{guide.summary}</p>

      <ol className="phase-checklist">
        {guide.steps.map((step) => (
          <li key={step}>
            <span aria-hidden="true" />
            {step}
          </li>
        ))}
      </ol>
    </section>
  )
}

function PhaseNavigation({
  activeAncientOne,
  openingHeadlineResolved,
  phase,
  sessionID,
  turnNumber,
}: {
  activeAncientOne: AncientOne | null
  openingHeadlineResolved: boolean
  phase: GamePhase
  sessionID: string
  turnNumber: number
}) {
  const isOpeningMythos = phase === openingMythosPhase
  const isSetupFlow = phase === 'Setup' || isOpeningMythos
  const activeIndex = turnPhases.findIndex((candidate) => candidate === phase)
  const nextLabel =
    phase === 'Setup'
      ? 'Opening Mythos'
      : isOpeningMythos
        ? openingHeadlineResolved
          ? 'Begin turn'
          : 'Resolve headline'
        : phase === 'Mythos'
          ? 'Complete turn'
          : phase === 'Other World Encounters'
            ? 'Encounters complete'
            : phase === 'Final Battle'
              ? 'Final battle'
              : 'Next phase'

  return (
    <nav className="phase-ribbon" aria-label="Turn phase">
      <form action={previousPhaseAction.bind(null, sessionID)}>
        <button
          className="phase-navigation-button previous"
          disabled={phase === 'Setup'}
          type="submit"
        >
          <span aria-hidden="true">&larr;</span>
          Previous
        </button>
      </form>
      <div className="phase-context">
        <div className="turn-context">
          <span>{isSetupFlow ? 'Setup' : 'Turn'}</span>
          {!isSetupFlow && <strong>{turnNumber}</strong>}
        </div>
        <div className={`phase-sequence${isOpeningMythos ? ' opening' : ''}`}>
          {isOpeningMythos ? (
            <div className="phase-step active">Opening Mythos</div>
          ) : (
            turnPhases.map((candidate, index) => (
              <div
                className={[
                  'phase-step',
                  candidate === phase ? 'active' : '',
                  activeIndex >= 0 && index < activeIndex ? 'complete' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                key={candidate}
              >
                {candidate}
              </div>
            ))
          )}
        </div>
      </div>
      <form action={advancePhaseAction.bind(null, sessionID)}>
        <button
          className="phase-navigation-button next"
          disabled={
            !activeAncientOne ||
            phase === 'Final Battle' ||
            (isOpeningMythos && !openingHeadlineResolved)
          }
          type="submit"
        >
          {nextLabel}
          <span aria-hidden="true">&rarr;</span>
        </button>
      </form>
    </nav>
  )
}

interface HomePageProps {
  searchParams: Promise<{
    session?: string | string[]
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestedSearchParams = await searchParams
  const requestedSessionID = Array.isArray(requestedSearchParams.session)
    ? requestedSearchParams.session[0]
    : requestedSearchParams.session
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const loadedSession = await getActiveSession(payload, requestedSessionID)

  if (!loadedSession) {
    redirect('/sessions')
  }

  const sessionWithSets = await repairLegacySessionEnabledSets(payload, loadedSession)
  const sessionWithOpening = await repairLegacyOpeningHeadline(payload, sessionWithSets)
  const session = await repairLegacyOtherWorldEncounterDeck(payload, sessionWithOpening)
  const enabledSetIDs = relationshipIDs(session.enabledSets)
  const [
    mythosCards,
    arkhamEncounterCards,
    otherWorldEncounterCards,
    referenceData,
    boxedSetResult,
  ] = await Promise.all([
    getAllMythosCards(payload, enabledSetIDs),
    getAllArkhamEncounterCards(payload, enabledSetIDs),
    getAllOtherWorldEncounterCards(payload, enabledSetIDs),
    getReferenceData(payload, enabledSetIDs),
    payload.find({
      collection: 'boxed-sets',
      sort: 'sortOrder',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
  ])
  const cardsByID = new Map(mythosCards.map((card) => [String(card.id), card]))
  const arkhamEncounterCardsByID = new Map(
    arkhamEncounterCards.map((card) => [String(card.id), card]),
  )
  const otherWorldEncounterCardsByID = new Map(
    otherWorldEncounterCards.map((card) => [String(card.id), card]),
  )
  const neighborhoodsByID = new Map(
    referenceData.neighborhoods.map((neighborhood) => [String(neighborhood.id), neighborhood]),
  )
  const ancientOnesByID = new Map(
    referenceData.ancientOnes.map((ancientOne) => [String(ancientOne.id), ancientOne]),
  )
  const mythos = mythosDeckStateFromSession(session)
  const arkhamEncounters = arkhamEncounterStateFromSession(session)
  const otherWorldEncounterDeck = otherWorldEncounterDeckStateFromSession(session)
  const tracks = session.tracks ?? {}
  const enabledSets = session.enabledSets.filter(isBoxedSetDocument)
  const enabledSetKeys = new Set(enabledSets.map((boxedSet) => boxedSet.key))
  const expansionBoards = enabledSets.filter(addsExpansionBoard)
  const investigatorRules = calculateInvestigatorRules({
    investigatorCount: session.playerCount,
    expansionBoardCount: expansionBoards.length,
    hasDunwich: enabledSetKeys.has('dunwich-horror'),
    hasInnsmouth: enabledSetKeys.has('innsmouth-horror'),
  })
  const limitWarnings = gameLimitWarnings(investigatorRules, {
    gatesOpen: tracks.gatesOpen ?? 0,
    monstersInArkham: tracks.monstersInArkham ?? 0,
    monstersInOutskirts: tracks.monstersInOutskirts ?? 0,
    terror: tracks.terror ?? 0,
  })
  const activeAncientOne = selectedAncientOne(session, ancientOnesByID)
  const activeSheet = selectedAncientOneSheet(activeAncientOne, session.ancientOneSheetKey)
  const currentPhase: GamePhase = activeAncientOne ? (session.currentPhase as GamePhase) : 'Setup'
  const isOpeningMythos = currentPhase === openingMythosPhase

  const drawPile = mythos.drawPile ?? []
  const discardPile = mythos.discardPile ?? []
  const drawHistory = mythos.drawHistory ?? []
  const currentCardDocument = resolveCard(mythos.currentDraw?.cardID, cardsByID)
  const activeEnvironmentDocument = resolveCard(mythos.activeEnvironment?.cardID, cardsByID)
  const activeRumorDocument = resolveCard(mythos.activeRumor?.cardID, cardsByID)
  const currentCard = cardProps(currentCardDocument)
  const activeEnvironment = cardProps(activeEnvironmentDocument)
  const activeRumor = cardProps(activeRumorDocument)
  const currentCardType = currentCardDocument?.cardType ?? ''
  const selectedArkhamNeighborhood = arkhamEncounters.selectedNeighborhoodID
    ? (neighborhoodsByID.get(arkhamEncounters.selectedNeighborhoodID) ?? null)
    : null
  const currentArkhamEncounterDocument = arkhamEncounters.currentCardID
    ? (arkhamEncounterCardsByID.get(arkhamEncounters.currentCardID) ?? null)
    : null
  const currentArkhamEncounter = arkhamEncounterCardProps(currentArkhamEncounterDocument)
  const arkhamCardCounts = arkhamEncounterCards.reduce((counts, card) => {
    const neighborhoodID = relationshipID(card.neighborhood)

    if (neighborhoodID) counts.set(neighborhoodID, (counts.get(neighborhoodID) ?? 0) + 1)

    return counts
  }, new Map<string, number>())
  const arkhamNeighborhoodDecks: ArkhamNeighborhoodDeckOption[] = [...referenceData.neighborhoods]
    .sort(neighborhoodSort)
    .map((neighborhood) => ({
      id: String(neighborhood.id),
      board: neighborhoodBoardName(neighborhood),
      boxedSet: boxedSetDisplay(neighborhood.sourceSet),
      cardCount: arkhamCardCounts.get(String(neighborhood.id)) ?? 0,
      ...arkhamEncounterDeckBackProps(
        neighborhood,
        referenceData.locations.filter((location) =>
          locationBelongsToNeighborhood(location, neighborhood),
        ),
      ),
    }))
  const selectedArkhamDeck = selectedArkhamNeighborhood
    ? (arkhamNeighborhoodDecks.find((deck) => deck.id === String(selectedArkhamNeighborhood.id)) ??
      null)
    : null
  const arkhamDrawsThisTurn = (arkhamEncounters.drawHistory ?? []).filter(
    (entry) => entry.turnNumber === session.turnNumber,
  ).length
  const currentOtherWorldEncounterDocument =
    otherWorldEncounterCardsByID.get(otherWorldEncounterDeck.currentDraw?.cardID ?? '') ?? null
  const currentOtherWorldEncounter = otherWorldEncounterCardProps(
    currentOtherWorldEncounterDocument,
  )
  const otherWorldDrawPile = otherWorldEncounterDeck.drawPile ?? []
  const otherWorldDiscardPile = otherWorldEncounterDeck.discardPile ?? []
  const otherWorldDrawHistory = otherWorldEncounterDeck.drawHistory ?? []
  const otherWorldAvailableCards =
    otherWorldDrawPile.length +
    otherWorldDiscardPile.length +
    (otherWorldEncounterDeck.currentDraw ? 1 : 0)
  const sessionID = String(session.id)

  return (
    <main className="mythos-table">
      <header className="table-topbar">
        <div className="session-title">
          <p className="eyebrow">Arkham Horror Helper</p>
          <h1>{session.name}</h1>
        </div>
        <section className="ancient-one-status" aria-label="Active Ancient One">
          <span>Ancient One</span>
          <strong>{activeAncientOne?.name ?? 'Not selected'}</strong>
          <small>
            {activeSheet
              ? `${activeSheet.label} | ${activeSheet.powerName}`
              : 'Choose during Setup'}
          </small>
        </section>
        <SessionTrackControls
          disabled={!activeAncientOne}
          gateAwakeningThreshold={investigatorRules.gateAwakeningThreshold}
          monsterLimit={investigatorRules.monsterLimit}
          outskirtsCapacity={investigatorRules.outskirtsCapacity}
          sessionID={sessionID}
          tracks={tracks}
        />
        <form action={exitGameAction.bind(null, sessionID)} className="exit-game-form">
          <button type="submit">Exit game</button>
        </form>
      </header>

      <section className="table-layout">
        <PhaseNavigation
          activeAncientOne={activeAncientOne}
          openingHeadlineResolved={session.openingHeadlineResolved}
          phase={currentPhase}
          sessionID={sessionID}
          turnNumber={session.turnNumber}
        />

        <GameRulesContext
          activeAncientOne={activeAncientOne}
          activeSheet={activeSheet}
          expansionBoardNames={expansionBoards.map((boxedSet) => boxedSet.name)}
          hasRelationships={enabledSetKeys.has('lurker-at-the-threshold')}
          investigatorRules={investigatorRules}
          phase={currentPhase}
          tracks={tracks}
        />

        {currentPhase !== 'Setup' && limitWarnings.length > 0 && (
          <section className="limit-warnings" aria-label="Game limit warnings">
            {limitWarnings.map((warning) => (
              <div className={warning.level} key={warning.text}>
                {warning.text}
              </div>
            ))}
          </section>
        )}

        {currentPhase === 'Setup' ? (
          <AncientOneSetup
            ancientOnes={referenceData.ancientOnes}
            boxedSets={boxedSetResult.docs}
            activeAncientOne={activeAncientOne}
            activeSheet={activeSheet}
            investigatorCount={session.playerCount}
            currentSession={session}
            sessionID={sessionID}
          />
        ) : currentPhase === 'Mythos' || isOpeningMythos ? (
          <div className="mythos-workspace">
            <aside className="mythos-resolver" aria-label="Mythos resolver">
              <header>
                <p className="eyebrow">
                  {isOpeningMythos ? 'Setup: Opening Mythos' : 'Mythos Resolver'}
                </p>
                <h2>
                  {currentCardDocument
                    ? mythos.currentDrawRevealed
                      ? currentCardDocument.title
                      : 'Card drawn'
                    : isOpeningMythos && session.openingHeadlineResolved
                      ? 'Opening complete'
                      : 'Deck ready'}
                </h2>
                <p className="resolver-copy">
                  {currentCardDocument
                    ? mythos.currentDrawRevealed
                      ? isOpeningMythos && !isHeadlineCardType(currentCardType)
                        ? `${currentCardType || 'Mythos card'}: skip this card and draw again.`
                        : currentCardType || 'Mythos card'
                      : 'Flip the card to reveal it.'
                    : isOpeningMythos && session.openingHeadlineResolved
                      ? 'The first turn can begin.'
                      : isOpeningMythos
                        ? 'Draw until a Headline appears. Skip Rumors and Environments.'
                        : mythosCards.length
                          ? 'Draw the next Mythos card.'
                          : 'No Mythos cards are available.'}
                </p>
              </header>

              <ol className="mythos-step-list">
                {(isOpeningMythos
                  ? gamePhaseGuides[openingMythosPhase].steps
                  : gamePhaseGuides.Mythos.steps
                ).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              {currentCardDocument && mythos.currentDrawRevealed && (
                <section className="mythos-primary-action">
                  {isOpeningMythos ? (
                    isHeadlineCardType(currentCardType) ? (
                      <form action={resolveOpeningHeadlineAction.bind(null, sessionID)}>
                        <button type="submit">Opening Headline resolved</button>
                      </form>
                    ) : (
                      <form action={skipOpeningMythosCardAction.bind(null, sessionID)}>
                        <button type="submit">Skip card and draw again</button>
                      </form>
                    )
                  ) : String(currentCardType).startsWith('Environment') ? (
                    <form action={activateCurrentEnvironmentAction.bind(null, sessionID)}>
                      <button type="submit">Set as Environment</button>
                    </form>
                  ) : currentCardType === 'Rumor' ? (
                    <form action={activateCurrentRumorAction.bind(null, sessionID)}>
                      <button type="submit">
                        {activeRumorDocument ? 'Ignore new Rumor' : 'Set as Rumor'}
                      </button>
                    </form>
                  ) : (
                    <form action={discardCurrentDrawAction.bind(null, sessionID)}>
                      <button type="submit">Discard after resolving</button>
                    </form>
                  )}
                </section>
              )}

              <div className="mythos-pile-summary">
                <span>
                  Discard <strong>{discardPile.length}</strong>
                </span>
                <span>
                  Drawn <strong>{drawHistory.length}</strong>
                </span>
                <span>
                  Shuffles <strong>{mythos.shuffleCount ?? 0}</strong>
                </span>
              </div>

              <details className="mythos-deck-actions">
                <summary>Deck actions</summary>
                <div>
                  <form action={shuffleDiscardIntoDeckAction.bind(null, sessionID)}>
                    <button disabled={discardPile.length === 0} type="submit">
                      Shuffle discard into deck
                    </button>
                  </form>
                  <form action={resetMythosDeckAction.bind(null, sessionID)}>
                    <button type="submit">Reset Mythos deck</button>
                  </form>
                </div>
              </details>
            </aside>

            <section className="card-lineup mythos-card-lineup" aria-label="Mythos cards in play">
              <section className="table-card-slot">
                <div className="slot-heading">
                  <h2>Current Mythos</h2>
                </div>
                <div className="deck-area">
                  <MythosDeckSlot
                    sessionID={sessionID}
                    currentCard={currentCard}
                    currentCardID={mythos.currentDraw?.cardID ?? null}
                    revealed={Boolean(mythos.currentDrawRevealed)}
                    cardsRemaining={drawPile.length}
                    drawDisabled={isOpeningMythos && session.openingHeadlineResolved}
                    drawLabel={isOpeningMythos ? 'Draw opening Mythos' : 'Draw Mythos'}
                  />
                </div>
              </section>

              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
                effectCard={activeEnvironmentDocument}
                action={
                  activeEnvironmentDocument
                    ? clearActiveEnvironmentAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                }
                actionLabel="Clear"
              />
            </section>
          </div>
        ) : currentPhase === 'Arkham Encounters' ? (
          <div className="mythos-workspace arkham-workspace">
            <aside className="mythos-resolver" aria-label="Arkham encounter resolver">
              <header>
                <p className="eyebrow">Arkham Encounters</p>
                <h2>{selectedArkhamNeighborhood?.name ?? 'Choose a neighborhood'}</h2>
                <p className="resolver-copy">
                  {selectedArkhamNeighborhood
                    ? currentArkhamEncounterDocument
                      ? 'Resolve the entry for the investigator’s location.'
                      : `${selectedArkhamNeighborhood.name} deck ready.`
                    : 'Select the location deck matching the investigator’s neighborhood.'}
                </p>
              </header>

              <ol className="mythos-step-list">
                {gamePhaseGuides['Arkham Encounters'].steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              {selectedArkhamNeighborhood && (
                <section className="mythos-primary-action">
                  <form action={clearArkhamNeighborhoodAction.bind(null, sessionID)}>
                    <button type="submit">Choose neighborhood</button>
                  </form>
                </section>
              )}

              <div className="mythos-pile-summary">
                <span>
                  This turn <strong>{arkhamDrawsThisTurn}</strong>
                </span>
                <span>
                  Session <strong>{arkhamEncounters.drawHistory?.length ?? 0}</strong>
                </span>
                {selectedArkhamDeck && (
                  <span>
                    Cards <strong>{selectedArkhamDeck.cardCount}</strong>
                  </span>
                )}
              </div>
            </aside>

            {selectedArkhamNeighborhood && selectedArkhamDeck ? (
              <section
                className="card-lineup mythos-card-lineup"
                aria-label="Arkham encounter and active effects"
              >
                <section className="table-card-slot">
                  <div className="slot-heading">
                    <h2>{selectedArkhamNeighborhood.name}</h2>
                  </div>
                  <div className="deck-area">
                    <ArkhamEncounterDeckSlot
                      cardCount={selectedArkhamDeck.cardCount}
                      currentCard={currentArkhamEncounter}
                      currentDrawKey={arkhamEncounters.currentDrawKey}
                      neighborhood={selectedArkhamDeck.neighborhood}
                      panels={selectedArkhamDeck.panels}
                      sessionID={sessionID}
                    />
                  </div>
                </section>

                <CardSlot
                  title="Active Environment"
                  card={activeEnvironment}
                  emptyText="No Environment is active."
                  effectCard={activeEnvironmentDocument}
                  action={
                    activeEnvironmentDocument
                      ? clearActiveEnvironmentAction.bind(null, sessionID)
                      : undefined
                  }
                  actionLabel="Clear"
                />
                <CardSlot
                  title="Active Rumor"
                  card={activeRumor}
                  emptyText="No Rumor is active."
                  effectCard={activeRumorDocument}
                  action={
                    activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                  }
                  actionLabel="Clear"
                />
              </section>
            ) : (
              <ArkhamNeighborhoodShelf decks={arkhamNeighborhoodDecks} sessionID={sessionID} />
            )}
          </div>
        ) : currentPhase === 'Other World Encounters' ? (
          <div className="mythos-workspace other-world-workspace">
            <aside className="mythos-resolver" aria-label="Other World encounter resolver">
              <header>
                <p className="eyebrow">Other World Encounters</p>
                <h2>
                  {currentOtherWorldEncounterDocument
                    ? `${currentOtherWorldEncounterDocument.colour} encounter`
                    : 'Deck ready'}
                </h2>
                <p className="resolver-copy">
                  {currentOtherWorldEncounterDocument
                    ? 'Click the card to discard it and flip the next encounter.'
                    : otherWorldAvailableCards > 0
                      ? 'Flip cards until every investigator in an Other World has resolved an encounter.'
                      : 'No encounter cards are available for the active sets.'}
                </p>
              </header>

              <ol className="mythos-step-list">
                {gamePhaseGuides['Other World Encounters'].steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="mythos-pile-summary">
                <span>
                  Draw <strong>{otherWorldDrawPile.length}</strong>
                </span>
                <span>
                  Discard <strong>{otherWorldDiscardPile.length}</strong>
                </span>
                <span>
                  Flipped <strong>{otherWorldDrawHistory.length}</strong>
                </span>
                <span>
                  Shuffles <strong>{otherWorldEncounterDeck.shuffleCount ?? 0}</strong>
                </span>
              </div>

              <details className="mythos-deck-actions">
                <summary>Deck actions</summary>
                <div>
                  <form action={shuffleOtherWorldEncounterDiscardAction.bind(null, sessionID)}>
                    <button disabled={otherWorldDiscardPile.length === 0} type="submit">
                      Shuffle discard into deck
                    </button>
                  </form>
                  <form action={resetOtherWorldEncounterDeckAction.bind(null, sessionID)}>
                    <button type="submit">Reset encounter deck</button>
                  </form>
                </div>
              </details>
            </aside>

            <section
              className="card-lineup mythos-card-lineup"
              aria-label="Other World encounter and active effects"
            >
              <section className="table-card-slot">
                <div className="slot-heading">
                  <h2>Current Encounter</h2>
                </div>
                <div className="deck-area">
                  <OtherWorldEncounterDeckSlot
                    availableCards={otherWorldAvailableCards}
                    currentCard={currentOtherWorldEncounter}
                    currentCardInstanceKey={
                      otherWorldEncounterDeck.currentDraw?.instanceKey ?? null
                    }
                    sessionID={sessionID}
                  />
                </div>
              </section>

              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
                effectCard={activeEnvironmentDocument}
                action={
                  activeEnvironmentDocument
                    ? clearActiveEnvironmentAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                }
                actionLabel="Clear"
              />
            </section>
          </div>
        ) : (
          <div className="phase-workspace">
            <PhaseGuide phase={currentPhase} />
            <div className="persistent-card-lineup" aria-label="Active Mythos effects">
              <CardSlot
                title="Active Environment"
                card={activeEnvironment}
                emptyText="No Environment is active."
                effectCard={activeEnvironmentDocument}
                action={
                  activeEnvironmentDocument
                    ? clearActiveEnvironmentAction.bind(null, sessionID)
                    : undefined
                }
                actionLabel="Clear"
              />
              <CardSlot
                title="Active Rumor"
                card={activeRumor}
                emptyText="No Rumor is active."
                effectCard={activeRumorDocument}
                action={
                  activeRumorDocument ? clearActiveRumorAction.bind(null, sessionID) : undefined
                }
                actionLabel="Clear"
              />
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
