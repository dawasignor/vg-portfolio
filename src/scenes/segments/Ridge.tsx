import { within, type SegmentProps } from '../../engine/segments'
import { Bivouac, Boulders, Conifers, Signpost, Spires, type SpireSpec } from './props'

// Along the ridge: a trail signpost, a jagged crest, and the metal bivouac
// above wide valleys. ref GOPR2997 (signpost, 09:01), GOPR2998–3001 (09:02).

const CREST: ReadonlyArray<SpireSpec> = [
  { u: 0.15, dx: -130, height: 80, radius: 14 },
  { u: 0.3, dx: -170, height: 115, radius: 18 },
  { u: 0.45, dx: -140, height: 95, radius: 15, lean: 0.04 },
  { u: 0.6, dx: -200, height: 125, radius: 20 },
  { u: 0.8, dx: -150, height: 85, radius: 14 },
]

/** Forest only far below the ridge, in the valleys it looks over. */
const VALLEY_TREES = [-400, -40] as const

export function Ridge({ segment }: SegmentProps) {
  return (
    <>
      <Signpost s={within(segment, 0.05)} dx={2.5} />
      <Bivouac s={within(segment, 0.6)} dx={-22} />
      <Spires segment={segment} specs={CREST} seed={41} />
      <Boulders from={segment.from} to={segment.to} count={400} seed={43} />
      <Conifers from={segment.from} to={segment.to} count={700} seed={45} band={VALLEY_TREES} minOffset={150} maxOffset={500} />
    </>
  )
}
