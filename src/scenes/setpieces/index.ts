import type { ComponentType } from 'react'
import { Seagulls, TrailJunction, Well, Windmill } from './LandPieces'
import { RiverVillage, SedimentFlow } from './RiverPieces'
import { Basketball, SkyWriting, TrainBridge } from './SkyPieces'
import type { SetPieceProps } from './types'

// The set-piece library. A journey's stops ask for pieces by name
// (content/journeys/*.json, "setPieces"); nothing here knows whose journey it is.
export const SET_PIECES: Record<string, ComponentType<SetPieceProps>> = {
  'trail-junction': TrailJunction,
  'sediment-flow': SedimentFlow,
  'river-village': RiverVillage,
  windmill: Windmill,
  seagulls: Seagulls,
  well: Well,
  basketball: Basketball,
  'sky-writing': SkyWriting,
  'train-bridge': TrainBridge,
}
