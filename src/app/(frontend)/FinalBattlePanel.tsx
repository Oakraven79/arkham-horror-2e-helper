import Image from 'next/image'

import { ancientOneSheetBackground } from '@/lib/ancientOneBackground'
import type { InvestigatorRules } from '@/lib/investigatorRules'
import type { AncientOne, GameSession } from '@/payload-types'

import { FinalBattleCounters } from './FinalBattleCounters'

type AncientOneSheet = AncientOne['sheets'][number]

interface FinalBattlePanelProps {
  activeAncientOne: AncientOne
  activeSheet: AncientOneSheet
  investigatorRules: InvestigatorRules
  sessionID: string
  tracks: GameSession['tracks']
}

export function FinalBattlePanel({
  activeAncientOne,
  activeSheet,
  investigatorRules,
  sessionID,
  tracks,
}: FinalBattlePanelProps) {
  const artwork = ancientOneSheetBackground(activeSheet)

  return (
    <section className="final-battle-panel" aria-label="Final battle Ancient One">
      <div className="final-battle-art">
        {artwork ? (
          <Image
            alt={artwork.alt}
            height={960}
            sizes="(max-width: 760px) 100vw, 360px"
            src={artwork.url}
            unoptimized
            width={720}
          />
        ) : (
          <div className="final-battle-art-placeholder">
            <span>{activeAncientOne.name}</span>
          </div>
        )}
      </div>
      <div className="final-battle-details">
        <p className="eyebrow">Final Battle</p>
        <h2>{activeAncientOne.name} awakens</h2>
        <p className="final-battle-sheet">{activeSheet.label}</p>
        <FinalBattleCounters sessionID={sessionID} tracks={tracks} />
        <dl className="final-battle-stats">
          <div>
            <dt>Combat</dt>
            <dd>{activeSheet.combatRating.display}</dd>
          </div>
          <div>
            <dt>Defenses</dt>
            <dd>{activeSheet.defenseText}</dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>{investigatorRules.finalBattleSuccessesPerDoom} successes per doom</dd>
          </div>
        </dl>
        {activeSheet.startOfBattle && (
          <section className="final-battle-rule">
            <h3>Start of Battle</h3>
            <p>{activeSheet.startOfBattle}</p>
          </section>
        )}
        <section className="final-battle-rule">
          <h3>Ancient One Attack</h3>
          <p>{activeSheet.attack}</p>
        </section>
        <section className="final-battle-rule">
          <h3>Worshippers</h3>
          <p>{activeSheet.worshippers}</p>
        </section>
      </div>
    </section>
  )
}
