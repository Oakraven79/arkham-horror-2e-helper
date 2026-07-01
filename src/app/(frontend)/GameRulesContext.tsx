import type { GamePhase } from '@/lib/gamePhaseState'
import type { InvestigatorRules } from '@/lib/investigatorRules'
import type { AncientOne, GameSession } from '@/payload-types'

type AncientOneSheet = AncientOne['sheets'][number]

interface GameRulesContextProps {
  activeAncientOne: AncientOne | null
  activeSheet: AncientOneSheet | null
  expansionBoardNames: string[]
  hasRelationships: boolean
  investigatorRules: InvestigatorRules
  phase: GamePhase
  tracks: GameSession['tracks']
}

export function GameRulesContext({
  activeAncientOne,
  activeSheet,
  expansionBoardNames,
  hasRelationships,
  investigatorRules,
  phase,
  tracks,
}: GameRulesContextProps) {
  const relevantNotes =
    activeAncientOne?.rulesNotes?.filter(
      (note) => !note.sheetKey || note.sheetKey === activeSheet?.key,
    ) ?? []
  const primaryModifiers = [
    ['Investigators', investigatorRules.actualInvestigatorCount],
    ...(investigatorRules.expansionBoardAdjustment > 0
      ? [['Adjusted investigators', investigatorRules.effectiveInvestigatorCount] as const]
      : []),
    ['Monster cap', investigatorRules.monsterLimit],
    ['Outskirts cap', investigatorRules.outskirtsCapacity],
    ['Gates to awaken', investigatorRules.gateAwakeningThreshold],
    ['New gate monsters', investigatorRules.newGateMonsterCount],
    ['Minimum surge', investigatorRules.monsterSurgeMinimum],
  ]
  const secondaryModifiers = [
    ['Terror 10 awakening', `${investigatorRules.terrorTenAwakeningMonsterCount} monsters`],
    ['Close-gates victory', `${investigatorRules.closeGateTrophiesRequired} gate trophies`],
    [
      'Final battle progress',
      `${investigatorRules.finalBattleSuccessesPerDoom} successes per doom`,
    ],
    ...(hasRelationships
      ? [['Relationship setup', `${investigatorRules.relationshipCardCount} cards`] as const]
      : []),
  ]

  return (
    <section className="game-rules-context" aria-label="Game rules and modifiers">
      <div className="rules-reference-strip">
        <div className="reference-identity">
          <span>Ancient One</span>
          <strong>{activeAncientOne?.name ?? 'Not selected'}</strong>
          <small>
            {activeSheet
              ? `${activeSheet.label} | ${activeSheet.powerName}`
              : 'Choose during Setup'}
          </small>
        </div>
        <div className="reference-metric doom">
          <span>Doom</span>
          <strong>
            {tracks.doomCurrent ?? 0}/{tracks.doomMax ?? activeSheet?.doomTrack ?? '-'}
          </strong>
        </div>
        {primaryModifiers.map(([label, value]) => (
          <div className="reference-metric" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <details className="rules-reference-details" open={phase === 'Final Battle'}>
        <summary>Reference details</summary>
        <div className="rules-reference-body">
          <section className="ancient-one-reference">
            <p className="eyebrow">Ancient One modifiers</p>
            {activeSheet ? (
              <>
                <div className="ancient-modifier-text">
                  <strong>{activeSheet.powerName}</strong>
                  <span>{activeSheet.power}</span>
                </div>
                <div className="ancient-modifier-text">
                  <strong>Worshipper changes</strong>
                  <span>{activeSheet.worshippers}</span>
                </div>

                {relevantNotes.length > 0 && (
                  <div className="ancient-rules-notes">
                    {relevantNotes.map((note) => (
                      <p key={`${note.kind}-${note.text}`}>
                        <strong>{note.kind}</strong>
                        {note.text}
                      </p>
                    ))}
                  </div>
                )}

                {phase === 'Final Battle' && (
                  <section className="final-battle-context">
                    <div>
                      <span>Combat modifier</span>
                      <strong>{activeSheet.combatRating.display}</strong>
                    </div>
                    <div>
                      <span>Defenses</span>
                      <strong>{activeSheet.defenseText}</strong>
                    </div>
                    {activeSheet.startOfBattle && (
                      <div>
                        <span>Start of battle</span>
                        <strong>{activeSheet.startOfBattle}</strong>
                      </div>
                    )}
                    <div>
                      <span>Ancient One attack</span>
                      <strong>{activeSheet.attack}</strong>
                    </div>
                  </section>
                )}
              </>
            ) : (
              <p className="rules-context-empty">
                Choose an Ancient One during Setup to display its modifiers.
              </p>
            )}
          </section>

          <section className="additional-rules-reference">
            <p className="eyebrow">Additional thresholds</p>
            {expansionBoardNames.length > 0 && (
              <p className="expansion-board-list">
                Expansion boards: {expansionBoardNames.join(', ')}
              </p>
            )}
            {investigatorRules.expansionBoardAdjustment > 0 && (
              <p className="rules-adjustment">
                {investigatorRules.actualInvestigatorCount} investigators count as{' '}
                {investigatorRules.effectiveInvestigatorCount} for board-pressure limits.
              </p>
            )}
            <dl className="secondary-modifier-grid">
              {secondaryModifiers.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </details>
    </section>
  )
}
