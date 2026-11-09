# Handover: portfolio-maker

*Written 2026-09-25 after v0.1–v0.3; **updated 2026-09-26 after semester 1** (see §0). Read this
first, then `CLAUDE.md` (the working rules), then `docs/design-doc.md` (the spec, and the
source of truth).*

---

## 0. Update 2026-09-26: semester 1 is built

**Status:** v0.4 in progress. The first quarter of the journey is **semester 1**, complete and
verified: a foothill river valley walked upstream, with seven stops, set pieces, pauses and
cards. The other three quarters still hold the v0.3 mountain-to-sea world, until the later
semesters are planned with the owner.

**Every §12 question is settled** (design doc §12, repo `CLAUDE.md` table). Two answers change
how you work:
- **Q6, voice:** node text is a minstrel telling the world about the owner. Claude drafts it,
  **only from facts the owner supplied**, and marks every draft `"draft": true` until approved.
- **Q11, identity:** no personal info. The project is being explored as a **tool for artists**,
  so keep everything person-specific in `content/`.

### How a stop works now

1. **Content** (`content/journeys/masters.json`): each stop has `t` (0–1 journey progress),
   `title`, `text`, `setPieces` (names), `gaze` (preset + side), and `sound` (a file slot).
2. **The pause:** `progressAtScroll()` (`engine/journeyProgress.ts`) adds a **flat stretch of
   ~110 px** (one wheel notch) at each stop's `t`. The arriving scroll holds; the next moves
   past. The page scroll is never blocked.
3. **The look:** `stopTransitions()` (`scenes/greybox/layout.ts`) turns each stop's `gaze` into
   a camera move centred on the stop. `look-aside.json` peaks at ~38° exactly where the pause
   holds, so the traveller looks at the set piece while the reader reads.
4. **Set pieces** (`scenes/setpieces/`, registry in `index.ts`) place themselves relative to the
   pause point `s` (world progress), which `Journey.tsx` converts from `t` through the path.
   A piece looking to the left at 38° should sit about `dx / tan(38°)` metres ahead.
5. **The card:** `StopTracker` publishes the active stop to `engine/stopStore.ts`, and
   `ui/StopCard.tsx` (outside the canvas) fades it in.
6. **Moving pieces:** `useAmbientZone(position, radius)` (`engine/ambient.ts`) keeps frames
   coming at ~30 fps only while the camera is near. Everywhere else still draws on demand.
7. **Sound:** `ui/SoundToggle.tsx`, off by default. The loop from the last-passed stop's `sound`
   file crossfades. Missing files are silent. The slots are listed in `public/audio/README.md`.

### Semester 1 at a glance

| t | Stop | Set piece |
|---|---|---|
| 0.000 | Joining the ABCD-Centre | trail-junction: the Bachelor's and work trails join; a tent |
| 0.045 | Contaminant Transport Modelling | sediment-flow down the river |
| 0.090 | Sustainable River Basin Management | river-village + water wheel (ω = flow / radius) |
| 0.135 | Physicochemical Treatment of Wastewater | windmill |
| 0.180 | Climate Adaptation and Coastal Engineering | seagulls; the sea glimpsed on the right (gaze strength 1.8) |
| 0.215 | Groundwater Engineering | well; a generic figure seen from behind hauls the bucket as you scroll |
| 0.250 | The first semester ends | (the mountain foot; the boundary camera move frames the towers) |

Measured on an Intel UHD at 1920×1080: 8–13 ms median per frame, 24 ms worst.

### New tools

- `npm run stylize`: repaint cleared photos through **OpenRouter** (`/api/v1/images`). A dry run
  by default; `-- --send` actually calls the model, which costs money. `OPENROUTER_API_KEY` and
  `OPENROUTER_IMAGE_MODEL` live in `.env` (gitignored; see `.env.example`), and **both are the
  owner's to set: never choose the model**. Only gate-cleared media can be sent. The prompt
  forbids adding or restoring faces, and outputs stay `"reviewed": false` until checked. The
  local-model provider is stubbed for v2.

### Public-release pass (2026-11-10)

- **Content:** `masters.json` now holds the owner's 28 items in their order: 24 stops plus four
  `"kind": "scenery"` nodes (basketball easter egg; sky-writing flights Chennai→Dresden and
  Aachen→Bangkok; the train-bridge "Movement to Aachen"). The text is the owner's, pruned. **No
  third-party names:** professors' names were removed per the GDPR rule. Six items (RWTH and UNU
  courses 22–26, the thesis body) await descriptions, so they show a title only.
- **Scenery nodes** never pause the scroll and never show a card. Set pieces take parameters from
  the journey file (`{ "name": "sky-writing", "text": …, "direction": … }`).
- **Words over the scene** are plain page elements, projected from 3D each frame
  (`useOverlayWords` in `SkyPieces.tsx`). drei's `Html` lost one of its roots under React's
  development double-mount, so don't use it here.
- **Privacy audit of `dist/`:** no dev paths, no secrets, no third-party names, zero external
  requests at runtime. The unused cleared photo now lives in gitignored `media-work/`; it is
  still in git history (commit dabdee7), which only matters if the repo itself is published.

### Landing screen (2026-11-09, text updated 2026-11-10)

The page opens on one screen with the title and a scroll hint, in large type over the valley
(`ui/Landing.tsx`, `ui/landingFade.ts`, `JourneyScroll introScreens={1}`). It fades over the
first 60% of a screen of scroll. The stop card and sound toggle stay hidden until it has gone.

### Waiting on the owner

- `[CONFIRM]` the start year: they wrote July 2026; the CV says July 2024 (July 2024 is used).
- Approve or rewrite the seven draft texts.
- Course dates within semester 1 (`[FROM VG]`).
- The tree species list from the Nevegal project (for the v0.6 big trees).
- Sound files for the seven slots. GDPR: no recognisable voices.
- The plan for semester 2 onward.

### Lessons added this session

- **Check that the promise matches the picture.** The coastal card said "look right: the sea",
  but the camera looked into a hill until the coastal lowland was lengthened and the gaze
  widened. Look at every stop.
- **Hidden-pane screenshots of a scrolled page come out blank.** Verify the scroll path with
  numbers (real `scrollTo` + scroll event), then take pictures by setting progress directly
  with the page at the top. The progress ref is the `ProgressContext` value in the R3F fiber tree.
- **The shell's quoted heredoc still broke on some text.** Write a script file and run it.

---

## 1. What this is

A portfolio told as a journey. The visitor scrolls, and a first-person camera walks a
traveller from the foot of a mountain to the sea. Each stop is a chapter of a life, and the
bigger the achievement, the grander the scenery. It's built with Three.js through React.

The engine (`src/`) is **generic**; a journey is defined by content (`content/`,
`public/media/`). That split is deliberate. It is what lets the engine become a template
later (design doc §11, v4).

**Status:** see §0. Semester 1 (the first quarter) has stops; the rest is the v0.3 world.

---

## 2. Run it

```bash
npm install
npm run dev          # http://localhost:5180
npm run build        # typecheck + production build
npm run lint         # oxlint
npm run media        # the GDPR media gate (needs the raw photos locally; see §6)
npm run stylize      # repaint cleared photos via OpenRouter: dry run; add -- --send to call (costs money)
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
