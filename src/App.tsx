import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { Atmosphere } from './engine/Atmosphere'
import { CameraRail } from './engine/CameraRail'
import { buildJourneyPath } from './engine/journeyPath'
import { Journey } from './scenes/Journey'
import { LIGHTING, SEGMENTS } from './scenes/greybox/layout'
import { greyBoxRoute } from './scenes/greybox/terrain'

export default function App() {
  const path = useMemo(() => buildJourneyPath(greyBoxRoute), [])

  return (
    // `flat` turns off tone mapping, so the sky shows the photo-sampled colours as they are.
    <Canvas flat camera={{ fov: 60, near: 0.1, far: 5000 }}>
      {/* Fog fades distant land into the horizon; Atmosphere recolours it as the day moves. */}
      <fog attach="fog" args={['#9aa4ab', 150, 2200]} />

      {/* pages = how many screen-heights of scrolling the whole journey takes. */}
      <ScrollControls pages={10} damping={0.25}>
        <CameraRail path={path} />
        <Atmosphere schedule={LIGHTING} />
        <Journey segments={SEGMENTS} />
      </ScrollControls>
    </Canvas>
  )
}
