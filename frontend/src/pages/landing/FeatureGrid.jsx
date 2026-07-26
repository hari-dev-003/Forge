import { gsap } from 'gsap';
import Icon from '../../components/ui/Icon.jsx';

// Subtle pointer-follow tilt + cursor-tracked glow — capped small (±6deg) so
// it reads as a premium micro-interaction, not a gimmick. No-ops on touch
// (no fine hover pointer) and under prefers-reduced-motion.
const canTilt = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function handleTiltMove(e) {
  if (!canTilt()) return;
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  gsap.to(card, { rotateY: x * 6, rotateX: -y * 6, duration: 0.4, ease: 'power2.out', transformPerspective: 600 });
  card.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
  card.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
}
function handleTiltLeave(e) {
  gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
}

const FEATURES = [
  { icon: 'barChart', title: 'Portfolio analytics', metric: '30+ metrics', body: 'Sharpe ratio, drawdown, exposure by asset — every number a serious trader actually checks.' },
  { icon: 'wallet', title: 'Multi-asset wallet', metric: '40+ assets', body: 'Hold spot and margin positions side by side with one unified balance view.' },
  { icon: 'trendingUp', title: 'Live order execution', metric: '<80ms latency', body: 'Direct market routing keeps slippage low even during volatility spikes.' },
  { icon: 'layers', title: 'Strategy builder', metric: 'No-code rules', body: 'Chain conditions — price, volume, RSI — into automated entries and exits.' },
  { icon: 'refresh', title: 'Smart alerts', metric: 'Real-time', body: 'Push, email, or webhook alerts the moment a position crosses your threshold.' },
  { icon: 'shield', title: 'API access', metric: 'REST + WebSocket', body: 'Full programmatic control for teams running their own execution logic.' },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-320 mx-auto">
        <div className="text-center max-w-160 mx-auto mb-14">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Platform</span>
          <h2 className="text-[36px] font-bold font-heading text-white mt-3 max-[640px]:text-[28px]">
            Everything a serious desk needs, in one screen.
          </h2>
          <p className="mt-4 text-muted text-base leading-relaxed">
            No plugins, no tab-switching. Forge Markets brings execution, analytics, and automation together.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-5 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="tilt-card relative bg-surface/80 backdrop-blur-md border border-border rounded-[16px] p-6 glow-card overflow-hidden"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-[11px] bg-primary-soft border border-primary/30 text-primary grid place-items-center">
                  <Icon name={f.icon} size={20} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary bg-primary-soft px-2 py-1 rounded-full">
                  {f.metric}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white font-heading">{f.title}</h3>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
