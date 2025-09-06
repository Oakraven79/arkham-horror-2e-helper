import './card.css'

export interface MythosCardBackProps {}

export const MythosCardBack = ({}: MythosCardBackProps) => {
  return (
    <div className="mythoscardback">
      <div className="image">
        <img src="/images/mythosBacking.jpg" width="100%" />
      </div>
    </div>
  )
}
