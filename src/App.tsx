import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { Atmosphere } from './engine/Atmosphere'
import { BASE_FOV, CameraRail } from './engine/CameraRail'
import { buildJourneyPath } from './engine/journeyPath'
import { Journey } from './scenes/Journey'
import { LIGHTING, SEGMENTS, TRANSITIONS } from './scenes/greybox/layout'
import { greyBoxRoute } from './scenes/greybox/terrain'

export default function App() {
  const path = useMemo(() => buildJourneyPath(greyBoxRoute), [])

  return (
    // flat: no tone mapping, so the sky shows the photo-sampled colours as they are.
    // frameloop="demand": draw only while something moves (a scroll, its easing),
    //   instead of up to 144 times a second while the page sits still.
    // dpr={1}: one rendered pixel per screen pixel, even on scaled displays.
    // powerPreference: ask the browser for the fast GPU on dual-GPU laptops.
    <Canvas
      flat
      frameloop="demand"
      dpr={1}
      gl={{ powerPreference: 'high-performance' }}
      camera={{ fov: BASE_FOV, near: 0.1, far: 5000 }}
    >
      {/* Fog fades distant land into the horizon; Atmosphere recolours it as the day moves. */}
      <fog attach="fog" args={['#9aa4ab', 150, 2200]} />

      {/* pages = how many screen-heights of scrolling the whole journey takes. */}
      {/* damping = seconds the camera takes to catch up with the scrollbar. Lower is snappier. */}
      <ScrollControls pages={10} damping={0.12}>
        <CameraRail path={path} transitions={TRANSITIONS} />
        <Atmosphere schedule={LIGHTING} />
        <Journey segments={SEGMENTS} />
      </ScrollControls>
    </Canvas>
  )
}
