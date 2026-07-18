// Dependency-free PWA icon generator. Renders the Forge "F" mark to PNGs using
// only Node built-ins (zlib), so there's no native image library to install.
// Run: `npm run icons`
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/icons');
mkdirSync(OUT, { recursive: true });

const BRAND = [0x4f, 0x46, 0xe5]; // indigo #4f46e5
const WHITE = [255, 255, 255];

// ── minimal PNG encoder (RGBA, no compression tricks) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── draw the "F" mark ──
function drawIcon(size, { pad = 0 } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  // opaque brand background (iOS requires non-transparent touch icons)
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = BRAND[0];
    buf[i * 4 + 1] = BRAND[1];
    buf[i * 4 + 2] = BRAND[2];
    buf[i * 4 + 3] = 255;
  }
  // content box inside the padded area
  const a = pad;
  const b = 1 - pad;
  const map = (n) => a + n * (b - a);
  const px = (n) => Math.round(map(n) * size);
  // "F" as three filled bars (normalized 0..1)
  const rects = [
    [0.30, 0.24, 0.44, 0.76], // vertical stem
    [0.30, 0.24, 0.72, 0.38], // top bar
    [0.30, 0.46, 0.64, 0.585], // middle bar
  ];
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = px(y0); y < px(y1); y++) {
      for (let x = px(x0); x < px(x1); x++) {
        const i = (y * size + x) * 4;
        buf[i] = WHITE[0];
        buf[i + 1] = WHITE[1];
        buf[i + 2] = WHITE[2];
        buf[i + 3] = 255;
      }
    }
  }
  return buf;
}

const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'icon-maskable-192.png', size: 192, pad: 0.18 },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.18 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.06 },
  { file: 'favicon-32.png', size: 32, pad: 0 },
];

for (const t of targets) {
  const png = encodePNG(t.size, drawIcon(t.size, { pad: t.pad }));
  writeFileSync(resolve(OUT, t.file), png);
  console.log(`✓ ${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}
console.log(`Icons written to ${OUT}`);
