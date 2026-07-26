import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { login, signup, confirmSignup, resendSignupCode, clearError, clearSignup } from '../features/auth/authSlice.js';
import { usePwaInstall } from '../hooks/usePwaInstall.js';
import { Button, Field, Input } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';

const emptySignupForm = { name: '', email: '', userId: '', password: '' };

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    token, status, error,
    signupStatus, signupMessage, signupError,
    pendingSignup, confirmStatus, confirmError, resendStatus,
  } = useSelector((s) => s.auth);
  const { canInstall, promptInstall, isIOS, isStandalone } = usePwaInstall();
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login'); // 'login' | 'signup' | 'verify'
  const [form, setForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState(emptySignupForm);
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => () => { dispatch(clearError()); dispatch(clearSignup()); }, [dispatch]);

  if (token) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setSignup = (k) => (e) => setSignupForm({ ...signupForm, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login(form));
    if (res.meta.requestStatus === 'fulfilled') navigate('/');
  };

  const submitSignup = async (e) => {
    e.preventDefault();
    const res = await dispatch(signup(signupForm));
    if (res.meta.requestStatus === 'fulfilled') {
      setMode('verify');
      setCode('');
    }
  };

  const submitConfirm = async (e) => {
    e.preventDefault();
    const res = await dispatch(confirmSignup({ ...pendingSignup, code }));
    if (res.meta.requestStatus === 'fulfilled') {
      setForm({ email: pendingSignup?.email || '', password: '' });
      setSignupForm(emptySignupForm);
      setCode('');
      setMode('login');
    }
  };

  const resendCode = () => {
    if (pendingSignup?.email) dispatch(resendSignupCode({ email: pendingSignup.email }));
  };

  const switchMode = (m) => {
    setMode(m);
    dispatch(clearError());
    dispatch(clearSignup());
  };

  return (
    <div className="min-h-screen grid grid-cols-2 max-[860px]:grid-cols-1 bg-bg relative overflow-hidden">
      {/* Ambient background light blobs */}
      <div className="midnight-effect-1" />
      <div className="midnight-effect-2" />

      <div className="bg-gradient-to-br from-hero-from via-hero-via to-hero-to border-r border-border text-white p-14 flex flex-col justify-center max-[860px]:hidden relative z-10">
        <span className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Welcome to Forge</span>
        <h1 className="text-[36px] leading-tight font-extrabold font-heading text-white">
          Turn every field visit into <span className="text-primary">measurable business activity.</span>
        </h1>
        <p className="mt-4 text-muted text-base max-w-105 leading-relaxed">
          Log verified client meetings, earn points on manager approval, and climb the leaderboard — all from one place.
        </p>
        <div className="mt-10 flex gap-7 pt-6 border-t border-border/40">
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-primary block font-heading">10</span>
            <small className="text-muted text-xs">pts / 1-to-1</small>
          </div>
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-primary block font-heading">25</span>
            <small className="text-muted text-xs">pts / group</small>
          </div>
          <div className="bg-surface/80 border border-border px-4 py-3 rounded-[12px]">
            <span className="text-[28px] font-extrabold text-success block font-heading">★</span>
            <small className="text-muted text-xs">live leaderboard</small>
          </div>
        </div>
      </div>

      <div className="grid place-items-center p-10 pt-[max(40px,env(safe-area-inset-top))] relative z-10">
        <div className="w-full max-w-95 bg-surface/60 border border-border/80 backdrop-blur-md p-8 rounded-[16px] shadow-card">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-8 rounded-[8px] bg-primary text-on-primary grid place-items-center font-extrabold text-sm shadow-[0_0_6px_rgba(238,179,28,0.2)]">
              F
            </span>
            <span className="text-lg font-bold text-white font-heading">Forge</span>
          </div>

          <h2 className="text-[24px] mb-1 font-bold font-heading text-white">
            {mode === 'login' ? 'Welcome back' : mode === 'verify' ? 'Verify your email' : 'Create your account'}
          </h2>
          <p className="text-muted text-sm mb-6">
            {mode === 'login'
              ? 'Sign in to your workspace'
              : mode === 'verify'
                ? <>We've sent a 6-digit code to <b className="text-white">{pendingSignup?.email}</b> — enter it below to activate your account.</>
                : 'Sign up as a field employee — verify your email to activate your account.'}
          </p>

          {mode === 'login' && error && (
            <div className="bg-danger-soft border border-danger/30 text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>
          )}
          {mode === 'signup' && signupError && (
            <div className="bg-danger-soft border border-danger/30 text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{signupError}</div>
          )}
          {mode === 'verify' && confirmError && (
            <div className="bg-danger-soft border border-danger/30 text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{confirmError}</div>
          )}
          {mode === 'login' && signupStatus === 'succeeded' && signupMessage && (
            <div className="bg-success-soft border border-success/30 text-success px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{signupMessage}</div>
          )}

          {mode === 'login' ? (
            <form onSubmit={submit}>
              <Field label="Email">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted/60 pointer-events-none flex items-center">
                    <Icon name="mail" size={16} />
                  </span>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@company.com"
                    required
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Password">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted/60 pointer-events-none flex items-center">
                    <Icon name="lock" size={16} />
                  </span>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                    required
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted/60 hover:text-white cursor-pointer focus:outline-none transition-colors duration-200 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </Field>
              <Button type="submit" className="w-full mt-2" loading={status === 'loading'}>
                Sign in
              </Button>
            </form>
          ) : mode === 'verify' ? (
            <form onSubmit={submitConfirm}>
              <Field label="Verification code">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  className="text-center tracking-[0.5em] text-lg"
                />
              </Field>
              <Button type="submit" className="w-full mt-2" loading={confirmStatus === 'loading'} disabled={code.length !== 6}>
                Verify & continue
              </Button>
              <div className="mt-4 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={resendStatus === 'loading'}
                  className="text-primary font-semibold hover:underline disabled:opacity-60"
                >
                  {resendStatus === 'loading' ? 'Sending…' : 'Resend code'}
                </button>
                <button type="button" onClick={() => switchMode('signup')} className="text-muted hover:text-white">
                  Use a different email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitSignup}>
              <Field label="Full name">
                <Input value={signupForm.name} onChange={setSignup('name')} placeholder="Your name" required />
              </Field>
              <Field label="Email">
                <Input type="email" value={signupForm.email} onChange={setSignup('email')} placeholder="you@company.com" required />
              </Field>
              <Field label="User ID">
                <Input value={signupForm.userId} onChange={setSignup('userId')} placeholder="Your employee/user ID" required />
              </Field>
              <Field label="Password" hint="Min 8 characters, with upper/lowercase, a number & a symbol">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted/60 pointer-events-none flex items-center">
                    <Icon name="lock" size={16} />
                  </span>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={signupForm.password}
                    onChange={setSignup('password')}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted/60 hover:text-white cursor-pointer focus:outline-none transition-colors duration-200 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </Field>
              <Button type="submit" className="w-full mt-2" loading={signupStatus === 'loading'}>
                Sign up
              </Button>
            </form>
          )}

          {mode !== 'verify' && (
            <p className="mt-5 text-xs text-muted text-center leading-relaxed">
              {mode === 'login' ? (
                <>Need an account? <button type="button" onClick={() => switchMode('signup')} className="text-primary font-semibold hover:underline">Sign up</button> as a field employee.</>
              ) : (
                <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="text-primary font-semibold hover:underline">Sign in</button>.</>
              )}
            </p>
          )}

          {canInstall && (
            <Button variant="outline" className="w-full mt-4" onClick={promptInstall}>
              <Icon name="download" size={16} /> Install Forge app
            </Button>
          )}
          {isIOS && !isStandalone && (
            <p className="mt-4 text-xs text-muted bg-surface-2 border border-border px-3 py-2.5 rounded-[9px] leading-relaxed flex items-start gap-2">
              <Icon name="smartphone" size={14} className="shrink-0 mt-0.5" />
              <span>Install on iPhone: tap the <b>Share</b> icon, then <b>Add to Home Screen</b>.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

