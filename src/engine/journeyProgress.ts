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
