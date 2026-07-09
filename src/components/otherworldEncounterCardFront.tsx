import ReactMarkdown from 'react-markdown'

import './card.css'

import { BoxedSetMark, type BoxedSetDisplay } from './boxedSetMark'

export type CardColor = 'red' | 'blue' | 'green' | 'yellow'

export interface TextBlocks {
  header: string
  desc: string
}

export interface OtherworldEncounterCardFrontProps {
  boxedSet?: BoxedSetDisplay
  /** Card text blocks (header + desc) */
  textBlocks: TextBlocks[]
  colour: CardColor
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

  return paragraphBreaks * 62 + lineBreaks * 20 + listRows * 30
}

function encounterCopyStyle(textBlocks: TextBlocks[]) {
  const totalLength = textBlocks.reduce(
    (total, block) => total + block.header.length + block.desc.length,
    0,
  )
  const longestEncounter = Math.max(0, ...textBlocks.map((block) => block.desc.length))
  const breakWeight = textBlocks.reduce(
    (total, block) => total + encounterBreakWeight(block.desc),
    0,
  )
  const contentScore = totalLength + longestEncounter * 0.38 + breakWeight
  const bodySize = clamp(0.84, 1.16 - contentScore * 0.0003, 1.08)
  const headingSize = clamp(1.08, bodySize * 1.16 + 0.08, 1.3)
  const gap = clamp(0.1, 0.42 - contentScore * 0.00035, 0.28)
  const blockPadding = clamp(0.48, 0.82 - contentScore * 0.00028, 0.72)

  return {
    '--encounter-body-size': cardPx(bodySize),
    '--encounter-gap': cardPx(gap),
    '--encounter-heading-size': cardPx(headingSize),
    '--encounter-panel-padding-block': cardPx(blockPadding),
  } as React.CSSProperties
}

export const OtherworldEncounterCardFront = ({
  boxedSet,
  textBlocks,
  colour,
}: OtherworldEncounterCardFrontProps) => {
  const cardClass = 'otherworldcardfront ' + colour
  const copyStyle = encounterCopyStyle(textBlocks)
  const otherWorldBoxedSetMark = boxedSet?.iconUrl ? boxedSet : undefined

  return (
    <div className={cardClass}>
      <BoxedSetMark boxedSet={otherWorldBoxedSetMark} />
      <div className="otherworldcard-center-panel" style={copyStyle}>
        {textBlocks.map((block, index) => (
          <section className="otherworldcard-encounter" key={`${block.header}-${index}`}>
            <h2>{block.header}</h2>
            <div className="otherworldcard-encounter-text">
              <ReactMarkdown>{block.desc}</ReactMarkdown>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
