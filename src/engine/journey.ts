import type { SceneType } from './segments'

// The journey definition (design doc §3, §5): everything about a person lives in
// content/journeys/*.json, and the engine only reads it. Any artist can write one.

export type Media = {
  type: 'image' | 'video'
  src: string
  alt: string
  status: 'placeholder' | 'raw' | 'stylized'
  /** GDPR (design doc §5, §10): what was done about people in it. Missing = not cleared. */
  people?: 'none' | 'blurred' | 'generic' | 'removed'
}

/** Which way the camera turns to look at a stop's set piece, and with which motion preset. */
export type Gaze = {
  preset: string
  side: 'left' | 'right'
  strength?: number
}

export type StopNode = {
  id: string
  /** Where on the journey the stop sits, 0–1. The scroll pauses here (§12 Q8). */
  t: number
  date?: string
  title: string
  text: string
  /** True until the owner approves the text (§12 Q6). */
  draft?: boolean
  magnitude: 1 | 2 | 3 | 4 | 5
  sceneType: SceneType
  timeOfDay?: string
  visibility: 'public' | 'personal'
  sceneDescription?: string
  /** Named props from the set-piece library, placed around the stop. */
  setPieces?: string[]
  gaze?: Gaze
  /** An ambient sound file under public/audio/, played from this stop onwards (§12 Q7). */
  sound?: string
  media?: Media[]
}

export type JourneyDefinition = {
  id: string
  title: string
  period: { start: string; end: string }
  stylePreset: string
  nodes: StopNode[]
}
