// The Forge brand marks.
//
// Both are served from /public (not imported through the bundler) because the
// master `src/assets/forge-logo.svg` is a 3.7MB auto-trace — importing it would
// dwarf the app bundle for a 36px sidebar mark. `npm run brand` regenerates
// these PNGs from the masters; see scripts/generate-brand-assets.mjs.
//
//   <LogoMark />    the F-on-anvil mark alone, transparent
//   <LogoLockup />  mark + FORGE wordmark + tagline, transparent
//
// Both are decorative by default: the visible product name sits next to the
// mark in the sidebar, so announcing it twice to a screen reader is noise. Pass
// an `alt` where the image IS the only brand label (the login panel).

const MARK_SRC = '/brand/forge-mark.png';
const MARK_LG_PNG = '/brand/forge-mark-lg.png';
const MARK_LG_WEBP = '/brand/forge-mark-lg.webp';
const LOCKUP_SRC = '/brand/forge-lockup.png';

/**
 * The F-on-anvil mark.
 *
 * Two renders, both cut from the vector master — pick by display size:
 *   default  256px, for the ~36px sidebar and header lockups
 *   size="lg" 1024px, for anywhere it is drawn large (the login watermark
 *             renders it at ~520px, where the 256 asset was upscaled 2x and
 *             visibly pixelated). 1024 also covers a 2x-DPR screen.
 *
 * The large one is served as WebP (~130KB) with a PNG fallback (~470KB) — the
 * login page is the first thing anyone loads, so the browser should only fetch
 * the big PNG if it genuinely can't do WebP.
 */
export function LogoMark({ className = '', alt = '', size, ...props }) {
  const hidden = alt ? undefined : 'true';

  if (size === 'lg') {
    return (
      <picture>
        <source srcSet={MARK_LG_WEBP} type="image/webp" />
        <img
          src={MARK_LG_PNG}
          alt={alt}
          aria-hidden={hidden}
          draggable="false"
          className={`select-none ${className}`}
          {...props}
        />
      </picture>
    );
  }

  return (
    <img
      src={MARK_SRC}
      alt={alt}
      aria-hidden={hidden}
      draggable="false"
      className={`select-none ${className}`}
      {...props}
    />
  );
}

export function LogoLockup({ className = '', alt = 'Forge', ...props }) {
  return (
    <img
      src={LOCKUP_SRC}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      draggable="false"
      className={`select-none ${className}`}
      {...props}
    />
  );
}

export default LogoMark;
