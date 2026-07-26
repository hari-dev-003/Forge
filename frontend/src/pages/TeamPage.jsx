import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, resetCreate } from '../features/users/usersSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Spinner, EmptyState, Badge, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { ROLES } from '../constants.js';

// Admin can only provision managers here — field users self-signup and
// verify their own email (see LoginPage.jsx), there's no admin-create path
// for them anymore.
const emptyForm = { name: '', email: '', password: '', region: '' };

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

export default function TeamPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list, status, createStatus, error } = useSelector((s) => s.users);
  const isAdmin = user.role === ROLES.ADMIN;
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleActive = async (u) => {
    const res = await dispatch(updateUser({ id: u.id, patch: { active: !u.active } }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: `${u.name} ${u.active ? 'deactivated' : 'activated'}`, type: 'success' }));
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to update', type: 'error' }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: ROLES.MANAGER,
      region: form.region || null,
    };
    const res = await dispatch(createUser(payload));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Manager created', type: 'success' }));
      setForm(emptyForm);
      dispatch(resetCreate());
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to create', type: 'error' }));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title={isAdmin ? 'Users & Managers' : 'My team'}
        subtitle={isAdmin ? 'Create managers — field users self-register and verify their own email.' : 'The field executives reporting to you.'}
      />

      {isAdmin && (
        <Reveal>
          <Card title="Add a manager">
            <form onSubmit={submit}>
              <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
                <Field label="Full name"><Input value={form.name} onChange={set('name')} required /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
                <Field label="Temporary password"><Input value={form.password} onChange={set('password')} minLength={8} required hint="Min 8 characters, with upper/lowercase, a number & a symbol" /></Field>
                <Field label="Region"><Input value={form.region} onChange={set('region')} placeholder="South / North…" /></Field>
              </div>
              {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
              <Button type="submit" loading={createStatus === 'loading'}>Create manager</Button>
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
                    <th className={TH}>Role</th><th className={TH}>Region</th><th className={TH}>Status</th>
                    {isAdmin && <th className={TH}></th>}
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                      <td className={TD}>{u.name}</td>
                      <td className={TD}>{u.email}</td>
                      <td className={TD}>{u.userId || '—'}</td>
                      <td className={TD}><Badge>{u.role}</Badge></td>
                      <td className={TD}>{u.region || '—'}</td>
                      <td className={TD}><Badge status={u.active === false ? 'REJECTED' : 'APPROVED'}>{u.active === false ? 'Inactive' : 'Active'}</Badge></td>
                      {isAdmin && (
                        <td className={TD}>
                          <Button size="sm" variant={u.active === false ? 'primary' : 'ghost'} onClick={() => toggleActive(u)}>
                            {u.active === false ? 'Activate' : 'Deactivate'}
                          </Button>
                        </td>
                      )}
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
