import { useState } from 'react'
import type { StopNode } from '../engine/journey'
import { useStopState } from '../engine/stopStore'
import { useLandingFade } from './landingFade'

// The card for the stop the reader is paused at (design doc §4.2, §12 Q8). It
// fades in on arrival and out on leaving. While fading out it keeps showing the
// stop it was showing, so the text never swaps mid-fade.
// TODO(v0.5): hovering a stop's lantern opens its card too.
export function StopCard({ nodes }: { nodes: ReadonlyArray<StopNode> }) {
  const { active } = useStopState()
  const landed = useLandingFade() >= 1
  const [shown, setShown] = useState<StopNode | null>(null)
  // Remember the last stop shown, so it can fade out with its own text.
  const arrived = active ? (nodes.find((n) => n.id === active) ?? null) : null
  if (arrived && arrived !== shown) setShown(arrived)

  const visible = landed && active !== null && shown?.id === active
  if (!shown) return null

  return (
    <aside className={`stop-card${visible ? ' stop-card--visible' : ''}`} aria-live="polite" aria-hidden={!visible}>
      {shown.date && <p className="stop-card__date">{shown.date}</p>}
      {shown.title && <h2 className="stop-card__title">{shown.title}</h2>}
      {shown.text && <p className="stop-card__text">{shown.text}</p>}
      {shown.sceneDescription && <p className="stop-card__scene">{shown.sceneDescription}</p>}
      {shown.draft && <p className="stop-card__draft">Draft: awaiting the owner's approval</p>}
    </aside>
  )
}
