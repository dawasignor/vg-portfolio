import type { ComponentType } from 'react'
import type { Segment, SceneType, SegmentProps } from '../engine/segments'
import { GreyBoxLandscape } from './greybox/GreyBoxLandscape'
import { AlpineLake } from './segments/AlpineLake'
import { Beach } from './segments/Beach'
import { Delta } from './segments/Delta'
import { ForestSlope } from './segments/ForestSlope'
import { MountainBase } from './segments/MountainBase'
import { Ridge } from './segments/Ridge'
import { RiverValley } from './segments/RiverValley'
import { SummitPass } from './segments/SummitPass'
import { Village } from './segments/Village'

// One component per scene type (design doc §8.3).
const SCENES: Record<SceneType, ComponentType<SegmentProps>> = {
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

// The whole world: the continuous landscape, plus each segment's own scenery.
export function Journey({ segments }: { segments: ReadonlyArray<Segment> }) {
  return (
    <>
      <GreyBoxLandscape />
      {segments.map((segment) => {
        const Scene = SCENES[segment.type]
        return <Scene key={`${segment.type}-${segment.from}`} segment={segment} />
      })}
    </>
  )
}
