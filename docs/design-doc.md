# Uyir Nadhi — Design & Implementation Doc

**Status:** Draft v0.1 (open questions in §12 still to be settled)
**Owner:** vg
**Audience:** vg + Claude Code (working together, with vg learning the stack along the way)

---

## 0. How to use this doc

This doc is the single source of truth for building Uyir Nadhi v1. Claude Code should read it before any work and follow §10 (Working agreement). Anything marked `TODO` is intentionally not built in v1. Anything marked `[CONFIRM]` or `[FROM CV]` is a placeholder that vg must fill or approve; never invent content to replace it.

Tags used throughout:

| Tag | Meaning |
|---|---|
| `TODO` | Deliberately deferred; leave a visible stub in code with a `// TODO(version):` comment |
| `[FROM CV]` | Content to be taken from vg's CV |
| `[CONFIRM]` | Drafted from context, vg must confirm before it ships |
| `[PLACEHOLDER-IMG]` | Scene description standing in for a stylized travel photo vg will supply |

---

## 1. Vision

A life flows like a river: it starts in the mountains, meets obstacles, changes course, and ends at the sea. Uyir Nadhi is a portfolio site told as a journey. A traveller with hiking gear sets off from the base of a mountain and walks towards the sea; every stop on the way is a chapter of vg's life, and the grander the achievement, the grander the scenery at that stop.

The experience is cinematic and scroll-driven, in the spirit of mont-fort.com: the visitor scrolls, the camera travels through a continuous landscape, and content surfaces as they arrive at each place.

---

## 2. v1 scope

### In v1
- One complete journey: **the Master's journey, July 2024 → graduation**, 10–15 story nodes, chronological from mountain base to seafront.
- Scroll-driven camera travelling along a path through connected scene segments (mountain, forest, ridge, lake, village, river valley, delta, beach).
- Story nodes that show media (image or video) and text on hover.
- Tab bar with **Master's** (active), **Bachelor's** and **Travels** (present as stubs, see §12 Q2).
- **Personal / Public toggle** in the UI that does nothing yet. `TODO(v2)`.
- A stylized "hand-painted" art direction, first style: Ghibli-inspired (see §7).
- Desktop only. `TODO(v1.x)`: tablet, then mobile.
- Content and media stored locally in the git repo; runs on vg's PC.

### Not in v1
Backend/uploads, hosting, marketplace, mobile, working visibility toggle, Bachelor's and Travels content. See §11.

---

## 3. Inputs that customise the boilerplate

The engine is generic; a journey is defined entirely by these inputs. Keeping this list clean now is what makes the future marketplace (§11, v4) possible.

1. **CV** — source of milestones, dates, titles, awards. `[FROM CV]`
2. **Journey definition** — which CV section becomes which tab (Master's, Bachelor's, Travels…), start/end scenes.
3. **Story nodes** — per node: date, title, short text, achievement magnitude, scene type, time of day, easter eggs (schema in §5).
4. **Media** — travel photos and videos, stylized into the chosen art style.
5. **Scene descriptions** — text placeholders that describe each node's image until the stylized image exists.
6. **Style preset** — colour palette, lighting mood, post-processing look (v1: Ghibli-inspired).
7. **Site identity** — name shown on site, title, contact links. `[CONFIRM]` see §12 Q11.
8. **Visibility flags** — per node `public` / `personal` (stored now, used from v2).

---

## 4. Experience design

### 4.1 Arc of the Master's journey

| Stage | Landscape | Mood / light |
|---|---|---|
| Opening | Base of the mountain; traveller packing gear at a base camp. Stands for everything before the Master's, and gearing up for it. | Pre-dawn blue, cold, quiet |
| Ascent | Forest slopes, switchbacks, first views | Morning |
| High country | Ridge, peaks, alpine lakes, other mountains in the distance | Midday to golden hour; bigger achievements get the bigger vistas |
| Crossing | Pass over the summit, descent into valleys and villages | Dusk into night (stars, lantern light) |
| River | Following a river down through valleys | Night into dawn |
| Finale | River mouth meeting the sea; traveller on the beach at sunrise/sunset. **Graduation.** `[CONFIRM]` §12 Q9 | Warm, open, wide |

