import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { login, completeNewPassword, clearError, clearChallenge } from '../features/auth/authSlice.js';
import { usePwaInstall } from '../hooks/usePwaInstall.js';
import { Button, Field, Input } from '../components/ui/index.jsx';
import Icon from '../components/ui/Icon.jsx';
import { LogoMark } from '../components/brand/Logo.jsx';

// Mirrors the Cognito password policy the backend enforces, so the meter can
// never tell a user they're done while the API would still reject them.
const PW_RULES = [
  { label: '8+ characters', test: (v) => v.length >= 8 },
  { label: 'Upper & lowercase', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /\d/.test(v) },
  { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH = [
  { label: 'Too weak', bar: 'bg-danger', text: 'text-danger' },
  { label: 'Weak', bar: 'bg-danger', text: 'text-danger' },
  { label: 'Fair', bar: 'bg-warning', text: 'text-warning' },
  { label: 'Good', bar: 'bg-primary', text: 'text-primary' },
  { label: 'Strong', bar: 'bg-success', text: 'text-success' },
];

const TRUST = [
  { icon: 'shield', label: 'Encrypted in transit' },
  { icon: 'users', label: 'Manager-provisioned access' },
  { icon: 'history', label: 'Full audit trail' },
];

function PasswordMeter({ value }) {
  const passed = PW_RULES.filter((r) => r.test(value));
  const score = passed.length;
  const tier = STRENGTH[score];

  if (!value) return null;

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {PW_RULES.map((r, i) => (
          <span
            key={r.label}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < score ? tier.bar : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3">
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {PW_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-1 text-[11px] transition-colors duration-200 ${
                  ok ? 'text-success' : 'text-muted/70'
                }`}
              >
                <Icon name={ok ? 'check' : 'minus'} size={11} />
                {r.label}
              </li>
            );
          })}
        </ul>
        <span className={`text-[11px] font-bold shrink-0 ${tier.text}`}>{tier.label}</span>
      </div>
      {/* Screen readers get the verdict without the decorative bar segments. */}
      <span className="sr-only" aria-live="polite">
        Password strength: {tier.label}. {score} of {PW_RULES.length} requirements met.
      </span>
    </div>
  );
}

function PasswordInput({ value, onChange, show, onToggleShow, autoComplete, minLength, id }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted/60 pointer-events-none flex items-center">
        <Icon name="lock" size={16} />
      </span>
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className="pl-9 pr-10"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 text-muted/60 hover:text-white cursor-pointer rounded transition-colors duration-200 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <Icon name={show ? 'eyeOff' : 'eye'} size={16} />
      </button>
    </div>
  );
}

function Alert({ tone, children }) {
  const map = {
    danger: 'bg-danger-soft border-danger/30 text-danger',
    success: 'bg-success-soft border-success/30 text-success',
  };
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 border px-3 py-2.5 rounded-[9px] text-[13px] mb-4 leading-relaxed ${map[tone]}`}
    >
      <Icon name={tone === 'danger' ? 'alertTriangle' : 'check'} size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const { token, status, error, challenge, challengeStatus, challengeError } = useSelector((s) => s.auth);
  const { canInstall, promptInstall, isIOS, isStandalone } = usePwaInstall();
  const [form, setForm] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => () => { dispatch(clearError()); dispatch(clearChallenge()); }, [dispatch]);

  if (token) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    await dispatch(login(form));
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return;
    await dispatch(completeNewPassword({ email: challenge.email, newPassword, session: challenge.session }));
  };

  const backToSignIn = () => {
    dispatch(clearChallenge());
    dispatch(clearError());
    setNewPassword('');
    setConfirmPassword('');
  };

  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const heading = challenge ? 'Set your password' : 'Welcome back';
  const subheading = challenge
    ? "You're signing in for the first time — choose a password only you know."
    : 'Sign in to your associate workspace.';

  return (
    <div className="min-h-screen grid grid-cols-[1.05fr_0.95fr] max-[900px]:grid-cols-1 bg-bg relative overflow-hidden">
      <div className="midnight-effect-1" />
      <div className="midnight-effect-2" />

      {/* ─────────── Brand panel ─────────── */}
      <aside className="relative z-10 overflow-hidden border-r border-border bg-gradient-to-br from-hero-from via-hero-via to-hero-to p-14 flex flex-col justify-between max-[900px]:hidden">
        {/* The mark alone as a large watermark — not the lockup. The lockup's
            FORGE wordmark landed directly under the headline and read as a
            second competing title; the mark carries the brand here without
            repeating type the panel already shows top-left. Held at 20%: it is
            dark metal on a dark panel, and below about 15% the anvil silhouette
            stops resolving at all. */}
        <div
          className="absolute right-[2%] top-1/2 -translate-y-1/2 w-[520px] max-w-none pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="absolute left-[16%] top-[14%] w-[68%] h-[62%] rounded-full bg-primary/12 blur-[95px]" />
          <LogoMark size="lg" className="relative w-full opacity-[0.20]" />
        </div>
        {/* Faint hairline grid for depth, masked out toward the edges. */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(238,179,28,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(238,179,28,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 40% 45%, #000 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 40% 45%, #000 20%, transparent 78%)',
          }}
        />

        <div className="relative flex items-center gap-2.5">
          <LogoMark className="w-9 h-9 object-contain shrink-0" />
          <span className="text-lg font-bold text-white font-heading tracking-tight">Forge</span>
        </div>

        <div className="relative max-w-125">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft border border-primary/30 text-primary text-[11px] font-bold uppercase tracking-widest mb-6">
            <Icon name="trendingUp" size={12} /> Associate platform
          </span>
          <h1 className="text-[40px] leading-[1.08] font-extrabold font-heading text-white tracking-tight">
            Run with the bulls.
            <br />
            <span className="text-primary">Earn your position.</span>
          </h1>
          <p className="mt-5 text-muted text-[15px] leading-relaxed max-w-110">
            Log verified client meetings, earn points on manager approval, and climb the desk leaderboard —
            the growth engine behind our crypto business.
          </p>
        </div>

        <ul className="relative flex flex-wrap gap-x-5 gap-y-2 pt-6 border-t border-border/40">
          {TRUST.map((t) => (
            <li key={t.label} className="flex items-center gap-1.5 text-[11.5px] text-muted/80 font-medium">
              <Icon name={t.icon} size={13} className="text-primary/70" />
              {t.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* ─────────── Form panel ─────────── */}
      <main className="relative z-10 grid place-items-center p-10 pt-[max(40px,env(safe-area-inset-top))] max-[900px]:p-6">
        {/* Mobile keeps the lockup as a base watermark — the brand panel is
            hidden below 900px, so this is the only place the motif survives. */}
        <div
          className="hidden max-[900px]:block absolute left-1/2 -translate-x-1/2 bottom-0 w-[520px] max-w-[135%] pointer-events-none select-none"
          aria-hidden="true"
        >
          {/* Behind the form card, so it stays well under desktop strength. */}
          <LogoMark size="lg" className="w-full opacity-[0.16]" />
        </div>

        <div className="relative w-full max-w-100">
          {/* Mobile-only brand row — the aside is hidden below 900px, so without
              this the small screen loses all brand context. Uses the mark alone,
              not the lockup: the wordmark is unreadable at 36px, and it would
              repeat the watermark sitting behind the card. */}
          <div className="hidden max-[900px]:flex items-center justify-center gap-2.5 mb-7">
            <LogoMark className="w-9 h-9 object-contain shrink-0" />
            <span className="text-lg font-bold text-white font-heading tracking-tight">Forge</span>
          </div>

          {/* Gradient hairline ring: a 1px gradient-filled wrapper reads as a
              lit edge, which a flat border can't do. Gold at the top fading to
              nothing at the bottom implies a light source above the card. */}
          <div className="relative rounded-[20px] p-px bg-gradient-to-b from-primary/35 via-border/50 to-border/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]">
            <div className="relative overflow-hidden bg-surface/75 backdrop-blur-xl p-8 rounded-[19px] max-[900px]:p-6">
              {/* Specular sheen along the top edge */}
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              {/* Interior glow, anchored top-centre to match the ring's light */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(238,179,28,0.09), transparent 70%)',
                }}
              />

              <div className="relative">
                <h2 className="text-[26px] font-bold font-heading text-white tracking-tight">{heading}</h2>
                <p className="text-muted text-sm mt-1.5 mb-6">{subheading}</p>

                {!challenge && error && <Alert tone="danger">{error}</Alert>}
                {challenge && challengeError && <Alert tone="danger">{challengeError}</Alert>}

                {challenge ? (
                  <form onSubmit={submitNewPassword}>
                    <Field label="New password">
                      <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        show={showPassword}
                        onToggleShow={() => setShowPassword(!showPassword)}
                        autoComplete="new-password"
                        minLength={8}
                      />
                      <PasswordMeter value={newPassword} />
                    </Field>
                    <Field label="Confirm password" error={passwordsMismatch ? 'Passwords do not match' : undefined}>
                      <PasswordInput
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        show={showPassword}
                        onToggleShow={() => setShowPassword(!showPassword)}
                        autoComplete="new-password"
                        minLength={8}
                      />
                    </Field>
                    <Button
                      type="submit"
                      className="w-full mt-2 py-3"
                      loading={challengeStatus === 'loading'}
                      disabled={passwordsMismatch || !newPassword}
                    >
                      Set password & continue <Icon name="arrowRight" size={16} />
                    </Button>
                    <button
                      type="button"
                      onClick={backToSignIn}
                      className="mt-4 text-xs text-muted hover:text-white cursor-pointer transition-colors duration-200 mx-auto block"
                    >
                      Back to sign in
                    </button>
                  </form>
                ) : (
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
                          autoComplete="email"
                          required
                          className="pl-9"
                        />
                      </div>
                    </Field>
                    <Field label="Password">
                      <PasswordInput
                        value={form.password}
                        onChange={set('password')}
                        show={showPassword}
                        onToggleShow={() => setShowPassword(!showPassword)}
                        autoComplete="current-password"
                      />
                    </Field>
                    <Button type="submit" className="w-full mt-2 py-3" loading={status === 'loading'}>
                      Sign in <Icon name="arrowRight" size={16} />
                    </Button>
                  </form>
                )}

                {/* Secondary actions sit below a labelled rule so they read as
                    optional rather than as part of the auth flow. */}
                {(canInstall || (isIOS && !isStandalone)) && (
                  <div className="relative mt-7 mb-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border/70" />
                    <span className="text-[10.5px] uppercase tracking-widest text-muted/60 font-bold">
                      Or
                    </span>
                    <span className="h-px flex-1 bg-border/70" />
                  </div>
                )}
                {canInstall && (
                  <Button variant="ghost" className="w-full" onClick={promptInstall}>
                    <Icon name="download" size={16} /> Install Forge app
                  </Button>
                )}
                {isIOS && !isStandalone && (
                  <p className="text-xs text-muted bg-surface-2/70 border border-border px-3 py-2.5 rounded-[9px] leading-relaxed flex items-start gap-2">
                    <Icon name="smartphone" size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Install on iPhone: tap the <b>Share</b> icon, then <b>Add to Home Screen</b>.
                    </span>
                  </p>
                )}

                {/* In-card trust line — reassurance belongs next to the button
                    that submits credentials, not stranded below the card. */}
                <div className="mt-7 pt-5 border-t border-border/60 flex items-center justify-center gap-1.5 text-[11.5px] text-muted/70">
                  <Icon name="shield" size={12} className="text-primary/70" />
                  Secured sign-in · access is logged to the audit trail
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11.5px] text-muted/70 leading-relaxed">
            Accounts are provisioned by your admin or manager.
          </p>
        </div>
      </main>
    </div>
  );
}
