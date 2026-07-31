// Reusable presentational primitives — Tailwind utilities encapsulated here so
// pages compose <Button>, <Card>, <Field> etc. without repeating class strings.
import { STATUS_LABEL } from '../../constants.js';
import Icon from './Icon.jsx';

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';
const BTN_SIZE = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3 py-1.75 text-sm',
};
const BTN_VARIANT = {
  primary: 'btn-sheen bg-primary text-on-primary font-bold hover:bg-primary-dark',
  success: 'btn-sheen bg-success text-on-primary font-bold hover:brightness-105',
  danger: 'btn-sheen bg-danger text-white hover:brightness-105',
  ghost: 'bg-transparent text-muted border border-border hover:bg-surface-2 hover:text-ink',
  outline: 'bg-surface text-primary border border-primary/40 hover:bg-primary-soft hover:border-primary',
};

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) {
  return (
    <button
      className={`${BTN_BASE} ${BTN_SIZE[size] || BTN_SIZE.md} ${BTN_VARIANT[variant] || BTN_VARIANT.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-[15px] h-[15px] border-2 border-black/40 border-t-black rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`glow-card bg-surface/80 backdrop-blur-md border border-border rounded-card shadow-card mb-5 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          {title && <h3 className="text-md font-medium text-white tracking-[-0.005em]">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const STAT_ACCENT = {
  indigo: 'before:bg-primary',
  green: 'before:bg-success',
  amber: 'before:bg-warning',
  blue: 'before:bg-info',
};

/**
 * `trend`: optional `{ direction: 'up' | 'down', value: '12%' }` — only pass
 * this where a real period-over-period number exists upstream; there's no
 * fallback/placeholder math here on purpose.
 */
export function StatCard({ label, value, sub, accent = 'indigo', trend }) {
  return (
    <div
      className={`glow-card relative overflow-hidden bg-surface/80 backdrop-blur-md border border-border rounded-shell p-5 flex flex-col gap-1 shadow-card
        before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${STAT_ACCENT[accent] || STAT_ACCENT.indigo}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted type-label">{label}</span>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${trend.direction === 'down' ? 'text-danger' : 'text-success'}`}>
            <Icon name="trendingUp" size={13} className={trend.direction === 'down' ? 'rotate-180' : ''} />
            {trend.value}
          </span>
        )}
      </div>
      <span className="text-display-lg font-semibold tracking-[-0.03em] leading-none text-white font-heading tabular">{value}</span>
      {sub != null && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

const BADGE_STATUS = {
  PENDING: 'bg-warning-soft text-warning border border-warning/20',
  APPROVED: 'bg-success-soft text-success border border-success/20',
  REJECTED: 'bg-danger-soft text-danger border border-danger/20',
  MODIFICATION_REQUESTED: 'bg-primary-soft text-primary border border-primary/20',
};

export function Badge({ status, children }) {
  const tone = (status && BADGE_STATUS[status]) || 'bg-surface-2 text-muted border border-border';
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-medium ${tone}`}>
      {children || (status ? STATUS_LABEL[status] || status : '')}
    </span>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      {label && <span className="text-sm font-medium text-muted">{label}</span>}
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 border border-border rounded-control text-sm bg-surface-2 text-white transition-all duration-200 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-soft placeholder:text-muted/60';

export function Input({ className = '', ...props }) {
  return <input className={`${INPUT_CLASS} ${className}`} {...props} />;
}

export function Select({ children, className = '', ...props }) {
  return (
    <select className={`${INPUT_CLASS} ${className}`} {...props}>
      {children}
    </select>
  );
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={`${INPUT_CLASS} min-h-[80px] resize-y ${className}`} {...props} />;
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-muted cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        className="w-4 h-4 rounded accent-primary bg-surface-2 border border-border cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        {...props}
      />
      {label}
    </label>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="mb-7 flex justify-between items-start gap-4 flex-wrap">
      <div>
        {eyebrow && <span className="text-primary text-xs type-label">{eyebrow}</span>}
        <h1 className="text-display leading-tight font-semibold font-heading text-white mt-1">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`bg-surface-2 animate-pulse rounded-control ${className}`} />;
}

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 p-15 text-muted">
      <span className="inline-block w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}

/**
 * Page selector for a client-side paginated list.
 *
 * Renders nothing for a single page. Long ranges collapse to
 * `1 … 4 5 6 … 20` so the control keeps a fixed width no matter how many
 * pages there are.
 */
export function Pagination({ page, pageCount, onChange, className = '' }) {
  if (pageCount <= 1) return null;

  const pages = [];
  for (let p = 1; p <= pageCount; p++) {
    const isEdge = p === 1 || p === pageCount;
    const isNear = Math.abs(p - page) <= 1;
    if (isEdge || isNear) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  const btn =
    'min-w-9 h-9 px-2.5 rounded-control text-sm font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1.5 ${className}`}>
      <button
        type="button"
        className={`${btn} bg-surface-2 border-border text-muted hover:text-white`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'bg-primary border-primary text-on-primary'
                : 'bg-surface-2 border-border text-muted hover:text-white'
            }`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        className={`${btn} bg-surface-2 border-border text-muted hover:text-white`}
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
      </button>
    </nav>
  );
}

export function EmptyState({ title, hint, icon }) {
  return (
    <div className="text-center p-12 text-muted">
      {icon && (
        <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-surface-2 border border-border grid place-items-center text-muted/70">
          {icon}
        </div>
      )}
      <p className="font-semibold text-white">{title}</p>
      {hint && <p className="text-sm mt-1.5">{hint}</p>}
    </div>
  );
}

