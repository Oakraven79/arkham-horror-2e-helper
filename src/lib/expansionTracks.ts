export const expansionTrackSetKeys = {
  dunwich: 'dunwich-horror',
  innsmouth: 'innsmouth-horror',
  kingsport: 'kingsport-horror',
} as const

export const riftTrackKeys = ['rift-1', 'rift-2', 'rift-3'] as const

export type RiftTrackKey = (typeof riftTrackKeys)[number]
export type FedsRaidDistrict = 'church-green' | 'factory-district' | 'innsmouth-shore'

export interface KingsportRiftState {
  currentLocation?: string
  investigated: number
  open: boolean
  progress: number
  trackKey: RiftTrackKey
}

export interface ExpansionTrackState {
  deepOnesRising: number
  dunwichHorrorTokens: number
  fedsRaid: Record<FedsRaidDistrict, number>
  kingsportRifts: KingsportRiftState[]
}

export type ExpansionTrackCommand =
  | { type: 'dunwich-correct-down' }
  | { type: 'dunwich-defeated' }
  | { type: 'dunwich-vortex' }
  | { type: 'feds-add'; district: FedsRaidDistrict }
  | { type: 'feds-remove'; district: FedsRaidDistrict }
  | { type: 'innsmouth-correct-down' }
  | { type: 'innsmouth-gate-prevented' }
  | { type: 'innsmouth-vortex' }
  | { type: 'rift-advance'; trackKey: RiftTrackKey }
  | { type: 'rift-correct-down'; trackKey: RiftTrackKey }
  | { type: 'rift-investigate'; trackKey: RiftTrackKey }
  | { type: 'rift-location'; trackKey: RiftTrackKey; location: string }

export interface ExpansionTrackTransition {
  note: string
  raidCompleted: boolean
  state: ExpansionTrackState
  terrorIncrease: number
}

interface RawKingsportRift {
  currentLocation?: string | null
  investigated?: number | null
  open?: boolean | null
  progress?: number | null
  trackKey?: string | null
}

interface RawExpansionTracks {
  deepOnesRising?: number | null
  dunwichHorrorTokens?: number | null
  fedsChurchGreen?: number | null
  fedsFactoryDistrict?: number | null
  fedsInnsmouthShore?: number | null
  kingsportRifts?: RawKingsportRift[] | null
}

function boundedInteger(value: number | null | undefined, maximum: number) {
  if (!Number.isInteger(value)) return 0
  return Math.min(maximum, Math.max(0, value ?? 0))
}

function freshRift(trackKey: RiftTrackKey): KingsportRiftState {
  return {
    trackKey,
    progress: 0,
    open: false,
    investigated: 0,
  }
}

export function freshExpansionTrackState(): ExpansionTrackState {
  return {
    dunwichHorrorTokens: 0,
    deepOnesRising: 0,
    fedsRaid: {
      'church-green': 0,
      'factory-district': 0,
      'innsmouth-shore': 0,
    },
    kingsportRifts: riftTrackKeys.map(freshRift),
  }
}

export function expansionTrackStateFromSession(
  expansionTracks?: RawExpansionTracks | null,
): ExpansionTrackState {
  const rawRifts = new Map(
    (expansionTracks?.kingsportRifts ?? [])
      .filter((rift): rift is RawKingsportRift & { trackKey: RiftTrackKey } =>
        riftTrackKeys.includes(rift.trackKey as RiftTrackKey),
      )
      .map((rift) => [rift.trackKey, rift]),
  )

  return {
    dunwichHorrorTokens: boundedInteger(expansionTracks?.dunwichHorrorTokens, 3),
    deepOnesRising: boundedInteger(expansionTracks?.deepOnesRising, 6),
    fedsRaid: {
      'church-green': boundedInteger(expansionTracks?.fedsChurchGreen, 2),
      'factory-district': boundedInteger(expansionTracks?.fedsFactoryDistrict, 2),
      'innsmouth-shore': boundedInteger(expansionTracks?.fedsInnsmouthShore, 2),
    },
    kingsportRifts: riftTrackKeys.map((trackKey) => {
      const raw = rawRifts.get(trackKey)
      const progress = boundedInteger(raw?.progress, 4)
      const open = Boolean(raw?.open) || progress >= 4

      return {
        trackKey,
        progress,
        open,
        investigated: open ? boundedInteger(raw?.investigated, 4) : 0,
        ...(raw?.currentLocation ? { currentLocation: raw.currentLocation } : {}),
      }
    }),
  }
}

