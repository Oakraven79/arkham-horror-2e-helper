import ReactMarkdown from 'react-markdown'

import './card.css'

import { BoxedSetMark, type BoxedSetDisplay } from './boxedSetMark'
import { MonsterIcons, getMonsterIconPath } from './constants'

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

export interface MythosCardGateInstructionDisplay {
  burst?: boolean
  doomTokens?: number
  locations: MythosCardLocationDisplay[]
  mode: 'none' | 'single' | 'choice' | 'all' | 'surge'
  reshuffleDeck?: boolean
  specialInstruction?: string
  terrorIncrease?: number
}

export interface MythosCardFrontProps {
  /** Card title */
  title: string
  /** What type of card is this? */
  cardType?: MythosCardType
  /** Mythos description */
  cardDescription: string
  /** Boxed-set icon or abbreviation */
  boxedSet?: BoxedSetDisplay
  /** Monster movement for white and black */
  monsterMoveWhite?: MonsterIcons[]
  monsterMoveBlack?: MonsterIcons[]
  /** Structured gate and special resolution rendered in the lower-left corner */
  gateInstruction?: MythosCardGateInstructionDisplay
  /** Special lower-left instructions used by cards without a normal location */
  lowerLeftOverride?: MythosCardLowerLeftOverride
}

export interface MythosCardFrontEncounterLocationProps {
  location?: MythosCardLocationDisplay
}

export interface MythosCardFrontEncounterAltLocationProps {
  lowerLeftOverride?: MythosCardLowerLeftOverride
}

export interface MythosCardFrontGateInstructionProps {
  gateInstruction?: MythosCardGateInstructionDisplay
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

const MythosCardFrontEncounterLocation = ({ location }: MythosCardFrontEncounterLocationProps) => {
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

const MythosCardFrontGateInstruction = ({
  gateInstruction,
}: MythosCardFrontGateInstructionProps) => {
  if (!gateInstruction) return null

  const { burst, doomTokens, locations, mode, reshuffleDeck, specialInstruction, terrorIncrease } =
    gateInstruction
  const specialLines = [
    doomTokens ? `Add ${doomTokens} doom tokens` : null,
    terrorIncrease ? `Increase terror by ${terrorIncrease}` : null,
    mode === 'surge' ? 'Monster surge' : null,
    reshuffleDeck ? 'Reshuffle and draw again' : null,
    specialInstruction,
  ].filter((line): line is string => Boolean(line))

  if (specialLines.length > 0) {
    return (
      <div className="mythos-special-instruction">
        {doomTokens && <img src="/images/misc/doomCounters.png" alt="" aria-hidden="true" />}
        <div>{specialLines.join('. ')}</div>
      </div>
    )
  }

  if (mode === 'single' && locations[0]) {
    return (
      <div>
        <MythosCardFrontEncounterLocation location={locations[0]} />
        {burst && <span className="mythos-gate-burst-seal">Burst</span>}
      </div>
    )
  }

  if ((mode === 'choice' || mode === 'all') && locations.length > 0) {
    return (
      <div className="mythos-multiple-gates">
        <div className="mythos-gate-destinations">
          {locations.map((location, index) => (
            <div className="mythos-gate-destination" key={`${location.text}-${index}`}>
              {location.imageUrl && (
                <img src={location.imageUrl} alt={location.imageAlt ?? location.text} />
              )}
              <ReactMarkdown>{location.text}</ReactMarkdown>
            </div>
          ))}
        </div>
        <span className="mythos-gate-joiner">{mode === 'choice' ? 'OR' : 'AND'}</span>
        {burst && <span className="mythos-gate-burst-seal compact">Burst</span>}
      </div>
    )
  }

  return null
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
  boxedSet,
  monsterMoveWhite,
  monsterMoveBlack,
  gateInstruction,
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
    !gateInstruction && !lowerLeftOverride?.imageUrl && !lowerLeftOverride?.text
  const boxedSetMarkClassName = centeredMonsterMovementBox
    ? 'mythos-boxed-set-mark centered'
    : 'mythos-boxed-set-mark'

  return (
    <div className="mythoscardfront">
      <BoxedSetMark boxedSet={boxedSet} className={boxedSetMarkClassName} />
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
      ) : gateInstruction ? (
        <MythosCardFrontGateInstruction gateInstruction={gateInstruction} />
      ) : null}
    </div>
  )
}
