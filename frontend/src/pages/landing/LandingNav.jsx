import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/index.jsx';
import Icon from '../../components/ui/Icon.jsx';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-bg/80 backdrop-blur-md border-b border-border' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-320 mx-auto px-6 h-18 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8.5 h-8.5 rounded-[9px] bg-primary text-on-primary grid place-items-center font-extrabold text-sm shadow-[0_0_6px_rgba(238,179,28,0.2)]">
            F
          </span>
          <span className="text-base font-semibold text-white font-heading tracking-wide">
            For<b className="text-primary font-extrabold">ge</b>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-[9px] text-sm font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex-1 md:hidden" />

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/login?mode=signup">
            <Button size="sm">
              Get started <Icon name="arrowRight" size={15} />
            </Button>
          </Link>
        </div>

        <button
          className="sm:hidden grid place-items-center w-11 h-11 -mr-2 text-muted hover:text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Icon name={open ? 'x' : 'menu'} size={22} />
        </button>
      </div>

      {open && (
        <div className="sm:hidden bg-bg/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col gap-1">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-[9px] text-sm font-medium text-muted hover:text-white hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-2 mt-2">
            <Link to="/login" className="flex-1"><Button variant="ghost" className="w-full">Sign in</Button></Link>
            <Link to="/login?mode=signup" className="flex-1"><Button className="w-full">Get started</Button></Link>
          </div>
        </div>
      )}
    </header>
  );
}