Day and night alternate through the journey; lighting is cinematic throughout, not uniformly dark.

### 4.2 Interaction
- **Scroll** moves the traveller/camera forward along the path; scrolling up goes back in time.
- **First person** (§12 Q5, settled 2026-09-25): the camera *is* the traveller. There is no hiker figure on screen.
- **First-person video, sometimes**: at chosen stops the 3D view gives way to real first-person footage, then returns to the landscape. How it behaves is §12 Q13. `[CONFIRM]`
- At each node the scroll **slows or holds briefly** (a "stall point") so the visitor can take it in. `[CONFIRM]` §12 Q8
- **Hovering** a node marker opens a card with the image/video and text. Moving away closes it.
- **Tabs** switch journeys (reload a different journey definition into the same engine).
- **Personal/Public toggle**: visual only in v1. `TODO(v2)`
- A small progress indicator (e.g., a thin river line with dots) shows where you are in the journey and lets you jump to a node. `[CONFIRM]`

### 4.3 Achievement magnitude → scene grandeur
Each node has `magnitude` 1–5. The scene system uses it to scale the moment:

| Magnitude | Example treatment |
|---|---|
| 1 | Small trail marker, close framing |
| 2 | Clearing with a view |
| 3 | Lake or village, wider camera |
| 4 | Ridge vista, birds, dramatic light |
| 5 | Summit or sea: widest shot, hero lighting, slow camera |

---

## 5. Story node schema

Content lives in `content/journeys/<journey-id>.json`. Nodes are stored in chronological order (oldest first), regardless of the CV's recent-first order.

```json
{
  "id": "masters",
  "title": "Master's journey",
  "period": { "start": "2024-07", "end": "[CONFIRM]" },
  "stylePreset": "painterly-anime",
  "nodes": [
    {
      "id": "m01-base-camp",
      "t": 0.0,
      "date": "2024-07",
      "title": "[FROM CV]",
      "text": "[FROM CV]",
      "magnitude": 2,
      "sceneType": "mountain-base",
      "timeOfDay": "pre-dawn",
      "visibility": "public",
      "sceneDescription": "[PLACEHOLDER-IMG] Base camp at the foot of a mountain…",
      "easterEggs": ["…", "…"],
      "media": [
        { "type": "image", "src": "media/masters/m01.webp", "alt": "…", "status": "placeholder" }
      ]
    }
  ]
}
```

Field notes:
- `t` — position along the camera path, 0 (start) to 1 (end). Auto-spaced by default; can be hand-tuned.
- `sceneType` — one of the segment types in §8.3.
- `visibility` — `public` | `personal`. Stored now, ignored until v2.
- `media[].status` — `placeholder` | `raw` | `stylized`. While `placeholder`, the card shows `sceneDescription` as styled text instead of an image.

---

## 6. Master's journey — node skeleton

Draft structure only. Titles and dates come from the CV `[FROM CV]`; the CV was not attached to this draft, so most slots are empty on purpose. Items marked `[CONFIRM]` are drawn from earlier conversation and need vg's approval.