export function expansionTrackStateForPayload(state: ExpansionTrackState) {
  return {
    dunwichHorrorTokens: state.dunwichHorrorTokens,
    deepOnesRising: state.deepOnesRising,
    fedsChurchGreen: state.fedsRaid['church-green'],
    fedsFactoryDistrict: state.fedsRaid['factory-district'],
    fedsInnsmouthShore: state.fedsRaid['innsmouth-shore'],
    kingsportRifts: state.kingsportRifts.map((rift) => ({
      trackKey: rift.trackKey,
      progress: rift.progress,
      open: rift.open,
      investigated: rift.investigated,
      currentLocation: rift.currentLocation,
    })),
  }
}

export function fedsRaidTotal(state: ExpansionTrackState) {
  return Object.values(state.fedsRaid).reduce((total, value) => total + value, 0)
}

function updateRift(
  state: ExpansionTrackState,
  trackKey: RiftTrackKey,
  update: (rift: KingsportRiftState) => KingsportRiftState,
) {
  return {
    ...state,
    kingsportRifts: state.kingsportRifts.map((rift) =>
      rift.trackKey === trackKey ? update(rift) : rift,
    ),
  }
}

export function applyExpansionTrackCommand(
  state: ExpansionTrackState,
  command: ExpansionTrackCommand,
): ExpansionTrackTransition {
  let nextState = state
  let note = ''
  let terrorIncrease = 0
  let raidCompleted = false

  switch (command.type) {
    case 'dunwich-vortex':
      nextState = {
        ...state,
        dunwichHorrorTokens: Math.min(3, state.dunwichHorrorTokens + 1),
      }
      terrorIncrease = 1
      note =
        state.dunwichHorrorTokens === 3
          ? 'A monster entered a Dunwich vortex. Terror rises; the Dunwich Horror track remains full.'
          : nextState.dunwichHorrorTokens === 3
            ? 'A monster entered a Dunwich vortex. Terror rises and the Dunwich Horror appears at Sentinel Hill.'
            : 'A monster entered a Dunwich vortex. Terror and the Dunwich Horror track each increase by one.'
      break
    case 'dunwich-correct-down':
      nextState = {
        ...state,
        dunwichHorrorTokens: Math.max(0, state.dunwichHorrorTokens - 1),
      }
      note = 'The Dunwich Horror track was corrected down by one.'
      break
    case 'dunwich-defeated':
      nextState = {
        ...state,
        dunwichHorrorTokens: 0,
      }
      note =
        'The Dunwich Horror was defeated. Its track is cleared; remember the investigator reward.'
      break
    case 'innsmouth-gate-prevented':
      nextState = {
        ...state,
        deepOnesRising: Math.min(6, state.deepOnesRising + 1),
      }
      note =
        nextState.deepOnesRising === 6
          ? 'A prevented gate fills the Deep Ones Rising track. The Ancient One awakens.'
          : 'A prevented gate advances the Deep Ones Rising track.'
      break
    case 'innsmouth-vortex':
      nextState = {
        ...state,
        deepOnesRising: Math.min(6, state.deepOnesRising + 1),
      }
      terrorIncrease = 1
      note =
        nextState.deepOnesRising === 6
          ? 'A monster entered an Innsmouth vortex. Terror rises and the Ancient One awakens.'
          : 'A monster entered an Innsmouth vortex. Terror and Deep Ones Rising each increase by one.'
      break
    case 'innsmouth-correct-down':
      nextState = {
        ...state,
        deepOnesRising: Math.max(0, state.deepOnesRising - 1),
      }
      note = 'The Deep Ones Rising track was corrected down by one.'
      break
    case 'feds-add': {
      const current = state.fedsRaid[command.district]
      const next = Math.min(2, current + 1)
      const fedsRaid = {
        ...state.fedsRaid,
        [command.district]: next,
      }
      const total = Object.values(fedsRaid).reduce((sum, value) => sum + value, 0)

      if (total >= 6) {
        nextState = {
          ...state,
          deepOnesRising: 0,
          fedsRaid: {
            'church-green': 0,
            'factory-district': 0,
            'innsmouth-shore': 0,
          },
        }
        raidCompleted = true
        note = 'The Feds Raid Innsmouth track filled. Both Innsmouth tracks are cleared.'
      } else {
        nextState = {
          ...state,
          fedsRaid,
        }
        note = 'Evidence was added to the Feds Raid Innsmouth track.'
      }
      break
    }
    case 'feds-remove':
      nextState = {
        ...state,
        fedsRaid: {
          ...state.fedsRaid,
          [command.district]: Math.max(0, state.fedsRaid[command.district] - 1),
        },
      }
      note = 'The Feds Raid Innsmouth track was corrected down by one.'
      break
    case 'rift-advance':
      nextState = updateRift(state, command.trackKey, (rift) => {
        if (rift.open) return rift
        const progress = Math.min(4, rift.progress + 1)
        return {
          ...rift,
          progress,
          open: progress === 4,
          investigated: 0,
        }
      })
      note = nextState.kingsportRifts.find((rift) => rift.trackKey === command.trackKey)?.open
        ? `${command.trackKey} filled and opens at the current Mythos gate location.`
        : `${command.trackKey} gained one rift progress marker.`
      break
    case 'rift-correct-down':
      nextState = updateRift(state, command.trackKey, (rift) => {
        if (rift.investigated > 0) {
          return {
            ...rift,
            investigated: rift.investigated - 1,
          }
        }

        if (rift.open) {
          return {
            ...rift,
            progress: 3,
            open: false,
            currentLocation: undefined,
          }
        }

        return {
          ...rift,
          progress: Math.max(0, rift.progress - 1),
        }
      })
      note = `${command.trackKey} was corrected down by one step.`
      break
    case 'rift-investigate':
      nextState = updateRift(state, command.trackKey, (rift) => {
        if (!rift.open) return rift
        const investigated = Math.min(4, rift.investigated + 1)

        if (investigated === 4) return freshRift(rift.trackKey)

        return {
          ...rift,
          investigated,
        }
      })
      note =
        nextState.kingsportRifts.find((rift) => rift.trackKey === command.trackKey)?.open === false
          ? `${command.trackKey} was fully investigated and closes.`
          : `${command.trackKey} gained one investigated progress marker.`
      break
    case 'rift-location':
      nextState = updateRift(state, command.trackKey, (rift) => ({
        ...rift,
        currentLocation: command.location.trim() || undefined,
      }))
      note = `${command.trackKey} location was updated.`
      break
  }

  return {
    state: nextState,
    note,
    terrorIncrease,
    raidCompleted,
  }
}

