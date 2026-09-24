import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { BufferAttribute, BufferGeometry, Vector3 } from 'three'
import {
  buildTerrainGeometry,
  groundHeight,
  JOURNEY_LENGTH,
  LAKE,
  LAKE_CENTRE,
  LAKE_LEVEL,
  RIVER,
  riverLevel,
  riverWidth,
  riverX,
  trailX,
} from './terrain'

/** The trail is drawn slightly above the ground so the terrain doesn't swallow it. */
const TRAIL_LIFT = 0.3
const WATER = '#6f8ea6' // ref GOPR2990: the pool by the hut, holding the sky
const SEA = '#4f8fa6' // default

// A flat ribbon along the river's centre line, widening into the delta.
function buildRiverGeometry() {
  const steps = 300
  const positions: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= steps; i++) {
    const s = RIVER.from + 0.02 + ((RIVER.to - RIVER.from - 0.02) * i) / steps
    const x = riverX(s)
    const halfWidth = riverWidth(s) + 2
    const y = riverLevel(s)
    const z = -s * JOURNEY_LENGTH
    positions.push(x - halfWidth, y, z, x + halfWidth, y, z)
    if (i < steps) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) // wound so the face points up
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

// The continuous landscape under every segment: ground, sea, trail, river, lake.
export function GreyBoxLandscape() {
  const terrain = useMemo(() => buildTerrainGeometry(), [])
  const river = useMemo(() => buildRiverGeometry(), [])

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
        <meshStandardMaterial color={SEA} roughness={0.35} />
      </mesh>

      <mesh geometry={river}>
        <meshStandardMaterial color={WATER} roughness={0.2} metalness={0.1} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[LAKE_CENTRE.x, LAKE_LEVEL, LAKE_CENTRE.z]}>
        <circleGeometry args={[LAKE.radius * 0.8, 48]} />
        <meshStandardMaterial color={WATER} roughness={0.15} metalness={0.1} />
      </mesh>

      <Line points={trail} color="#7a5a34" lineWidth={3} />
    </>
  )
}
