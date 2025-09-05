import './card.css'

import Image from 'next/image'

export interface MythosCardBackProps {}

export const MythosCardBack = ({}: MythosCardBackProps) => {
  return (
    <div className="card">
      <div className="image">
        <img src="/images/mythosBacking.jpg" width="100%" />
      </div>
    </div>
  )
}
