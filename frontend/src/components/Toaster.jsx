import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { dismissToast } from '../features/ui/uiSlice.js';
import Icon from './ui/Icon.jsx';

const TONE = {
  success: { bg: 'bg-success', icon: 'check' },
  error: { bg: 'bg-danger', icon: 'x' },
  info: { bg: 'bg-info', icon: 'history' },
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  const tone = TONE[toast.type] || { bg: 'bg-ink', icon: 'check' };
  const dismiss = () => dispatch(dismissToast(toast.id));

  useEffect(() => {
    const t = setTimeout(dismiss, 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <div
      className={`flex items-start gap-2.5 pl-4 pr-2.5 py-3 rounded-control text-white text-sm shadow-card cursor-pointer animate-toast-in ${tone.bg}`}
      onClick={dismiss}
    >
      <Icon name={tone.icon} size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/15 transition-colors"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div role="status" aria-live="polite" className="fixed top-5 right-5 z-100 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
