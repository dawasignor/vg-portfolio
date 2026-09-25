// Repaints cleared photos in the site's painted style (design doc §7.2, §12 Q3).
//
//   npm run stylize            dry run: shows what would be sent; sends nothing
//   npm run stylize -- --send  calls the image model (costs money per image)
//
// Provider today: OpenRouter's image endpoint. Needs two values in .env (see
// .env.example), both chosen by the owner: OPENROUTER_API_KEY and
// OPENROUTER_IMAGE_MODEL. There is deliberately no default model.
// Provider later: a local model (TODO(v2), see `local` below).
//
// GDPR: only media that has passed the gate (content/media-clearance.json) can
// be sent, because this sends the image to a third party. Outputs are written
// with no metadata and must be looked at before use: a model can invent
// detail, including faces, so each item stays `"reviewed": false` until checked.

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

const PLAN = 'content/stylize.json'
const CLEARANCE = 'content/media-clearance.json'
const PEOPLE = ['none', 'blurred', 'generic', 'removed']
const ENDPOINT = 'https://openrouter.ai/api/v1/images'
const ASPECTS = { '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '16:9': 16 / 9, '9:16': 9 / 16 }
const LONG_EDGE = 2048

const send = process.argv.includes('--send')
const plan = JSON.parse(readFileSync(PLAN, 'utf8'))
const cleared = new Map(JSON.parse(readFileSync(CLEARANCE, 'utf8')).items.map((i) => [i.output, i]))

function checkCleared(input) {
  const item = cleared.get(input)
  if (!item || !PEOPLE.includes(item.people)) {
    throw new Error(`${input}: not in ${CLEARANCE} with a "people" value. Run it through the media gate first.`)
  }
}

function nearestAspect(width, height) {
  const ratio = width / height
  return Object.entries(ASPECTS).sort((a, b) => Math.abs(a[1] - ratio) - Math.abs(b[1] - ratio))[0][0]
}

const providers = {
  async openrouter({ prompt, image, aspect }) {
    const key = process.env.OPENROUTER_API_KEY
    const model = process.env.OPENROUTER_IMAGE_MODEL
    if (!key || !model) throw new Error('Set OPENROUTER_API_KEY and OPENROUTER_IMAGE_MODEL in .env (see .env.example).')
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        aspect_ratio: aspect,
        output_format: 'png',
        input_references: [{ type: 'image_url', image_url: { url: `data:image/png;base64,${image.toString('base64')}` } }],
      }),
    })
    if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`)
    const body = await response.json()
    const b64 = body.data?.[0]?.b64_json
    if (!b64) throw new Error('OpenRouter returned no image.')
    return { image: Buffer.from(b64, 'base64'), cost: body.usage?.cost }
  },
  // TODO(v2): a local image model (e.g. a ComfyUI workflow on this machine).
  async local() {
    throw new Error('The local provider is not built yet. Use "openrouter" for now.')
  },
}

const provider = providers[plan.provider]
if (!provider) throw new Error(`Unknown provider "${plan.provider}". Use one of: ${Object.keys(providers).join(', ')}`)

for (const item of plan.items) {
  checkCleared(item.input)
  const prompt = item.prompt ?? plan.style
  const { width, height } = await sharp(item.input).metadata()
  const aspect = nearestAspect(width, height)

  if (!send) {
    console.log(`would send ${item.input} (${width}x${height}, ${aspect}) via ${plan.provider} → ${item.output}`)
    continue
  }
  const image = await sharp(item.input).png().toBuffer()
  const { image: painted, cost } = await provider({ prompt, image, aspect })
  mkdirSync(dirname(item.output), { recursive: true })
  await sharp(painted).resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside' }).webp({ quality: 82 }).toFile(item.output)
  console.log(`painted ${item.output}${cost !== undefined ? `  cost=${cost}` : ''}  → check it, then set "reviewed": true in ${PLAN}`)
}

if (!send) console.log('\nDry run: nothing was sent. Add --send to call the image model (this costs money).')
