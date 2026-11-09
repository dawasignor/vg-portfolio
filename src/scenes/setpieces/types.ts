/** Every set piece gets the stop it belongs to: where the reader pauses. */
export type SetPieceProps = {
  /** World progress (z) of the pause, 0–1. Set pieces place themselves relative to it. */
  s: number
  /** Journey progress (scroll) of the pause, 0–1, for pieces that move with the scroll. */
  t: number
  /** Extra values from the journey file, e.g. { text, direction } for sky-writing. */
  params: Record<string, unknown>
}
