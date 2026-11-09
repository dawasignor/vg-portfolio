import { useSyncExternalStore } from 'react'

/** How far through its fade the landing screen is: 0 = fully shown, 1 = gone.
 *  It fades over the first 60% of the first screen of scroll. */
function landingFade() {
  const fade = window.innerHeight > 0 ? window.scrollY / (window.innerHeight * 0.6) : 0
  return Math.round(Math.min(Math.max(fade, 0), 1) * 40) / 40 // steps of 2.5%, so React re-renders sparingly
}

function subscribe(listener: () => void) {
  window.addEventListener('scroll', listener, { passive: true })
  window.addEventListener('resize', listener)
  return () => {
    window.removeEventListener('scroll', listener)
    window.removeEventListener('resize', listener)
  }
}

export function useLandingFade() {
  return useSyncExternalStore(subscribe, landingFade)
}
