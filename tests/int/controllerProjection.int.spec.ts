import { describe, expect, it } from 'vitest'

import { controllerCommandsForSession } from '@/lib/controllerProjection'
import type { GameSession, MythosCard } from '@/payload-types'

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

  it('keeps Setup read-only on phones', () => {
    expect(commandIDs(session({ currentPhase: 'Setup' }))).toEqual([])
  })
})
