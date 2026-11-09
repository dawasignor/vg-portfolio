import { createContext, useContext, type RefObject } from 'react'

export type Progress = { offset: number; target: number }

export const ProgressContext = createContext<RefObject<Progress> | null>(null)

/** Journey progress, 0 (start) to 1 (end), eased. Read `.current.offset` inside useFrame. */
export function useJourneyProgress() {
  const progress = useContext(ProgressContext)
  if (!progress) throw new Error('useJourneyProgress must be used inside <JourneyScroll>')
  return progress
}

/**
 * Scroll position → journey progress, with a flat stretch at each stop. Inside a
 * stretch the scrollbar still moves (the page is never blocked), but progress holds.
 */
export function progressAtScroll(y: number, travelPx: number, stops: ReadonlyArray<number>, pausePx: number) {
  let paused = 0
  for (const stop of stops) {
    const start = stop * travelPx + paused
    if (y < start) break
    if (y <= start + pausePx) return stop
    paused += pausePx
  }
  return Math.min(Math.max((y - paused) / travelPx, 0), 1)
}

/** How the page's scroll maps onto the journey, published by JourneyScroll for page UI
 *  (the progress bar) that needs to read progress or jump to a stop. */
export type ScrollGeometry = {
  intro: number
  travelPx: number
  stops: ReadonlyArray<number>
  pausePx: number
}

let geometry: ScrollGeometry | null = null

export function setScrollGeometry(next: ScrollGeometry) {
  geometry = next
}

/** Journey progress (0–1) at a page scroll position, or 0 before the journey is ready. */
export function progressAtPageScroll(y: number) {
  if (!geometry) return 0
  const g = geometry
  return progressAtScroll(Math.max(y - g.intro, 0), g.travelPx, g.stops, g.pausePx)
}

/** The page scroll position at the middle of the pause for the stop at progress `t`. */
export function scrollForStop(t: number) {
  if (!geometry) return 0
  const g = geometry
  const i = g.stops.indexOf(t)
  if (i < 0) return g.intro + t * g.travelPx
  return g.intro + t * g.travelPx + i * g.pausePx + g.pausePx / 2
}
