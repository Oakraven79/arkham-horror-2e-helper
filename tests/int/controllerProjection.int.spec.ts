import { describe, expect, it } from 'vitest'
import type { Payload } from 'payload'

import type { ControllerParticipant } from '@/lib/controllerAuth'
import { controllerCommandsForSession, controllerProjection } from '@/lib/controllerProjection'
import type { AncientOne, BoxedSet, GameSession, Media, MythosCard } from '@/payload-types'

function mythosCard(
  cardType: MythosCard['cardType'],
  gateMode: MythosCard['gateInstruction']['mode'] = 'single',
) {
  return {
    id: `${cardType}-${gateMode}`,
    title: `${cardType} card`,
    cardCode: `${cardType}-${gateMode}`,
    copyCount: 1,
    cardType,
    gateInstruction: {
      mode: gateMode,
      locations: gateMode === 'none' || gateMode === 'surge' ? [] : ['woods'],
    },
  } as MythosCard
}

function session(overrides: Partial<GameSession> = {}) {
  return {
    id: 'session-one',
    name: 'Friday in Arkham',
    status: 'active',
    stateRevision: 3,
    mobileControlsEnabled: true,
    playerCount: 4,
    enabledSets: ['base-set'],
    turnNumber: 2,
    activeAncientOne: 'ancient-one',
    useAncientOneBackground: false,
    currentPhase: 'Upkeep',
    openingHeadlineResolved: true,
    tracks: {
      doomCurrent: 1,
      doomMax: 10,
      terror: 0,
      gatesOpen: 1,
      elderSigns: 0,
      monstersInArkham: 1,
      monstersInOutskirts: 0,
    },
    expansionTracks: {
      dunwichHorrorTokens: 0,
      deepOnesRising: 0,
      fedsChurchGreen: 0,
      fedsFactoryDistrict: 0,
      fedsInnsmouthShore: 0,
    },
    mythos: {
      shuffleCount: 0,
    },
    otherWorldEncounters: {
      initialized: true,
      shuffleCount: 0,
    },
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  } as GameSession
}

function boxedSet(key: string) {
  return {
    id: `${key}-set`,
    name: key,
    key,
    abbreviation: key.slice(0, 3).toUpperCase(),
    category: 'large-expansion',
    sortOrder: 1,
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
  } as BoxedSet
}

const participant: ControllerParticipant = {
  expiresAt: Date.UTC(2030, 0, 1),
  name: 'Jenny',
  roomVersion: 'room-one',
  sessionID: 'session-one',
}

const unusedPayload = {} as Payload

function ancientOneWithBackground() {
  return {
    id: 'azathoth',
    name: 'Azathoth',
    key: 'azathoth',
    boxedSet: 'Base Game',
    sourceSet: 'base-set',
    sheets: [
      {
        key: 'standard',
        label: 'Standard',
        isDefault: true,
        doomTrack: 14,
        combatRating: {
          display: '-',
          type: 'infinite',
        },
        defenseText: '',
        worshippers: '',
        powerName: 'Absolute Destruction',
        power: '',
        attack: '',
        sheetImage: {
          id: 'azathoth-background',
          alt: 'Azathoth sheet art',
          url: '/media/azathoth.png',
          updatedAt: '2026-07-03T00:00:00.000Z',
          createdAt: '2026-07-03T00:00:00.000Z',
        } as Media,
      },
    ],
    updatedAt: '2026-07-03T00:00:00.000Z',
    createdAt: '2026-07-03T00:00:00.000Z',
  } as AncientOne
}

function commandIDs(value: GameSession) {
  return controllerCommandsForSession(value).map((command) => command.id)
}

