'use client'

export function submitContainingForm(control: HTMLElement | null) {
  const form =
    control instanceof HTMLInputElement ||
    control instanceof HTMLSelectElement ||
    control instanceof HTMLButtonElement ||
    control instanceof HTMLTextAreaElement
      ? control.form
      : control?.closest('form')

  if (!form) return

  window.setTimeout(() => form.requestSubmit(), 0)
}
