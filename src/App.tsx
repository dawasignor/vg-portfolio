import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import { CameraRail } from './engine/CameraRail'
import { buildJourneyPath } from './engine/journeyPath'
import { GreyBoxLandscape } from './scenes/greybox/GreyBoxLandscape'
import { greyBoxRoute } from './scenes/greybox/terrain'

const SKY = '#cfd9df'

export default function App() {
  const path = useMemo(() => buildJourneyPath(greyBoxRoute), [])

  return (
    <Canvas camera={{ fov: 60, near: 0.1, far: 5000 }}>
      <color attach="background" args={[SKY]} />
      {/* Fog fades distant land into the sky; it is most of what makes grey-box read as depth. */}
      <fog attach="fog" args={[SKY, 150, 2200]} />
      <hemisphereLight args={['#eef3f6', '#6b6250', 0.9]} />
      <directionalLight position={[300, 500, 200]} intensity={1.4} />

      {/* pages = how many screen-heights of scrolling the whole journey takes. */}
      <ScrollControls pages={10} damping={0.25}>
        <CameraRail path={path} />
        <GreyBoxLandscape />
      </ScrollControls>
    </Canvas>
  )
}
