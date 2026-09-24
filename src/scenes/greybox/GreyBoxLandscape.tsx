import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'
import { buildTerrainGeometry, groundHeight, JOURNEY_LENGTH, trailX } from './terrain'

/** The trail is drawn slightly above the ground so the terrain doesn't swallow it. */
const TRAIL_LIFT = 0.3

export function GreyBoxLandscape() {
  const terrain = useMemo(() => buildTerrainGeometry(), [])

  const trail = useMemo(() => {
    const points: Vector3[] = []
    for (let i = 0; i <= 500; i++) {
      const s = i / 500
      const x = trailX(s)
      const z = -s * JOURNEY_LENGTH
      points.push(new Vector3(x, groundHeight(x, z) + TRAIL_LIFT, z))
    }
    return points
  }, [])

  return (
    <>
      <mesh geometry={terrain}>
        <meshStandardMaterial vertexColors flatShading />
      </mesh>

      {/* The sea: one flat plane at sea level, hidden under the land until the shore. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -JOURNEY_LENGTH - 1500]}>
        <planeGeometry args={[8000, 4000]} />
        <meshStandardMaterial color="#4f8fa6" roughness={0.35} />
      </mesh>

      <Line points={trail} color="#7a5a34" lineWidth={3} />
    </>
  )
}
