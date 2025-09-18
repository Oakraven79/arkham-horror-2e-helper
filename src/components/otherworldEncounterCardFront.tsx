import ReactMarkdown from 'react-markdown'

import './card.css'

export type CardColor = 'red' | 'blue' | 'green' | 'yellow'

export interface TextBlocks {
  header: string
  desc: string
}

export interface OtherworldEncounterCardFrontProps {
  /** Card text blocks (header + desc) */
  textBlocks: TextBlocks[]
  colour: CardColor
}

export const OtherworldEncounterCardFront = ({
  textBlocks,
  colour,
}: OtherworldEncounterCardFrontProps) => {
  const cardClass = 'otherworldcardfront ' + colour

  return (
    <div className={cardClass}>
      <div className="otherworldcard-center-panel">
        {textBlocks.map((block, index) => (
          <div>
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
