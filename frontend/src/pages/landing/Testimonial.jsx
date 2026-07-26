export default function Testimonial() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-190 mx-auto text-center">
        <svg width="40" height="30" viewBox="0 0 40 30" fill="none" className="mx-auto mb-6 text-primary/60">
          <path d="M0 30V17.5C0 7.5 6.5 0.5 16 0L17 5C10 6 6.5 10 6.5 15H16V30H0ZM24 30V17.5C24 7.5 30.5 0.5 40 0L41 5C34 6 30.5 10 30.5 15H40V30H24Z" fill="currentColor" />
        </svg>
        <p className="text-2xl font-medium text-white leading-relaxed max-[640px]:text-xl">
          "I moved my entire trading workflow to Forge Markets in a weekend. The automated rules alone paid for a
          year of Pro in the first month."
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-soft border border-primary/30 text-primary grid place-items-center font-bold font-heading">
            AR
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Alex Rivera</div>
            <div className="text-xs text-muted">Independent portfolio manager</div>
          </div>
        </div>
      </div>
    </section>
  );
}
