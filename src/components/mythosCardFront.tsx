import ReactMarkdown from 'react-markdown'

import './card.css'

import {
  MonsterIcons,
  getMonsterIconPath,
} from './constants'

import { MythosCardType } from './constants'

export interface MythosCardLocationDisplay {
  imageAlt?: string
  imageUrl?: string
  text: string
}

export interface MythosCardLowerLeftOverride {
  imageAlt?: string
  imageUrl?: string
  text?: string
}

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
  /** Location display resolved from Payload */
  location?: MythosCardLocationDisplay
  /** Special lower-left instructions used by cards without a normal location */
  lowerLeftOverride?: MythosCardLowerLeftOverride
}

export interface MythosCardFrontEncounterLocationProps {
  location?: MythosCardLocationDisplay
}

export interface MythosCardFrontEncounterAltLocationProps {
  lowerLeftOverride?: MythosCardLowerLeftOverride
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
  location,
}: MythosCardFrontEncounterLocationProps) => {
  if (!location) {
    return null
  }

  return (
    <div>
      <div className="mythos-portal-location-text">
        <ReactMarkdown>{location.text}</ReactMarkdown>
      </div>
      {location.imageUrl && (
        <div className="mythos-portal-location">
          <img src={location.imageUrl} alt={location.imageAlt ?? location.text} />
        </div>
      )}
    </div>
  )
}

const MythosCardFrontEncounterAltLocation = ({
  lowerLeftOverride,
}: MythosCardFrontEncounterAltLocationProps) => {
  if (!lowerLeftOverride?.imageUrl && !lowerLeftOverride?.text) {
    return null
  }

  return (
    <div>
      {lowerLeftOverride.text && (
        <div className="mythos-portal-alt-location-text">
          <ReactMarkdown>{lowerLeftOverride.text}</ReactMarkdown>
        </div>
      )}
      {lowerLeftOverride.imageUrl && (
        <div className="mythos-portal-alt-location">
          <img
            src={lowerLeftOverride.imageUrl}
            alt={lowerLeftOverride.imageAlt ?? 'Mythos card instruction'}
          />
        </div>
      )}
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
  location,
  lowerLeftOverride,
}: MythosCardFrontProps) => {
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
    !location && !lowerLeftOverride?.imageUrl && !lowerLeftOverride?.text

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

      {lowerLeftOverride ? (
        <MythosCardFrontEncounterAltLocation lowerLeftOverride={lowerLeftOverride} />
      ) : (
        <MythosCardFrontEncounterLocation location={location} />
      )}
    </div>
  )
}
