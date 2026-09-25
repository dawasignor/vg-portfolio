# CLAUDE.md: portfolio-maker

Read `docs/design-doc.md` before doing any work. It is the single source of truth. This
file holds its §10 working agreement, the decisions settled so far, and where the build
stands.

## Working agreement (design doc §10)

- **Teach as you build.** vg is learning the stack. Before each milestone, explain the
  concepts in plain language. After it, summarise what changed and why.
- **Small steps, small commits.** One idea per commit, with a readable message.
- **Edit in place.** Never regenerate the whole project to make a change.
- **Never invent content.** Leave `[FROM CV]`, `[CONFIRM]` and `[PLACEHOLDER-IMG]` untouched
  unless vg supplies the content.
- **Privacy.** This repo must not reference, link, copy from, or reveal the path of vg's
  private notes or any other personal directory. That includes absolute paths in committed
  config. `.claude/launch.json` is gitignored for this reason.
- **GDPR, strictly (vg's rule, 2026-09-25).** Treat every photo and video as personal data
  until it's cleared:
  - **Faces:** any person who could be recognised is **blurred**, or redrawn as a *generic*
    person (e.g. seen from behind, looking away), or, as a last resort, **removed**. This
    covers strangers, friends and family. vg decides about their own face.
  - **Location and metadata:** EXIF is stripped from everything that ships, GPS above all.
  - **Other people's words and names** (interviewees, villagers) never appear without consent.
  - **Minimise:** keep only what the page needs. Raw originals never enter git or a build.
- **Keep the engine and the content apart.** Nothing about vg goes in `src/`. Everything
  personal lives in `content/` and `public/media/`. That separation is what lets the engine
  become a template later (§11, v4).
- **Mark deferrals** with `// TODO(v2|v3|v4|v1.x): …` so they're greppable.
- **Skills:** use a suitable frontend/Three.js skill if one is available. Once the v0.4
  patterns are stable, write a project skill in `.claude/skills/uyir-scene-builder/`
  that captures how to add a node and a scene segment.

## Settled decisions

| Question | Decision | When |
|---|---|---|
| §12 Q4 Language | TypeScript | 2026-09-25 |
| §12 Q5 Traveller | First-person: the camera is the traveller. Sometimes a first-person video (details: open Q13) | 2026-09-25 |
| Dev server | Port **5180**, `strictPort`. 5173 is taken by another project on this machine | 2026-09-25 |

Every other §12 question is still open. Ask about it when its milestone arrives, and don't
pick an answer yourself.

## Stack (design doc §8.1)

Vite · React · TypeScript · Three.js via React Three Fiber (`@react-three/fiber`).
`@react-three/drei` (for `Line`; `Html` cards come at v0.4). **Not** drei's `ScrollControls`:
it left the camera frozen on vg's machine (see `JourneyScroll`, below). `sharp` (dev only) runs
the media gate. To be added at the milestone that needs it: `@react-three/postprocessing`
(v0.6: the painterly look).

**Start with `docs/HANDOVER.md`** for the full picture of what exists and why.

## Where the build stands (design doc §9)

- [x] **v0.1 Scaffold.** Vite + React + R3F, git, this file, a spinning cube (2026-09-25)
- [x] **v0.2 Camera rail.** First-person rail over a grey-box heightfield, scroll 0–1 → t (2026-09-25)
- [x] **v0.3 Segments & light.** Nine segment components, photo-referenced looks, a day-night cycle (2026-09-25)
- [ ] v0.4 Nodes from JSON
- [ ] v0.5 UI shell
- [ ] v0.6 Art pass
- [ ] v0.7 Content pass
- [ ] v1.0 Polish

## The media gate (GDPR): nothing ships until it passes

Every media item must record `people`, meaning what was done about people in it:
`none` · `blurred` · `generic` · `removed`. A missing value means **not cleared**, and the
item must not be published. Nothing enters `public/media/` except through the gate below.

**`npm run media`** runs the gate: for each item in `content/media-clearance.json` it applies
the camera's rotation, blurs the listed regions (faces are pixelated first, so the blur
can't be reversed), resizes to 2048 px, writes WebP with **no metadata**, verifies that,
and refuses any item without a `people` value. The regions are recorded in the manifest,
so every edit can be reproduced and accounted for.

Cleared so far: `public/media/reference/gopr2915.webp`. The summit cross, with one hiker
**facing the camera**, blurred to a generic figure (vg's decision, 2026-09-25).
GOPR2784 and GOPR2785 show strangers' faces and stay excluded.

## Reference photos and the story (2026-09-25)

- `Image feed/` holds vg's raw alpine reference photos. It is **gitignored and must stay
  that way**: the files are large, and most carry **GPS coordinates in their EXIF**. Read
  them for shape, colour and light only. Anything that ships goes to `public/media/`, resized
  and with EXIF stripped, through `npm run media` (see the media gate above).
- Palettes marked `ref GOPR…` in `src/styles/presets/` and `src/scenes/` were sampled
  from those photos. `default` means there's no reference yet.
- **The story is vg's to write.** vg said so explicitly: *"lets work on the story later,
  ill do it myself."* Don't draft node titles, text or easter eggs. The `[FROM CV]` and
  `[CONFIRM]` slots stay as they are until vg fills them.

## How the rail works

- `src/engine/journeyPath.ts` samples a `Route`'s ground along its trail and threads a
  `CatmullRomCurve3` through the samples, one `EYE_HEIGHT` up. Scene code supplies the route.
- `src/engine/JourneyScroll.tsx`: the page itself scrolls (10 screens tall); the canvas is
  fixed behind it (`index.css`). A window scroll listener sets the target progress and
  requests a frame; the easing in `useFrame` keeps requesting frames only until it catches up
  (`frameloop="demand"`).
- `src/engine/CameraRail.tsx` reads that progress each frame: `t` → `getPointAt(t)` for the
  position, the tangent for the look direction, plus any transition camera move on top.
- `src/scenes/greybox/terrain.ts` is the placeholder world: one `groundHeight(x, z)`
  that both the mesh and the path read.

**Testing in a hidden Browser pane:** no animation frames run there. Test the *real* scroll
path: `window.scrollTo(…)`, then `dispatchEvent(new Event('scroll'))`, then step frames by hand
(`_roots.get(canvas).store.getState().advance(performance.now())`) with real time between
them, because the easing uses elapsed time. Never set the progress directly: that skipped the
scroll path and hid a bug that froze the site for vg. Screenshots of a scrolled page can come
out blank in a hidden pane; read pixels with `gl.readPixels` instead.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5180 in a desktop browser.

⚠️ The parent folder of this repo belongs to an unrelated project with its own
`node_modules`. Node looks upward for packages, so a dependency missing from this repo's
`package.json` can resolve silently to the wrong copy. Install every import here.
