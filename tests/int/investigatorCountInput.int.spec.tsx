import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvestigatorCountInput } from '@/app/(frontend)/InvestigatorCountInput'
import {
  SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT,
  type SetupInvestigatorCountPreview,
} from '@/app/(frontend)/setupInvestigatorCountPreview'

function investigatorCountInput(initialValue: number) {
  return <InvestigatorCountInput initialValue={initialValue} key={initialValue} />
}

describe('Investigator count setup control', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('requests setup persistence when the investigator count changes', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    const { container } = render(
      <form>
        <InvestigatorCountInput initialValue={4} />
      </form>,
    )

    fireEvent.click(screen.getByRole('radio', { name: '6 investigators' }))

    const input = container.querySelector<HTMLInputElement>('input[name="investigatorCount"]')

    expect(input?.value).toBe('6')
    expect(screen.getByRole('radio', { name: '6 investigators' }).getAttribute('aria-checked')).toBe(
      'true',
    )
    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })

  it('SETUP-06 publishes the selected count for setup counter previews', async () => {
    const requestSubmit = vi
      .spyOn(HTMLFormElement.prototype, 'requestSubmit')
      .mockImplementation(() => undefined)

    const previews: SetupInvestigatorCountPreview[] = []
    const listener = (event: Event) => {
      previews.push((event as CustomEvent<SetupInvestigatorCountPreview>).detail)
    }

    window.addEventListener(SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT, listener)

    render(
      <form>
        <InvestigatorCountInput initialValue={4} sessionID="session" />
      </form>,
    )

    fireEvent.click(screen.getByRole('radio', { name: '6 investigators' }))
    window.removeEventListener(SETUP_INVESTIGATOR_COUNT_PREVIEW_EVENT, listener)

    expect(previews).toEqual([
      {
        investigatorCount: 6,
        sessionID: 'session',
      },
    ])
    await waitFor(() => expect(requestSubmit).toHaveBeenCalledOnce())
  })

  it('renders exactly the legal one to eight investigator choices', () => {
    render(investigatorCountInput(4))

    expect(screen.getAllByRole('radio')).toHaveLength(8)
    expect(screen.getByRole('radio', { name: '1 investigator' })).toBeDefined()
    expect(screen.getByRole('radio', { name: '8 investigators' })).toBeDefined()
    expect(screen.queryByRole('radio', { name: '9 investigators' })).toBeNull()
  })

  it('clamps the initial investigator count to the legal range', () => {
    const { container, rerender } = render(investigatorCountInput(12))
    const input = () =>
      container.querySelector<HTMLInputElement>('input[name="investigatorCount"]')

    expect(input()?.value).toBe('8')
    expect(screen.getByRole('radio', { name: '8 investigators' }).getAttribute('aria-checked')).toBe(
      'true',
    )

    rerender(investigatorCountInput(0))

    expect(input()?.value).toBe('1')
    expect(screen.getByRole('radio', { name: '1 investigator' }).getAttribute('aria-checked')).toBe(
      'true',
    )
  })
})
