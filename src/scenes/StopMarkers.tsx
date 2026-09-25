import { useMemo } from 'react'
import type { StopNode } from '../engine/journey'
import { ahead, groundPoint } from './greybox/terrain'

const POST = '#5a4a38' // default
const LAMP = '#ffcf8a' // default: warm lantern light

// A lantern beside the trail, a little ahead of each stop, so the reader sees
// where the pause will come before it arrives.
export function StopMarkers({ nodes, stopS }: { nodes: ReadonlyArray<StopNode>; stopS: ReadonlyArray<number> }) {
  const lanterns = useMemo(() => stopS.map((s) => groundPoint(ahead(s, 14), 2.6)), [stopS])
  return (
    <>
      {nodes.map((node, i) => (
        <group key={node.id} position={lanterns[i]}>
          <mesh position-y={1.1}>
            <cylinderGeometry args={[0.05, 0.07, 2.2, 6]} />
            <meshStandardMaterial color={POST} />
          </mesh>
          <mesh position-y={2.3}>
            <boxGeometry args={[0.3, 0.38, 0.3]} />
            <meshStandardMaterial color={LAMP} emissive={LAMP} emissiveIntensity={1.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}
