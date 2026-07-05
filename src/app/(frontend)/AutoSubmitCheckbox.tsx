'use client'

import type { InputHTMLAttributes } from 'react'

import { submitContainingForm } from './setupAutoSubmit'

type AutoSubmitCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'>

export function AutoSubmitCheckbox(props: AutoSubmitCheckboxProps) {
  return (
    <input
      {...props}
      onChange={(event) => submitContainingForm(event.currentTarget)}
      type="checkbox"
    />
  )
}
