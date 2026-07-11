import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

function setupFields(currentSelection: string, initialUseBackground = false) {
  return (
    <AncientOneSetupFields
      currentSelection={currentSelection}
      initialUseBackground={initialUseBackground}
      key={`${currentSelection}:${initialUseBackground}`}
      options={options}
    />
  )
}

describe('Ancient One setup background control', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

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

  it('SETUP-06 reflects the saved Ancient One selection after refresh', async () => {
    const { rerender } = render(setupFields('cthulhu::standard'))

    expect(screen.getByLabelText('Ancient One and sheet')).toHaveProperty(
      'value',
      'cthulhu::standard',
    )

    rerender(setupFields('azathoth::standard', true))

    await waitFor(() =>
      expect(screen.getByLabelText('Ancient One and sheet')).toHaveProperty(
        'value',
        'azathoth::standard',
      ),
    )
    expect(screen.getByRole('checkbox', { name: /Use Ancient One artwork/ })).toHaveProperty(
      'checked',
      true,
    )
  })

  it('requests setup persistence when the selected sheet changes', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    render(
      <form>
        <AncientOneSetupFields
          currentSelection="cthulhu::standard"
          initialUseBackground={false}
          options={options}
        />
      </form>,
    )

    fireEvent.change(screen.getByLabelText('Ancient One and sheet'), {
      target: { value: 'azathoth::standard' },
    })

    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })

  it('SETUP-06 persists a selected sheet through the client action without resetting the select', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)
    const persistSetup = vi.fn(() => Promise.resolve())

    render(
      <form>
        <input name="investigatorCount" readOnly value="4" />
        <AncientOneSetupFields
          currentSelection="cthulhu::standard"
          initialUseBackground={false}
          options={options}
          persistSetup={persistSetup}
        />
      </form>,
    )

    fireEvent.change(screen.getByLabelText('Ancient One and sheet'), {
      target: { value: 'azathoth::standard' },
    })

    await waitFor(() => expect(persistSetup).toHaveBeenCalledOnce())

    const formData = persistSetup.mock.calls[0][0] as FormData

    expect(formData.get('ancientOneSelection')).toBe('azathoth::standard')
    expect(formData.get('investigatorCount')).toBe('4')
    expect(screen.getByLabelText('Ancient One and sheet')).toHaveProperty(
      'value',
      'azathoth::standard',
    )
    expect(requestSubmit).not.toHaveBeenCalled()
  })

  it('requests setup persistence when the artwork preference changes', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    render(
      <form>
        <AncientOneSetupFields
          currentSelection="cthulhu::standard"
          initialUseBackground={false}
          options={options}
        />
      </form>,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: /Use Ancient One artwork/ }))

    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })
})
