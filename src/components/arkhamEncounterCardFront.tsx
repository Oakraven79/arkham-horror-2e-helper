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

function clamp(min: number, value: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const CARD_ROOT_FONT_SIZE = 16

function cardPx(value: number) {
  return `${(value * CARD_ROOT_FONT_SIZE).toFixed(3)}px`
}

function encounterBreakWeight(text: string) {
  const paragraphBreaks = text.match(/\n\s*\n/g)?.length ?? 0
  const lineBreaks = text.match(/\n/g)?.length ?? 0
  const listRows = text.match(/(?:^|\n)\s*\d[+:.-]/g)?.length ?? 0

  return paragraphBreaks * 58 + lineBreaks * 18 + listRows * 28
}

function encounterCopyStyle(encounters: ArkhamEncounterTextBlock[]) {
  const totalLength = encounters.reduce(
    (total, encounter) => total + encounter.header.length + encounter.text.length,
    0,
  )
  const longestEncounter = Math.max(0, ...encounters.map((encounter) => encounter.text.length))
  const breakWeight = encounters.reduce(
    (total, encounter) => total + encounterBreakWeight(encounter.text),
    0,
  )
  const contentScore = totalLength + longestEncounter * 0.35 + breakWeight
  const bodySize = clamp(0.76, 1 - contentScore * 0.0002, 0.92)
  const headingSize = clamp(1.12, 1.56 - contentScore * 0.00018, 1.5)
  const gap = clamp(0.08, 0.36 - contentScore * 0.00022, 0.24)
  const blockPadding = clamp(0.24, 0.5 - contentScore * 0.00018, 0.4)
  const inlinePadding = clamp(0.68, 0.92 - contentScore * 0.00016, 0.86)

  return {
    '--encounter-copy-gap': cardPx(gap),
    '--encounter-copy-padding-block': cardPx(blockPadding),
    '--encounter-copy-padding-inline': cardPx(inlinePadding),
    '--encounter-copy-size': cardPx(bodySize),
    '--encounter-heading-size': cardPx(headingSize),
  } as React.CSSProperties
}

export function ArkhamEncounterCardFront({
  boxedSet,
  encounters,
  neighborhood,
}: ArkhamEncounterCardFrontProps) {
  const style = {
    '--arkham-encounter-colour': neighborhood.colourHex ?? '#686862',
  } as React.CSSProperties
  const copyStyle = encounterCopyStyle(encounters)
  const arkhamEncounterBoxedSetMark = boxedSet?.iconUrl ? boxedSet : undefined

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
      <BoxedSetMark boxedSet={arkhamEncounterBoxedSetMark} />

      <div className="arkham-encounter-copy" style={copyStyle}>
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
