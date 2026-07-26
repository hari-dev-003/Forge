import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLog } from '../features/audit/auditSlice.js';
import { Card, Spinner, EmptyState, Badge, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

function MetaChips({ meta }) {
  const entries = meta && typeof meta === 'object' ? Object.entries(meta) : [];
  if (entries.length === 0) return <span className="text-muted">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 bg-surface-2 border border-border rounded px-1.5 py-0.5 text-[11px] text-muted whitespace-nowrap">
          <span className="text-muted/70">{key}:</span>
          <span className="text-ink">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
        </span>
      ))}
    </div>
  );
}

export default function AuditLogPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.audit);

  useEffect(() => { dispatch(fetchAuditLog()); }, [dispatch]);

  return (
    <div>
      <PageHeader eyebrow="History" title="Audit log" subtitle="Every user, config, and approval change — who did what, and when." />

      <Reveal>
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
                      <td className={`${TD} max-w-100`}>
                        <MetaChips meta={ev.meta} />
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
