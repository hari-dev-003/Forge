import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSummary } from '../features/dashboard/dashboardSlice.js';
import { Card, StatCard, Badge, Skeleton, EmptyState } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import { ROLES, MEETING_TYPES } from '../constants.js';

const STAT_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4';
const TH = 'text-left px-3.5 py-2.5 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-2.5 border-b border-border';

function fmtRelative(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function TypeTag({ type }) {
  const isGroup = type === MEETING_TYPES.GROUP;
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${isGroup ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'}`}>
      {isGroup ? 'Group' : '1-to-1'}
    </span>
  );
}

function DeltaBadge({ pct }) {
  if (!pct) return null;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
      <Icon name="trendingUp" size={12} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}{pct}% vs last week
    </span>
  );
}

function NeedsAttentionCard({ sla }) {
  return (
    <Card title="Needs attention" actions={<Link to="/submissions" className="text-xs text-primary font-semibold hover:underline">View all</Link>}>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center bg-surface-2 rounded-[10px] py-2.5">
          <div className="text-lg font-bold font-heading text-success">{sla.onTrack}</div>
          <div className="text-[11px] text-muted uppercase tracking-wide mt-0.5">On track</div>
        </div>
        <div className="text-center bg-surface-2 rounded-[10px] py-2.5">
          <div className="text-lg font-bold font-heading text-warning">{sla.dueSoon}</div>
          <div className="text-[11px] text-muted uppercase tracking-wide mt-0.5">Due soon</div>
        </div>
        <div className="text-center bg-surface-2 rounded-[10px] py-2.5">
          <div className="text-lg font-bold font-heading text-danger">{sla.breached}</div>
          <div className="text-[11px] text-muted uppercase tracking-wide mt-0.5">Breached</div>
        </div>
      </div>
      {sla.oldest.length === 0 ? (
        <EmptyState title="All caught up" hint="No pending reviews waiting." icon={<Icon name="check" size={18} />} />
      ) : (
        <div className="flex flex-col gap-1.5">
          {sla.oldest.map((m) => (
            <div key={m.meetingId} className="flex items-center gap-3 px-3 py-2 rounded-[9px] hover:bg-surface-2 transition-colors">
              <Icon name="alertTriangle" size={15} className="text-warning shrink-0" />
              <span className="flex-1 text-sm text-white truncate">{m.employeeName}</span>
              <TypeTag type={m.type} />
              <span className="text-xs text-muted whitespace-nowrap">{m.hoursWaiting}h waiting</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentActivityCard({ items }) {
  return (
    <Card title="Recent activity">
      {items.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((m) => (
            <div key={m.meetingId} className="flex items-center gap-3 px-3 py-2 rounded-[9px] hover:bg-surface-2 transition-colors">
              <span className="w-7 h-7 rounded-full bg-surface-2 grid place-items-center shrink-0">
                <Icon name={m.type === MEETING_TYPES.GROUP ? 'users' : 'user'} size={13} className="text-muted" />
              </span>
              <span className="flex-1 text-sm text-white truncate">{m.employeeName}</span>
              <Badge status={m.status} />
              <span className="text-xs text-muted whitespace-nowrap">{fmtRelative(m.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function PerformanceCard({ rows, isAdmin }) {
  return (
    <Card
      title={isAdmin ? 'Manager performance' : 'Team performance'}
      actions={<Link to="/submissions" className="text-xs text-primary font-semibold hover:underline">View all</Link>}
    >
      {rows.length === 0 ? (
        <EmptyState title="No one to show yet" hint={isAdmin ? 'Managers will appear once assigned.' : 'Your team will appear once added.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={TH}>{isAdmin ? 'Manager' : 'Team member'}</th>
                <th className={TH}>Submissions</th>
                <th className={TH}>Approval rate</th>
                <th className={TH}>Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                  <td className={`${TD} font-semibold text-white`}>{r.name}</td>
                  <td className={TD}>{r.submissions}</td>
                  <td className={TD}>{r.approvalRate}%</td>
                  <td className={`${TD} font-bold text-primary`}>{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RegionsCard({ regions }) {
  return (
    <Card title="By region">
      <div className="flex flex-col gap-1.5">
        {regions.map((r) => (
          <div key={r.region} className="flex items-center gap-3 px-3 py-2 rounded-[9px] hover:bg-surface-2 transition-colors">
            <Icon name="globe" size={14} className="text-muted shrink-0" />
            <span className="flex-1 text-sm text-white">{r.region}</span>
            <span className="text-xs text-muted">{r.count} meetings</span>
            <span className="text-sm font-bold text-primary">{r.points} pts</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className={`${STAT_GRID} mb-5`}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-21" />)}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
        <Card title="Meetings — last 7 days"><Skeleton className="h-50" /></Card>
        <Card title="Meeting type distribution"><Skeleton className="h-50" /></Card>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
        <Card title="Needs attention"><Skeleton className="h-40" /></Card>
        <Card title="Recent activity"><Skeleton className="h-40" /></Card>
      </div>
      <Card title="Performance"><Skeleton className="h-40" /></Card>
    </>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { summary, status } = useSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchSummary()); }, [dispatch]);

  const isUser = user.role === ROLES.USER;
  const isAdmin = user.role === ROLES.ADMIN;
  const loading = status === 'loading' || !summary;
  const k = summary?.kpis;

  return (
    <div>
      <div className="mb-7">
        <span className="text-primary text-xs font-bold uppercase tracking-widest">Overview</span>
        <h1 className="text-[32px] leading-tight font-bold font-heading tracking-tight text-white mt-1">Hi {user.name.split(' ')[0]} 👋</h1>
        <p className="text-muted text-sm mt-1.5">
          {isUser
            ? "Here's your activity today."
            : `${user.role} overview for your ${isAdmin ? 'organization' : 'team'}.`}
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : isUser ? (
        <>
          <Reveal className={`${STAT_GRID} mb-5`}>
            <StatCard label="Meetings today" value={k.today} accent="indigo" />
            <StatCard label="Total meetings" value={k.total} accent="blue" />
            <StatCard label="Pending review" value={k.byStatus.PENDING} accent="amber" />
            <StatCard label="Approval rate" value={`${k.approvalRate}%`} accent="green" />
            <StatCard label="My points" value={summary.points} sub="all-time" accent="indigo" />
            <StatCard label="My rank" value={summary.rank ? `#${summary.rank}` : '—'} sub={summary.gapToNext ? `${summary.gapToNext} to next` : ''} accent="amber" />
          </Reveal>

          <Reveal delay={80} className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
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
          </Reveal>

          <Reveal delay={160}>
            <Card title="Status breakdown">
              <div className={STAT_GRID}>
                <StatCard label="Approved" value={k.byStatus.APPROVED} accent="green" />
                <StatCard label="Rejected" value={k.byStatus.REJECTED} accent="amber" />
                <StatCard label="1-to-1" value={k.byType.ONE_TO_ONE} accent="blue" />
                <StatCard label="Group" value={k.byType.GROUP} accent="indigo" />
              </div>
            </Card>
          </Reveal>
        </>
      ) : (
        <>
          <Reveal className={`${STAT_GRID} mb-5`}>
            <StatCard label="Meetings today" value={k.today} accent="indigo" />
            <StatCard label="Total meetings" value={k.total} accent="blue" />
            <StatCard label="Pending review" value={k.byStatus.PENDING} accent="amber" />
            <StatCard label="Approval rate" value={`${k.approvalRate}%`} accent="green" />
            <StatCard label="Points awarded" value={summary.pointsAwarded} accent="indigo" />
            <StatCard label="Premium rate" value={`${summary.premiumRate}%`} accent="amber" />
            <StatCard label="Avg quality" value={summary.quality.avg > 0 ? `${summary.quality.avg}★` : '—'} sub={`${summary.quality.count} rated`} accent="blue" />
            <StatCard label={isAdmin ? 'Field users' : 'Team size'} value={summary.counts?.teamSize ?? 0} accent="blue" />
            {isAdmin && <StatCard label="Managers" value={summary.counts?.managers ?? 0} accent="indigo" />}
            {isAdmin && (
              <Link to="/team" className="contents">
                <StatCard label="Pending approvals" value={summary.counts?.pendingApprovals ?? 0} sub="new sign-ups" accent="amber" />
              </Link>
            )}
          </Reveal>

          <Reveal delay={80} className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
            <Card
              title="Meetings — last 7 days"
              actions={<DeltaBadge pct={summary.weekOverWeek?.deltaPct} />}
            >
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
          </Reveal>

          <Reveal delay={160} className="grid grid-cols-2 gap-4 mb-5 max-[860px]:grid-cols-1">
            <NeedsAttentionCard sla={summary.sla} />
            <RecentActivityCard items={summary.recentActivity || []} />
          </Reveal>

          <Reveal delay={240} className="mb-5">
            <PerformanceCard rows={summary.performance || []} isAdmin={isAdmin} />
          </Reveal>

          {summary.regions ? (
            <Reveal delay={320} className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
              <Card title="Top performers">
                {(summary.leaderboardPreview || []).length === 0 ? (
                  <p className="text-[13px] text-muted">No approved points yet.</p>
                ) : (
                  <BarChart data={summary.leaderboardPreview} height={Math.max(160, summary.leaderboardPreview.length * 42)} />
                )}
              </Card>
              <RegionsCard regions={summary.regions} />
            </Reveal>
          ) : (
            <Reveal delay={320}>
              <Card title="Top performers">
                {(summary.leaderboardPreview || []).length === 0 ? (
                  <p className="text-[13px] text-muted">No approved points yet.</p>
                ) : (
                  <BarChart data={summary.leaderboardPreview} height={Math.max(160, summary.leaderboardPreview.length * 42)} />
                )}
              </Card>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
}
