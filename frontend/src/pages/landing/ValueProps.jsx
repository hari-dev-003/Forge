import Icon from '../../components/ui/Icon.jsx';

const ITEMS = [
  {
    icon: 'globe',
    title: 'Global market access',
    body: 'Trade spot, derivatives, and 40+ digital assets from a single account — no juggling exchanges.',
  },
  {
    icon: 'shield',
    title: 'Bank-grade security',
    body: 'Cold-storage custody, hardware-key withdrawals, and continuous audits keep your funds locked down.',
  },
  {
    icon: 'zap',
    title: 'Automated execution',
    body: 'Set rules once — take-profit ladders, DCA schedules, alerts — and let the engine handle the rest.',
  },
];

export default function ValueProps() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-320 mx-auto grid grid-cols-3 gap-6 max-[860px]:grid-cols-1">
        {ITEMS.map((it) => (
          <div key={it.title} className="bg-surface/60 border border-border rounded-[16px] p-7 glow-card">
            <div className="w-12 h-12 rounded-[12px] bg-primary-soft border border-primary/30 text-primary grid place-items-center mb-5">
              <Icon name={it.icon} size={22} />
            </div>
            <h3 className="text-lg font-semibold text-white font-heading">{it.title}</h3>
            <p className="mt-2 text-sm text-muted leading-relaxed">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
