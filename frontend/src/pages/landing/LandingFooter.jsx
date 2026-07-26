import { Link } from 'react-router-dom';

const COLUMNS = [
  { title: 'Product', links: ['Features', 'Pricing', 'API', 'Status'] },
  { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
  { title: 'Resources', links: ['Documentation', 'Guides', 'Support', 'Community'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Compliance'] },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-6 pt-16 pb-10">
      <div className="max-w-320 mx-auto">
        <div className="grid grid-cols-[1.4fr_repeat(4,1fr)] gap-10 max-[860px]:grid-cols-2 max-[480px]:grid-cols-1">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[8px] bg-primary text-on-primary grid place-items-center font-extrabold text-sm">F</span>
              <span className="text-base font-semibold text-white font-heading">
                For<b className="text-primary font-extrabold">ge</b> Markets
              </span>
            </div>
            <p className="mt-4 text-sm text-muted leading-relaxed max-w-70">
              Real-time markets, portfolio analytics, and automated execution — built for traders who move fast.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-muted">© {new Date().getFullYear()} Forge Markets. All rights reserved.</p>
          <Link to="/login" className="text-xs text-muted hover:text-white transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
