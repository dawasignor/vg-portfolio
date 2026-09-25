import type { SegmentProps } from '../../engine/segments'
import { Boulders, Conifers } from './props'

// The foothill river valley (design doc §6, semester 1): meadow, scattered trees,
// stones along the banks. The river and the coast are part of the landscape; each
// stop brings its own set piece. No reference photos yet: grey-box.

const TREE_BAND = [-6, 70] as const

export function Foothills({ segment }: SegmentProps) {
  return (
    <>
      <Conifers from={segment.from} to={segment.to} count={350} seed={101} band={TREE_BAND} minOffset={40} />
      <Boulders from={segment.from} to={segment.to} count={120} seed={103} maxOffset={60} />
    </>
  )
}
