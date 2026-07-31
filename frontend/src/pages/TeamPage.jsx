import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, resetCreate } from '../features/users/usersSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Spinner, EmptyState, Badge, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import { ROLES } from '../constants.js';

// Admin provisions Managers here (with a password they set themselves).
// Manager provisions Users on their own team — the password is generated
// server-side and shown once, below, for the manager to share manually.
const emptyManagerForm = { name: '', email: '', password: '', city: '' };
const emptyUserForm = { name: '', email: '', city: '' };

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

function TempPasswordBanner({ created, onDismiss }) {
  const [copied, setCopied] = useState(false);
  if (!created?.tempPassword) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-success-soft border border-success/30 rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3">
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
  const { user } = useSelector((s) => s.auth);
  const { list, status, createStatus, error, lastCreated } = useSelector((s) => s.users);
  const isAdmin = user.role === ROLES.ADMIN;
  const [managerForm, setManagerForm] = useState(emptyManagerForm);
  const [userForm, setUserForm] = useState(emptyUserForm);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const setManagerField = (k) => (e) => setManagerForm({ ...managerForm, [k]: e.target.value });
  const setUserField = (k) => (e) => setUserForm({ ...userForm, [k]: e.target.value });

  const toggleActive = async (u) => {
    const res = await dispatch(updateUser({ id: u.id, patch: { active: !u.active } }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: `${u.name} ${u.active ? 'deactivated' : 'activated'}`, type: 'success' }));
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to update', type: 'error' }));
    }
  };

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
      dispatch(pushToast({ message: 'Employee created', type: 'success' }));
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
        subtitle={isAdmin ? 'Create managers on the platform.' : 'Create and manage the field executives reporting to you.'}
      />

      <TempPasswordBanner created={lastCreated} onDismiss={() => dispatch(resetCreate())} />

      {isAdmin && (
        <Reveal>
          <Card title="Add a manager">
            <form onSubmit={submitManager}>
              <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                <Field label="Full name"><Input value={managerForm.name} onChange={setManagerField('name')} required /></Field>
                <Field label="Email"><Input type="email" value={managerForm.email} onChange={setManagerField('email')} required /></Field>
                <Field label="Temporary password"><Input value={managerForm.password} onChange={setManagerField('password')} minLength={8} required hint="Min 8 characters, with upper/lowercase, a number & a symbol" /></Field>
                <Field label="City"><Input value={managerForm.city} onChange={setManagerField('city')} placeholder="Bengaluru, Chennai…" /></Field>
              </div>
              {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
              <Button type="submit" loading={createStatus === 'loading'}>Create manager</Button>
            </form>
          </Card>
        </Reveal>
      )}

      {!isAdmin && (
        <Reveal>
          <Card title="Add an employee">
            <form onSubmit={submitUser}>
              <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                <Field label="Full name"><Input value={userForm.name} onChange={setUserField('name')} required /></Field>
                <Field label="Email"><Input type="email" value={userForm.email} onChange={setUserField('email')} required /></Field>
                <Field label="City"><Input value={userForm.city} onChange={setUserField('city')} placeholder="Bengaluru, Chennai…" /></Field>
              </div>
              {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
              <Button type="submit" loading={createStatus === 'loading'}>Create employee</Button>
              <p className="text-xs text-muted mt-2.5">A temporary password is generated automatically — you'll get it here to share with them.</p>
            </form>
          </Card>
        </Reveal>
      )}

      <Reveal delay={80}>
        <Card title={`${list.length} ${isAdmin ? 'people' : 'team members'}`}>
          {status === 'loading' ? (
            <Spinner label="Loading…" />
          ) : list.length === 0 ? (
            <EmptyState title="No users yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={TH}>Name</th><th className={TH}>Email</th><th className={TH}>User ID</th>
                    <th className={TH}>Role</th><th className={TH}>City</th><th className={TH}>Status</th>
                    <th className={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                      <td className={TD}>{u.name}</td>
                      <td className={TD}>{u.email}</td>
                      <td className={TD}>{u.userId || '—'}</td>
                      <td className={TD}><Badge>{u.role}</Badge></td>
                      <td className={TD}>{u.city || '—'}</td>
                      <td className={TD}><Badge status={u.active === false ? 'REJECTED' : 'APPROVED'}>{u.active === false ? 'Inactive' : 'Active'}</Badge></td>
                      <td className={TD}>
                        {isAdmin && (
                          <Button size="sm" variant={u.active === false ? 'primary' : 'ghost'} onClick={() => toggleActive(u)}>
                            {u.active === false ? 'Activate' : 'Deactivate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
