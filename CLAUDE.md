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
`@react-three/drei` (since v0.2: `ScrollControls`, `Line`; `Html` cards come at v0.4).
To be added at the milestone that needs it: `@react-three/postprocessing` (v0.6: the painterly look), and
GSAP only if drei's scroll turns out not to be enough.

## Where the build stands (design doc §9)

- [x] **v0.1 Scaffold.** Vite + React + R3F, git, this file, a spinning cube (2026-09-25)
- [x] **v0.2 Camera rail.** First-person rail over a grey-box heightfield, scroll 0–1 → t (2026-09-25)
- [x] **v0.3 Segments & light.** Nine segment components, photo-referenced looks, a day-night cycle (2026-09-25)
- [ ] v0.4 Nodes from JSON
- [ ] v0.5 UI shell
- [ ] v0.6 Art pass
- [ ] v0.7 Content pass
- [ ] v1.0 Polish

## Reference photos and the story (2026-09-25)

- `Image feed/` holds vg's raw alpine reference photos. It is **gitignored and must stay
  that way**: the files are large, and most carry **GPS coordinates in their EXIF**. Read
  them for shape, colour and light only. Anything that ships goes to `public/media/`, resized
  and with EXIF stripped (the media prep step is still to be built; see §8.4).
- Palettes marked `ref GOPR…` in `src/styles/presets/` and `src/scenes/` were sampled
  from those photos. `default` means there's no reference yet.
- **The story is vg's to write.** vg said so explicitly: *"lets work on the story later,
  ill do it myself."* Don't draft node titles, text or easter eggs. The `[FROM CV]` and
  `[CONFIRM]` slots stay as they are until vg fills them.

## How the rail works (v0.2)

- `src/engine/journeyPath.ts` samples a `Route`'s ground along its trail and threads a
  `CatmullRomCurve3` through the samples, one `EYE_HEIGHT` up. Scene code supplies the route.
- `src/engine/CameraRail.tsx` runs each frame inside `<ScrollControls>`: scroll offset →
  `t` → `getPointAt(t)` for position, and the tangent for the look direction.
- `src/scenes/greybox/terrain.ts` is the placeholder world: one `groundHeight(x, z)`
  that both the mesh and the path read.

**Testing in a hidden Browser pane:** no animation frames run there, and drei ignores
scroll events until its first frame, so real scrolling can't be tested. Drive R3F by hand
instead: get the root from `@react-three/fiber`'s `_roots` for the canvas, set drei's
scroll state (found in the R3F fiber tree) and call `store.getState().advance(ts)`.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5180 in a desktop browser.

⚠️ The parent folder of this repo belongs to an unrelated project with its own
`node_modules`. Node looks upward for packages, so a dependency missing from this repo's
`package.json` can resolve silently to the wrong copy. Install every import here.
