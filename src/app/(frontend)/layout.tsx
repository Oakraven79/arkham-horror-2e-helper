import React from 'react'
import './styles.css'

export const metadata = {
  description: 'A table companion for Arkham Horror Second Edition.',
  title: 'Arkham Horror Helper',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
