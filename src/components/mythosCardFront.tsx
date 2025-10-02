import ReactMarkdown from 'react-markdown'

import './card.css'

import {
  MonsterIcons,
  getMonsterIconPath,
  EncounterLocation,
  encounterLocationMap,
} from './constants'

import { MythosCardType } from './constants'

export interface MythosCardFrontProps {
  /** Card title */
  title: string
  /** What type of card is this? */
  cardType?: MythosCardType
  /** Mythos description */
  cardDescription: string
  /** Monster movement for white and black */
  monsterMoveWhite?: MonsterIcons[]
  monsterMoveBlack?: MonsterIcons[]
  /** Portal Location */
  portalLocation?: EncounterLocation
  /** Portal Alt Text and IMG */
  portalLocationAltImg?: string
  portalLocationAltText?: string
}

export interface MythosCardFrontEncounterLocationProps {
  /** Portal Location */
  portalLocation?: EncounterLocation
}

export interface MythosCardFrontEncounterAltLocationProps {
  /** Portal Location */
  portalLocationAltImg?: string
  portalLocationAltText?: string
}

export interface MythosCardFrontMonsterMovementProps {
  /** Monster movement for white and black */
  monsterMoveWhite?: MonsterIcons[]
  monsterMoveBlack?: MonsterIcons[]
  centered?: boolean
}

function getDescSizeClass(description: string) {
  const len = description?.length ?? 1

  if (len > 500) return 'mythoscarddesc-really-small'
  if (len > 250) return 'mythoscarddesc-small'
  return 'mythoscarddesc'
}

const MythosCardFrontEncounterLocation = ({
  portalLocation,
}: MythosCardFrontEncounterLocationProps) => {
  const encounterObj = portalLocation ? encounterLocationMap[portalLocation] : null

  if (encounterObj === null || encounterObj?.file === 'null') {
    return
  }

  return (
    <div>
      <div className="mythos-portal-location-text">
        <ReactMarkdown>{encounterObj.display}</ReactMarkdown>
      </div>
      <div className="mythos-portal-location">
        <img src={encounterObj.file} />
      </div>
    </div>
  )
}

const MythosCardFrontEncounterAltLocation = ({
  portalLocationAltImg,
  portalLocationAltText,
}: MythosCardFrontEncounterAltLocationProps) => {
  if (!portalLocationAltImg && !portalLocationAltText) {
    return
  }

  return (
    <div>
      <div className="mythos-portal-alt-location-text">
        <ReactMarkdown>{portalLocationAltText}</ReactMarkdown>
      </div>
      <div className="mythos-portal-alt-location">
        <img src={portalLocationAltImg} />
      </div>
    </div>
  )
}

const MythosCardFrontMonsterMovement = ({
  monsterMoveBlack,
  monsterMoveWhite,
  centered,
}: MythosCardFrontMonsterMovementProps) => {
  if (!monsterMoveBlack?.length && !monsterMoveWhite?.length) {
    return
  }

  const monsterBoxClassName = centered
    ? 'mythos-monster-corner-box centered'
    : 'mythos-monster-corner-box'

  return (
    <div className={monsterBoxClassName}>
      <div className="monster-top">
        {(monsterMoveWhite ?? []).map((icon) => (
          <img key={icon} src={getMonsterIconPath(icon)} alt={icon} />
        ))}
      </div>
      <div className="monster-bottom">
        {(monsterMoveBlack ?? []).map((icon) => (
          <img key={icon} src={getMonsterIconPath(icon)} alt={icon} />
        ))}
      </div>
    </div>
  )
}

export const MythosCardFront = ({
  title,
  cardType,
  cardDescription,
  monsterMoveWhite,
  monsterMoveBlack,
  portalLocation,
  portalLocationAltImg,
  portalLocationAltText,
}: MythosCardFrontProps) => {
  const encounterObj = portalLocation ? encounterLocationMap[portalLocation] : null

  const descSizeClass = getDescSizeClass(cardDescription)

  const titleSizeClass = (title?.length ?? 1) > 22 ? 'mythoscardtitle-long' : 'mythoscardtitle'

  const cardTypeSizeClass = (title?.length ?? 1) > 22 ? 'mythoscardtype-small' : 'mythoscardtype'

  const monsterMoveBlackList: MonsterIcons[] = monsterMoveBlack
    ? Array.isArray(monsterMoveBlack)
      ? monsterMoveBlack
      : [monsterMoveBlack]
    : []
  const monsterMoveWhiteList: MonsterIcons[] = monsterMoveWhite
    ? Array.isArray(monsterMoveWhite)
      ? monsterMoveWhite
      : [monsterMoveWhite]
    : []

  const centeredMonsterMovementBox =
    !portalLocation && !portalLocationAltImg && !portalLocationAltText

  return (
    <div className="mythoscardfront">
      <div className="mythoscardheaderbox">
        <div className={titleSizeClass}>{title}</div>
        <div className={cardTypeSizeClass}>{cardType}</div>
      </div>
      <div className={descSizeClass}>
        <ReactMarkdown>{cardDescription}</ReactMarkdown>
      </div>

      <MythosCardFrontMonsterMovement
        monsterMoveBlack={monsterMoveBlackList}
        monsterMoveWhite={monsterMoveWhiteList}
        centered={centeredMonsterMovementBox}
      />

      <MythosCardFrontEncounterAltLocation
        portalLocationAltImg={portalLocationAltImg}
        portalLocationAltText={portalLocationAltText}
      />

      <MythosCardFrontEncounterLocation portalLocation={portalLocation} />
    </div>
  )
}
