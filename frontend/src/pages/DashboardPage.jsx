import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary } from '../features/dashboard/dashboardSlice.js';
import { Card, StatCard, Spinner } from '../components/ui/index.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import { ROLES } from '../constants.js';

const STAT_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4';

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
        <h1 className="text-2xl font-bold font-heading text-white">Hi {user.name.split(' ')[0]} 👋</h1>
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
            <StatCard label="Pending > SLA" value={summary.counts?.pendingAging ?? 0} sub="awaiting review too long" accent="amber" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
        <Card title="Meetings — last 7 days">
          <LineChart data={summary.trend} />
        </Card>
        <Card title="Meeting type distribution">
          <DonutChart
            data={[
              { name: '1-to-1', value: k.byType.ONE_TO_ONE },
              { name: 'Group', value: k.byType.GROUP },
            ]}
          />
        </Card>
      </div>

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
            <BarChart data={summary.leaderboardPreview} height={Math.max(160, summary.leaderboardPreview.length * 42)} />
          )}
        </Card>
      )}
    </div>
  );
}

