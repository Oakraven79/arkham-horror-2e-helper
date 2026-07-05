import type { GamePhase } from '@/lib/gamePhaseState'
import {
  ELDER_SIGN_VICTORY_THRESHOLD,
  elderSignVictoryStatus,
  terrorLevelStatus,
} from '@/lib/gameStatusRules'
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
    ['New gate monsters', investigatorRules.newGateMonsterCount],
    ['Minimum surge', investigatorRules.monsterSurgeMinimum],
  ]
  const terrorStatus = terrorLevelStatus(tracks.terror)
  const elderSignStatus = elderSignVictoryStatus(tracks.elderSigns)
  const monsterLimitRemoved = tracks.terror >= 10
  const secondaryModifiers = [
    {
      help: 'Only after Terror reaches 10: awakening occurs when Arkham + Sky monsters reach twice the normal monster limit. Do not count expansion-board monsters.',
      label: 'At Terror 10',
      value: `${investigatorRules.terrorTenAwakeningMonsterCount} monsters`,
    },
    {
      help: 'When the last open gate closes, investigators win if they collectively hold this many unspent gate trophies. Use actual investigators, not the adjusted board-pressure count.',
      label: 'Close-gates victory',
      value: `${investigatorRules.closeGateTrophiesRequired} gate trophies`,
    },
    {
      help: `Final battle only: investigators attack the Ancient One with Combat checks. Each 5 or 6 is 1 success. Successes carry across investigators and rounds; remove 1 doom each time total successes reaches the original investigator count (${investigatorRules.finalBattleSuccessesPerDoom} in this game).`,
      label: 'Final battle progress',
      value: `${investigatorRules.finalBattleSuccessesPerDoom} successes per doom`,
    },
    ...(hasRelationships
      ? [
          {
            label: 'Relationship setup',
            value: `${investigatorRules.relationshipCardCount} cards`,
          },
        ]
      : []),
  ]

  return (
    <section className="game-rules-context" aria-label="Game rules and modifiers">
      <div className="active-rules-summary">
        <section className="active-rule ancient-effect-summary">
          <p className="eyebrow">Ancient One effect</p>
          {activeSheet ? (
            <>
              <h2>{activeSheet.powerName}</h2>
              <p>{activeSheet.power}</p>
              <p className="worshipper-summary">
                <strong>Worshippers:</strong> {activeSheet.worshippers}
              </p>
            </>
          ) : (
            <p className="rules-context-empty">
              Choose an Ancient One during Setup to display its effect.
            </p>
          )}
        </section>

        <section className="active-rule terror-effect-summary">
          <div className="active-rule-heading">
            <p className="eyebrow">Terror effects</p>
            <strong>{terrorStatus.level}/10</strong>
          </div>
          <p className="terror-standing-rule">
            Terror does not normally decrease. Each increase returns one random Ally to the box.
          </p>
          {terrorStatus.activeEffects.length > 0 ? (
            <ul>
              {terrorStatus.activeEffects.map((effect) => (
                <li key={effect}>{effect}</li>
              ))}
            </ul>
          ) : (
            <p className="inactive-rule">No Terror milestone effects are active.</p>
          )}
          {terrorStatus.nextMilestone && (
            <p className="next-terror-milestone">
              <strong>Next at {terrorStatus.nextMilestone.level}:</strong>{' '}
              {terrorStatus.nextMilestone.effect}
            </p>
          )}
        </section>

        <section className="active-rule capacity-effect-summary">
          <p className="eyebrow">Board pressure</p>
          <dl>
            <div>
              <dt>Arkham + Sky</dt>
              <dd>
                <strong>
                  {tracks.monstersInArkham}/
                  {monsterLimitRemoved ? 'no cap' : investigatorRules.monsterLimit}
                </strong>
                <span>
                  {monsterLimitRemoved
                    ? `The Ancient One awakens at ${investigatorRules.terrorTenAwakeningMonsterCount} monsters.`
                    : tracks.monstersInArkham >= investigatorRules.monsterLimit
                      ? 'Full. The next monster flows to the Outskirts.'
                      : 'Additional monsters go to the Outskirts.'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Outskirts</dt>
              <dd>
                <strong>
                  {tracks.monstersInOutskirts}/{investigatorRules.outskirtsCapacity}
                </strong>
                <span>
                  {tracks.monstersInOutskirts >= investigatorRules.outskirtsCapacity
                    ? 'Full. The next monster clears the Outskirts and raises Terror.'
                    : 'Exceeding capacity clears the Outskirts and raises Terror.'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Open gates</dt>
              <dd>
                <strong>
                  {tracks.gatesOpen}/{investigatorRules.gateAwakeningThreshold}
                </strong>
                <span>Reaching the threshold awakens the Ancient One.</span>
              </dd>
            </div>
            <div className={elderSignStatus.won ? 'is-victory' : undefined}>
              <dt>Elder signs</dt>
              <dd>
                <strong>
                  {elderSignStatus.current}/{ELDER_SIGN_VICTORY_THRESHOLD}
                </strong>
                <span>
                  {elderSignStatus.won
                    ? 'Six Elder Signs are on the board. The investigators win.'
                    : `${elderSignStatus.remaining} more on the board wins the game.`}
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="rules-reference-strip">
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
          {(relevantNotes.length > 0 || (phase === 'Final Battle' && activeSheet)) && (
            <section className="ancient-one-reference">
              <p className="eyebrow">Ancient One details</p>
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

              {phase === 'Final Battle' && activeSheet && (
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
            </section>
          )}

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
              {secondaryModifiers.map((modifier) => (
                <div key={modifier.label}>
                  <dt>{modifier.label}</dt>
                  <dd>
                    <strong>{modifier.value}</strong>
                    {'help' in modifier && modifier.help && <span>{modifier.help}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </details>
    </section>
  )
}
