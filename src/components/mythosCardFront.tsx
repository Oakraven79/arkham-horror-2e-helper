import './card.css'

export interface MythosCardFrontProps {}

export const MythosCardFront = ({}: MythosCardFrontProps) => {
  return (
    <div className="mythoscardfront">
      <div className="mythodcardheaderbox">
        <div className="mythodcardtitle">Fourth Of July Parade!</div>
        <div className="mythodcardtype">Headline</div>
      </div>
      <div className="mythodcarddesc">
        Investigators cannot move into or out of the Merchant District street until the end of the
        next turn. Leave this card in play until then to indicate this.<h3>Close:</h3> Merchant
        District Streets <h3>Clue Appears at:</h3>Black Cave
      </div>

      <div className="mythos-monster-corner-box">
        <div className="monster-top">
          <img src="/images/crescent-moon-icon.png" />
        </div>
        <div className="monster-bottom">
          <img src="/images/cross-icon.png" />
        </div>
      </div>

      <div className="mythos-portal-location">
        <img src="/images/old-house.jpg" alt="icon" />
      </div>
      <div className="mythos-portal-location-text">
        The Witch
        <br />
        House
      </div>
    </div>
  )
}
