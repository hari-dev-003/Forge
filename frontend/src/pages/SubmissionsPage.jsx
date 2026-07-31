import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSubmissions } from '../features/submissions/submissionsSlice.js';
import { fetchUsers } from '../features/users/usersSlice.js';
import { assetUrl } from '../api/client.js';
import { Card, Button, Field, Input, Select, Badge, Skeleton, EmptyState, PageHeader } from '../components/ui/index.jsx';
import Reveal, { STAGGER } from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import { MEETING_TYPES, MEETING_STATUS, STATUS_LABEL, ROLES } from '../constants.js';

const PAGE_SIZE = 15;

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border select-none';
const TD = 'px-3.5 py-3 border-b border-border';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '');

const SORT_ACCESSOR = {
  createdAt: (m) => m.createdAt,
  employeeName: (m) => m.employeeName?.toLowerCase() || '',
  points: (m) => m.points?.awarded ?? -1,
  status: (m) => m.status,
};

function SortIcon({ active, dir }) {
  if (!active) return null;
  return <Icon name="arrowRight" size={12} className={`inline-block ml-1 ${dir === 'asc' ? '-rotate-90' : 'rotate-90'}`} />;
}

export default function SubmissionsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items, status } = useSelector((s) => s.submissions);
  const executives = useSelector((s) => s.users.list);
  const isAdmin = user.role === ROLES.ADMIN;

  const [filters, setFilters] = useState({ from: '', to: '', status: '', type: '', employeeId: '' });
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);
  useEffect(() => { dispatch(fetchSubmissions(filters)); setPage(1); }, [dispatch, filters]);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const toggleSort = (field) => {
    setSort((s) => (s.field === field ? { field, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { field, dir: 'desc' }));
    setPage(1);
  };

  const sorted = useMemo(() => {
    const accessor = SORT_ACCESSOR[sort.field];
    const copy = [...items].sort((a, b) => {
      const av = accessor(a), bv = accessor(b);
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [items, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const loading = status === 'loading';

  const Th = ({ field, label, className = '' }) => (
    <th className={`${TH} ${className} cursor-pointer hover:text-white transition-colors`} onClick={() => toggleSort(field)}>
      {label}
      <SortIcon active={sort.field === field} dir={sort.dir} />
    </th>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Team activity"
        title="All submissions"
        subtitle="Every meeting your team has logged, across every status and day — sort or filter to find what you need."
      />

      <Reveal>
        <Card title="Filters">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
            <Field label="From"><Input type="date" value={filters.from} onChange={setFilter('from')} /></Field>
            <Field label="To"><Input type="date" value={filters.to} onChange={setFilter('to')} /></Field>
            <Field label="Status">
              <Select value={filters.status} onChange={setFilter('status')}>
                <option value="">All statuses</option>
                {Object.values(MEETING_STATUS).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={filters.type} onChange={setFilter('type')}>
                <option value="">All types</option>
                <option value={MEETING_TYPES.ONE_TO_ONE}>One-to-one</option>
                <option value={MEETING_TYPES.GROUP}>Group</option>
                <option value={MEETING_TYPES.DIRECT_CONVERSION}>Direct conversion</option>
              </Select>
            </Field>
            {executives.length > 0 && (
              <Field label={isAdmin ? 'Executive' : 'Team member'}>
                <Select value={filters.employeeId} onChange={setFilter('employeeId')}>
                  <option value="">Everyone</option>
                  {executives.filter((e) => e.role === ROLES.USER).map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
        </Card>
      </Reveal>

      <Reveal delay={STAGGER[1]}>
        <Card
          title={loading ? 'Loading…' : `${sorted.length} submission${sorted.length === 1 ? '' : 's'}`}
          actions={
            totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </span>
                <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )
          }
        >
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState title="No submissions match these filters" hint="Try widening the date range or clearing a filter." icon={<Icon name="layers" size={20} />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={TH}></th>
                    <Th field="createdAt" label="Submitted" />
                    <Th field="employeeName" label="Executive" />
                    <th className={TH}>Type</th>
                    <Th field="status" label="Status" />
                    <Th field="points" label="Points" />
                    <th className={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((m) => {
                    const isGroup = m.type === MEETING_TYPES.GROUP;
                    const isDirectConversion = m.type === MEETING_TYPES.DIRECT_CONVERSION;
                    const title = isGroup ? m.group?.name : isDirectConversion ? m.directConversion?.name : m.customer?.name;
                    const cover = m.photos?.[0] || m.photo;
                    return (
                      <tr
                        key={m.meetingId}
                        className="hover:bg-surface-2 cursor-pointer last:[&>td]:border-b-0"
                        onClick={() => navigate(`/submissions/${m.meetingId}`)}
                        title="Open submission"
                      >
                        <td className={TD}>
                          {cover ? (
                            <img
                              src={assetUrl(cover.url)}
                              alt=""
                              className="w-9 h-9 rounded-control object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-control bg-surface-2 grid place-items-center text-muted/50">
                              <Icon name="image" size={16} />
                            </div>
                          )}
                        </td>
                        <td className={`${TD} whitespace-nowrap`}>
                          <div>{fmtDate(m.createdAt)}</div>
                          <div className="text-xs text-muted">{fmtTime(m.createdAt)}</div>
                        </td>
                        <td className={TD}>
                          <div className="font-semibold text-white">{m.employeeName}</div>
                          <div className="text-xs text-muted">{title || '—'}</div>
                        </td>
                        <td className={TD}>
                          <span
                            className={`text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                              isGroup ? 'bg-success-soft text-success' : isDirectConversion ? 'bg-info/15 text-info' : 'bg-primary-soft text-primary'
                            }`}
                          >
                            {isGroup ? 'Group' : isDirectConversion ? 'Direct conversion' : '1-to-1'}
                          </span>
                        </td>
                        <td className={TD}><Badge status={m.status} /></td>
                        <td className={TD}>
                          {m.status === MEETING_STATUS.APPROVED ? (
                            <span className="font-bold text-success">+{m.points?.awarded ?? 0}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className={`${TD} text-muted`}>
                          <Icon name="arrowRight" size={14} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
