import {
  AnimationClip,
  InterpolateDiscrete,
  InterpolateLinear,
  ZeroSlopeEnding,
  type AnimationClipJSON,
  type Interpolant,
  type KeyframeTrack,
} from 'three'

/**
 * What a camera move adds on top of the rail: a zoom factor (1 = unchanged,
 * < 1 = zoomed in, > 1 = wider) and turns in degrees. Pan direction comes from
 * the transition, so one preset works to either side.
 */
export type MoveSample = { fov: number; yaw: number; pitch: number; roll: number }

export type CameraMove = (u: number, out: MoveSample) => MoveSample

const CHANNELS = ['fov', 'yaw', 'pitch', 'roll'] as const
const NEUTRAL: MoveSample = { fov: 1, yaw: 0, pitch: 0, roll: 0 }

/**
 * Loads a camera move saved as a three.js AnimationClip in JSON. Tracks are
 * named ".fov", ".yaw", ".pitch", ".roll"; time runs 0 → 1 across the transition.
 * Each track eases in and out with zero slope at both ends, so a move never
 * starts or stops with a jolt, however it is keyed.
 */
export function loadCameraMove(json: AnimationClipJSON): CameraMove {
  const clip = AnimationClip.parse(json)
  const interpolants = new Map<(typeof CHANNELS)[number], Interpolant>()
  for (const track of clip.tracks) {
    const channel = CHANNELS.find((c) => track.name === `.${c}`)
    if (channel) interpolants.set(channel, interpolantFor(track))
  }
  return (u, out) => {
    for (const channel of CHANNELS) {
      const interpolant = interpolants.get(channel)
      out[channel] = interpolant ? interpolant.evaluate(u * clip.duration)[0] : NEUTRAL[channel]
    }
    return out
  }
}

// Honours each track's saved interpolation. Smooth tracks (the default for
// presets) get zero-slope endings: the move eases out of stillness and back into it.
function interpolantFor(track: KeyframeTrack): Interpolant {
  switch (track.getInterpolation()) {
    case InterpolateDiscrete:
      return track.InterpolantFactoryMethodDiscrete()
    case InterpolateLinear:
      return track.InterpolantFactoryMethodLinear()
    default: {
      const smooth = track.InterpolantFactoryMethodSmooth()
      smooth.settings = { endingStart: ZeroSlopeEnding, endingEnd: ZeroSlopeEnding }
      return smooth
    }
  }
}

/** A camera move placed on the journey, centred on `at` (0–1) and lasting `span`. */
export type Transition = {
  at: number
  span: number
  /** +1 pans right, -1 pans left. */
  side: 1 | -1
  move: CameraMove
  /** 0 = off, 1 = as keyed. */
  strength?: number
}
