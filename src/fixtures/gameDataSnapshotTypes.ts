export type PortableGameDocument = Record<string, unknown> & {
  _status?: 'draft' | 'published'
}

export interface PortableBoxedSet extends PortableGameDocument {
  icon?: string
  key: string
}

export interface PortableAncientOne extends PortableGameDocument {
  key: string
  sheets: (PortableGameDocument & {
    key: string
    sheetImage?: string
  })[]
  sourceSet: string
}

export interface PortableNeighborhood extends PortableGameDocument {
  backFrame?: string
  frontFrame?: string
  key: string
  sourceSet: string
}

export interface PortableLocation extends PortableGameDocument {
  cardImage?: string
  key: string
  neighborhood: string
  sourceSet: string
}

export interface PortableArkhamEncounterCard extends PortableGameDocument {
  cardCode: string
  encounters: (PortableGameDocument & {
    location: string
  })[]
  neighborhood: string
  sourceSet: string
}

export interface PortableMythosCard extends PortableGameDocument {
  cardCode: string
  gateInstruction: PortableGameDocument & {
    locations: string[]
  }
  lowerLeftOverride?: PortableGameDocument & {
    image?: string
  }
  sourceSet: string
}

export interface PortableOtherWorld extends PortableGameDocument {
  art?: string
  key: string
  sourceSet: string
}

export interface PortableOtherWorldEncounterCard extends PortableGameDocument {
  cardCode: string
  encounters: (PortableGameDocument & {
    destination?: string
  })[]
  sourceSet: string
}

export interface GameDataSnapshot {
  collections: {
    ancientOnes: PortableAncientOne[]
    arkhamEncounterCards: PortableArkhamEncounterCard[]
    boxedSets: PortableBoxedSet[]
    locations: PortableLocation[]
    mythosCards: PortableMythosCard[]
    neighborhoods: PortableNeighborhood[]
    otherWorldEncounterCards: PortableOtherWorldEncounterCard[]
    otherWorlds: PortableOtherWorld[]
  }
  excludedCollections: readonly ['users', 'game-sessions', 'fixture-installations']
  generatedAt: string
}