| # | Stage | Content | Mag. | Scene & light | Easter egg ideas |
|---|---|---|---|---|---|
| 1 | Opening | Gearing up for the Master's, July 2024 | 2 | Base camp, pre-dawn | A packed rucksack with a boarding-pass bookmark; a map with the route inked in |
| 2 | Ascent | `[FROM CV]` first semester / arrival | 1–2 | Forest trail, morning | A trail sign in a new language |
| 3 | Ascent | `[FROM CV]` | `[ ]` | Forest slope | `[ ]` |
| 4 | Ascent | Nevegal forestry workshop `[CONFIRM]` | 3 | Dolomite peaks above spruce/larch forest; the pink alpenglow on the rock at dusk | A measuring tape wrapped around a tree trunk; a field notebook on a stump |
| 5 | High country | `[FROM CV]` | `[ ]` | Alpine lake | `[ ]` |
| 6 | High country | `[FROM CV]` award/publication? | 4 | Ridge vista, birds | `[ ]` |
| 7 | High country | `[FROM CV]` | `[ ]` | Village in a valley | `[ ]` |
| 8 | Crossing | Thesis begins: flood impact assessment `[CONFIRM]` | 4 | Summit pass, storm clouds clearing | A satellite tracing across the night sky; a rain gauge by the path |
| 9 | Crossing | Thesis mid-review, Aug 2026 `[CONFIRM]` | 3 | Halfway cairn, night, stars | A stone cairn with one stone for each chapter |
| 10 | River | Thesis case study, Kelani River `[CONFIRM]` | 4 | River valley at dawn | A paper boat on the water |
| 11 | River | `[FROM CV]` | `[ ]` | Delta, wide water | `[ ]` |
| 12 | Finale | Graduation `[CONFIRM]` date | 5 | Beach, sunrise or sunset `[CONFIRM]` | The traveller's boots left on the sand |

Add or remove rows to land at 10–15 nodes once the CV is in.

> **2026-09-25, test phase:** the v0.3 scenes are built from vg's alpine reference photos,
> good nature images standing in while the story waits. **vg will write the story
> themselves, later** (v0.7). Nothing in this table gets drafted for them.

---

## 7. Art pipeline: photos → painted scenes

### 7.1 What "wiring real photos into animation" usually means
Sites like this rarely model everything in 3D. Common techniques:
- **2.5D parallax layers** — a photo is split into foreground, midground and background cut-outs placed at different depths; the camera moving past them creates depth. Cheap, beautiful, and works with any art style.
- **Depth-map displacement** — a depth map (can be generated automatically from a photo) pushes a flat image into gentle 3D relief.
- **Painted backdrops + simple 3D** — stylized images as skies and distant scenery, with a few low-poly 3D elements (trees, path, water) in front.
- **Post-processing looks** — a screen-wide filter (e.g., a painterly "Kuwahara" filter, soft bloom, colour grading) makes everything, including plain photos, read as painted.

### 7.2 Where the stylization happens
An honest constraint: Claude (in chat or in Claude Code) does not itself turn a photo into a painting. A Claude skill can **orchestrate** a stylization step, but something else has to do the image work. Three routes:

| Route | How | Pros | Cons |
|---|---|---|---|
| A. External tool, manual | vg stylizes photos in an image tool, saves into `public/media/…` | Simplest; zero code | Manual per image; consistency depends on vg |
| B. Local image model, scripted | A local img2img pipeline (e.g., Stable Diffusion via ComfyUI) with a painterly/anime style; a Claude Code skill runs the script over a folder | Repeatable, consistent, batchable | Needs a decent GPU and setup time |
| C. In-browser shader | Photos stay raw; a Three.js post-processing filter paints them live | No image generation; any artist's upload gets the look instantly (great for the marketplace) | Less dramatic than true repainting |

**Proposed for v1:** A for the hero images + C as the global look. Revisit B in v2. `[CONFIRM]` §12 Q3

### 7.3 Naming the style
Painting in a Ghibli-like manner is fine for vg's own site. For anything public-facing or in the future marketplace, label the preset descriptively (e.g., "painterly-anime") rather than using the studio's name, since the name itself is a trademark.

---

## 8. Technical architecture

### 8.1 Stack (proposed)
- **Vite** — dev server and build tool
- **React + React Three Fiber (R3F)** — Three.js written as React components
- **@react-three/drei** — ready-made helpers: `ScrollControls`, `Html` (hover cards), curves, loaders
- **@react-three/postprocessing** — painterly/bloom/grading effects
- **GSAP** (optional) — fine-grained animation timing if drei scroll isn't enough
- **Language:** TypeScript (settled 2026-09-25, §12 Q4)

