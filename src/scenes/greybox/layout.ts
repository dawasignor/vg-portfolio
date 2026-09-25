import type { Stop } from '../../engine/blend'
import type { Transition } from '../../engine/cameraMove'
import type { StopNode } from '../../engine/journey'
import type { Look } from '../../engine/look'
import type { Segment } from '../../engine/segments'
import { MOTION_PRESETS } from '../../styles/presets/motion'
import { LOOKS } from '../../styles/presets/painterlyAnime'
import { FOOTHILLS_END } from './terrain'

// The grey-box journey's layout: which scene segment sits where, the time of day
// along the way, and the camera moves (design doc §4.1, §6). Progress runs
// 0 (start) → 1 (shore). The first quarter is semester 1's foothill valley; M()
// places the mountain-to-sea world's original numbers into the rest.
// TODO(v0.5): derive segments and lighting from the journey's stops (sceneType,
// timeOfDay) instead of hard-coding them here.

const M = (s: number) => FOOTHILLS_END + (1 - FOOTHILLS_END) * s

export const SEGMENTS: ReadonlyArray<Segment> = [
  { type: 'foothills', from: 0.0, to: FOOTHILLS_END },
  { type: 'mountain-base', from: M(0.0), to: M(0.1) },
  { type: 'forest-slope', from: M(0.1), to: M(0.21) },
  { type: 'alpine-lake', from: M(0.21), to: M(0.29) },
  { type: 'ridge', from: M(0.29), to: M(0.4) },
  { type: 'summit-pass', from: M(0.4), to: M(0.5) },
  { type: 'village', from: M(0.5), to: M(0.62) },
  { type: 'river-valley', from: M(0.62), to: M(0.8) },
  { type: 'delta', from: M(0.8), to: M(0.92) },
  { type: 'beach', from: M(0.92), to: M(1.0) },
]

/** Time of day by scroll position: pre-dawn in the foothills, a day in the
 *  mountains, the night by the river, and sunrise at the sea (§12 Q9). */
export const LIGHTING: ReadonlyArray<Stop<Look>> = [
  [0.0, LOOKS['pre-dawn']],
  [0.1, LOOKS.dawn],
  [0.2, LOOKS.morning],
  [M(0.09), LOOKS.morning],
  [M(0.2), LOOKS['bright-morning']],
  [M(0.32), LOOKS['mid-morning']],
  [M(0.42), LOOKS['late-morning']],
  [M(0.5), LOOKS.afternoon],
  [M(0.57), LOOKS['golden-hour']],
  [M(0.64), LOOKS.dusk],
  [M(0.72), LOOKS.night],
  [M(0.82), LOOKS.night],
  [M(0.9), LOOKS.dawn],
  [1.0, LOOKS.finale],
]

/** Share of the journey each scene-boundary move takes: 5% ≈ 9 mouse-wheel notches. */
const TRANSITION_SPAN = 0.05

/** Which way to glance at each scene boundary, towards what's worth seeing there. */
const GLANCE: ReadonlyArray<1 | -1> = [
  1, // foothills → mountain foot: the tower trio on the right
  1, // mountain foot → forest
  -1, // forest → lake: the lake ahead-left
  -1, // lake → ridge: down at the water, beside you
  1, // ridge → summit: the valleys falling away on the right
  -1, // summit → village: the tower on the left of the pass
  1, // village → river: the river on the right
  1, // river → delta: the delta widening on the right
  -1, // delta → beach: along the shore
]

/** A zoom-in side-pan at every boundary between scenes (design doc §4.2). */
export const TRANSITIONS: ReadonlyArray<Transition> = SEGMENTS.slice(1).map((segment, i) => ({
  at: segment.from,
  span: TRANSITION_SPAN,
  side: GLANCE[i],
  move: MOTION_PRESETS['zoom-side-pan'],
}))

/** Share of the journey a stop's look takes: 3% ≈ 5 wheel notches, centred on the pause. */
const STOP_GAZE_SPAN = 0.03

/** The camera turns toward each stop's set piece and holds there during the pause. */
export function stopTransitions(nodes: ReadonlyArray<StopNode>): Transition[] {
  return nodes.flatMap((node) => {
    const move = node.gaze && MOTION_PRESETS[node.gaze.preset]
    if (!node.gaze || !move) return []
    return [
      {
        at: node.t,
        span: STOP_GAZE_SPAN,
        side: node.gaze.side === 'right' ? 1 : -1,
        move,
        strength: node.gaze.strength,
      },
    ]
  })
}
