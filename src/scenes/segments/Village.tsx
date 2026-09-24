import { within, type SegmentProps } from '../../engine/segments'
import { Building, Conifers } from './props'

// A village in the valley below the pass. No reference photo yet: grey-box.

const HOUSES = [
  { u: 0.3, dx: 34, rotation: 0.2 },
  { u: 0.36, dx: -38, rotation: -0.1 },
  { u: 0.45, dx: 48, rotation: 0.5 },
  { u: 0.5, dx: -32, rotation: 0.1 },
  { u: 0.58, dx: 36, rotation: -0.3 },
  { u: 0.66, dx: -46, rotation: 0.3 },
  { u: 0.72, dx: 60, rotation: 0 },
]

export function Village({ segment }: SegmentProps) {
  return (
    <>
      {HOUSES.map((house) => (
        <Building
          key={house.u}
          s={within(segment, house.u)}
          dx={house.dx}
          rotation={house.rotation}
          width={10}
          depth={8}
          height={7}
        />
      ))}
      <Conifers from={segment.from} to={segment.to} count={180} seed={61} minOffset={70} />
    </>
  )
}
