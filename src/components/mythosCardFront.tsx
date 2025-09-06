import './card.css'

import { MonsterIcons, getMonsterIconPath } from './constants'

export interface MythosCardFrontProps {
  /** Card title */
  title: string
  /** What type of card is this? */
  cardType?: 'HeadLine' | 'Environment' | 'Environment (Mystic)' | 'Rumor'
  /** Monster movement for white and black */
  monsterMoveWhite: MonsterIcons[]
  monsterMoveBlack: MonsterIcons[]
}

export const MythosCardFront = ({
  title,
  cardType,
  monsterMoveWhite,
  monsterMoveBlack,
}: MythosCardFrontProps) => {
  return (
    <div className="mythoscardfront">
      <div className="mythodcardheaderbox">
        <div className="mythodcardtitle">{title}</div>
        <div className="mythodcardtype">{cardType}</div>
      </div>
      <div className="mythodcarddesc">
        Investigators cannot move into or out of the Merchant District street until the end of the
        next turn. Leave this card in play until then to indicate this.<h3>Close:</h3> Merchant
        District Streets <h3>Clue Appears at:</h3>Black Cave
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
        <img src="/images/old-house.jpg" />
      </div>
      <div className="mythos-portal-location-text">
        The Witch
        <br />
        House
      </div>
    </div>
  )
}
