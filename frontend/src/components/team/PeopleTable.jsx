import { useEffect, useState } from 'react';
import { Badge, Button, Spinner, EmptyState, Pagination } from '../ui/index.jsx';
import { roleLabel } from '../../constants.js';

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';

/**
 * Paginated people table, shared by the managers list and a manager's team.
 *
 * @param {object[]} rows        Full result set — pagination is applied here.
 * @param {number}   pageSize
 * @param {boolean}  loading
 * @param {boolean}  showActions  Activate/deactivate/delete column (admin only).
 * @param {(u) => void} [onRowClick]  Makes rows navigable.
 * @param {Array<{label: string, render: (u) => any}>} [extraColumns]
 *   Inserted before the Status column — used for the manager team-size count.
 */
export default function PeopleTable({
  rows,
  pageSize,
  loading = false,
  showActions = false,
  onRowClick,
  extraColumns = [],
  emptyTitle = 'No users yet',
  emptyHint,
  actions,
  resetKey = '',
}) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  // Clamp so filtering or deleting the last row on the final page can't strand
  // the viewer on an empty one.
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  // A changed query (a search keystroke, a different manager) restarts at page
  // one — staying on page 4 of a 1-page result reads as "no results". Keyed on
  // the caller's query rather than on `rows`, so an unrelated change to the
  // data (deleting someone) leaves the reader on the page they were reading.
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  if (loading) return <Spinner label="Loading…" />;
  if (rows.length === 0) return <EmptyState title={emptyTitle} hint={emptyHint} />;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>Email</th>
              <th className={TH}>User ID</th>
              <th className={TH}>Role</th>
              <th className={TH}>City</th>
              {extraColumns.map((c) => (
                <th key={c.label} className={TH}>{c.label}</th>
              ))}
              <th className={TH}>Status</th>
              <th className={TH}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => (
              <tr
                key={u.id}
                onClick={onRowClick ? () => onRowClick(u) : undefined}
                title={onRowClick ? `View ${u.name}'s team` : undefined}
                className={`last:[&>td]:border-b-0 hover:bg-surface-2 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                <td className={TD}>{u.name}</td>
                <td className={TD}>{u.email}</td>
                <td className={TD}>{u.userId || '—'}</td>
                <td className={TD}><Badge>{roleLabel(u.role)}</Badge></td>
                <td className={TD}>{u.city || '—'}</td>
                {extraColumns.map((c) => (
                  <td key={c.label} className={TD}>{c.render(u)}</td>
                ))}
                <td className={TD}>
                  <Badge status={u.active === false ? 'REJECTED' : 'APPROVED'}>
                    {u.active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </td>
                <td className={TD}>
                  {showActions && actions && (
                    // Stop clicks here from also triggering the row's
                    // navigation — the buttons live inside a clickable row.
                    <div
                      className="flex items-center gap-2 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(u)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > pageSize && (
        <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-2.5">
          <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
          <p className="text-xs text-muted">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length}
          </p>
        </div>
      )}
    </>
  );
}

/** The activate/deactivate + delete pair, rendered per row. */
export function RowActions({ user: u, onToggleActive, onDelete, deletingId }) {
  return (
    <>
      <Button size="sm" variant={u.active === false ? 'primary' : 'ghost'} onClick={() => onToggleActive(u)}>
        {u.active === false ? 'Activate' : 'Deactivate'}
      </Button>
      {/* Deleting also wipes the Cognito account, so it is only offered once
          the account has been deactivated. */}
      {u.active === false && (
        <Button
          size="sm"
          variant="ghost"
          loading={deletingId === u.id}
          onClick={() => onDelete(u)}
          className="text-danger hover:bg-danger-soft"
        >
          Delete
        </Button>
      )}
    </>
  );
}
