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

  return (
    <div className={cardClass}>
      <BoxedSetMark boxedSet={boxedSet} />
      <div className="otherworldcard-center-panel">
        {textBlocks.map((block, index) => (
          <div key={`${block.header}-${index}`}>
            <h2>{block.header}</h2>
            <p>
              <ReactMarkdown>{block.desc}</ReactMarkdown>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