describe('mobile controller phase projection', () => {
  it('offers only phase completion during Upkeep and Movement', () => {
    expect(commandIDs(session({ currentPhase: 'Upkeep' }))).toEqual(['advance-phase'])
    expect(commandIDs(session({ currentPhase: 'Movement' }))).toEqual(['advance-phase'])
  })

  it('requires an eligible Opening Mythos card to be fully resolved', () => {
    const environment = mythosCard('Environment (Weather)')
    const rumor = mythosCard('Rumor')

    expect(
      commandIDs(
        session({
          currentPhase: 'Opening Mythos',
          openingHeadlineResolved: false,
          mythos: {
            currentDraw: environment,
            currentDrawRevealed: true,
            shuffleCount: 0,
          },
        }),
      ),
    ).toContain('resolve-opening-mythos')
    expect(
      commandIDs(
        session({
          currentPhase: 'Opening Mythos',
          openingHeadlineResolved: false,
          mythos: {
            currentDraw: rumor,
            currentDrawRevealed: true,
            shuffleCount: 0,
          },
        }),
      ),
    ).toContain('skip-opening-mythos')
  })

  it('does not offer turn completion before the Mythos card is resolved', () => {
    expect(commandIDs(session({ currentPhase: 'Mythos' }))).toEqual(['draw-mythos'])
  })

  it('offers turn completion only after a logged Mythos resolution', () => {
    expect(
      commandIDs(
        session({
          currentPhase: 'Mythos',
          sessionLog: [
            {
              turnNumber: 2,
              phase: 'Mythos',
              action: 'discard-card',
            },
          ],
        }),
      ),
    ).toEqual(['advance-phase'])
  })

  it('projects card-type-specific Mythos actions', () => {
    expect(
      commandIDs(
        session({
          currentPhase: 'Mythos',
          mythos: {
            currentDraw: mythosCard('Environment (Urban)'),
            currentDrawRevealed: true,
            shuffleCount: 0,
          },
        }),
      ),
    ).toEqual(['activate-environment'])

    expect(
      commandIDs(
        session({
          currentPhase: 'Mythos',
          mythos: {
            currentDraw: mythosCard('Rumor'),
            currentDrawRevealed: true,
            shuffleCount: 0,
          },
        }),
      ),
    ).toEqual(['activate-rumor'])
  })

  it('offers MOBILE-07 discard for a revealed Mythos card stored as an ID relationship', async () => {
    const headline = mythosCard('Headline')
    const payload = {
      findByID: async (args: { collection: string; id: string }) => {
        expect(args.collection).toBe('mythos-cards')
        expect(args.id).toBe(String(headline.id))
        return headline
      },
    } as unknown as Payload
    const projection = await controllerProjection(
      payload,
      session({
        currentPhase: 'Mythos',
        mythos: {
          currentDraw: String(headline.id),
          currentDrawInstanceKey: `${headline.id}:1`,
          currentDrawRevealed: true,
          shuffleCount: 0,
        },
      }),
      participant,
    )

    expect(projection.commands.map((command) => command.id)).toEqual(['discard-mythos'])
    expect(projection.currentCard).toMatchObject({
      revealed: true,
      title: headline.title,
      type: 'Headline',
    })
  })

  it('keeps Setup read-only on phones', () => {
    expect(commandIDs(session({ currentPhase: 'Setup' }))).toEqual([])
  })

  it('projects MOBILE-08 enabled expansion board tracks for phones', async () => {
    const projection = await controllerProjection(
      unusedPayload,
      session({
        enabledSets: [
          boxedSet('base-game'),
          boxedSet('dunwich-horror'),
          boxedSet('innsmouth-horror'),
          boxedSet('kingsport-horror'),
        ],
        expansionTracks: {
          dunwichHorrorTokens: 2,
          deepOnesRising: 3,
          fedsChurchGreen: 1,
          fedsFactoryDistrict: 2,
          fedsInnsmouthShore: 0,
          kingsportRifts: [
            {
              trackKey: 'rift-1',
              progress: 4,
              open: true,
              investigated: 1,
              currentLocation: 'South Shore',
            },
          ],
        },
      }),
      participant,
    )

    expect(projection.expansionTracks.enabledSetKeys).toEqual([
      'base-game',
      'dunwich-horror',
      'innsmouth-horror',
      'kingsport-horror',
    ])
    expect(projection.expansionTracks.state).toMatchObject({
      dunwichHorrorTokens: 2,
      deepOnesRising: 3,
      fedsRaid: {
        'church-green': 1,
        'factory-district': 2,
        'innsmouth-shore': 0,
      },
    })
    expect(projection.expansionTracks.state.kingsportRifts[0]).toMatchObject({
      trackKey: 'rift-1',
      progress: 4,
      open: true,
      investigated: 1,
      currentLocation: 'South Shore',
    })
  })

  it('uses the default table background when the Ancient One background is disabled', async () => {
    const projection = await controllerProjection(
      unusedPayload,
      session({
        activeAncientOne: ancientOneWithBackground(),
        ancientOneSheetKey: 'standard',
        useAncientOneBackground: false,
      }),
      participant,
    )

    expect(projection.presentation).toEqual({
      tableBackgroundAlt: null,
      tableBackgroundUrl: null,
    })
  })

  it('projects the selected Ancient One sheet background for phones when enabled', async () => {
    const projection = await controllerProjection(
      unusedPayload,
      session({
        activeAncientOne: ancientOneWithBackground(),
        ancientOneSheetKey: 'standard',
        useAncientOneBackground: true,
      }),
      participant,
    )

    expect(projection.presentation).toEqual({
      tableBackgroundAlt: 'Azathoth sheet art',
      tableBackgroundUrl: '/media/azathoth.png',
    })
  })
})
