import LineChart from '../../components/charts/LineChart.jsx';
import Icon from '../../components/ui/Icon.jsx';

const SAMPLE = [
  { day: '01', count: 112 },
  { day: '02', count: 118 },
  { day: '03', count: 109 },
  { day: '04', count: 131 },
  { day: '05', count: 126 },
  { day: '06', count: 142 },
  { day: '07', count: 138 },
];

const TICKER = [
  { label: 'BTC/USD', value: '$67,214', change: '+3.2%', up: true },
  { label: 'ETH/USD', value: '$3,481', change: '+1.8%', up: true },
  { label: 'SOL/USD', value: '$142.90', change: '-0.6%', up: false },
  { label: 'AVAX/USD', value: '$34.12', change: '+2.1%', up: true },
];

export default function LiveSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-320 mx-auto grid grid-cols-[1fr_1.2fr] gap-14 items-center max-[960px]:grid-cols-1">
        <div>
          <span className="inline-flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-primary glow-pulse" /> Live market data
          </span>
          <h2 className="text-[36px] font-bold font-heading text-white mt-3 max-[640px]:text-[28px]">
            Watch every position move in real time.
          </h2>
          <p className="mt-4 text-muted text-base leading-relaxed max-w-110">
            Streaming price feeds, order-book depth, and portfolio P&amp;L update the instant the market does —
            no refresh button needed.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {TICKER.map((t) => (
              <div key={t.label} className="bg-surface border border-border rounded-[12px] px-4 py-3">
                <div className="text-xs text-muted">{t.label}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-white">{t.value}</span>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${t.up ? 'text-success' : 'text-danger'}`}>
                    <Icon name="trendingUp" size={12} className={t.up ? '' : 'rotate-90'} /> {t.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface/80 border border-border rounded-[20px] p-6 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Weekly execution volume</h3>
            <span className="text-[11px] font-bold uppercase tracking-wide text-success bg-success-soft px-2 py-1 rounded-full">Live</span>
          </div>
          <LineChart data={SAMPLE} height={240} />
        </div>
      </div>
    </section>
  );
}
