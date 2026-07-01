'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

function ConfirmDeleteButton() {
  const { pending } = useFormStatus()

  return (
    <button className="confirm-session-delete" disabled={pending} type="submit">
      {pending ? 'Deleting...' : 'Confirm delete'}
    </button>
  )
}

export function DeleteSessionControl({
  action,
  sessionName,
}: {
  action: () => Promise<void>
  sessionName: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button className="request-session-delete" onClick={() => setConfirming(true)} type="button">
        Delete
      </button>
    )
  }

  return (
    <div
      aria-label={`Confirm deletion of ${sessionName}`}
      className="session-delete-confirmation"
      role="group"
    >
      <form action={action}>
        <ConfirmDeleteButton />
      </form>
      <button className="cancel-session-delete" onClick={() => setConfirming(false)} type="button">
        Cancel
      </button>
    </div>
  )
}
