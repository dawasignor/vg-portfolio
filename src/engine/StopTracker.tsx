import { useFrame } from '@react-three/fiber'
import { isStop, type StopNode } from './journey'
import { useJourneyProgress } from './journeyProgress'
import { setStopState } from './stopStore'

/** How close (in journey progress) counts as being at a stop. The pause holds progress
 *  exactly on the stop, so this only needs to cover the last moment of easing in. */
const AT_STOP = 0.002

// Watches progress each frame and publishes which stop the reader is at (for the
// card) and which stop they last passed (for ambient sound).
export function StopTracker({ nodes }: { nodes: ReadonlyArray<StopNode> }) {
  const progress = useJourneyProgress()
  useFrame(() => {
    const t = progress.current.offset
    let active: string | null = null
    let region: string | null = null
    for (const node of nodes) {
      if (!isStop(node)) continue
      if (Math.abs(t - node.t) < AT_STOP) active = node.id
      if (node.t <= t + AT_STOP) region = node.id
    }
    setStopState({ active, region })
  })
  return null
}
