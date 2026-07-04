import type { CSSProperties, ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'

export type EncounterListBlock = {
  heading: string
  key?: number | string | null
  text?: string | null
}

const cellStyle = {
  display: 'grid',
  gap: '8px',
  minWidth: '28rem',
  maxWidth: '64rem',
  whiteSpace: 'normal',
} satisfies CSSProperties

const blockStyle = {
  display: 'grid',
  gap: '2px',
} satisfies CSSProperties

const headingStyle = {
  color: 'var(--theme-elevation-600)',
  fontSize: '12px',
  fontWeight: 700,
  lineHeight: 1.25,
} satisfies CSSProperties

const markdownStyle = {
  color: 'var(--theme-text)',
  fontSize: '13px',
  lineHeight: 1.4,
} satisfies CSSProperties

const paragraphStyle = {
  margin: 0,
} satisfies CSSProperties

const listStyle = {
  margin: '0 0 0 1.1rem',
  padding: 0,
} satisfies CSSProperties

const markdownComponents = {
  ol: ({ children }) => <ol style={listStyle}>{children}</ol>,
  p: ({ children }) => <p style={paragraphStyle}>{children}</p>,
  ul: ({ children }) => <ul style={listStyle}>{children}</ul>,
} satisfies Components

export function EncounterListCellLayout({
  blocks,
  emptyLabel = 'No encounters',
}: {
  blocks: EncounterListBlock[]
  emptyLabel?: string
}): ReactNode {
  if (blocks.length === 0) {
    return <span>{emptyLabel}</span>
  }

  return (
    <div style={cellStyle}>
      {blocks.map((block, index) => (
        <section key={block.key ?? index} style={blockStyle}>
          <div style={headingStyle}>{block.heading}</div>
          <div style={markdownStyle}>
            <ReactMarkdown components={markdownComponents}>{block.text ?? ''}</ReactMarkdown>
          </div>
        </section>
      ))}
    </div>
  )
}
