const QA = [
  { q: 'Is my custody insured?', a: 'Yes — assets held in cold storage are covered under our third-party custody insurance policy, with details available after signup.' },
  { q: 'What assets can I trade?', a: '40+ major and mid-cap digital assets across spot and margin, with new listings added monthly based on liquidity thresholds.' },
  { q: 'Can I cancel anytime?', a: 'Pro is billed monthly with no lock-in — cancel from your account settings and you’ll keep access until the period ends.' },
  { q: 'Do you support automated strategies for beginners?', a: 'Yes — Pro includes ready-made templates (DCA, take-profit ladders, rebalancing) you can enable with no code.' },
  { q: 'Is there an API?', a: 'Pro and Elite plans include REST and WebSocket API access with per-key rate limits shown in your dashboard.' },
];

export default function Faq() {
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-190 mx-auto">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="text-[36px] font-bold font-heading text-white mt-3 max-[640px]:text-[28px]">
            Questions, answered.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {QA.map((item) => (
            <details key={item.q} className="group bg-surface border border-border rounded-[14px] px-5 py-4 open:border-primary/30">
              <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold text-white">
                {item.q}
                <span className="shrink-0 ml-4 w-6 h-6 rounded-full border border-border grid place-items-center text-muted group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13px] text-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
