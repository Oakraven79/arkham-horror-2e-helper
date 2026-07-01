import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DeleteSessionControl } from '@/app/(frontend)/sessions/DeleteSessionControl'

describe('DeleteSessionControl', () => {
  it('requires an explicit confirmation and can be cancelled', () => {
    render(<DeleteSessionControl action={async () => undefined} sessionName="Friday in Arkham" />)

    expect(screen.queryByRole('button', { name: 'Confirm delete' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(
      screen.getByRole('group', { name: 'Confirm deletion of Friday in Arkham' }),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Confirm delete' })).toBeNull()
  })
})
