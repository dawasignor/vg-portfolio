import type { SegmentProps } from '../../engine/segments'
import { Conifers } from './props'

// Forest slopes on the way up. No reference photo from inside a forest yet;
// the green is taken from the wooded valleys seen from the ridge (ref GOPR2999).

export function ForestSlope({ segment }: SegmentProps) {
  return <Conifers from={segment.from} to={segment.to} count={1200} seed={21} />
}
