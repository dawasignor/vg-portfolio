import { within, type SegmentProps } from '../../engine/segments'
import { Boulders, DeadRoots, MountainHut, Spires, type SpireSpec } from './props'

// Base camp: a stony bowl ringed by limestone towers, the hut in the middle.
// ref GOPR2956–2961 (towers behind dead roots at 06:06), GOPR2917 / 2989–2990 (the hut).

const TOWERS: ReadonlyArray<SpireSpec> = [
  // The trio ahead, standing just beyond the bowl (u > 1) so they sit inside the
  // very first view: black against the pre-dawn sky, as in the dawn photos.
  { u: 1.15, dx: 80, height: 155, radius: 17 },
  { u: 1.25, dx: 110, height: 185, radius: 21, lean: 0.03 },
  { u: 1.35, dx: 140, height: 165, radius: 18 },
  // Their neighbours on the left of the first view.
  { u: 1.2, dx: -85, height: 140, radius: 16, lean: -0.03 },
  { u: 1.4, dx: -120, height: 170, radius: 20 },
  // The walls of the bowl.
  { u: 0.3, dx: -170, height: 190, radius: 26 },
  { u: 0.5, dx: -210, height: 220, radius: 30, lean: -0.04 },
  { u: 0.75, dx: -160, height: 170, radius: 22 },
  { u: 0.4, dx: 190, height: 200, radius: 28 },
  { u: 0.65, dx: 230, height: 175, radius: 24 },
]

export function MountainBase({ segment }: SegmentProps) {
  return (
    <>
      {/* Roots framing the very first view, as in the dawn photos. */}
      <DeadRoots s={within(segment, 0.06)} dx={-6} seed={3} />
      <DeadRoots s={within(segment, 0.09)} dx={7} seed={7} />
      <MountainHut s={within(segment, 0.35)} dx={40} rotation={-0.3} />
      <Boulders from={segment.from} to={segment.to} count={350} seed={13} maxOffset={100} />
      <Spires segment={segment} specs={TOWERS} seed={11} />
    </>
  )
}
