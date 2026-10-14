/**
 * Genera los iconos PNG de la PWA sin dependencias externas.
 * Uso: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const SKY = [2, 132, 199]
const WHITE = [255, 255, 255]

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let c = 0xffffffff
  for (let i = 0; i < buffer.length; i++) c = crcTable[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

/** Cobertura (0..1) de un rectángulo redondeado, para bordes suaves. */
function roundRectCoverage(x, y, radius) {
  const cx = clamp(x, radius, 1 - radius)
  const cy = clamp(y, radius, 1 - radius)
  const dist = Math.hypot(x - cx, y - cy)
  return clamp(radius - dist + 0.5 / 512, 0, 1)
}

/** Diseña el icono: fondo azul + cruz blanca. `bleed` = sin esquinas redondeadas. */
function drawIcon(size, { bleed = false } = {}) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  const barLong = 0.56
  const barThick = 0.18
  const from = (1 - barLong) / 2
  const to = (1 + barLong) / 2
  const thickFrom = (1 - barThick) / 2
  const thickTo = (1 + barThick) / 2

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filtro "None"
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size

      const inVertical = u >= thickFrom && u <= thickTo && v >= from && v <= to
      const inHorizontal = v >= thickFrom && v <= thickTo && u >= from && u <= to
      const color = inVertical || inHorizontal ? WHITE : SKY

      const coverage = bleed ? 1 : roundRectCoverage(u, v, 0.2)
      const offset = rowStart + 1 + x * 4
      raw[offset] = color[0]
      raw[offset + 1] = color[1]
      raw[offset + 2] = color[2]
      raw[offset + 3] = Math.round(coverage * 255)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outputs = [
  ['pwa-192x192.png', 192, { bleed: false }],
  ['pwa-512x512.png', 512, { bleed: false }],
  ['maskable-512x512.png', 512, { bleed: true }],
  ['apple-touch-icon.png', 180, { bleed: false }],
]

mkdirSync(PUBLIC_DIR, { recursive: true })
for (const [name, size, options] of outputs) {
  writeFileSync(join(PUBLIC_DIR, name), drawIcon(size, options))
  console.log(`✓ public/${name}`)
}
