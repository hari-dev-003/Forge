import Icon from '../../components/ui/Icon.jsx';

const RULES = [
  'Take profit at +15%, trail the remainder by 4%',
  'DCA $200 into ETH every Monday at 09:00 UTC',
  'Alert me if portfolio drawdown exceeds 8%',
];

export default function Automation() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-320 mx-auto relative bg-gradient-to-br from-hero-from via-hero-via to-hero-to border border-border rounded-[24px] p-12 overflow-hidden max-[640px]:p-7">
        <div className="absolute -top-20 -right-20 w-100 h-100 rounded-full bg-primary/5 blur-3xl blob-drift pointer-events-none" />
        <div className="relative grid grid-cols-[1fr_1fr] gap-12 items-center max-[860px]:grid-cols-1">
          <div>
            <div className="w-12 h-12 rounded-[12px] bg-primary-soft border border-primary/30 text-primary grid place-items-center mb-5">
              <Icon name="refresh" size={22} />
            </div>
            <h2 className="text-[32px] font-bold font-heading text-white leading-tight max-[640px]:text-[26px]">
              Automation that thinks like a trader.
            </h2>
            <p className="mt-4 text-muted text-base leading-relaxed max-w-110">
              Chain conditions into rules once, and let Forge Markets execute them exactly as written — every time,
              without you watching a screen.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {RULES.map((r) => (
              <div key={r} className="flex items-center gap-3 bg-surface/80 border border-border rounded-[12px] px-4 py-3.5">
                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0">
                  <Icon name="check" size={14} />
                </span>
                <span className="text-sm text-white">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
