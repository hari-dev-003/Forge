import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { Button } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { ROLES } from '../../constants.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'grid', end: true, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] },
  { to: '/submit', label: 'Log Meeting', icon: 'plus', roles: [ROLES.USER] },
  { to: '/meetings', label: 'My Meetings', icon: 'list', roles: [ROLES.USER] },
  { to: '/review', label: 'Review Queue', icon: 'check', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] },
  { to: '/team', label: 'Team', icon: 'users', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { to: '/config', label: 'Points Rules', icon: 'sliders', roles: [ROLES.ADMIN] },
];

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-primary text-[#08090d] font-bold shadow-[0_0_12px_rgba(238,179,28,0.35)]'
      : 'text-[#9b9db1] hover:bg-white/5 hover:text-white'
  }`;

export default function AppLayout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { canInstall, promptInstall } = usePwaInstall();

  const items = NAV.filter((n) => n.roles.includes(user?.role));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-bg relative overflow-hidden">
      {/* Ambient background light blobs */}
      <div className="midnight-effect-1" />
      <div className="midnight-effect-2" />

      <aside
        className={`w-61 bg-sidebar border-r border-border text-[#9b9db1] flex flex-col fixed inset-y-0 left-0 z-40 pt-[env(safe-area-inset-top)] transition-transform duration-300 ${
          open ? 'max-[860px]:translate-x-0' : 'max-[860px]:-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6 border-b border-border/40">
          <span className="w-8.5 h-8.5 rounded-[9px] bg-primary text-[#08090d] grid place-items-center font-extrabold text-sm shadow-[0_0_10px_rgba(238,179,28,0.4)]">
            F
          </span>
          <span className="text-base font-semibold text-white font-heading tracking-wide">
            For<b className="text-primary font-extrabold">ge</b>
          </span>
        </div>

        <nav className="flex flex-col gap-1 px-3 pt-4 flex-1">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navItemClass} onClick={() => setOpen(false)}>
              <Icon name={n.icon} size={18} className="shrink-0" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-border/40">
          <div className="text-[11px] tracking-widest uppercase text-muted font-bold">{user?.role}</div>
        </div>
      </aside>

      <div className="flex-1 ml-61 flex flex-col min-w-0 max-[860px]:ml-0 relative z-10">
        <header className="h-[calc(64px+env(safe-area-inset-top))] bg-surface/90 backdrop-blur-md border-b border-border flex items-center gap-3 px-6 pt-[env(safe-area-inset-top)] sticky top-0 z-30">
          <button
            className="hidden max-[860px]:grid place-items-center w-11 h-11 -ml-2 bg-transparent border-0 cursor-pointer text-muted hover:text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            <Icon name="menu" size={22} />
          </button>
          <div className="flex-1" />
          {canInstall && (
            <Button variant="outline" size="sm" onClick={promptInstall}>
              <Icon name="download" size={16} /> Install app
            </Button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-primary border border-primary/30 grid place-items-center font-bold font-heading">
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight max-[560px]:hidden">
              <span className="text-sm font-semibold text-white">{user?.name}</span>
              <span className="text-xs text-muted">{user?.region || user?.email}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </header>

        <main className="p-7 pb-[calc(28px+env(safe-area-inset-bottom))] max-w-300 w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

