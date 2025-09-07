import './card.css'

export interface OtherworldEncounterCardBackProps {}

export const OtherworldEncounterCardBack = ({}: OtherworldEncounterCardBackProps) => {
  return (
    <div className="otherworldcardback">
      <div className="image">
        <img src="/images/otherworldEncounterBack.jpg" />
      </div>
    </div>
  )
}
