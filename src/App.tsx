import { Canvas } from '@react-three/fiber'
import { SpinningCube } from './scenes/SpinningCube'

export default function App() {
  return (
    // <Canvas> sets up the scene, a perspective camera, the WebGL renderer
    // and the render loop. Everything inside it is Three.js, written as JSX.
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#f6efe0']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <SpinningCube />
    </Canvas>
  )
}
