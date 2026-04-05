const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const inputImage = path.join(__dirname, '../src/assets/mit.avif')
const outputDir  = path.join(__dirname, '../public/icons')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

async function generateIcon(size) {
  const padding = Math.floor(size * 0.08)
  const inner   = size - padding * 2

  await sharp(inputImage)
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .toBuffer()
    .then(imgBuffer => {
      const mask = Buffer.from(
        `<svg width="${inner}" height="${inner}">
           <rect x="0" y="0" width="${inner}" height="${inner}" rx="${Math.floor(inner * 0.18)}" ry="${Math.floor(inner * 0.18)}" fill="white"/>
         </svg>`
      )
      return sharp(imgBuffer)
        .composite([{ input: mask, blend: 'dest-in' }])
        .png()
        .toBuffer()
    })
    .then(roundedBuffer => {
      const bg = `<svg width="${size}" height="${size}">
        <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.18)}" fill="#0b1120"/>
      </svg>`

      return sharp(Buffer.from(bg))
        .composite([{ input: roundedBuffer, top: padding, left: padding }])
        .png()
        .toFile(path.join(outputDir, `icon-${size}.png`))
    })

  console.log(`Generated icon-${size}.png`)
}

async function run() {
  try {
    await generateIcon(192)
    await generateIcon(512)
    console.log('All icons generated in public/icons/')
  } catch (err) {
    console.error('Error:', err.message)
  }
}

run()