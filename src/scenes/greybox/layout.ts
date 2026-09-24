import type { Stop } from '../../engine/blend'
import type { Look } from '../../engine/look'
import type { Segment } from '../../engine/segments'
import { LOOKS } from '../../styles/presets/painterlyAnime'

// The grey-box journey's layout: which scene segment sits where, and the time
// of day along the way (design doc §4.1). Progress runs 0 (base camp) → 1 (shore).
// TODO(v0.4): derive this from content/journeys/*.json (each node's sceneType
// and timeOfDay) instead of hard-coding it here.

export const SEGMENTS: ReadonlyArray<Segment> = [
  { type: 'mountain-base', from: 0.0, to: 0.1 },
  { type: 'forest-slope', from: 0.1, to: 0.21 },
  { type: 'alpine-lake', from: 0.21, to: 0.29 },
  { type: 'ridge', from: 0.29, to: 0.4 },
  { type: 'summit-pass', from: 0.4, to: 0.5 },
  { type: 'village', from: 0.5, to: 0.62 },
  { type: 'river-valley', from: 0.62, to: 0.8 },
  { type: 'delta', from: 0.8, to: 0.92 },
  { type: 'beach', from: 0.92, to: 1.0 },
]

/** Time of day by scroll position: one day, pre-dawn at base camp to the finale. */
export const LIGHTING: ReadonlyArray<Stop<Look>> = [
  [0.0, LOOKS['pre-dawn']],
  [0.09, LOOKS.morning],
  [0.2, LOOKS['bright-morning']],
  [0.32, LOOKS['mid-morning']],
  [0.42, LOOKS['late-morning']],
  [0.5, LOOKS.afternoon],
  [0.57, LOOKS['golden-hour']],
  [0.64, LOOKS.dusk],
  [0.72, LOOKS.night],
  [0.82, LOOKS.night],
  [0.9, LOOKS.dawn],
  [1.0, LOOKS.finale],
]
