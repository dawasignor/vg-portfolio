import type { Look } from '../../engine/look'

// Style preset "painterly-anime" (design doc §3 input 6, §7.3).
// v0.3 holds its time-of-day looks; the post-processing look arrives in v0.6.
//
// "ref" = colours sampled from a reference photo taken at that time of day.
// "default" = no reference yet: a grey-box stand-in, to be replaced.
// Sun azimuth: 0 = ahead along the journey, +90 = right, 180 = behind.

export const LOOKS = {
  // ref GOPR2958–2960, 06:06: cold blue-grey sky, towers against it. Brightened
  // 2026-11-11 at the owner's request (the opening read as gloomy): lighter sky,
  // more ambient light, a little early sun.
  'pre-dawn': {
    zenith: '#6a7f99', horizon: '#bcc5cc',
    sun: '#e6d6c0', sunIntensity: 1.3, sunElevation: 10, sunAzimuth: 15,
    skyLight: '#a9b9ca', groundLight: '#4a4b46', ambientIntensity: 2.0,
    fogFar: 1900, stars: 0.05,
  },
  // ref GOPR2989–2990, 08:46: the hut's bowl, sun over the rim, bright cloud.
  morning: {
    zenith: '#3a6392', horizon: '#ccdce8',
    sun: '#fff1dc', sunIntensity: 2.4, sunElevation: 28, sunAzimuth: -70,
    skyLight: '#7aa6cf', groundLight: '#645e56', ambientIntensity: 1.3,
    fogFar: 2200, stars: 0,
  },
  // ref GOPR2986, 08:46 (horizon from GOPR2999): deep blue over sunlit scree.
  'bright-morning': {
    zenith: '#1f5aa0', horizon: '#879eb7',
    sun: '#fff6e8', sunIntensity: 2.8, sunElevation: 38, sunAzimuth: -100,
    skyLight: '#5379a6', groundLight: '#bfb6ab', ambientIntensity: 1.2,
    fogFar: 2600, stars: 0,
  },
  // ref GOPR2998–3001, 09:02: on the ridge, valleys hazy far below.
  'mid-morning': {
    zenith: '#2d518e', horizon: '#a0b0c7',
    sun: '#fff6ea', sunIntensity: 2.7, sunElevation: 42, sunAzimuth: 110,
    skyLight: '#4e77b5', groundLight: '#42474c', ambientIntensity: 1.3,
    fogFar: 2600, stars: 0,
  },
  // ref GOPR3025, 11:16: high cloud, softer light on warm grey rock.
  'late-morning': {
    zenith: '#687991', horizon: '#b7c0ca',
    sun: '#f4f1ea', sunIntensity: 2.0, sunElevation: 55, sunAzimuth: 150,
    skyLight: '#9a9ea2', groundLight: '#6f675d', ambientIntensity: 1.5,
    fogFar: 2000, stars: 0,
  },
  // ref GOPR2913–2915, 16:47: soft blue, cirrus, the summit cross.
  afternoon: {
    zenith: '#7288aa', horizon: '#adbed1',
    sun: '#fbf0dc', sunIntensity: 2.3, sunElevation: 32, sunAzimuth: 80,
    skyLight: '#859dbf', groundLight: '#484038', ambientIntensity: 1.3,
    fogFar: 2300, stars: 0,
  },
  // default
  'golden-hour': {
    zenith: '#5b6e97', horizon: '#efc38e',
    sun: '#ffbe78', sunIntensity: 2.2, sunElevation: 9, sunAzimuth: 50,
    skyLight: '#c9a27e', groundLight: '#4a3d30', ambientIntensity: 1.1,
    fogFar: 1900, stars: 0,
  },
  // default
  dusk: {
    zenith: '#2c3558', horizon: '#c98a7a',
    sun: '#ff9a6a', sunIntensity: 0.9, sunElevation: 1, sunAzimuth: 35,
    skyLight: '#6c5d78', groundLight: '#231d24', ambientIntensity: 0.9,
    fogFar: 1500, stars: 0.35,
  },
  // default: moonlight
  night: {
    zenith: '#070b1a', horizon: '#1b2340',
    sun: '#9fb2e0', sunIntensity: 0.45, sunElevation: 40, sunAzimuth: -40,
    skyLight: '#2a3558', groundLight: '#06070b', ambientIntensity: 0.7,
    fogFar: 1100, stars: 1,
  },
  // default
  dawn: {
    zenith: '#2f4270', horizon: '#e3a57e',
    sun: '#ffc49a', sunIntensity: 1.7, sunElevation: 4, sunAzimuth: -10,
    skyLight: '#a3a5bf', groundLight: '#3d3640', ambientIntensity: 1.4,
    fogFar: 1600, stars: 0.15,
  },
  // default. Low warm sun straight ahead over the sea, which reads as either
  // sunrise or sunset. Which one is still open: design doc §12 Q9. [CONFIRM]
  finale: {
    zenith: '#4d6fa6', horizon: '#f6d3a4',
    sun: '#ffd08e', sunIntensity: 2.2, sunElevation: 7, sunAzimuth: 0,
    skyLight: '#c7b59c', groundLight: '#5a4a3a', ambientIntensity: 1.2,
    fogFar: 3000, stars: 0,
  },
} satisfies Record<string, Look>
