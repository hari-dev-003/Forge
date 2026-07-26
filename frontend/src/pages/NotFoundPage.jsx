import { Link } from 'react-router-dom';
import { Button } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen grid place-items-center bg-bg relative overflow-hidden px-6">
      <div className="midnight-effect-1" />
      <div className="midnight-effect-2" />

      <div className="relative z-10 text-center bg-surface/70 backdrop-blur-md border border-border rounded-[20px] px-10 py-12 max-w-105 shadow-card">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest mb-6">
          404
        </span>
        <h1 className="text-[56px] leading-none font-bold font-heading tracking-tight text-white">
          Page not <span className="text-primary">found.</span>
        </h1>
        <p className="mt-4 text-muted text-sm leading-relaxed">
          The page you're looking for doesn't exist, or you don't have access to view it.
        </p>
        <Link to="/" className="inline-block mt-8">
          <Button>
            <Icon name="arrowRight" size={16} className="rotate-180" /> Back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
