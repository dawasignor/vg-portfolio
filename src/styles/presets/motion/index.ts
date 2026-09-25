import type { AnimationClipJSON } from 'three'
import { loadCameraMove, type CameraMove } from '../../../engine/cameraMove'
import lookAside from './look-aside.json'
import zoomSidePan from './zoom-side-pan.json'

// Camera moves saved as three.js AnimationClips. JSON imports lose the clip's
// enum types, hence the casts. Journeys name a preset; this is where names resolve.
export const MOTION_PRESETS: Record<string, CameraMove> = {
  'zoom-side-pan': loadCameraMove(zoomSidePan as AnimationClipJSON),
  // Turns ~38° to one side at its middle, where a stop's pause holds it: the
  // traveller looks at the set piece while the reader reads.
  'look-aside': loadCameraMove(lookAside as AnimationClipJSON),
}
