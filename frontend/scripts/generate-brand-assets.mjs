// Brand asset generator.
//
// Renders the shipped derivatives from the two master assets in src/assets:
//
//   forge-logo.svg   the full lockup (mark + FORGE wordmark + tagline)
//   forge-icon.jpeg  the mark on its own
//
// Why derivatives exist at all:
//   · forge-logo.svg is a 3.7MB auto-trace (5,751 paths). Shipping it would
//     roughly quadruple the page weight for a 36px sidebar mark, so the UI uses
//     rasterised PNGs at the sizes actually displayed and the SVG stays the
//     master that these are regenerated from.
//   · That SVG also paints an opaque #070709 tile across the whole canvas. On
//     the app's #121213 sidebar that reads as a dark rectangle around the logo,
//     so the background path is stripped here and the PNGs are transparent.
//   · The icon is a JPEG, so it has no transparency and no vector form. It is
//     used only where an opaque square is correct anyway (favicon, PWA, iOS).
//
// Outputs are committed — you only need to re-run this if a master changes:
//   npm run brand
//
// Rendering uses headless Chrome (no native image dependency to install).
// Point CHROME_PATH at the binary if it isn't in one of the usual places.
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../src/assets');
const PUBLIC = resolve(__dirname, '../public');
const ICONS = join(PUBLIC, 'icons');
const BRAND = join(PUBLIC, 'brand');
const WORK = join(tmpdir(), 'forge-brand-assets');

for (const d of [ICONS, BRAND, WORK]) mkdirSync(d, { recursive: true });

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error(
    'No Chrome/Edge binary found. Set CHROME_PATH to one, e.g.\n' +
      '  CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" npm run brand'
  );
  process.exit(1);
}

