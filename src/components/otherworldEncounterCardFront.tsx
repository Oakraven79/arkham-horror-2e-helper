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

export const OtherworldEncounterCardFront = ({
  boxedSet,
  textBlocks,
  colour,
}: OtherworldEncounterCardFrontProps) => {
  const cardClass = 'otherworldcardfront ' + colour
  const contentLength = textBlocks.reduce(
    (total, block) => total + block.header.length + block.desc.length,
    0,
  )
  const density = contentLength > 650 ? 'compact' : contentLength > 400 ? 'dense' : 'regular'

  return (
    <div className={cardClass}>
      <BoxedSetMark boxedSet={boxedSet} />
      <div className={`otherworldcard-center-panel otherworldcard-center-panel--${density}`}>
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
