// Reusable presentational primitives — Tailwind utilities encapsulated here so
// pages compose <Button>, <Card>, <Field> etc. without repeating class strings.
import { STATUS_LABEL } from '../../constants.js';

const BTN_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold cursor-pointer transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed';
const BTN_SIZE = {
  md: 'px-4 py-2.5 text-sm',
  sm: 'px-3 py-1.75 text-[13px]',
};
const BTN_VARIANT = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  success: 'bg-success text-white hover:brightness-95',
  danger: 'bg-danger text-white hover:brightness-95',
  ghost: 'bg-transparent text-muted border border-border hover:bg-surface-2 hover:text-ink',
  outline: 'bg-surface text-primary border border-primary hover:bg-primary-soft',
};

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) {
  return (
    <button
      className={`${BTN_BASE} ${BTN_SIZE[size] || BTN_SIZE.md} ${BTN_VARIANT[variant] || BTN_VARIANT.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-[15px] h-[15px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`bg-surface border border-border rounded-[14px] shadow-card mb-5 ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between px-5 py-4 border-b border-border">
          {title && <h3 className="text-[15px] font-semibold">{title}</h3>}
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

export function StatCard({ label, value, sub, accent = 'indigo' }) {
  return (
    <div
      className={`relative overflow-hidden bg-surface border border-border rounded-[14px] p-4.5 flex flex-col gap-1 shadow-card
        before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${STAT_ACCENT[accent] || STAT_ACCENT.indigo}`}
    >
      <span className="text-xs text-muted font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-[28px] font-bold tracking-tight leading-none">{value}</span>
      {sub != null && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

const BADGE_STATUS = {
  PENDING: 'bg-warning-soft text-warning',
  APPROVED: 'bg-success-soft text-success',
  REJECTED: 'bg-danger-soft text-danger',
  MODIFICATION_REQUESTED: 'bg-primary-soft text-primary',
};

export function Badge({ status, children }) {
  const tone = (status && BADGE_STATUS[status]) || 'bg-surface-2 text-muted';
  return (
    <span className={`inline-flex items-center px-2.5 py-[3px] rounded-full text-xs font-semibold ${tone}`}>
      {children || (status ? STATUS_LABEL[status] || status : '')}
    </span>
  );
}

export function Field({ label, error, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5 mb-4">
      {label && <span className="text-[13px] font-semibold text-muted">{label}</span>}
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}

const INPUT_CLASS =
  'w-full px-3 py-2.5 border border-border rounded-[9px] text-sm bg-surface text-ink transition-colors focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-soft';

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
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="text-[13px] mt-1.5">{hint}</p>}
    </div>
  );
}
