import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { dismissToast } from '../features/ui/uiSlice.js';

const TONE = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-info',
};

function Toast({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 3500);
    return () => clearTimeout(t);
  }, [toast.id, dispatch]);
  return (
    <div
      className={`px-4.5 py-3 rounded-[9px] text-white text-sm shadow-card cursor-pointer animate-toast-in ${TONE[toast.type] || 'bg-ink'}`}
      onClick={() => dispatch(dismissToast(toast.id))}
    >
      {toast.message}
    </div>
  );
}

export default function Toaster() {
  const toasts = useSelector((s) => s.ui.toasts);
  return (
    <div className="fixed top-5 right-5 z-100 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  );
}
