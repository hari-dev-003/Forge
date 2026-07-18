import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { login, clearError } from '../features/auth/authSlice.js';
import { usePwaInstall } from '../hooks/usePwaInstall.js';
import { Button, Field, Input } from '../components/ui/index.jsx';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, status, error } = useSelector((s) => s.auth);
  const { canInstall, promptInstall, isIOS, isStandalone } = usePwaInstall();
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  if (token) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (res.meta.requestStatus === 'fulfilled') navigate('/');
  };

  return (
    <div className="min-h-screen grid grid-cols-2 max-[860px]:grid-cols-1">
      <div className="bg-linear-to-br from-primary to-[#7c3aed] text-white p-14 flex flex-col justify-center max-[860px]:hidden">
        <h1 className="text-[34px] leading-tight font-bold">Turn every field visit into measurable business activity.</h1>
        <p className="mt-4 opacity-90 text-base max-w-105">
          Log verified client meetings, earn points on manager approval, and climb the leaderboard — all from one place.
        </p>
        <div className="mt-10 flex gap-7">
          <div><span className="text-[30px] font-extrabold block">10</span><small className="opacity-85">pts / 1-to-1</small></div>
          <div><span className="text-[30px] font-extrabold block">25</span><small className="opacity-85">pts / group</small></div>
          <div><span className="text-[30px] font-extrabold block">★</span><small className="opacity-85">live leaderboard</small></div>
        </div>
      </div>

      <div className="grid place-items-center p-10 pt-[max(40px,env(safe-area-inset-top))]">
        <div className="w-full max-w-95">
          <h2 className="text-[22px] mb-1 font-semibold">Welcome back</h2>
          <p className="text-muted text-sm mb-6">Sign in to your Forge workspace</p>

          {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}

          <form onSubmit={submit}>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
            </Field>
            <Button type="submit" className="w-full" loading={status === 'loading'}>
              Sign in
            </Button>
          </form>

          <p className="mt-4.5 text-xs text-muted text-center">
            Accounts are provisioned by your administrator. Contact them if you need access.
          </p>

          {canInstall && (
            <Button variant="outline" className="w-full mt-4" onClick={promptInstall}>
              ⬇ Install Forge app
            </Button>
          )}
          {isIOS && !isStandalone && (
            <p className="mt-4 text-xs text-muted bg-surface-2 border border-border px-3 py-2.5 rounded-[9px] leading-relaxed">
              📲 Install on iPhone: tap the <b>Share</b> icon, then <b>Add to Home Screen</b>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
