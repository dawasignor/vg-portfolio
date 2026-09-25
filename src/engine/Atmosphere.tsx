import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Fog,
  MathUtils,
  Vector3,
  type DirectionalLight,
  type HemisphereLight,
  type Mesh,
  type Points,
  type PointsMaterial,
  type ShaderMaterial,
} from 'three'
import { bracket, type Stop } from './blend'
import { useJourneyProgress } from './journeyProgress'
import type { Look } from './look'
import { seededRandom } from './random'

const SKY_RADIUS = 4000
const STAR_RADIUS = 3500
const STAR_COUNT = 2500

// The sky is a huge ball around the camera, painted from the inside: horizon
// colour at eye level fading to the zenith colour straight up.
const skyVertex = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFragment = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  varying vec3 vDirection;
  void main() {
    float up = clamp(normalize(vDirection).y, 0.0, 1.0);
    gl_FragColor = vec4(mix(horizon, zenith, pow(up, 0.5)), 1.0);
    #include <colorspace_fragment>
  }
`

type ParsedLook = {
  [K in keyof Look]: Look[K] extends string ? Color : number
}

function parseLook(look: Look): ParsedLook {
  return {
    ...look,
    zenith: new Color(look.zenith),
    horizon: new Color(look.horizon),
    sun: new Color(look.sun),
    skyLight: new Color(look.skyLight),
    groundLight: new Color(look.groundLight),
  }
}

// Scratch values reused every frame.
const sunDirection = new Vector3()
const lerp = MathUtils.lerp

// Time of day along the journey (design doc §4.1, §8.3): each frame, the scroll
// position picks a spot between two looks in the schedule and blends sky, fog,
// sun, ambient light and stars between them. Must sit inside <JourneyScroll>.
export function Atmosphere({ schedule }: { schedule: ReadonlyArray<Stop<Look>> }) {
  const progress = useJourneyProgress()
  const looks = useMemo(
    () => schedule.map(([at, look]) => [at, parseLook(look)] as const),
    [schedule],
  )
  const skyUniforms = useMemo(
    () => ({ zenith: { value: new Color() }, horizon: { value: new Color() } }),
    [],
  )
  const starGeometry = useMemo(() => {
    const random = seededRandom(7)
    const positions = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = random() * Math.PI * 2
      const y = random() // upper half of the sky only
      const ring = Math.sqrt(1 - y * y)
      positions.set([ring * Math.cos(theta), y, ring * Math.sin(theta)], i * 3)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.scale(STAR_RADIUS, STAR_RADIUS, STAR_RADIUS)
    return geometry
  }, [])

  const sky = useRef<Mesh>(null)
  const stars = useRef<Points>(null)
  const sun = useRef<DirectionalLight>(null)
  const ambient = useRef<HemisphereLight>(null)

  useFrame(({ camera, scene }) => {
    if (!sky.current || !stars.current || !sun.current || !ambient.current) return
    const [a, b, u] = bracket(looks, progress.current.offset)

    const skyMaterial = sky.current.material as ShaderMaterial
    const horizon = skyMaterial.uniforms.horizon.value as Color
    ;(skyMaterial.uniforms.zenith.value as Color).lerpColors(a.zenith, b.zenith, u)
    horizon.lerpColors(a.horizon, b.horizon, u)
    sky.current.position.copy(camera.position)

    if (scene.fog instanceof Fog) {
      scene.fog.color.copy(horizon)
      scene.fog.far = lerp(a.fogFar, b.fogFar, u)
    }

    const elevation = MathUtils.degToRad(lerp(a.sunElevation, b.sunElevation, u))
    const azimuth = MathUtils.degToRad(lerp(a.sunAzimuth, b.sunAzimuth, u))
    sunDirection.set(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      -Math.cos(azimuth) * Math.cos(elevation),
    )
    sun.current.position.copy(sunDirection).multiplyScalar(1000)
    sun.current.color.lerpColors(a.sun, b.sun, u)
    sun.current.intensity = lerp(a.sunIntensity, b.sunIntensity, u)

    ambient.current.color.lerpColors(a.skyLight, b.skyLight, u)
    ambient.current.groundColor.lerpColors(a.groundLight, b.groundLight, u)
    ambient.current.intensity = lerp(a.ambientIntensity, b.ambientIntensity, u)

    const starOpacity = lerp(a.stars, b.stars, u)
    stars.current.visible = starOpacity > 0.01
    ;(stars.current.material as PointsMaterial).opacity = starOpacity
    stars.current.position.copy(camera.position)
  })

  return (
    <>
      <mesh ref={sky} renderOrder={-2} frustumCulled={false}>
        <sphereGeometry args={[SKY_RADIUS, 32, 16]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={skyUniforms}
          vertexShader={skyVertex}
          fragmentShader={skyFragment}
        />
      </mesh>
      <points ref={stars} geometry={starGeometry} renderOrder={-1} frustumCulled={false}>
        <pointsMaterial size={1.6} sizeAttenuation={false} transparent depthWrite={false} fog={false} />
      </points>
      <hemisphereLight ref={ambient} />
      <directionalLight ref={sun} />
    </>
  )
}
