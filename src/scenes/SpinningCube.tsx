import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

// v0.1 placeholder: its only job is to prove the render loop runs.
// TODO(v0.2): replaced by the grey-box landscape and the camera rail.
export function SpinningCube() {
  const mesh = useRef<Mesh>(null)

  // useFrame runs once per rendered frame. `delta` is the seconds since the last
  // frame, so the spin speed is the same on a 60 Hz and a 144 Hz screen.
  useFrame((_, delta) => {
    if (!mesh.current) return
    mesh.current.rotation.x += delta * 0.4
    mesh.current.rotation.y += delta * 0.6
  })

  // A mesh = geometry (the shape) + material (the skin light falls on).
  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#5e9fb4" />
    </mesh>
  )
}
