# Handover: portfolio-maker

*Written 2026-09-25, at the end of the session that built v0.1–v0.3. Read this first, then
`CLAUDE.md` (the working rules), then `docs/design-doc.md` (the spec, and the source of truth).*

---

## 1. What this is

A portfolio told as a journey. The visitor scrolls, and a first-person camera walks a
traveller from the foot of a mountain to the sea. Each stop is a chapter of a life, and the
bigger the achievement, the grander the scenery. It's built with Three.js through React.

The engine (`src/`) is **generic**; a journey is defined by content (`content/`,
`public/media/`). That split is deliberate. It is what lets the engine become a template
later (design doc §11, v4).

**Status:** v0.3 of 1.0. You can scroll through a full grey-box world with a day-night
cycle, based on alpine reference photos. There are no story nodes yet.

---

## 2. Run it

```bash
npm install
npm run dev          # http://localhost:5180
npm run build        # typecheck + production build
npm run lint         # oxlint
npm run media        # the GDPR media gate (needs the raw photos locally; see §6)
```

- The port is fixed at **5180** (`strictPort`), because 5173 belongs to another project on
  the original machine. If you get "port in use", something is already serving it: open the
  URL, or stop that process.
- The server listens on `localhost` (IPv6 `::1`). Use `localhost`, not `127.0.0.1`.
- **Always test in a fresh tab or with a hard reload** (Ctrl+Shift+R) after big changes. A
  3D page that has taken dozens of hot updates can lock up.

Stack: Vite 8 · React 19 · TypeScript 6 · three r186 · @react-three/fiber 9 ·
@react-three/drei 10 (for `Line` only) · sharp (dev, for the media gate).

---

## 3. How it's built: the map

```
src/
├── App.tsx                    Canvas + JourneyScroll + CameraRail + Atmosphere + Journey
├── index.css                  #root is position:fixed; the page scrolls past it
├── engine/                    generic: knows nothing about mountains or vg
│   ├── JourneyScroll.tsx      page scroll → eased progress 0–1; requests frames on demand
│   ├── journeyProgress.ts     context + useJourneyProgress()
│   ├── journeyPath.ts         Route → CatmullRomCurve3 at eye height (EYE_HEIGHT 1.7 m)
│   ├── CameraRail.tsx         progress → camera on the path; layers transition moves
│   ├── cameraMove.ts          loads camera moves saved as three.js AnimationClip JSON
│   ├── Atmosphere.tsx         sky dome, fog, sun, ambient, stars, blended along progress
│   ├── look.ts                the Look type (one time-of-day)
│   ├── segments.ts            SceneType union, Segment, within()
│   ├── blend.ts               Stop<T>, smoothstep, bracket/blendNumber/blendColor
│   └── random.ts              seededRandom (mulberry32), hash3
├── scenes/
│   ├── Journey.tsx            landscape + one component per segment type
│   ├── greybox/
│   │   ├── terrain.ts         groundHeight(x,z): the ONE function mesh, path and props share
│   │   ├── layout.ts          SEGMENTS, LIGHTING schedule, TRANSITIONS
│   │   └── GreyBoxLandscape.tsx  terrain mesh, sea, river ribbon, lake, trail line
│   └── segments/              MountainBase … Beach, plus props.tsx (Spires, Boulders,
│                              Conifers, Building/MountainHut, Bivouac, SummitCross,
│                              Signpost, DeadRoots)
└── styles/presets/
    ├── painterlyAnime.ts      LOOKS: time-of-day palettes (ref = sampled from photos)
    └── motion/zoom-side-pan.json   the transition camera move (AnimationClip JSON)
scripts/clear-media.mjs        the media gate
content/media-clearance.json   what the gate did to each published photo
public/media/reference/        cleared media (currently one photo)
docs/design-doc.md             the spec: canonical copy
```

### The ideas that hold it together

1. **One height function.** `groundHeight(x, z)` in `terrain.ts` shapes the terrain mesh,
   and the same function places the camera path and every prop. Nothing floats and nothing
   sinks. The world is 3 km long (`JOURNEY_LENGTH`), shaped by `TRAIL_ELEVATION` stops (base
   camp 20 m → summit 260 m → beach 1.5 m). The valley walls differ left and right, so the
   ridge drops away into views.
2. **Progress 0–1 drives everything.** Scroll → `JourneyScroll` → progress. The camera sits
   at `path.getPointAt(progress)`, which is arc-length, so it moves at constant speed. The
   Atmosphere blends looks by progress, and transitions fire by progress.
