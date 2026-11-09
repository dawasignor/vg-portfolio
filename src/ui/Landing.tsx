import { useLandingFade } from './landingFade'

// The landing screen: the title, big, over the valley before dawn, and a hint to
// scroll. Nothing else shows until it has faded (see StopCard and SoundToggle).
export function Landing() {
  const fade = useLandingFade()
  if (fade >= 1) return null
  return (
    <div className="coming-soon" style={{ opacity: 1 - fade }}>
      <div>
        <h1 className="coming-soon__title">
          A glimpse into Vigneshvar's Master's journey in Water Security and Global Change
        </h1>
        <p className="coming-soon__hint">Scroll down to navigate :)</p>
        <p className="coming-soon__note">This site is still being fine-tuned.</p>
      </div>
    </div>
  )
}