/** Screenshot an HTML string at an exact pixel size. */
function shoot(html, out, size) {
  const page = join(WORK, `page-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(page, html);
  execFileSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000', // transparent unless the page paints one
      `--screenshot=${out}`,
      `--window-size=${size},${size}`,
      pathToFileURL(page).href,
    ],
    { stdio: 'pipe' }
  );
  rmSync(page, { force: true });
  console.log(`  ✓ ${out.replace(PUBLIC, 'public')} (${size}x${size}, ${statSync(out).size} bytes)`);
}

/**
 * Re-encode a rendered PNG as WebP, via a canvas in the same headless browser.
 *
 * Chrome's --screenshot only writes PNG, and a 1024px transparent render of
 * this artwork is ~470KB — too much to put on the login page, which is the
 * first thing anyone loads. WebP takes the same pixels to ~130KB with no
 * visible loss. The data URL comes back through --dump-dom because there is no
 * other channel out of a headless run without a devtools client.
 */
function toWebp(pngPath, outPath, quality = 0.92) {
  const page = join(WORK, `webp-${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(
    page,
    `<!doctype html><html><body><textarea id="o"></textarea><script>
      const i=new Image();
      i.onload=()=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;
        c.getContext('2d').drawImage(i,0,0);
        document.getElementById('o').textContent='DATA:'+c.toDataURL('image/webp',${quality});};
      i.src=${JSON.stringify(pathToFileURL(pngPath).href)};
    </script></body></html>`
  );
  const dom = execFileSync(
    chrome,
    [
      '--headless',
      '--disable-gpu',
      // The canvas is tainted by a file:// image without this, and toDataURL throws.
      '--allow-file-access-from-files',
      '--virtual-time-budget=10000',
      '--dump-dom',
      pathToFileURL(page).href,
    ],
    { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }
  ).toString();
  rmSync(page, { force: true });

  const m = dom.match(/DATA:data:image\/webp;base64,([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error(`WebP encode failed for ${pngPath}`);
  const buf = Buffer.from(m[1], 'base64');
  if (buf.slice(8, 12).toString('ascii') !== 'WEBP') throw new Error('Not a WebP payload');
  writeFileSync(outPath, buf);
  console.log(`  ✓ ${outPath.replace(PUBLIC, 'public')} (${buf.length} bytes, from ${statSync(pngPath).size})`);
}

// ── 1. Transparent master, derived from the lockup ────────────────────────────
// The background is the single full-canvas path filled #070709.
const BG_PATH = /<path d="M0 0 C413\.82 0[^"]*" fill="#070709" transform="translate\(0,0\)"\/>\s*/;
const rawLogo = readFileSync(join(SRC, 'forge-logo.svg'), 'utf8');
if (!BG_PATH.test(rawLogo)) {
  console.error('forge-logo.svg: could not find the background path to strip — has the master changed?');
  process.exit(1);
}
const transparentLogo = join(WORK, 'forge-logo-transparent.svg');
writeFileSync(transparentLogo, rawLogo.replace(BG_PATH, ''));
const logoUrl = pathToFileURL(transparentLogo).href;
const iconUrl = pathToFileURL(join(SRC, 'forge-icon.jpeg')).href;

// The mark occupies the upper portion of the 1254x1254 lockup, above the
// wordmark. This square crop takes it without clipping the spark spray.
const MARK_VIEWBOX = { x: 214, y: 48, size: 840 };

const svgCrop = (size) => `
<!doctype html><html><body style="margin:0">
  <svg width="${size}" height="${size}" viewBox="${MARK_VIEWBOX.x} ${MARK_VIEWBOX.y} ${MARK_VIEWBOX.size} ${MARK_VIEWBOX.size}"
       xmlns="http://www.w3.org/2000/svg">
    <image href="${logoUrl}" x="0" y="0" width="1254" height="1254"/>
  </svg>
</body></html>`;

const svgFull = (size) => `
<!doctype html><html><body style="margin:0">
  <img src="${logoUrl}" style="display:block;width:${size}px;height:${size}px">
</body></html>`;

console.log('Logo derivatives (transparent):');
shoot(svgFull(640), join(BRAND, 'forge-lockup.png'), 640);
// Small mark: the 36px sidebar/header lockups. 256 is already 3.5x those.
shoot(svgCrop(256), join(BRAND, 'forge-mark.png'), 256);
// Large mark: the login watermark renders it at ~520px, so the 256 asset was
// being upscaled 2x and showed it. This is a fresh render from the vector
// master at 1024 — real detail, not an enlargement — which also covers 2x DPR.
shoot(svgCrop(1024), join(BRAND, 'forge-mark-lg.png'), 1024);
toWebp(join(BRAND, 'forge-mark-lg.png'), join(BRAND, 'forge-mark-lg.webp'));

// ── 2. Favicon + PWA icons, from forge-icon.jpeg ──────────────────────────────
// Icons must be opaque (iOS refuses transparency on touch icons), and the tile
// colour is the artwork's OWN black — sampled from the JPEG's corners, which
// average #070709, the same value forge-logo.svg paints its background. Using
// the app's #0a0a0c instead left a faintly visible rectangle where the tile met
// the artwork.
const BG = '#070709';

// The source is 847x887 with dead margin down the sides, so `contain` at scale
// 1 shows the whole mark and the side letterboxing is invisible against BG.
// `zoom` then trims or insets from there: above 1 to fill the tile, below 1 for
// the maskable safe zone (platforms may crop to a circle, so content has to sit
// inside the middle ~80%). No clipping box — that is what caused the seam.
const iconHtml = (size, zoom, filter = 'none') => `
<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:${BG};overflow:hidden">
  <img src="${iconUrl}"
       style="position:absolute;left:0;top:0;width:${size}px;height:${size}px;
              object-fit:contain;transform:scale(${zoom});filter:${filter}">
</body></html>`;

// At 32px the metallic texture and near-black ground average into a dark blob
// and the F stops reading. Lifting brightness/contrast for the small favicons
// only — the large icons need no help — keeps the silhouette legible in a tab
// strip. Compared against tighter crops: cropping to just the F reads at size
// but throws away the anvil, which is the half that makes the mark ours.
const FAVICON_FILTER = 'brightness(1.35) contrast(1.25) saturate(1.15)';

console.log('Favicon + PWA icons (opaque):');
// Standard icons: a light trim so the mark sits large without losing the anvil.
shoot(iconHtml(512, 1.06), join(ICONS, 'icon-512.png'), 512);
shoot(iconHtml(192, 1.06), join(ICONS, 'icon-192.png'), 192);
// Maskable: scaled into the safe zone so a circular mask can't clip the mark.
shoot(iconHtml(512, 0.78), join(ICONS, 'icon-maskable-512.png'), 512);
shoot(iconHtml(192, 0.78), join(ICONS, 'icon-maskable-192.png'), 192);
// iOS rounds the corners itself, so leave a little breathing room.
shoot(iconHtml(180, 0.94), join(ICONS, 'apple-touch-icon.png'), 180);
// Favicons: trim hardest — at 32px only the F and the anvil survive legibly.
shoot(iconHtml(48, 1.16, FAVICON_FILTER), join(ICONS, 'favicon-48.png'), 48);
shoot(iconHtml(32, 1.16, FAVICON_FILTER), join(ICONS, 'favicon-32.png'), 32);

rmSync(WORK, { recursive: true, force: true });
console.log('\nDone.');
