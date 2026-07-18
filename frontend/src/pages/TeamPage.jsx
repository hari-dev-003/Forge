import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, fetchManagers, createUser, resetCreate } from '../features/users/usersSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Card, Button, Field, Input, Select, Spinner, EmptyState, Badge } from '../components/ui/index.jsx';
import { ROLES } from '../constants.js';

const emptyForm = { name: '', email: '', password: '', role: ROLES.USER, managerId: '', region: '' };

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

export default function TeamPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list, managers, status, createStatus, error } = useSelector((s) => s.users);
  const isAdmin = user.role === ROLES.ADMIN;
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchUsers());
    if (isAdmin) dispatch(fetchManagers());
  }, [dispatch, isAdmin]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      region: form.region || null,
      managerId: form.role === ROLES.USER ? form.managerId || null : null,
    };
    const res = await dispatch(createUser(payload));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: `${form.role === ROLES.MANAGER ? 'Manager' : 'User'} created`, type: 'success' }));
      setForm(emptyForm);
      dispatch(resetCreate());
      if (isAdmin) dispatch(fetchManagers());
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to create', type: 'error' }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isAdmin ? 'Users & Managers' : 'My team'}</h1>
        <p className="text-muted text-sm mt-1">
          {isAdmin ? 'Create managers and field users and assign reporting lines.' : 'The field executives reporting to you.'}
        </p>
      </div>

      {isAdmin && (
        <Card title="Add a user">
          <form onSubmit={submit}>
            <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
              <Field label="Full name"><Input value={form.name} onChange={set('name')} required /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
              <Field label="Temporary password"><Input value={form.password} onChange={set('password')} minLength={8} required hint="Min 8 characters" /></Field>
              <Field label="Role">
                <Select value={form.role} onChange={set('role')}>
                  <option value={ROLES.USER}>Field user</option>
                  <option value={ROLES.MANAGER}>Manager</option>
                </Select>
              </Field>
              {form.role === ROLES.USER && (
                <Field label="Reports to (manager)">
                  <Select value={form.managerId} onChange={set('managerId')} required>
                    <option value="">Select manager…</option>
                    {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </Select>
                </Field>
              )}
              <Field label="Region"><Input value={form.region} onChange={set('region')} placeholder="South / North…" /></Field>
            </div>
            {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}
            <Button type="submit" loading={createStatus === 'loading'}>Create user</Button>
          </form>
        </Card>
      )}

      <Card title={`${list.length} ${isAdmin ? 'people' : 'team members'}`}>
        {status === 'loading' ? (
          <Spinner label="Loading…" />
        ) : list.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr><th className={TH}>Name</th><th className={TH}>Email</th><th className={TH}>Role</th><th className={TH}>Region</th><th className={TH}>Status</th></tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                    <td className={TD}>{u.name}</td>
                    <td className={TD}>{u.email}</td>
                    <td className={TD}><Badge>{u.role}</Badge></td>
                    <td className={TD}>{u.region || '—'}</td>
                    <td className={TD}><Badge status={u.active === false ? 'REJECTED' : 'APPROVED'}>{u.active === false ? 'Inactive' : 'Active'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
