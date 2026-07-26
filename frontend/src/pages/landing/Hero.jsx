import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';

const STATS = [
  { label: 'Assets tracked', value: '$4.2B+' },
  { label: 'Active traders', value: '180K+' },
  { label: 'Uptime', value: '99.98%' },
];

export default function Hero() {
  return (
    <section className="relative pt-36 pb-24 px-6 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-125 h-125 rounded-full bg-primary/5 blur-3xl blob-drift pointer-events-none" />
      <div className="absolute top-40 -right-40 w-150 h-150 rounded-full bg-primary/3 blur-3xl blob-drift pointer-events-none" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-320 mx-auto grid grid-cols-[1.1fr_0.9fr] gap-16 items-center max-[960px]:grid-cols-1 max-[960px]:text-center">
        <div data-hero-in>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-6">
            <Icon name="zap" size={13} /> Now with automated strategies
          </span>
          <h1 className="text-[56px] leading-[1.05] font-bold font-heading text-white max-[960px]:text-[40px]">
            Trade smarter with <span className="text-primary">real-time market intelligence.</span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-135 leading-relaxed max-[960px]:mx-auto">
            One dashboard for live markets, portfolio analytics, and automated execution — built for traders who
            don't have time to babysit a dozen tabs.
          </p>
          <div className="mt-9 flex items-center gap-3 max-[960px]:justify-center flex-wrap">
            <Link to="/login?mode=signup">
              <Button size="md" className="px-6 py-3 text-base">
                Start trading free <Icon name="arrowRight" size={17} />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="md" className="px-6 py-3 text-base">
                See how it works
              </Button>
            </a>
          </div>

          <div className="mt-14 flex gap-10 max-[960px]:justify-center flex-wrap">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-[28px] font-bold font-heading text-white">{s.value}</div>
                <div className="text-xs text-muted uppercase tracking-wide mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div data-hero-in className="relative max-[960px]:hidden">
          <div className="relative bg-surface/80 backdrop-blur-md border border-border rounded-[20px] p-6 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs text-muted uppercase tracking-wide">Portfolio value</div>
                <div className="text-[32px] font-bold font-heading text-white mt-1">$128,430.52</div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-success text-sm font-semibold bg-success-soft px-2.5 py-1 rounded-full">
                <Icon name="trendingUp" size={14} /> +12.4%
              </span>
            </div>
            <svg viewBox="0 0 300 90" className="w-full h-22" fill="none">
              <path
                d="M0 70 Q30 40 60 55 T120 35 T180 50 T240 20 T300 30"
                stroke="#eeb31c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0 70 Q30 40 60 55 T120 35 T180 50 T240 20 T300 30 V90 H0 Z"
                fill="url(#heroGradient)"
                opacity="0.35"
              />
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eeb31c" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#eeb31c" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border">
              {[
                { label: 'BTC', value: '+4.2%', tone: 'text-success' },
                { label: 'ETH', value: '+2.8%', tone: 'text-success' },
                { label: 'SOL', value: '-1.1%', tone: 'text-danger' },
              ].map((a) => (
                <div key={a.label} className="text-center">
                  <div className="text-xs text-muted">{a.label}</div>
                  <div className={`text-sm font-bold mt-0.5 ${a.tone}`}>{a.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-8 bg-surface border border-border rounded-[14px] px-4 py-3 shadow-card flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-success glow-pulse" />
            <span className="text-xs font-semibold text-white">Live sync active</span>
          </div>
        </div>
      </div>
    </section>
  );
}