3. **Segments are components.** `layout.ts` lists which scene type covers which stretch of
   progress. Each segment places its own props with `within(segment, u)`; `u > 1` is allowed
   for things seen from a segment but standing beyond it.
4. **Draw on demand.** `frameloop="demand"`: nothing renders while the page is still. A
   scroll requests frames until the easing settles.
5. **Seeded randomness.** Trees, boulders and spires use `seededRandom(seed)`, so the world is
   identical on every load.

---

## 4. What happened this session, in order

| Commit | What and why |
|---|---|
| `d6283ae` → `b6dc722` | Stock Vite react-ts scaffold; LF line endings; design doc copied in, with §12 Q4 settled as **TypeScript**; `CLAUDE.md` from design doc §10 |
| `f02f09e` | **v0.1**: spinning cube in a `<Canvas>` |
| `7380ff6` | **Q5 settled**: first-person traveller. *Sometimes* first-person video, which opened **Q13** |
| `c56efd9` | **v0.2**: camera rail over a heightfield |
| `1730c9a` | Raw reference photos gitignored (they carry GPS) |
| `42ede1a` | **v0.3**: nine segments, props, the Atmosphere with photo-sampled looks. Journey stretched to 3 km for walkable grades. The lake sits below a brow, because a lake is only visible from above |
| `93e97c7` | Recorded: reference-photo rules, and **the story is the owner's to write** |
| `6b0a9ee` | Performance for integrated GPUs (see §7) |
| `10ae0f8` | **zoom-side-pan** transition preset |
| `2a1a814` | **GDPR** became a standing rule |
| `dabdee7` | The media gate; one photo cleared (a hiker blurred to a generic figure) |
| `51cd97f` | **Fix: the camera froze while the scrollbar moved.** drei `ScrollControls` replaced by `JourneyScroll` |

### Where the scenes come from

The owner supplied 23 alpine trip photos as references; 17 nature photos were used, and 6
city shots were excluded. Their **capture times form one day**, and the lighting follows it:

| Progress | Look (`painterlyAnime.ts`) | Reference time |
|---|---|---|
| 0.00 | `pre-dawn` | 06:06: towers silhouetted behind dead roots |
| 0.09 | `morning` | 08:46: the hut in its stony bowl |
| 0.20 | `bright-morning` | 08:46: scree under deep blue |
| 0.32 | `mid-morning` | 09:02: the ridge, the bivouac, the valleys |
| 0.42 | `late-morning` | 11:16: limestone peaks |
| 0.50 | `afternoon` | 16:47: the summit cross |
| 0.57 → 1.00 | `golden-hour`, `dusk`, `night`, `dawn`, `finale` | **no photos yet**: marked `default` |

Colours marked `ref GOPR…` were sampled from those photos (k-means and band averages). Colours
marked `default` are stand-ins until a reference exists.

---

## 5. The camera preset (zoom-side-pan)

- **Asked for:** "a zoom in side pan… transitions can be warped… saved as an animation…
  natural, not very sudden."
- **What it does:** at each boundary between scenes, the camera zooms in (FOV → ~86%) while
  panning to one side (~12°) and glancing up slightly. It then briefly opens *wider* than
  normal (FOV ~105%, the warp) and settles.
- **Where it lives:** `src/styles/presets/motion/zoom-side-pan.json`, a genuine three.js
  `AnimationClip` in JSON. Tracks: `.fov` (a multiplier), `.yaw`, `.pitch` and `.roll` (degrees).
  Time runs 0 → 1.
- **Why it's never sudden:** smooth (Catmull-Rom) tracks get **zero-slope endings**
  (`cameraMove.ts`). Each window is 8% of the journey, about 7 mouse-wheel notches. Measured:
  FOV stays within 51.5°–63.3° and changes by ≤0.4° per 0.05% of scroll.
- **Where it plays:** `TRANSITIONS` in `layout.ts`, one per segment boundary, panning toward
  what's worth seeing there (`GLANCE`).
- **To make a new preset:** copy the JSON, change the numbers, `loadCameraMove()` it, and
  reference it in `TRANSITIONS`.

---

## 6. Privacy and GDPR: standing rules (non-negotiable)

- **Faces:** any recognisable person is blurred, redrawn as a *generic* person (e.g. looking
  away), or removed. This covers strangers, friends and family.