### 8.2 Repo structure (fresh repo, code only)

```
portfolio-maker/
├── CLAUDE.md                  # working agreement (§10)
├── docs/design-doc.md         # this file
├── content/
│   ├── site.json              # identity, tabs, toggle state
│   └── journeys/
│       ├── masters.json
│       ├── bachelors.json     # stub
│       └── travels.json       # stub
├── public/media/masters/      # stylized images & videos
├── src/
│   ├── engine/                # generic: camera rail, scroll, node system
│   ├── scenes/                # scene segment components (§8.3)
│   ├── styles/presets/        # painterly-anime.ts, etc.
│   ├── ui/                    # tabs, toggle, hover card, progress bar
│   └── App.tsx
└── package.json
```

Rule: **no personal content inside `src/`.** Everything about vg lives in `content/` and `public/media/`. This is what lets the engine become a template later.

### 8.3 Scene system
- The journey path is a 3D curve (`CatmullRomCurve3`) winding from mountain to sea.
- The path is divided into **segments**, each a component: `MountainBase`, `ForestSlope`, `AlpineLake`, `Ridge`, `Village`, `SummitPass`, `RiverValley`, `Delta`, `Beach`.
- Each node's `sceneType` decides which segment it sits in; `magnitude` scales camera framing and light.
- Lighting keyframes along `t` blend time of day (pre-dawn → morning → golden hour → night → dawn → sunset).
- v1 starts with grey-box placeholders (simple shapes, fog, light) and swaps in art progressively.

### 8.4 Media handling
- Images as `.webp`, videos as short muted `.mp4` loops. `[CONFIRM]` §12 Q10
- Preload media for the current and next two nodes only.
- Hover card is an HTML overlay anchored to the node's 3D position.

### 8.5 Running locally
`npm install` then `npm run dev`; open the local URL in a desktop browser. `TODO(v3)`: hosting.

---

## 9. Implementation plan (v1 sub-milestones)

Each milestone has a learning goal so vg understands what was built, not just that it works.

| Milestone | Build | Learning goal | Done when |
|---|---|---|---|
| **v0.1 Scaffold** | Vite + React + R3F project, git repo, CLAUDE.md, a spinning cube | What a scene, camera, mesh and render loop are | Cube renders; first commit |
| **v0.2 Camera rail** | Path curve + scroll-driven camera over a grey-box landscape | Curves, `t`, scroll-to-position mapping | Scrolling moves the camera start → end and back |
| **v0.3 Segments & light** | Placeholder segments for all scene types; time-of-day blending | Lights, fog, materials, components | Full grey-box journey with day/night changes |
| **v0.4 Nodes from JSON** | Load `masters.json`; markers at `t`; hover card showing `sceneDescription` | Data-driven rendering; React state | 10–15 markers, hover cards work with placeholder text |
| **v0.5 UI shell** | Tabs (stubs), Personal/Public toggle (inert, `TODO`), progress bar, intro/loading screen | Layouts and UI over a 3D canvas | All UI present; toggle visibly marked TODO |
| **v0.6 Art pass** | Painterly-anime post-processing preset; first stylized images; parallax layers for 2–3 nodes | Post-processing, textures, parallax | Three nodes look "finished" |
| **v0.7 Content pass** | All nodes filled from CV; all media in; easter eggs placed | Asset workflow | No `[FROM CV]` left in `masters.json` |
| **v1.0 Polish** | Stall points, transitions, performance pass, desktop browser testing | Profiling, optimisation | Smooth on vg's PC; tagged `v1.0` |

---

## 10. Working agreement for Claude Code (goes into CLAUDE.md)

