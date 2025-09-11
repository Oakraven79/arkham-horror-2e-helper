import ReactMarkdown from 'react-markdown'

import './card.css'

import {
  MonsterIcons,
  getMonsterIconPath,
  EncounterLocation,
  encounterLocationMap,
} from './constants'

export interface MythosCardFrontProps {
  /** Card title */
  title: string
  /** What type of card is this? */
  cardType?:
    | 'HeadLine'
    | 'Environment'
    | 'Environment (Mystic)'
    | 'Environment (Urban)'
    | 'Environment (Weather)'
    | 'Rumor'
  /** Mythos description */
  cardDescription: string
  /** Monster movement for white and black */
  monsterMoveWhite?: MonsterIcons[]
  monsterMoveBlack?: MonsterIcons[]
  /** Portal Location */
  portalLocation?: EncounterLocation
}

function getDescSizeClass(description: string) {
  const len = description.length

  if (len > 500) return 'mythoscarddesc-really-small'
  if (len > 250) return 'mythoscarddesc-small'
  return 'mythoscarddesc'
}

export const MythosCardFront = ({
  title,
  cardType,
  cardDescription,
  monsterMoveWhite,
  monsterMoveBlack,
  portalLocation,
}: MythosCardFrontProps) => {
  const encounterObj = portalLocation ? encounterLocationMap[portalLocation] : null

  const descSizeClass = getDescSizeClass(cardDescription)

  const titleSizeClass = title.length > 22 ? 'mythoscardtitle-long' : 'mythoscardtitle'

  const cardTypeSizeClass = title.length > 22 ? 'mythoscardtype-small' : 'mythoscardtype'

  return (
    <div className="mythoscardfront">
      <div className="mythoscardheaderbox">
        <div className={titleSizeClass}>{title}</div>
        <div className={cardTypeSizeClass}>{cardType}</div>
      </div>
      <div className={descSizeClass}>
        <ReactMarkdown>{cardDescription}</ReactMarkdown>
      </div>

      <div className="mythos-monster-corner-box">
        <div className="monster-top">
          {monsterMoveWhite.map((icon) => (
            <img key={icon} src={getMonsterIconPath(icon)} alt={icon} />
          ))}
        </div>
        <div className="monster-bottom">
          {monsterMoveBlack.map((icon) => (
            <img key={icon} src={getMonsterIconPath(icon)} alt={icon} />
          ))}
        </div>
      </div>

      <div className="mythos-portal-location">
        <img src={encounterObj.file} />
      </div>
      <div className="mythos-portal-location-text">
        <ReactMarkdown>{encounterObj.display}</ReactMarkdown>
      </div>
    </div>
  )
}
