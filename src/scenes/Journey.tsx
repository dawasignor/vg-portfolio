import { useMemo, type ComponentType } from 'react'
import type { CatmullRomCurve3 } from 'three'
import { isStop, type StopNode } from '../engine/journey'
import type { Segment, SceneType, SegmentProps } from '../engine/segments'
import { GreyBoxLandscape } from './greybox/GreyBoxLandscape'
import { JOURNEY_LENGTH } from './greybox/terrain'
import { SET_PIECES } from './setpieces'
import { StopMarkers } from './StopMarkers'
import { AlpineLake } from './segments/AlpineLake'
import { Beach } from './segments/Beach'
import { Delta } from './segments/Delta'
import { Foothills } from './segments/Foothills'
import { ForestSlope } from './segments/ForestSlope'
import { MountainBase } from './segments/MountainBase'
import { Ridge } from './segments/Ridge'
import { RiverValley } from './segments/RiverValley'
import { SummitPass } from './segments/SummitPass'
import { Village } from './segments/Village'

// One component per scene type (design doc §8.3).
const SCENES: Record<SceneType, ComponentType<SegmentProps>> = {
  foothills: Foothills,
  'mountain-base': MountainBase,
  'forest-slope': ForestSlope,
  'alpine-lake': AlpineLake,
  ridge: Ridge,
  'summit-pass': SummitPass,
  village: Village,
  'river-valley': RiverValley,
  delta: Delta,
  beach: Beach,
}

type JourneyProps = {
  segments: ReadonlyArray<Segment>
  nodes: ReadonlyArray<StopNode>
  path: CatmullRomCurve3
}

// The whole world: the continuous landscape, each segment's own scenery, and
// each stop's lantern and set pieces.
export function Journey({ segments, nodes, path }: JourneyProps) {
  // Where each stop's pause stands in the world. Stops are given in journey progress
  // (the scroll); set pieces need world progress (distance along z). The path converts.
  const stopS = useMemo(() => nodes.map((node) => -path.getPointAt(node.t).z / JOURNEY_LENGTH), [nodes, path])

  return (
    <>
      <GreyBoxLandscape />
      {segments.map((segment) => {
        const Scene = SCENES[segment.type]
        return <Scene key={`${segment.type}-${segment.from}`} segment={segment} />
      })}
      <StopMarkers
        nodes={nodes.filter(isStop)}
        stopS={stopS.filter((_, i) => isStop(nodes[i]))}
      />
      {nodes.flatMap((node, i) =>
        (node.setPieces ?? []).map((ref) => {
          const { name, ...params } = typeof ref === 'string' ? { name: ref } : ref
          const Piece = SET_PIECES[name]
          if (!Piece) {
            console.warn(`Unknown set piece "${name}" at ${node.id}`)
            return null
          }
          return <Piece key={`${node.id}-${name}`} s={stopS[i]} t={node.t} params={params} />
        }),
      )}
    </>
  )
}
