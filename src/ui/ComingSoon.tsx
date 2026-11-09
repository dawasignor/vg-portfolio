import { useLandingFade } from './landing'

// The landing screen: one line, big, over the valley before dawn. Nothing else
// shows until it has faded (see StopCard and SoundToggle).
export function ComingSoon() {
  const fade = useLandingFade()
  if (fade >= 1) return null
  return (
    <div className="coming-soon" style={{ opacity: 1 - fade }}>
      <h1 className="coming-soon__title">Coming soon</h1>
    </div>
  )
}
