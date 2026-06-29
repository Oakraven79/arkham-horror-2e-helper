export interface BoxedSetDisplay {
  abbreviation: string
  iconAlt?: string
  iconUrl?: string
  name: string
}

export interface BoxedSetMarkProps {
  boxedSet?: BoxedSetDisplay
}

export function BoxedSetMark({ boxedSet }: BoxedSetMarkProps) {
  if (!boxedSet) return null

  return (
    <div className="boxed-set-mark" title={boxedSet.name}>
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
