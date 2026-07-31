import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice.js';
import { usePwaInstall } from '../../hooks/usePwaInstall.js';
import { Button } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { LogoMark } from '../brand/Logo.jsx';
import AnnouncementPopup from '../announcements/AnnouncementPopup.jsx';
import { ROLES, roleLabel } from '../../constants.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'grid', end: true, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] },
  { to: '/submit', label: 'Log Meeting', icon: 'plus', roles: [ROLES.USER] },
  { to: '/meetings', label: 'My Meetings', icon: 'list', roles: [ROLES.USER] },
  { to: '/review', label: 'Review Queue', icon: 'check', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { to: '/submissions', label: 'Submissions', icon: 'layers', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'trophy', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] },
  { to: '/team', label: 'Team', icon: 'users', roles: [ROLES.MANAGER, ROLES.ADMIN] },
  { to: '/announcements', label: 'Information & News', icon: 'megaphone', end: true, roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.USER] },
  { to: '/announcements/manage', label: 'Manage Announcements', icon: 'edit', roles: [ROLES.ADMIN] },
  { to: '/config', label: 'Points Rules', icon: 'sliders', roles: [ROLES.ADMIN] },
  { to: '/audit', label: 'Audit Log', icon: 'history', roles: [ROLES.ADMIN] },
];

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-primary text-on-primary font-bold'
      : 'text-muted hover:bg-white/5 hover:text-white'
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
        className={`w-61 bg-sidebar/95 backdrop-blur-md border-r border-border text-muted flex flex-col fixed inset-y-0 left-0 z-40 pt-[env(safe-area-inset-top)] transition-transform duration-300 overflow-hidden ${
          open ? 'max-nav:translate-x-0' : 'max-nav:-translate-x-full'
        }`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/4 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3 px-5 pt-6 pb-6 border-b border-border/40">
          <LogoMark className="w-9 h-9 object-contain shrink-0" />
          <span className="text-lg text-white font-heading type-wordmark">
            FOR<b className="text-primary font-semibold">GE</b>
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
          <div className="text-2xs tracking-widest uppercase text-muted font-bold">{roleLabel(user?.role)}</div>
        </div>
      </aside>

      <div className="flex-1 ml-61 flex flex-col min-w-0 max-nav:ml-0 relative z-10">
        <header className="relative h-[calc(64px+env(safe-area-inset-top))] bg-surface/90 backdrop-blur-md border-b border-border flex items-center gap-3 px-6 pt-[env(safe-area-inset-top)] sticky top-0 z-30">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <button
            className="hidden max-nav:grid place-items-center w-11 h-11 -ml-2 bg-transparent border-0 cursor-pointer text-muted hover:text-white"
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
            <div className="flex flex-col leading-tight max-mobile:hidden">
              <span className="text-sm font-semibold text-white">{user?.name}</span>
              <span className="text-xs text-muted">{user?.city || user?.email}</span>
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

      <AnnouncementPopup />
    </div>
  );
}

