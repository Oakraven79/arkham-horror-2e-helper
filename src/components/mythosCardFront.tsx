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
  cardType?: 'HeadLine' | 'Environment' | 'Environment (Mystic)' | 'Rumor'
  /** Mythos description */
  cardDescription: string
  /** Monster movement for white and black */
  monsterMoveWhite: MonsterIcons[]
  monsterMoveBlack: MonsterIcons[]
  /** Portal Location */
  portalLocation: EncounterLocation
}

export const MythosCardFront = ({
  title,
  cardType,
  cardDescription,
  monsterMoveWhite,
  monsterMoveBlack,
  portalLocation,
}: MythosCardFrontProps) => {
  const encounterObj = encounterLocationMap[portalLocation]

  return (
    <div className="mythoscardfront">
      <div className="mythodcardheaderbox">
        <div className="mythodcardtitle">{title}</div>
        <div className="mythodcardtype">{cardType}</div>
      </div>
      <div className="mythodcarddesc">
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
