import type { SegmentProps } from '../../engine/segments'
import { Conifers } from './props'

const TREE_BAND = [-20, 80] as const

// Following the river down the valley. The river itself is part of the
// landscape (see greybox/terrain.ts, RIVER). No reference photo yet: grey-box.

export function RiverValley({ segment }: SegmentProps) {
  return <Conifers from={segment.from} to={segment.to} count={700} seed={71} band={TREE_BAND} minOffset={40} />
}
