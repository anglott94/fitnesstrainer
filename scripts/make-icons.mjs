// Erzeugt die PWA-Icons als PNG — ohne Fremdbibliothek, nur mit Node-Bordmitteln.
// Aufruf: npm run icons
//
// Warum von Hand: Ein PNG ist ein überschaubares Format (Header, ein zlib-
// komprimierter Pixelblock, Ende), und so bleibt das Projekt frei von einer
// Bildbibliothek, die nur beim Einrichten einmal gebraucht würde.

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [11, 18, 32, 255] // --bg
const ACCENT = [52, 211, 153, 255] // --accent
const ACCENT_SOFT = [52, 211, 153, 90]

// --- PNG-Kodierung ---------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const out = Buffer.alloc(body.length + 8)
  out.writeUInt32BE(data.length, 0)
  body.copy(out, 4)
  out.writeUInt32BE(crc32(body), body.length + 4)
  return out
}

function encodePNG(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // Bittiefe
  ihdr[9] = 6 // Farbtyp RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  // Jede Bildzeile bekommt ein führendes Filter-Byte (0 = kein Filter).
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Zeichnen --------------------------------------------------------------

function createCanvas(size, color) {
  const buf = Buffer.alloc(size * size * 4)
  for (let i = 0; i < size * size; i++) buf.set(color, i * 4)
  return buf
}

function blend(buf, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  const alpha = color[3] / 255
  for (let c = 0; c < 3; c++) buf[i + c] = Math.round(buf[i + c] * (1 - alpha) + color[c] * alpha)
  buf[i + 3] = 255
}

/** Abgerundetes Rechteck mit weichem Rand (2x2-Überabtastung gegen Treppenstufen). */
function roundedRect(buf, size, x0, y0, w, h, radius, color) {
  const x1 = x0 + w
  const y1 = y0 + h
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      let hits = 0
      for (const dy of [0.25, 0.75]) {
        for (const dx of [0.25, 0.75]) {
          if (insideRoundedRect(x + dx, y + dy, x0, y0, x1, y1, radius)) hits++
        }
      }
      if (hits === 0) continue
      blend(buf, size, x, y, [color[0], color[1], color[2], (color[3] * hits) / 4])
    }
  }
}

function insideRoundedRect(px, py, x0, y0, x1, y1, r) {
  if (px < x0 || px > x1 || py < y0 || py > y1) return false
  const cx = Math.min(Math.max(px, x0 + r), x1 - r)
  const cy = Math.min(Math.max(py, y0 + r), y1 - r)
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

/**
 * Motiv: drei aufsteigende Balken auf einer Grundlinie — der Fortschritt, um den
 * es in der App geht.
 */
function drawIcon(size) {
  const buf = createCanvas(size, BG)
  const u = size / 100 // Einheiten in Prozent der Kantenlänge

  const barWidth = 14 * u
  const gap = 8 * u
  const baseline = 76 * u
  const heights = [26, 40, 54].map((h) => h * u)
  const totalWidth = barWidth * 3 + gap * 2
  const left = (size - totalWidth) / 2

  // Grundlinie
  roundedRect(buf, size, left, baseline + 3 * u, totalWidth, 3 * u, 1.5 * u, ACCENT_SOFT)

  heights.forEach((h, i) => {
    const x = left + i * (barWidth + gap)
    roundedRect(buf, size, x, baseline - h, barWidth, h, barWidth / 2.6, ACCENT)
  })

  return encodePNG(size, buf)
}

// --- Ausgabe ---------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true })
for (const size of [192, 512]) {
  const file = join(OUT_DIR, `icon-${size}.png`)
  writeFileSync(file, drawIcon(size))
  console.log(`geschrieben: ${file}`)
}
