import type {
  ArkhamEncounterBackPanel,
  ArkhamEncounterNeighborhoodDisplay,
} from './arkhamEncounterCardTypes'
import './arkhamEncounterCard.css'

export interface ArkhamEncounterDeckBackProps {
  neighborhood: ArkhamEncounterNeighborhoodDisplay
  panels: ArkhamEncounterBackPanel[]
}

export function ArkhamEncounterDeckBack({ neighborhood, panels }: ArkhamEncounterDeckBackProps) {
  const style = {
    '--arkham-encounter-colour': neighborhood.colourHex ?? '#686862',
  } as React.CSSProperties

  return (
    <div
      aria-label={`${neighborhood.name} encounter deck back`}
      className="arkham-encounter-card arkham-encounter-card--back"
      role="img"
      style={style}
    >
      <div className="arkham-encounter-back-panels" data-panel-count={Math.max(1, panels.length)}>
        {panels.length > 0 ? (
          panels.map((panel) =>
            panel.imageUrl ? (
              // Payload media may be local or externally hosted.
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={panel.imageAlt ?? panel.name} key={panel.name} src={panel.imageUrl} />
            ) : (
              <div className="arkham-encounter-back-panel-fallback" key={panel.name}>
                {panel.name}
              </div>
            ),
          )
        ) : (
          <div className="arkham-encounter-back-panel-fallback">{neighborhood.name}</div>
        )}
      </div>

      {neighborhood.backFrameUrl && (
        // Decorative frame; the card itself carries the accessible label.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          aria-hidden="true"
          className="arkham-encounter-frame"
          src={neighborhood.backFrameUrl}
        />
      )}
    </div>
  )
}
