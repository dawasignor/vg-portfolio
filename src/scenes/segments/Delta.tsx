import type { SegmentProps } from '../../engine/segments'
import { Conifers } from './props'

const TREE_BAND = [-5, 20] as const

// Where the river widens and flattens before the sea. No reference photo yet: grey-box.

export function Delta({ segment }: SegmentProps) {
  return <Conifers from={segment.from} to={segment.to} count={70} seed={81} band={TREE_BAND} minOffset={60} />
}
