import sharp from 'sharp'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(resolve(__dirname, '../public/icon.svg'))

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

const outDir = resolve(__dirname, '../public/icons')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

await Promise.all(
  sizes.map(({ size, name }) =>
    sharp(svg).resize(size, size).png().toFile(resolve(outDir, name))
  )
)

console.log('✅ PWA icons generated:', sizes.map(s => s.name).join(', '))
