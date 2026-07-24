import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLog } from '../features/audit/auditSlice.js';
import { Card, Spinner, EmptyState, Badge } from '../components/ui/index.jsx';

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

export default function AuditLogPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.audit);

  useEffect(() => { dispatch(fetchAuditLog()); }, [dispatch]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="text-muted text-sm mt-1">Every user, config, and approval change — who did what, and when.</p>
      </div>

      <Card title={`${items.length} events`}>
        {status === 'loading' ? (
          <Spinner label="Loading…" />
        ) : items.length === 0 ? (
          <EmptyState title="No audit events yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr><th className={TH}>When</th><th className={TH}>Action</th><th className={TH}>Actor</th><th className={TH}>Target</th><th className={TH}>Details</th></tr>
              </thead>
              <tbody>
                {items.map((ev, i) => (
                  <tr key={`${ev.ts}-${i}`} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                    <td className={`${TD} whitespace-nowrap`}>{fmt(ev.ts)}</td>
                    <td className={TD}><Badge>{ev.action}</Badge></td>
                    <td className={TD}>{ev.actorId} <span className="text-muted">({ev.actorRole})</span></td>
                    <td className={`${TD} break-all`}>{ev.target || '—'}</td>
                    <td className={`${TD} break-all text-muted text-xs max-w-100`}>
                      {ev.meta ? JSON.stringify(ev.meta) : '—'}
                    </td>
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
