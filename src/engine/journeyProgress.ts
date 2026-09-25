import { createContext, useContext, type RefObject } from 'react'

export type Progress = { offset: number; target: number }

export const ProgressContext = createContext<RefObject<Progress> | null>(null)

/** Journey progress, 0 (start) to 1 (end), eased. Read `.current.offset` inside useFrame. */
export function useJourneyProgress() {
  const progress = useContext(ProgressContext)
  if (!progress) throw new Error('useJourneyProgress must be used inside <JourneyScroll>')
  return progress
}
