const NAMES = ['Nova Capital', 'Lumen Markets', 'Vertex Fund', 'Atlas Prime', 'Meridian OTC', 'Kepler Trading', 'Orbit Ventures', 'Solace Wealth'];

function Track() {
  return (
    <div className="flex items-center gap-14 pr-14 shrink-0">
      {NAMES.map((n) => (
        <span key={n} className="text-lg font-semibold text-muted/50 tracking-wide whitespace-nowrap">
          {n}
        </span>
      ))}
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section className="py-10 border-y border-border/60 overflow-hidden">
      <p className="text-center text-xs uppercase tracking-widest text-muted/70 font-semibold mb-6">
        Trusted by desks and independent traders worldwide
      </p>
      <div className="flex w-max marquee-track">
        <Track />
        <Track />
      </div>
    </section>
  );
}
