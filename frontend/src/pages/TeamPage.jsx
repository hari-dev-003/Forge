import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, createUser, resetCreate } from '../features/users/usersSlice.js';
import { useUserActions } from '../features/users/useUserActions.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, PageHeader } from '../components/ui/index.jsx';
import PeopleTable, { RowActions } from '../components/team/PeopleTable.jsx';
import Reveal, { STAGGER } from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import { ROLES } from '../constants.js';

// Admin provisions Managers here (with a password they set themselves).
// Manager provisions Executives on their own team — the password is generated
// server-side and shown once, below, for the manager to share manually.
// Note: an executive's stored role value is still `USER`; only the wording
// shown to people says "Executive" (see roleLabel in constants.js).
const emptyManagerForm = { name: '', email: '', password: '', city: '' };
const emptyUserForm = { name: '', email: '', city: '' };

// Admin browses managers; a manager browses their own executives.
const MANAGERS_PAGE_SIZE = 25;
const TEAM_PAGE_SIZE = 20;

function TempPasswordBanner({ created, onDismiss }) {
  const [copied, setCopied] = useState(false);
  if (!created?.tempPassword) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-success-soft border border-success/30 rounded-card px-4 py-3.5 mb-5 flex items-start gap-3">
      <Icon name="check" size={16} className="text-success shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-semibold">
          {created.user.name} was created — share this temporary password with them directly.
        </p>
        <p className="text-xs text-muted mt-0.5">
          They'll be asked to set their own password the first time they sign in. This won't be shown again.
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <code className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-primary tracking-wide">
            {created.tempPassword}
          </code>
          <Button type="button" size="sm" variant="outline" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted hover:text-white cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export default function TeamPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { list, status, createStatus, error, lastCreated } = useSelector((s) => s.users);
  const isAdmin = user.role === ROLES.ADMIN;
  const [managerForm, setManagerForm] = useState(emptyManagerForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [search, setSearch] = useState('');
  const { toggleActive, removeUser, deletingId } = useUserActions();

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  // Admin sees managers, and drills into a manager to reach their executives.
  // A manager sees their own team directly (the API already scopes their list).
  //
  // Both views are derived from the single /users response rather than a
  // per-manager request: it is one round trip, it makes the team-size column
  // free, and the drill-down is instant. Worth moving server-side (a managerId
  // filter on GET /users) if the directory ever outgrows a single response.
  const rows = useMemo(() => {
    if (!isAdmin) return list.filter((u) => u.role === ROLES.USER);
    const q = search.trim().toLowerCase();
    return list
      .filter((u) => u.role === ROLES.MANAGER)
      .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [list, isAdmin, search]);

  const teamSizeOf = useMemo(() => {
    const counts = new Map();
    for (const u of list) {
      if (u.role !== ROLES.USER || !u.managerId) continue;
      counts.set(u.managerId, (counts.get(u.managerId) || 0) + 1);
    }
    return counts;
  }, [list]);

  const setManagerField = (k) => (e) => setManagerForm({ ...managerForm, [k]: e.target.value });
  const setUserField = (k) => (e) => setUserForm({ ...userForm, [k]: e.target.value });

  const submitManager = async (e) => {
    e.preventDefault();
    const res = await dispatch(createUser({ ...managerForm, city: managerForm.city || null }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Manager created', type: 'success' }));
      setManagerForm(emptyManagerForm);
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to create', type: 'error' }));
    }
  };

  const submitUser = async (e) => {
    e.preventDefault();
    const res = await dispatch(createUser({ ...userForm, city: userForm.city || null }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Executive created', type: 'success' }));
      setUserForm(emptyUserForm);
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to create', type: 'error' }));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title={isAdmin ? 'Managers' : 'My team'}
        subtitle={
          isAdmin
            ? 'Create managers, and open one to see the executives reporting to them.'
            : 'Create and manage the field executives reporting to you.'
        }
      />

      <TempPasswordBanner created={lastCreated} onDismiss={() => dispatch(resetCreate())} />

      {isAdmin ? (
        <Reveal>
          <Card title="Add a manager">
            <form onSubmit={submitManager}>
              <div className="grid grid-cols-2 gap-4 max-nav:grid-cols-1">
                <Field label="Full name"><Input value={managerForm.name} onChange={setManagerField('name')} required /></Field>
                <Field label="Email"><Input type="email" value={managerForm.email} onChange={setManagerField('email')} required /></Field>
                <Field label="Temporary password"><Input value={managerForm.password} onChange={setManagerField('password')} minLength={8} required hint="Min 8 characters, with upper/lowercase, a number & a symbol" /></Field>
                <Field label="City"><Input value={managerForm.city} onChange={setManagerField('city')} placeholder="Bengaluru, Chennai…" /></Field>
              </div>
              {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-control text-sm mb-4">{error}</div>}
              <Button type="submit" loading={createStatus === 'loading'}>Create manager</Button>
            </form>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <Card title="Add an executive">
            <form onSubmit={submitUser}>
              <div className="grid grid-cols-2 gap-4 max-nav:grid-cols-1">
                <Field label="Full name"><Input value={userForm.name} onChange={setUserField('name')} required /></Field>
                <Field label="Email"><Input type="email" value={userForm.email} onChange={setUserField('email')} required /></Field>
                <Field label="City"><Input value={userForm.city} onChange={setUserField('city')} placeholder="Bengaluru, Chennai…" /></Field>
              </div>
              {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-control text-sm mb-4">{error}</div>}
              <Button type="submit" loading={createStatus === 'loading'}>Create executive</Button>
              <p className="text-xs text-muted mt-2.5">A temporary password is generated automatically — you'll get it here to share with them.</p>
            </form>
          </Card>
        </Reveal>
      )}

      <Reveal delay={STAGGER[1]}>
        <Card
          title={
            isAdmin
              ? `${rows.length} manager${rows.length === 1 ? '' : 's'}`
              : `${rows.length} team member${rows.length === 1 ? '' : 's'}`
          }
          actions={
            isAdmin && (
              <div className="relative">
                <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search managers by name…"
                  aria-label="Search managers by name"
                  className="pl-9 w-64 max-mobile:w-44"
                />
              </div>
            )
          }
        >
          <PeopleTable
            rows={rows}
            resetKey={search}
            pageSize={isAdmin ? MANAGERS_PAGE_SIZE : TEAM_PAGE_SIZE}
            loading={status === 'loading'}
            showActions={isAdmin}
            onRowClick={isAdmin ? (u) => navigate(`/team/${u.id}`) : undefined}
            extraColumns={
              isAdmin
                ? [{ label: 'Team', render: (u) => teamSizeOf.get(u.id) || 0 }]
                : []
            }
            emptyTitle={
              isAdmin
                ? search
                  ? 'No managers match that search'
                  : 'No managers yet'
                : 'No team members yet'
            }
            emptyHint={isAdmin && search ? 'Try a different name.' : undefined}
            actions={(u) => (
              <RowActions user={u} onToggleActive={toggleActive} onDelete={removeUser} deletingId={deletingId} />
            )}
          />
        </Card>
      </Reveal>
    </div>
  );
}
