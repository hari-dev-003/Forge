import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../features/dashboard/dashboardSlice.js';
import { Card, StatCard, Spinner } from '../components/ui/index.jsx';
import { ROLES } from '../constants.js';

const RANK_TONE = ['bg-[#fef3c7] text-[#b45309]', 'bg-[#e5e7eb] text-[#4b5563]', 'bg-[#fde4d0] text-[#b45309]'];
const rankTone = (i) => RANK_TONE[i] || 'bg-surface-2 text-muted';

const STAT_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4';

function TrendChart({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-2.5 h-35 pt-2.5">
      {data.map((d) => (
        <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end" key={d.day}>
          <span className="text-xs font-semibold">{d.count}</span>
          <div
            className="w-full max-w-10.5 bg-primary rounded-t-md min-h-1 transition-all"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-[11px] text-muted">{d.day.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { summary, status } = useSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchSummary()); }, [dispatch]);

  if (status === 'loading' || !summary) return <Spinner label="Loading dashboard…" />;

  const k = summary.kpis;
  const isUser = user.role === ROLES.USER;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1">
          {isUser
            ? "Here's your activity today."
            : `${user.role} overview for your ${user.role === ROLES.ADMIN ? 'organization' : 'team'}.`}
        </p>
      </div>

      <div className={`${STAT_GRID} mb-5`}>
        <StatCard label="Meetings today" value={k.today} accent="indigo" />
        <StatCard label="Total meetings" value={k.total} accent="blue" />
        <StatCard label="Pending review" value={k.byStatus.PENDING} accent="amber" />
        <StatCard label="Approval rate" value={`${k.approvalRate}%`} accent="green" />
        {isUser ? (
          <>
            <StatCard label="My points" value={summary.points} sub="all-time" accent="indigo" />
            <StatCard label="My rank" value={summary.rank ? `#${summary.rank}` : '—'} sub={summary.gapToNext ? `${summary.gapToNext} to next` : ''} accent="amber" />
          </>
        ) : (
          <>
            <StatCard label={user.role === ROLES.ADMIN ? 'Field users' : 'Team size'} value={summary.counts?.teamSize ?? 0} accent="blue" />
            {user.role === ROLES.ADMIN && <StatCard label="Managers" value={summary.counts?.managers ?? 0} accent="indigo" />}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
        <Card title="Meetings — last 7 days">
          <TrendChart data={summary.trend} />
        </Card>

        {isUser ? (
          <Card title="Status breakdown">
            <div className={STAT_GRID}>
              <StatCard label="Approved" value={k.byStatus.APPROVED} accent="green" />
              <StatCard label="Rejected" value={k.byStatus.REJECTED} accent="amber" />
              <StatCard label="1-to-1" value={k.byType.ONE_TO_ONE} accent="blue" />
              <StatCard label="Group" value={k.byType.GROUP} accent="indigo" />
            </div>
          </Card>
        ) : (
          <Card title="Top performers">
            {(summary.leaderboardPreview || []).length === 0 ? (
              <p className="text-[13px] text-muted">No approved points yet.</p>
            ) : (
              summary.leaderboardPreview.map((r, i) => (
                <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0" key={r.userId}>
                  <span className={`w-8.5 h-8.5 rounded-full grid place-items-center font-bold ${rankTone(i)}`}>{i + 1}</span>
                  <span className="flex-1 font-semibold">{r.name}</span>
                  <span className="font-bold text-primary">{r.points} pts</span>
                </div>
              ))
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
