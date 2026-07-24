// Reusable presentational primitives — Tailwind utilities encapsulated here so
// pages compose <Button>, <Card>, <Field> etc. without repeating class strings.
import { STATUS_LABEL } from '../../constants.js';

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';
const BTN_SIZE = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3 py-1.75 text-[13px]',
};
const BTN_VARIANT = {
  primary: 'btn-sheen bg-primary text-[#08090d] font-bold hover:bg-primary-dark shadow-[0_2px_14px_rgba(238,179,28,0.25)]',
  success: 'btn-sheen bg-success text-[#08090d] font-bold hover:brightness-105',
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
    <section className={`bg-surface border border-border rounded-[14px] shadow-card transition-all duration-300 hover:border-primary/20 mb-5 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          {title && <h3 className="text-[15px] font-semibold text-white tracking-wide">{title}</h3>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const STAT_ACCENT = {
  indigo: 'before:bg-primary before:shadow-[0_0_8px_rgba(238,179,28,0.6)]',
  green: 'before:bg-success before:shadow-[0_0_8px_rgba(128,219,102,0.6)]',
  amber: 'before:bg-warning before:shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  blue: 'before:bg-info before:shadow-[0_0_8px_rgba(59,130,246,0.6)]',
};

export function StatCard({ label, value, sub, accent = 'indigo' }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface border border-border rounded-[14px] p-4.5 flex flex-col gap-1 shadow-card transition-all duration-300 hover:border-border/80
        before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${STAT_ACCENT[accent] || STAT_ACCENT.indigo}`}
    >
      <span className="text-xs text-muted font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-[28px] font-bold tracking-tight leading-none text-white font-heading">{value}</span>
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
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-semibold ${tone}`}>
      {children || (status ? STATUS_LABEL[status] || status : '')}
    </span>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      {label && <span className="text-[13px] font-semibold text-muted tracking-wide">{label}</span>}
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 border border-border rounded-[9px] text-sm bg-surface-2 text-white transition-all duration-200 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-soft placeholder:text-muted/60';

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

export function Spinner({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 p-15 text-muted">
      <span className="inline-block w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="text-center p-12 text-muted">
      <p className="font-semibold text-white">{title}</p>
      {hint && <p className="text-[13px] mt-1.5">{hint}</p>}
    </div>
  );
}

