import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  AncientOneSetupFields,
  type AncientOneSetupOption,
} from '@/app/(frontend)/AncientOneSetupFields'

const options: AncientOneSetupOption[] = [
  {
    value: 'cthulhu::standard',
    label: 'Cthulhu - Standard (13 doom)',
    imageUrl: '/api/media/file/cthulhu.jpg',
    imageAlt: 'Cthulhu artwork',
  },
  {
    value: 'azathoth::standard',
    label: 'Azathoth - Standard (14 doom)',
  },
]

describe('Ancient One setup background control', () => {
  it('shows available artwork and preserves the saved preference', () => {
    render(
      <AncientOneSetupFields
        currentSelection="cthulhu::standard"
        initialUseBackground
        options={options}
      />,
    )

    const backgroundCheckbox = screen.getByRole('checkbox', {
      name: /Use Ancient One artwork/,
    }) as HTMLInputElement

    expect(backgroundCheckbox.checked).toBe(true)
    expect(screen.getByText('Cthulhu artwork')).toBeDefined()
  })

  it('updates the availability message when the selected sheet changes', () => {
    render(
      <AncientOneSetupFields
        currentSelection="cthulhu::standard"
        initialUseBackground={false}
        options={options}
      />,
    )

    fireEvent.change(screen.getByLabelText('Ancient One and sheet'), {
      target: { value: 'azathoth::standard' },
    })

    expect(
      screen.getByText('No artwork available; the default background will be used.'),
    ).toBeDefined()
  })
})
