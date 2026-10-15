/**
 * Genera los iconos PNG de la PWA sin dependencias externas.
 * Uso: node scripts/generate-icons.mjs
 *
 * El símbolo es un estetoscopio sobre el cuadrado azul. La geometría de acá
 * (normalizada 0..1) y la de `public/favicon.svg` (escala 512) son la misma:
 * si cambias una, cambia la otra.
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const SKY = [2, 132, 199]
const WHITE = [255, 255, 255]

// ── Geometría del símbolo (coordenadas normalizadas) ───────────────────────
const STROKE = 0.06
const U_CENTER_Y = 0.4
const U_RADIUS = 0.19
const LEG_TOP = 0.2
const STEM_BOTTOM = 0.64
const CHEST_Y = 0.755
const CHEST_OUTER = 0.115
const CHEST_INNER = CHEST_OUTER - STROKE
const CORNER_RADIUS = 0.2

const clamp = (v, min, max) => Math.min(Math.max(v, min), max)

/** Distancia de (px,py) al segmento (ax,ay)-(bx,by). */
function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t =
    lengthSquared === 0
      ? 0
      : clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1)
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** ¿El punto (u,v) cae dentro del trazo del estetoscopio? */
function inGlyph(u, v) {
  const half = STROKE / 2
  const left = 0.5 - U_RADIUS
  const right = 0.5 + U_RADIUS

  // Arco inferior del tubo (la "∪") y sus dos patas hacia arriba.
  const ringDistance = Math.abs(Math.hypot(u - 0.5, v - U_CENTER_Y) - U_RADIUS)
  if (ringDistance <= half && v >= U_CENTER_Y) return true
  if (segmentDistance(u, v, left, U_CENTER_Y, left, LEG_TOP) <= half) return true
  if (segmentDistance(u, v, right, U_CENTER_Y, right, LEG_TOP) <= half) return true

  // Vástago que baja del arco hasta el auricular.
  if (segmentDistance(u, v, 0.5, U_CENTER_Y + U_RADIUS, 0.5, STEM_BOTTOM) <= half) {
    return true
  }

  // Auricular: anillo con el centro hueco.
  const chestDistance = Math.hypot(u - 0.5, v - CHEST_Y)
  return chestDistance <= CHEST_OUTER && chestDistance >= CHEST_INNER
}

/** ¿Cae el punto dentro del cuadrado de esquinas redondeadas? */
function inRoundedRect(u, v, radius) {
  const cx = clamp(u, radius, 1 - radius)
  const cy = clamp(v, radius, 1 - radius)
  return Math.hypot(u - cx, v - cy) <= radius
}

/**
 * Cobertura del fondo y del símbolo en el píxel, por supermuestreo 4×4.
 * El supermuestreo (en vez de una fórmula solo para el borde) es lo que deja el
 * alfa a 255 dentro de la figura: antes se calculaba únicamente la transición
 * del borde, así que el icono entero salía casi transparente.
 */
function coverageAt(u, v, size, bleed) {
  let background = 0
  let glyph = 0
  const step = 1 / (size * 4)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const su = u - 0.5 / size + (i + 0.5) * step
      const sv = v - 0.5 / size + (j + 0.5) * step
      if (bleed || inRoundedRect(su, sv, CORNER_RADIUS)) background++
      if (inGlyph(su, sv)) glyph++
    }
  }
  return { background: background / 16, glyph: glyph / 16 }
}

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

/** Diseña el icono: fondo azul + estetoscopio. `bleed` = sin esquinas redondeadas. */
function drawIcon(size, { bleed = false } = {}) {
  const raw = Buffer.alloc(size * (size * 4 + 1))

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filtro "None"
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size
      const v = (y + 0.5) / size

      const { background, glyph } = coverageAt(u, v, size, bleed)
      const offset = rowStart + 1 + x * 4
      raw[offset] = Math.round(SKY[0] + (WHITE[0] - SKY[0]) * glyph)
      raw[offset + 1] = Math.round(SKY[1] + (WHITE[1] - SKY[1]) * glyph)
      raw[offset + 2] = Math.round(SKY[2] + (WHITE[2] - SKY[2]) * glyph)
      raw[offset + 3] = Math.round(background * 255)
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
