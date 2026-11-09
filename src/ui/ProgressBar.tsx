import { useSyncExternalStore } from 'react'
import { isStop, type StopNode } from '../engine/journey'
import { progressAtPageScroll, scrollForStop } from '../engine/journeyProgress'
import { useStopState } from '../engine/stopStore'
import { useLandingFade } from './landingFade'

function subscribe(listener: () => void) {
  window.addEventListener('scroll', listener, { passive: true })
  window.addEventListener('resize', listener)
  return () => {
    window.removeEventListener('scroll', listener)
    window.removeEventListener('resize', listener)
  }
}

/** Progress from the page scroll, in steps of 0.1%, so React re-renders sparingly. */
function currentProgress() {
  return Math.round(progressAtPageScroll(window.scrollY) * 1000) / 1000
}

// The river line (design doc §4.2, §12 Q12): a thin line down the right edge, a dot
// for every stop, and a marker for where the reader is. Hover a dot for its title;
// click it to travel there. Hidden on the landing screen, like the other controls.
export function ProgressBar({ nodes }: { nodes: ReadonlyArray<StopNode> }) {
  const landed = useLandingFade() >= 1
  const progress = useSyncExternalStore(subscribe, currentProgress)
  const { active } = useStopState()
  if (!landed) return null

  const stops = nodes.filter(isStop)
  return (
    <nav className="river-bar" aria-label="Journey progress">
      <div className="river-bar__line" />
      <div className="river-bar__flow" style={{ height: `${progress * 100}%` }} />
      {stops.map((node) => (
        <button
          key={node.id}
          type="button"
          className={`river-bar__dot${node.t <= progress + 0.0005 ? ' is-past' : ''}${active === node.id ? ' is-active' : ''}`}
          style={{ top: `${node.t * 100}%` }}
          aria-label={node.title ?? node.id}
          onClick={() => window.scrollTo({ top: scrollForStop(node.t), behavior: 'smooth' })}
        >
          <span className="river-bar__label">{node.title}</span>
        </button>
      ))}
      <div className="river-bar__you" style={{ top: `${progress * 100}%` }} />
    </nav>
  )
}
