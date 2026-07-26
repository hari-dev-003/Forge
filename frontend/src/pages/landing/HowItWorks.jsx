const STEPS = [
  { n: '01', title: 'Create your account', body: 'Verify your identity in minutes with our streamlined, security-first onboarding.' },
  { n: '02', title: 'Fund your wallet', body: 'Deposit via bank transfer or supported assets — funds settle same-day.' },
  { n: '03', title: 'Set your strategy', body: 'Pick a template or build your own rules for entries, exits, and alerts.' },
  { n: '04', title: 'Track & optimize', body: 'Watch performance roll in and refine your approach with built-in analytics.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-320 mx-auto">
        <div className="text-center max-w-160 mx-auto mb-16">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">How it works</span>
          <h2 className="text-[36px] font-bold font-heading text-white mt-3 max-[640px]:text-[28px]">
            From sign-up to your first trade in minutes.
          </h2>
        </div>

        <div className="grid grid-cols-4 gap-6 max-[860px]:grid-cols-2 max-[480px]:grid-cols-1 relative">
          <div className="absolute top-6 left-[12.5%] right-[12.5%] h-px bg-border max-[860px]:hidden" />
          {STEPS.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface border border-primary/40 text-primary grid place-items-center font-bold font-heading relative z-10">
                {s.n}
              </div>
              <h3 className="mt-4 text-base font-semibold text-white font-heading">{s.title}</h3>
              <p className="mt-1.5 text-[13px] text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
