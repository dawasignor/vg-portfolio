import { useSyncExternalStore } from 'react'

// A tiny store that carries "where are we" out of the 3D canvas to the page UI
// (the stop card, the sound toggle). The canvas writes it inside its frame loop;
// React components outside the canvas read it with useStopState().

export type StopState = {
  /** The stop the reader is paused at, or null while travelling. */
  active: string | null
  /** The last stop passed, so ambient sound keeps playing between stops. */
  region: string | null
}

let state: StopState = { active: null, region: null }
const listeners = new Set<() => void>()

export function setStopState(next: StopState) {
  if (next.active === state.active && next.region === state.region) return
  state = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStopState() {
  return useSyncExternalStore(subscribe, () => state)
}
