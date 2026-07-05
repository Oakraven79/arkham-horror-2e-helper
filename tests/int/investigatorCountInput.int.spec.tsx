import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvestigatorCountInput } from '@/app/(frontend)/InvestigatorCountInput'

describe('Investigator count setup control', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests setup persistence when the investigator count changes', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    render(
      <form>
        <InvestigatorCountInput initialValue={4} />
      </form>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add one investigator' }))

    const input = screen.getByRole('spinbutton', {
      name: 'Number of investigators',
    }) as HTMLInputElement

    expect(input.value).toBe('5')
    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })
})
