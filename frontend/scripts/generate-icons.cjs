const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const iconDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true })

const sizes = [192, 512]

async function generate() {
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="80" fill="#0b1120"/>
      <rect x="40" y="40" width="432" height="432" rx="60" fill="#111827"/>
      <text x="256" y="320" font-size="240" text-anchor="middle" font-family="serif">🏫</text>
      <circle cx="380" cy="140" r="60" fill="#ef4444"/>
      <text x="380" y="158" font-size="56" text-anchor="middle" font-family="sans-serif" fill="white" font-weight="bold">!</text>
    </svg>
  `)

  for (const size of sizes) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }
}

generate()