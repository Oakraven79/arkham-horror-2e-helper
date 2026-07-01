import ReactMarkdown from 'react-markdown'

import { BoxedSetMark, type BoxedSetDisplay } from './boxedSetMark'
import type {
  ArkhamEncounterNeighborhoodDisplay,
  ArkhamEncounterTextBlock,
} from './arkhamEncounterCardTypes'
import './arkhamEncounterCard.css'

export interface ArkhamEncounterCardFrontProps {
  boxedSet?: BoxedSetDisplay
  encounters: ArkhamEncounterTextBlock[]
  neighborhood: ArkhamEncounterNeighborhoodDisplay
}

export function ArkhamEncounterCardFront({
  boxedSet,
  encounters,
  neighborhood,
}: ArkhamEncounterCardFrontProps) {
  const contentLength = encounters.reduce(
    (total, encounter) => total + encounter.header.length + encounter.text.length,
    0,
  )
  const density = contentLength > 900 ? 'compact' : contentLength > 600 ? 'dense' : 'regular'
  const style = {
    '--arkham-encounter-colour': neighborhood.colourHex ?? '#686862',
  } as React.CSSProperties

  return (
    <div
      aria-label={`${neighborhood.name} encounter card`}
      className="arkham-encounter-card arkham-encounter-card--front"
      style={style}
    >
      {neighborhood.frontFrameUrl && (
        // Decorative frame; headings provide the card's readable structure.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className="arkham-encounter-frame"
          src={neighborhood.frontFrameUrl}
        />
      )}
      <BoxedSetMark boxedSet={boxedSet} />

      <div className={`arkham-encounter-copy arkham-encounter-copy--${density}`}>
        {encounters.map((encounter, index) => (
          <section className="arkham-encounter-entry" key={`${encounter.header}-${index}`}>
            <h2>{encounter.header}</h2>
            <div className="arkham-encounter-entry-text">
              <ReactMarkdown>{encounter.text}</ReactMarkdown>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
