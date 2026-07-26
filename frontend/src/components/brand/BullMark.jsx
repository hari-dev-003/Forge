// Bull mark — faceted low-poly head, wide horn sweep.
//
// Hand-authored so the artwork is ours outright and it samples the live
// --color-primary gold.
//
// This restores the original silhouette (the one that worked) and refines it,
// rather than re-inventing. Keep these traits — they are what make it read:
//   · horns sweeping WIDE, nearly the full frame, as the dominant gesture
//   · a hard-angled faceted skull, no curves in the outline
//   · angular slit eyes, not rounded ones
//   · coins banked along the base
//
// Refinements over the first pass: the muzzle is broadened and given a flat
// base (it tapered to a near-point before, which is the one genuinely wrong
// note), horns are thicker at the temple so they carry more weight, and the
// facet planes are pushed further apart in value so the form reads at low
// opacity, where flat shading disappears first.
//
// Symmetric about x=120 — every mirrored pair sums to 240.

const SKULL = 'M88,60 L152,60 L168,80 L160,114 L142,150 L120,168 L98,150 L80,114 L72,80 Z';

const HORN_L = 'M86,58 C68,48 44,36 18,18 C26,38 40,56 58,70 C68,77 79,80 89,77 Z';
const HORN_R = 'M154,58 C172,48 196,36 222,18 C214,38 200,56 182,70 C172,77 161,80 151,77 Z';

const EAR_L = 'M78,72 L54,80 L71,95 Z';
const EAR_R = 'M162,72 L186,80 L169,95 Z';

// Facet planes. Light upper-right, so the left half sinks and the muzzle lifts.
const FACETS = [
  { d: 'M120,60 L88,60 L72,80 L80,114 L98,150 L120,168 Z', f: '#000', o: 0.18 },
  { d: 'M80,114 L160,114 L142,150 L120,168 L98,150 Z', f: '#fbe28f', o: 0.13 },
  { d: 'M120,60 L127,114 L120,168 L113,114 Z', f: '#000', o: 0.1 },
  { d: 'M96,70 L144,70 L138,106 L102,106 Z', f: '#fbe28f', o: 0.08 },
];

const COINS = [
  { cx: 58, cy: 192, r: 17, glyph: '₿', o: 0.92 },
  { cx: 96, cy: 205, r: 14, glyph: 'Ξ', o: 0.76 },
  { cx: 137, cy: 199, r: 18, glyph: '₿', o: 0.96 },
  { cx: 177, cy: 190, r: 13, glyph: '', o: 0.7 },
  { cx: 211, cy: 133, r: 10, glyph: '', o: 0.5 },
  { cx: 29, cy: 141, r: 9, glyph: '', o: 0.44 },
];

export default function BullMark({ className = '', withCoins = true, ...props }) {
  const viewBox = withCoins ? '0 0 240 228' : '10 10 220 172';

  return (
    <svg viewBox={viewBox} fill="none" aria-hidden="true" focusable="false" className={className} {...props}>
      <defs>
        <linearGradient id="bm-gold" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#f8d469" />
          <stop offset="45%" stopColor="#eeb31c" />
          <stop offset="100%" stopColor="#8a6206" />
        </linearGradient>
        <linearGradient id="bm-horn" x1="0" y1="1" x2="0.8" y2="0">
          <stop offset="0%" stopColor="#c79415" />
          <stop offset="100%" stopColor="#fbe28f" />
        </linearGradient>
        <linearGradient id="bm-gold-dim" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#c79415" />
          <stop offset="100%" stopColor="#5f4204" />
        </linearGradient>
        <radialGradient id="bm-coin" cx="0.34" cy="0.28" r="0.85">
          <stop offset="0%" stopColor="#fbe28f" />
          <stop offset="55%" stopColor="#eeb31c" />
          <stop offset="100%" stopColor="#7d5805" />
        </radialGradient>
      </defs>

      {/* Ears behind the skull so its outline stays unbroken */}
      <path d={EAR_L} fill="url(#bm-gold-dim)" />
      <path d={EAR_R} fill="url(#bm-gold-dim)" />

      {/* Horns — the dominant gesture, so they get the brightest gradient */}
      <path d={HORN_L} fill="url(#bm-horn)" />
      <path d={HORN_R} fill="url(#bm-horn)" />
      {/* Undersides shaded so each horn reads as a solid, not a flat crescent */}
      <path d="M89,77 C70,68 46,52 18,18 C26,38 40,56 58,70 C68,77 79,80 89,77 Z" fill="#000" opacity="0.24" />
      <path
        d="M151,77 C170,68 194,52 222,18 C214,38 200,56 182,70 C172,77 161,80 151,77 Z"
        fill="#000"
        opacity="0.24"
      />

      <path d={SKULL} fill="url(#bm-gold)" />
      {FACETS.map((f) => (
        <path key={f.d} d={f.d} fill={f.f} opacity={f.o} />
      ))}

      {/* Angular slit eyes with a small gold glint each */}
      <path d="M90,92 L108,98 L102,108 L86,101 Z" fill="#0a0a0c" opacity="0.78" />
      <path d="M150,92 L132,98 L138,108 L154,101 Z" fill="#0a0a0c" opacity="0.78" />
      <path d="M92,95 L101,98 L97,103 Z" fill="#fbe28f" opacity="0.4" />
      <path d="M148,95 L139,98 L143,103 Z" fill="#fbe28f" opacity="0.5" />

      {/* Nostrils on the broadened muzzle */}
      <path d="M112,137 L119,142 L112,148 Z" fill="#0a0a0c" opacity="0.46" />
      <path d="M128,137 L121,142 L128,148 Z" fill="#0a0a0c" opacity="0.46" />

      {withCoins &&
        COINS.map((c) => (
          <g key={`${c.cx}-${c.cy}`} opacity={c.o}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill="url(#bm-coin)" />
            <circle
              cx={c.cx}
              cy={c.cy}
              r={c.r - 3}
              fill="none"
              stroke="#7d5805"
              strokeOpacity="0.5"
              strokeWidth="1.2"
            />
            {c.glyph && (
              <text
                x={c.cx}
                y={c.cy + c.r * 0.36}
                textAnchor="middle"
                fontSize={c.r * 1.05}
                fontWeight="700"
                fill="#5c3f03"
                fillOpacity="0.75"
                fontFamily="DM Sans, system-ui, sans-serif"
              >
                {c.glyph}
              </text>
            )}
          </g>
        ))}
    </svg>
  );
}
