'use client'

import { useRef, useState } from 'react'

import { submitContainingForm } from './setupAutoSubmit'
import { publishSetupInvestigatorCountPreview } from './setupInvestigatorCountPreview'

interface InvestigatorCountInputProps {
  initialValue: number
  sessionID?: string
}

const MIN_INVESTIGATORS = 1
const MAX_INVESTIGATORS = 8
const investigatorCounts = Array.from(
  { length: MAX_INVESTIGATORS },
  (_, index) => index + MIN_INVESTIGATORS,
)

function clampInvestigatorCount(value: number) {
  if (!Number.isFinite(value)) return MIN_INVESTIGATORS

  return Math.min(MAX_INVESTIGATORS, Math.max(MIN_INVESTIGATORS, Math.trunc(value)))
}

export function InvestigatorCountInput({ initialValue, sessionID }: InvestigatorCountInputProps) {
  const [value, setValue] = useState(clampInvestigatorCount(initialValue))
  const inputRef = useRef<HTMLInputElement>(null)
  const selectCount = (nextValue: number) => {
    const next = clampInvestigatorCount(nextValue)
    setValue(next)

    if (inputRef.current) {
      inputRef.current.value = String(next)
    }

    if (sessionID) {
      publishSetupInvestigatorCountPreview({
        investigatorCount: next,
        sessionID,
      })
    }

    submitContainingForm(inputRef.current)
  }

  return (
    <div className="investigator-count-input">
      <input name="investigatorCount" readOnly ref={inputRef} type="hidden" value={value} />
      <div
        aria-label="Number of investigators"
        className="investigator-count-track"
        role="radiogroup"
      >
        {investigatorCounts.map((count) => {
          const isSelected = count === value
          const isFilled = count <= value

          return (
            <button
              aria-checked={isSelected}
              aria-label={`${count} investigator${count === 1 ? '' : 's'}`}
              className={`investigator-count-token${isFilled ? ' is-filled' : ''}`}
              key={count}
              onClick={() => selectCount(count)}
              role="radio"
              type="button"
            >
              <span className="investigator-count-icon" aria-hidden="true" />
              <span className="investigator-count-number">{count}</span>
            </button>
          )
        })}
      </div>
      <p aria-live="polite" className="investigator-count-summary">
        <strong>{value}</strong> investigator{value === 1 ? '' : 's'}
      </p>
    </div>
  )
}
