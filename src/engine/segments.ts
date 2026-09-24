/** The scene segment types from design doc §8.3, in journey order. */
export type SceneType =
  | 'mountain-base'
  | 'forest-slope'
  | 'alpine-lake'
  | 'ridge'
  | 'summit-pass'
  | 'village'
  | 'river-valley'
  | 'delta'
  | 'beach'

/** A stretch of the journey, by progress: 0 = the start, 1 = the end. */
export type Segment = {
  type: SceneType
  from: number
  to: number
}

export type SegmentProps = { segment: Segment }

/** Journey progress at fraction u (0–1) of the way through a segment. */
export function within(segment: Segment, u: number) {
  return segment.from + (segment.to - segment.from) * u
}
