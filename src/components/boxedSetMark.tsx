export interface BoxedSetDisplay {
  abbreviation: string
  iconAlt?: string
  iconUrl?: string
  name: string
}

export interface BoxedSetMarkProps {
  boxedSet?: BoxedSetDisplay
  className?: string
}

export function BoxedSetMark({ boxedSet, className }: BoxedSetMarkProps) {
  if (!boxedSet) return null

  const markClassName = [
    'boxed-set-mark',
    boxedSet.iconUrl ? 'boxed-set-mark--image' : 'boxed-set-mark--text',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={markClassName} title={boxedSet.name}>
      {boxedSet.iconUrl ? (
        // Payload media may be local or externally hosted, so it cannot use a fixed Next image loader.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={boxedSet.iconUrl} alt={boxedSet.iconAlt ?? `${boxedSet.name} boxed set`} />
      ) : (
        <span aria-label={`${boxedSet.name} boxed set`}>{boxedSet.abbreviation}</span>
      )}
    </div>
  )
}
