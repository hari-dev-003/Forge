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
    <div className="min-h-screen grid grid-cols-2 max-[860px]:grid-cols-1 bg-bg relative overflow-hidden">
      {/* Sigma Ambient Background Light Blobs */}
      <div className="midnight-effect-1" />
      <div className="midnight-effect-2" />

      <div className="bg-gradient-to-br from-[#0c0e17] via-[#121524] to-[#08090d] border-r border-border text-white p-14 flex flex-col justify-center max-[860px]:hidden relative z-10">
        <span className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Welcome to Forge</span>
        <h1 className="text-[36px] leading-tight font-extrabold font-heading text-white">
          Turn every field visit into <span className="text-primary drop-shadow-[0_0_12px_rgba(241,184,17,0.4)]">measurable business activity.</span>
        </h1>
        <p className="mt-4 text-[#9b9db1] text-base max-w-105 leading-relaxed">
          Log verified client meetings, earn points on manager approval, and climb the leaderboard — all from one place.
        </p>
        <div className="mt-10 flex gap-7 pt-6 border-t border-border/40">
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-primary block font-heading">10</span>
            <small className="text-[#9b9db1] text-xs">pts / 1-to-1</small>
          </div>
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-primary block font-heading">25</span>
            <small className="text-[#9b9db1] text-xs">pts / group</small>
          </div>
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-success block font-heading">★</span>
            <small className="text-[#9b9db1] text-xs">live leaderboard</small>
          </div>
        </div>
      </div>

      <div className="grid place-items-center p-10 pt-[max(40px,env(safe-area-inset-top))] relative z-10">
        <div className="w-full max-w-95 bg-surface/60 border border-border/80 backdrop-blur-md p-8 rounded-[16px] shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-[8px] bg-primary text-[#08090d] grid place-items-center font-extrabold text-sm shadow-[0_0_10px_rgba(241,184,17,0.4)]">
              F
            </span>
            <span className="text-lg font-bold text-white font-heading">Forge</span>
          </div>

          <h2 className="text-[24px] mb-1 font-bold font-heading text-white">Welcome back</h2>
          <p className="text-muted text-sm mb-6">Sign in to your workspace</p>

          {error && <div className="bg-danger-soft border border-danger/30 text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}

          <form onSubmit={submit}>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
            </Field>
            <Button type="submit" className="w-full mt-2" loading={status === 'loading'}>
              Sign in
            </Button>
          </form>

          <p className="mt-5 text-xs text-muted text-center leading-relaxed">
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

