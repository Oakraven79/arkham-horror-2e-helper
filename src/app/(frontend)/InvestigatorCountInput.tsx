'use client'

import { useState } from 'react'

interface InvestigatorCountInputProps {
  initialValue: number
}

export function InvestigatorCountInput({ initialValue }: InvestigatorCountInputProps) {
  const [value, setValue] = useState(initialValue)

  return (
    <div className="investigator-count-input">
      <button
        aria-label="Remove one investigator"
        disabled={value <= 1}
        onClick={() => setValue((current) => Math.max(1, current - 1))}
        type="button"
      >
        -
      </button>
      <input
        aria-label="Number of investigators"
        max={8}
        min={1}
        name="investigatorCount"
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isInteger(next)) setValue(Math.min(8, Math.max(1, next)))
        }}
        type="number"
        value={value}
      />
      <button
        aria-label="Add one investigator"
        disabled={value >= 8}
        onClick={() => setValue((current) => Math.min(8, current + 1))}
        type="button"
      >
        +
      </button>
    </div>
  )
}