- **Metadata:** EXIF, and GPS above all, is stripped from everything that ships. The
  original GoPro photos embed GPS in most frames.
- **Other people's data:** no names, quotes or words of third parties without consent.
- **Raw originals never enter git or a build.** `Image feed/` is gitignored and Vite doesn't
  watch it.
- **The repo never references the owner's private notes or personal directories.** No
  absolute personal paths in committed files. `.claude/launch.json` is gitignored for that
  reason.

**The media gate (`npm run media`).** For each item in `content/media-clearance.json`:
1. applies the camera rotation,
2. blurs the listed regions with feathered edges (faces are pixelated first, so it can't be
   reversed),
3. resizes to 2048 px and writes WebP with **no metadata**,
4. verifies no metadata survived,
5. refuses items without `people: none | blurred | generic | removed`.

Region boxes are `[left, top, width, height]` in pixels of the rotated, full-size source.

Media status: `public/media/reference/gopr2915.webp` is cleared. The hiker beside the summit
cross faces the camera, so the figure is softly blurred and the face pixelated. Two city
photos with strangers' faces are excluded.

---

## 7. Lessons that cost time: read before changing things

1. **Test the real input path.** Setting scroll progress directly hid a bug: drei's
   `ScrollControls` never moved the camera on the owner's machine. Test by
   `window.scrollTo` + a `scroll` event + real-time frames.
2. **A hidden browser pane runs no animation frames.** It also doesn't deliver resize
   events, and screenshots of a scrolled page can come out blank. Step R3F by hand
   (`_roots.get(canvas).store.getState().advance(performance.now())`) and verify with
   `gl.readPixels`.
3. **Dual-GPU laptops render browsers on the integrated GPU** by default.
   `powerPreference: 'high-performance'` is only a hint. Measured on an Intel UHD at
   1920×1080: ~8 ms/frame median, 20 ms worst. Keep it that way (dpr 1, draw on demand, ~200k
   triangles). The user can switch the browser to the discrete GPU in Windows graphics
   settings.
4. **A lake needs to be seen from above.** From 1.7 m eye height, a lake's near rim hides its
   surface. The trail must crest a brow first.
5. **A narrow field of view hides side scenery.** Test compositions at a 16:9 aspect too.
6. **Vite's watcher crashes** if large files are being copied into the project while it runs
   (EBUSY). Keep raw media out of the watched tree, or ignore it.
7. **One idea per commit.** When a file carries two ideas, commit them separately.

---

## 8. Open questions (design doc §12) and what's next

| Open | Needed by |
|---|---|
| **Q9** Sunrise or sunset at the beach? The finale is currently a low warm sun ahead that reads as either | v0.3 is done; decide before the art pass |
| **Q13** First-person video: scrub or play? full-screen or in-scene? styled or raw? (suggested: scrub, full-screen, raw) | proposed v0.6 |
| Q2 stub tabs · Q11 identity & links · Q12 progress bar | v0.5 |
| Q3 stylization route · Q10 video in cards | v0.6 / v0.4 |
| Q6 voice · Q1 graduation date | v0.7 |
| Q7 sound · Q8 stall points | v1.0 |

**The story is the owner's to write.** Never draft node titles, text or easter eggs.
`[FROM CV]`, `[CONFIRM]` and `[PLACEHOLDER-IMG]` stay as they are until they supply them.

**Next milestone: v0.4, Nodes from JSON.**
- Load `content/journeys/masters.json` (schema in design doc §5).
- Place markers at each node's `t`.
- Show a hover card with drei `<Html>`: `sceneDescription` text while the media is a
  `placeholder`, or a cleared image from `public/media/`.
- Replace the hard-coded `SEGMENTS`/`LIGHTING` in `layout.ts` with values derived from the
  nodes (the `TODO(v0.4)` is there).
- Every media item needs `people` set, per the gate.

**Known rough edges:**
- The trail line glows at night (unlit line material). Fix in the art pass.
- The first transition's pan shows more slope than towers. Tune per transition.
- The blur on the cleared photo reaches slightly into the rocks under the hiker's feet.
- Village, river, delta and beach have no reference photos yet.

---

## 9. Working agreement (short form; the full text is in `CLAUDE.md`)

- Teach as you build: explain before each milestone, summarise after.
- Small commits, one idea each. Edit in place; never regenerate.
- Never invent content. Mark deferrals `// TODO(vX): …`.
- Report bugs with a proposed fix before applying one, unless the fix answers a problem the
  owner just reported.
