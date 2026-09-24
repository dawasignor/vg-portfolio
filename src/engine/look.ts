/**
 * One time-of-day look (design doc §4.1, §8.3). Colours are CSS hex strings,
 * angles are degrees. The Atmosphere blends between looks as you scroll.
 */
export type Look = {
  /** Sky straight overhead. */
  zenith: string
  /** Sky at the horizon. Distant land fades into this colour (the fog). */
  horizon: string
  sun: string
  sunIntensity: number
  /** 0 = on the horizon, 90 = overhead. */
  sunElevation: number
  /** 0 = straight ahead along the journey, +90 = to the right, 180 = behind. */
  sunAzimuth: number
  /** Ambient light from the sky above … */
  skyLight: string
  /** … and bounced up from the ground. */
  groundLight: string
  ambientIntensity: number
  /** Metres until land fully fades into the horizon. */
  fogFar: number
  /** 0 = no stars, 1 = a full night sky. */
  stars: number
}