export function commandRequiredSet(command: ExpansionTrackCommand) {
  if (command.type.startsWith('dunwich-')) return expansionTrackSetKeys.dunwich
  if (command.type.startsWith('rift-')) return expansionTrackSetKeys.kingsport
  return expansionTrackSetKeys.innsmouth
}

export const fedsRaidDistrictLabels: Record<FedsRaidDistrict, string> = {
  'church-green': 'Church Green',
  'factory-district': 'Factory District',
  'innsmouth-shore': 'Innsmouth Shore',
}

const expansionTrackCommandTypes = new Set<ExpansionTrackCommand['type']>([
  'dunwich-correct-down',
  'dunwich-defeated',
  'dunwich-vortex',
  'feds-add',
  'feds-remove',
  'innsmouth-correct-down',
  'innsmouth-gate-prevented',
  'innsmouth-vortex',
  'rift-advance',
  'rift-correct-down',
  'rift-investigate',
  'rift-location',
])

export function assertExpansionTrackCommand(
  command: ExpansionTrackCommand,
): asserts command is ExpansionTrackCommand {
  if (
    !command ||
    typeof command !== 'object' ||
    !('type' in command) ||
    !expansionTrackCommandTypes.has(command.type)
  ) {
    throw new Error('That expansion track action is not supported.')
  }

  if (
    (command.type === 'feds-add' || command.type === 'feds-remove') &&
    !Object.hasOwn(fedsRaidDistrictLabels, command.district)
  ) {
    throw new Error('That Feds Raid district is not supported.')
  }

  if (
    command.type.startsWith('rift-') &&
    (!('trackKey' in command) || !riftTrackKeys.includes(command.trackKey))
  ) {
    throw new Error('That Kingsport rift track is not supported.')
  }

  if (command.type === 'rift-location' && typeof command.location !== 'string') {
    throw new Error('A Kingsport rift location must be text.')
  }
}
