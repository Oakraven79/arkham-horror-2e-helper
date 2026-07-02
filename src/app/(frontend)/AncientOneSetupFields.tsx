'use client'

import { useMemo, useState } from 'react'

import { cssBackgroundImageValue } from '@/lib/ancientOneBackground'

export interface AncientOneSetupOption {
  imageAlt?: string
  imageUrl?: string
  label: string
  value: string
}

interface AncientOneSetupFieldsProps {
  currentSelection: string
  initialUseBackground: boolean
  options: AncientOneSetupOption[]
}

export function AncientOneSetupFields({
  currentSelection,
  initialUseBackground,
  options,
}: AncientOneSetupFieldsProps) {
  const [selection, setSelection] = useState(currentSelection)
  const [useBackground, setUseBackground] = useState(initialUseBackground)
  const selectedOption = useMemo(
    () => options.find((option) => option.value === selection) ?? null,
    [options, selection],
  )

  return (
    <>
      <div className="setup-form-field ancient-one-field">
        <label htmlFor="ancient-one-selection">Ancient One and sheet</label>
        <select
          id="ancient-one-selection"
          name="ancientOneSelection"
          onChange={(event) => setSelection(event.target.value)}
          required
          value={selection}
        >
          <option disabled value="">
            Select an Ancient One
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="setup-form-field ancient-one-background-field">
        <span className="setup-control-label">Table background</span>
        <label className="ancient-one-background-toggle">
          <input
            checked={useBackground}
            name="useAncientOneBackground"
            onChange={(event) => setUseBackground(event.target.checked)}
            type="checkbox"
          />
          <span
            aria-hidden="true"
            className={`ancient-one-background-preview${
              selectedOption?.imageUrl ? ' has-image' : ''
            }`}
            style={
              selectedOption?.imageUrl
                ? { backgroundImage: cssBackgroundImageValue(selectedOption.imageUrl) }
                : undefined
            }
          />
          <span>
            <strong>Use Ancient One artwork</strong>
            <small>
              {selectedOption?.imageUrl
                ? selectedOption.imageAlt || 'Artwork available for this sheet.'
                : 'No artwork available; the default background will be used.'}
            </small>
          </span>
        </label>
      </div>
    </>
  )
}
