// The media gate (GDPR): turns a raw photo into a publishable one.
//
//   npm run media
//
// For every item in content/media-clearance.json it:
//   1. applies the camera's rotation, then blurs each listed region (faces get
//      pixelated first, so the blur cannot be reversed),
//   2. resizes for the web and re-encodes as WebP, which drops ALL metadata
//      (EXIF, GPS, camera serials),
//   3. refuses items that don't say what was done about people.
// Region boxes are [left, top, width, height] in pixels of the rotated,
// full-size source image.

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import sharp from 'sharp'

const MANIFEST = 'content/media-clearance.json'
const PEOPLE = ['none', 'blurred', 'generic', 'removed']
const LONG_EDGE = 2048

// A white rounded rectangle with soft edges: where it is white, the blurred
// copy shows; where it fades, the original shows through. No hard seams.
function featherMask(width, height, feather) {
  const inset = feather * 2
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <filter id="f"><feGaussianBlur stdDeviation="${feather}"/></filter>
      <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}"
            rx="${inset}" fill="#fff" filter="url(#f)"/>
    </svg>`,
  )
}

async function blurRegion(image, { box: [left, top, width, height], blur, pixelate, feather = 12 }) {
  let region = sharp(image).extract({ left, top, width, height })
  if (pixelate) {
    // Down to a handful of blocks and back up: the detail is gone, not hidden.
    const small = await region
      .resize(pixelate, Math.max(1, Math.round((pixelate * height) / width)), { kernel: 'nearest' })
      .toBuffer()
    region = sharp(small).resize(width, height, { kernel: 'cubic' })
  }
  const blurred = await region.blur(blur).png().toBuffer()
  const softened = await sharp(blurred)
    .composite([{ input: featherMask(width, height, feather), blend: 'dest-in' }])
    .png()
    .toBuffer()
  return sharp(image).composite([{ input: softened, left, top }]).png().toBuffer()
}

async function clear(item) {
  if (!PEOPLE.includes(item.people)) {
    throw new Error(`${item.output}: "people" must be one of ${PEOPLE.join(' | ')}; not cleared, not written`)
  }
  if (!existsSync(item.source)) {
    console.warn(`skip ${item.output}: source ${item.source} not on this machine`)
    return
  }
  let image = await sharp(item.source).rotate().png().toBuffer()
  for (const region of item.regions ?? []) image = await blurRegion(image, region)

  mkdirSync(dirname(item.output), { recursive: true })
  const info = await sharp(image)
    .resize({ width: LONG_EDGE, height: LONG_EDGE, fit: 'inside' })
    .webp({ quality: 82 }) // no .withMetadata(): nothing from the camera survives
    .toFile(item.output)

  const check = await sharp(item.output).metadata()
  if (check.exif || check.xmp || check.iptc) throw new Error(`${item.output}: metadata survived`)
  console.log(`cleared ${item.output}  ${info.width}x${info.height}  people=${item.people}  metadata=none`)
}

const { items } = JSON.parse(readFileSync(MANIFEST, 'utf8'))
for (const item of items) await clear(item)
