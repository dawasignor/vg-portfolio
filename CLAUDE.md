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
To be added at the milestone that needs each one: `@react-three/drei` (v0.2: scroll,
curves, `Html` cards), `@react-three/postprocessing` (v0.6: the painterly look), and
GSAP only if drei's scroll turns out not to be enough.

## Where the build stands (design doc §9)

- [x] **v0.1 Scaffold.** Vite + React + R3F, git, this file, a spinning cube (2026-09-25)
- [ ] v0.2 Camera rail
- [ ] v0.3 Segments & light
- [ ] v0.4 Nodes from JSON
- [ ] v0.5 UI shell
- [ ] v0.6 Art pass
- [ ] v0.7 Content pass
- [ ] v1.0 Polish

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5180 in a desktop browser.

⚠️ The parent folder of this repo belongs to an unrelated project with its own
`node_modules`. Node looks upward for packages, so a dependency missing from this repo's
`package.json` can resolve silently to the wrong copy. Install every import here.