- **Teach as you build.** Before each milestone, explain the concepts in plain language; after it, summarise what changed and why.
- **Small steps, small commits.** One idea per commit with a readable message.
- **Edit in place.** Never regenerate the whole project to make a change.
- **Never invent content.** Leave `[FROM CV]`, `[CONFIRM]`, `[PLACEHOLDER-IMG]` untouched unless vg supplies the content.
- **Privacy.** This repo must not reference, link, copy from, or reveal the path of vg's private vault or any other personal directories.
- **Keep engine and content apart** (§8.2 rule).
- **Mark deferrals** with `// TODO(v2|v3|v4|v1.x): …` so they're greppable.
- **Skills:** if a suitable frontend/Three.js skill is available, use it; otherwise, once v0.4 patterns are stable, create a project skill (e.g., `.claude/skills/uyir-scene-builder/`) capturing how to add a node and a scene segment.

---

## 11. Future directions

Tentative; versions will be refined and sub-versioned as they approach.

### v1.x — Other devices
- Tablet layout and touch scrolling first, then mobile.
- Reduced-motion and lower-quality modes for weaker hardware.

### v2 — Content management & more journeys
- Upload images/videos through the site instead of dropping files in the repo; backend storage.
- Personal/Public toggle becomes functional, filtering nodes by `visibility`.
- Bachelor's and Travels journeys filled in.
- New journey types: travel blog, bucket list, "crazy things I did".
- Optional: scripted stylization (route B, §7.2) as a Claude skill.

### v3 — Hosting
- Choose a host (static hosts such as Vercel/Netlify, or self-hosted), domain, media delivery via CDN.
- Backend hosting for v2 uploads.

### v4 — Template marketplace
- Audience: non-technical artists.
- Flow: artist uploads pictures (photographs, watercolour, live 3D art — any style), picks a journey template and style preset, fills in node text, gets a themed Three.js site.
- Built on v1 foundations: journey JSON schema, style presets as data, engine/content separation, in-browser stylization (route C).
- Open design topics for later: accounts, templates as sellable items, rights over uploaded art, moderation.

---

## 12. Open questions (settle inline)

1. **CV:** It wasn't attached to this draft. Upload it and §6 gets filled. Also confirm the graduation date / journey end.
2. **Stub tabs:** Should Bachelor's and Travels be visible but disabled ("coming soon") in v1, or hidden until they have content?
3. **Stylization route:** Go with A + C for v1 (§7.2), or do you want B (local image model) now?
4. **Language:** TypeScript (stricter, catches errors, helps Claude Code; steeper start) or JavaScript (gentler for learning)?
   → **Settled 2026-09-25: TypeScript.**
5. **Traveller on screen:** Do we see the hiker (a figure walking ahead of the camera), or is it first-person, with the visitor as the traveller?
   → **Settled 2026-09-25: first-person, sometimes a first-person video.** The video part opened Q13.
6. **Voice:** The original Uyir Nadhi concept was an AI personal secretary's notes. Should node text be written in that voice (e.g., dated log entries), or plain portfolio text?
7. **Sound:** Ambient audio (wind, birds, water, waves) with a mute button, or silent?
8. **Stall points:** Should scrolling pause briefly at each node, or flow continuously with nodes just appearing as you pass?
9. **Finale light:** Sunrise or sunset at the beach?
10. **Video in hover cards:** Autoplay muted loops, or click to play?
11. **Identity:** What name/title appears on the site, and which contact links (email, LinkedIn, GitHub…)?
12. **Progress bar:** Keep the river-line progress indicator with jump-to-node (§4.2)?
13. **First-person video segments** (raised by Q5):
    a. Does scroll *scrub* the footage (scroll forward = walk forward, scroll back = rewind), or does it play in real time once you arrive?
    b. Does the video cross-fade in full-screen, or play inside the landscape (e.g., on a surface in the scene)?
    c. Does the art-pass look apply to the footage, or does it stay raw, as a contrast to the painted world?
    d. Which milestone? Proposed: engine support at v0.6 (Art pass), alongside the first media. `[CONFIRM]`
    Technical note: scrubbed video only seeks smoothly if it's encoded with very frequent keyframes. Keep clips short (≈5–15 s) and muted; the prep script belongs with the media workflow.
