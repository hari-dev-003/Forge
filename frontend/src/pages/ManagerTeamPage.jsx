import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchUsers } from '../features/users/usersSlice.js';
import { useUserActions } from '../features/users/useUserActions.js';
import { Card, Input, PageHeader, Spinner, EmptyState } from '../components/ui/index.jsx';
import PeopleTable, { RowActions } from '../components/team/PeopleTable.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import { ROLES } from '../constants.js';

const TEAM_PAGE_SIZE = 20;

/**
 * Admin drill-down: the executives reporting to one manager.
 *
 * Reads from the same /users response the managers list uses, and dispatches
 * the fetch itself so a direct link or a refresh works rather than depending on
 * the previous page having loaded.
 */
export default function ManagerTeamPage() {
  const { managerId } = useParams();
  const dispatch = useDispatch();
  const { list, status } = useSelector((s) => s.users);
  const [search, setSearch] = useState('');
  const { toggleActive, removeUser, deletingId } = useUserActions();

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const manager = useMemo(() => list.find((u) => u.id === managerId), [list, managerId]);

  const team = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((u) => u.role === ROLES.USER && u.managerId === managerId)
      .filter((u) => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [list, managerId, search]);

  const back = (
    <Link to="/team" className="text-sm text-muted hover:text-white inline-flex items-center gap-1">
      <Icon name="arrowRight" size={14} className="rotate-180" /> Back to managers
    </Link>
  );

  // The list is still loading and we have nothing to show yet.
  if (status === 'loading' && list.length === 0) return <Spinner label="Loading team…" />;

  if (!manager && status !== 'loading') {
    return (
      <div>
        <PageHeader eyebrow="People" title="Manager not found" actions={back} />
        <Card>
          <EmptyState
            title="This manager isn't available"
            hint="They may have been deleted."
            icon={<Icon name="alertTriangle" size={20} />}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Manager"
        title={manager?.name || 'Team'}
        subtitle={
          [manager?.email, manager?.city].filter(Boolean).join(' · ') ||
          'Executives reporting to this manager.'
        }
        actions={back}
      />

      <Reveal>
        <Card
          title={`${team.length} executive${team.length === 1 ? '' : 's'}`}
          actions={
            <div className="relative">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search executives…"
                aria-label="Search executives by name"
                className="pl-9 w-64 max-mobile:w-44"
              />
            </div>
          }
        >
          <PeopleTable
            rows={team}
            resetKey={`${managerId}:${search}`}
            pageSize={TEAM_PAGE_SIZE}
            loading={status === 'loading' && list.length === 0}
            showActions
            emptyTitle={search ? 'No executives match that search' : 'No executives on this team yet'}
            emptyHint={
              search
                ? 'Try a different name.'
                : 'This manager has not created any executives.'
            }
            actions={(u) => (
              <RowActions user={u} onToggleActive={toggleActive} onDelete={removeUser} deletingId={deletingId} />
            )}
          />
        </Card>
      </Reveal>
    </div>
  );
}
