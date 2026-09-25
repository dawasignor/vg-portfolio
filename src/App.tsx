import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import masters from '../content/journeys/masters.json'
import { AmbientTicker } from './engine/ambient'
import { Atmosphere } from './engine/Atmosphere'
import { BASE_FOV, CameraRail } from './engine/CameraRail'
import type { JourneyDefinition } from './engine/journey'
import { buildJourneyPath } from './engine/journeyPath'
import { JourneyScroll } from './engine/JourneyScroll'
import { StopTracker } from './engine/StopTracker'
import { Journey } from './scenes/Journey'
import { LIGHTING, SEGMENTS, stopTransitions, TRANSITIONS } from './scenes/greybox/layout'
import { greyBoxRoute } from './scenes/greybox/terrain'
import { SoundToggle } from './ui/SoundToggle'
import { StopCard } from './ui/StopCard'

// The journey is content (design doc §3): everything about the person comes from
// this file. The engine below would run anyone's journey.
const JOURNEY = masters as JourneyDefinition
const STOPS = JOURNEY.nodes.map((node) => node.t)
const CAMERA_MOVES = [...TRANSITIONS, ...stopTransitions(JOURNEY.nodes)]

export default function App() {
  const path = useMemo(() => buildJourneyPath(greyBoxRoute), [])

  return (
    <>
      {/* flat: no tone mapping, so the sky shows the photo-sampled colours as they are.
          frameloop="demand": draw only while something moves (a scroll, its easing,
            or an animated set piece nearby), not 144 times a second at rest.
          dpr={1}: one rendered pixel per screen pixel, even on scaled displays.
          powerPreference: ask the browser for the fast GPU on dual-GPU laptops. */}
      <Canvas
        flat
        frameloop="demand"
        dpr={1}
        gl={{ powerPreference: 'high-performance' }}
        camera={{ fov: BASE_FOV, near: 0.1, far: 5000 }}
      >
        {/* Fog fades distant land into the horizon; Atmosphere recolours it as the day moves. */}
        <fog attach="fog" args={['#9aa4ab', 150, 2200]} />

        {/* pages = screens of scrolling for the travel; each stop adds one short pause.
            damping = seconds the camera takes to catch up with the scrollbar. */}
        <JourneyScroll pages={24} damping={0.12} stops={STOPS}>
          <CameraRail path={path} transitions={CAMERA_MOVES} />
          <Atmosphere schedule={LIGHTING} />
          <Journey segments={SEGMENTS} nodes={JOURNEY.nodes} path={path} />
          <StopTracker nodes={JOURNEY.nodes} />
          <AmbientTicker />
        </JourneyScroll>
      </Canvas>
      <StopCard nodes={JOURNEY.nodes} />
      <SoundToggle nodes={JOURNEY.nodes} />
    </>
  )
}
