import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';

const TIERS = [
  {
    name: 'Starter',
    price: '$0',
    period: '/mo',
    tagline: 'For getting familiar with the platform.',
    features: ['1 connected wallet', 'Real-time market data', 'Basic portfolio analytics', 'Community support'],
    variant: 'outline',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    tagline: 'For active traders who want automation.',
    features: ['Unlimited wallets', 'Automated strategy rules', 'Advanced analytics suite', 'Priority support', 'API access'],
    featured: true,
    variant: 'primary',
  },
  {
    name: 'Elite',
    price: '$249',
    period: 'one-time',
    tagline: 'Lifetime access, built for power users.',
    features: ['Everything in Pro', 'Lifetime updates', 'Dedicated onboarding', 'Custom alert webhooks'],
    variant: 'outline',
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-320 mx-auto">
        <div className="text-center max-w-160 mx-auto mb-14">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Pricing</span>
          <h2 className="text-[36px] font-bold font-heading text-white mt-3 max-[640px]:text-[28px]">
            Simple plans that scale with you.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-6 max-[860px]:grid-cols-1 items-start">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`rounded-[20px] p-8 border relative ${
                t.featured
                  ? 'bg-gradient-to-b from-primary/10 to-surface border-primary/50 shadow-[0_0_20px_rgba(238,179,28,0.08)] md:-translate-y-3'
                  : 'bg-surface border-border glow-card'
              }`}
            >
              {t.featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white font-heading">{t.name}</h3>
              <p className="text-[13px] text-muted mt-1">{t.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[40px] font-bold font-heading text-white">{t.price}</span>
                <span className="text-sm text-muted">{t.period}</span>
              </div>
              <Link to="/login?mode=signup" className="block mt-6">
                <Button variant={t.variant} className="w-full">Get started</Button>
              </Link>
              <ul className="mt-7 flex flex-col gap-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted">
                    <Icon name="check" size={16} className="text-primary shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
