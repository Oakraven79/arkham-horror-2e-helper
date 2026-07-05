import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AutoSubmitCheckbox } from '@/app/(frontend)/AutoSubmitCheckbox'

describe('auto-submit checkbox', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests form submission when changed', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    render(
      <form>
        <label>
          <AutoSubmitCheckbox name="enabledSet" value="dunwich" />
          Dunwich Horror
        </label>
      </form>,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Dunwich Horror' }))

    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })
})
