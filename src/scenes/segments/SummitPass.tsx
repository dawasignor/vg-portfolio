import { within, type SegmentProps } from '../../engine/segments'
import { Boulders, Spires, SummitCross, type SpireSpec } from './props'

// The highest point: a pass between towers, and a summit cross on a boulder.
// ref GOPR2913–2915 (the cross against the sky, 16:47), GOPR3025 (peaks, 11:16).

const TOWERS: ReadonlyArray<SpireSpec> = [
  // A pair framing the way down, seen ahead as you top out.
  { u: 0.8, dx: -60, height: 150, radius: 20 },
  { u: 0.85, dx: 72, height: 170, radius: 22, lean: -0.03 },
  // Behind them, further out.
  { u: 0.95, dx: -115, height: 130, radius: 18 },
  { u: 1.0, dx: 125, height: 145, radius: 19 },
  // The walls you climb between.
  { u: 0.2, dx: -110, height: 120, radius: 18 },
  { u: 0.3, dx: 120, height: 135, radius: 20 },
]

export function SummitPass({ segment }: SegmentProps) {
  return (
    <>
      {/* On the last rise before the top, so it stands against the sky as you climb. */}
      <SummitCross s={within(segment, 0.45)} dx={10} />
      <Spires segment={segment} specs={TOWERS} seed={51} />
      <Boulders from={segment.from} to={segment.to} count={400} seed={53} />
    </>
  )
}
