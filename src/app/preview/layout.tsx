import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './preview.css'

export const metadata: Metadata = {
  title: 'Card Preview | Arkham Horror Helper',
  description: 'Live CMS card preview.',
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
