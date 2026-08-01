import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchSummary } from '../features/dashboard/dashboardSlice.js';
import { Card, StatCard, Badge, Skeleton, EmptyState } from '../components/ui/index.jsx';
import Reveal, { STAGGER } from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import { ROLES, MEETING_TYPES, roleLabel } from '../constants.js';

const STAT_GRID = 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6';
const TH = 'text-left px-5 py-3 text-muted text-2xs uppercase tracking-wider font-bold border-b border-border/40';
const TD = 'px-5 py-3.5 border-b border-border/40';

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
  const isDirectConversion = type === MEETING_TYPES.DIRECT_CONVERSION;
  const className = isGroup ? 'bg-success-soft text-success border border-success/10' : isDirectConversion ? 'bg-info/15 text-info border border-info/10' : 'bg-primary-soft text-primary border border-primary/10';
  const label = isGroup ? 'Group' : isDirectConversion ? 'Direct conversion' : '1-to-1';
  return (
    <span className={`text-2xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${className}`}>
      {label}
    </span>
  );
}

function DeltaBadge({ pct }) {
  if (!pct) return null;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${up ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
      <Icon name="trendingUp" size={12} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}{pct}% vs last week
    </span>
  );
}

function NeedsAttentionCard({ sla = {} }) {
  const oldest = sla.oldest || [];
  return (
    <Card title="Needs attention" actions={<Link to="/submissions" className="text-xs text-primary font-semibold hover:underline">View all</Link>}>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center bg-surface-2/40 hover:bg-surface-2/70 transition-colors border border-border/20 rounded-thumb py-3 px-2 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xl font-bold font-heading text-success leading-none">{sla.onTrack ?? 0}</div>
          <div className="text-2xs text-muted uppercase tracking-wider font-semibold mt-1">On track</div>
        </div>
        <div className="text-center bg-surface-2/40 hover:bg-surface-2/70 transition-colors border border-border/20 rounded-thumb py-3 px-2 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xl font-bold font-heading text-warning leading-none">{sla.dueSoon ?? 0}</div>
          <div className="text-2xs text-muted uppercase tracking-wider font-semibold mt-1">Due soon</div>
        </div>
        <div className="text-center bg-surface-2/40 hover:bg-surface-2/70 transition-colors border border-border/20 rounded-thumb py-3 px-2 flex flex-col items-center justify-center shadow-sm">
          <div className="text-xl font-bold font-heading text-danger leading-none">{sla.breached ?? 0}</div>
          <div className="text-2xs text-muted uppercase tracking-wider font-semibold mt-1">Breached</div>
        </div>
      </div>
      {oldest.length === 0 ? (
        <EmptyState title="All caught up" hint="No pending reviews waiting." icon={<Icon name="check" size={18} />} />
      ) : (
        <div className="flex flex-col gap-2">
          {oldest.map((m) => (
            <div key={m.meetingId} className="flex items-center gap-3 px-3 py-2.5 rounded-control hover:bg-surface-2/50 transition-colors border border-transparent hover:border-border/30">
              <div className="w-8.5 h-8.5 rounded-full bg-primary-soft text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                {(m.employeeName || '?').charAt(0).toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium text-white truncate">{m.employeeName}</span>
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
        <div className="flex flex-col gap-2">
          {items.map((m) => (
            <div key={m.meetingId} className="flex items-center gap-3 px-3 py-2.5 rounded-control hover:bg-surface-2/50 transition-colors border border-transparent hover:border-border/30">
              <div className="w-8.5 h-8.5 rounded-full bg-surface-2 text-muted border border-border flex items-center justify-center font-bold text-xs shrink-0 relative">
                {(m.employeeName || '?').charAt(0).toUpperCase()}
                <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-primary text-on-primary flex items-center justify-center border border-surface shadow-sm">
                  <Icon name={m.type === MEETING_TYPES.GROUP ? 'users' : m.type === MEETING_TYPES.DIRECT_CONVERSION ? 'trendingUp' : 'user'} size={9} />
                </span>
              </div>
              <span className="flex-1 text-sm font-medium text-white truncate">{m.employeeName}</span>
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
        <div className="overflow-x-auto -mx-6 md:-mx-7">
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
                <tr key={r.id} className="hover:bg-surface-2/40 last:[&>td]:border-b-0 transition-colors">
                  <td className={`${TD} font-semibold text-white`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8.5 h-8.5 rounded-full bg-primary-soft text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                        {(r.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <span>{r.name}</span>
                    </div>
                  </td>
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

function CitiesCard({ cities }) {
  return (
    <Card title="By city">
      <div className="flex flex-col gap-2">
        {cities.map((c) => (
          <div key={c.city} className="flex items-center gap-3 px-3 py-2.5 rounded-control hover:bg-surface-2/50 transition-colors border border-transparent hover:border-border/30">
            <div className="w-8.5 h-8.5 rounded-full bg-surface-2 text-muted border border-border flex items-center justify-center font-bold text-xs shrink-0 uppercase">
              {c.city?.slice(0, 2)}
            </div>
            <span className="flex-1 text-sm font-medium text-white">{c.city}</span>
            <span className="text-xs text-muted">{c.count} meetings</span>
            <span className="text-sm font-bold text-primary">{c.points} pts</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className={`${STAT_GRID} mb-6`}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6 max-nav:grid-cols-1">
        <Card title="Meetings — last 7 days"><Skeleton className="h-56" /></Card>
        <Card title="Meeting type distribution"><Skeleton className="h-56" /></Card>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6 max-nav:grid-cols-1">
        <Card title="Needs attention"><Skeleton className="h-44" /></Card>
        <Card title="Recent activity"><Skeleton className="h-44" /></Card>
      </div>
      <Card title="Performance"><Skeleton className="h-44" /></Card>
    </>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { summary, status } = useSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchSummary()); }, [dispatch]);

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good morning';
    if (hrs < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Branch on the role the PAYLOAD declares, not the one in the auth slice.
  //
  // The two dashboard shapes differ: the USER summary has points/rank and no
  // sla/performance/recentActivity, the Manager/Admin one is the reverse. The
  // server picks the shape from its own view of the caller's role, so keying
  // the render off the client's copy meant any disagreement between them —
  // a stale token, a role changed mid-session, a backend running older code —
  // rendered the manager branch against a user-shaped payload and crashed the
  // whole page on the first missing field. The payload is the authority on its
  // own shape; `user.role` is only the fallback while it's still loading.
  const payloadRole = summary?.role || user.role;
  const isUser = payloadRole === ROLES.USER;
  const isAdmin = payloadRole === ROLES.ADMIN;
  const loading = status === 'loading' || !summary;
  const k = summary?.kpis;

  return (
    <div>
      <div className="mb-8 border-b border-border/20 pb-6">
        <span className="text-primary text-2xs font-bold uppercase tracking-widest">Overview</span>
        <h1 className="text-display leading-none font-bold font-heading tracking-tight text-white mt-1.5">{getGreeting()}, {user.name.split(' ')[0]}</h1>
        <p className="text-muted text-sm mt-2">
          {isUser
            ? "Here's your activity today."
            : `${roleLabel(user.role)} overview for your ${isAdmin ? 'organization' : 'team'}.`}
        </p>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : isUser ? (
        <>
          <Reveal className={`${STAT_GRID} mb-6`}>
            <StatCard label="Meetings today" value={k.today} accent="indigo" />
            <StatCard label="Total meetings" value={k.total} accent="blue" />
            <StatCard label="Pending review" value={k.byStatus.PENDING} accent="amber" />
            <StatCard label="Approval rate" value={`${k.approvalRate}%`} accent="green" />
            <StatCard label="My points" value={summary.points} sub="all-time" accent="indigo" />
            <StatCard label="My rank" value={summary.rank ? `#${summary.rank}` : '—'} sub={summary.gapToNext ? `${summary.gapToNext} to next` : ''} accent="amber" />
          </Reveal>

          <Reveal delay={STAGGER[1]} className="grid grid-cols-2 gap-6 mb-6 max-nav:grid-cols-1">
            <Card title="Meetings — last 7 days">
              <LineChart data={summary.trend} />
            </Card>
            <Card title="Meeting type distribution">
              <DonutChart
                data={[
                  { name: '1-to-1', value: k.byType.ONE_TO_ONE },
                  { name: 'Group', value: k.byType.GROUP },
                  { name: 'Direct conversion', value: k.byType.DIRECT_CONVERSION },
                ]}
              />
            </Card>
          </Reveal>

          <Reveal delay={STAGGER[2]}>
            <Card title="Status breakdown">
              <div className={STAT_GRID}>
                <StatCard label="Approved" value={k.byStatus.APPROVED} accent="green" />
                <StatCard label="Rejected" value={k.byStatus.REJECTED} accent="amber" />
                <StatCard label="1-to-1" value={k.byType.ONE_TO_ONE} accent="blue" />
                <StatCard label="Group" value={k.byType.GROUP} accent="indigo" />
                <StatCard label="Direct conversion" value={k.byType.DIRECT_CONVERSION} accent="amber" />
              </div>
            </Card>
          </Reveal>
        </>
      ) : (
        <>
          <Reveal className={`${STAT_GRID} mb-6`}>
            <StatCard label="Meetings today" value={k.today} accent="indigo" />
            <StatCard label="Total meetings" value={k.total} accent="blue" />
            <StatCard label="Pending review" value={k.byStatus.PENDING} accent="amber" />
            <StatCard label="Approval rate" value={`${k.approvalRate}%`} accent="green" />
            <StatCard label="Points awarded" value={summary.pointsAwarded} accent="indigo" />
            <StatCard label={isAdmin ? 'Field users' : 'Team size'} value={summary.counts?.teamSize ?? 0} accent="blue" />
            {isAdmin && <StatCard label="Managers" value={summary.counts?.managers ?? 0} accent="indigo" />}
            {isAdmin && (
              <Link to="/team" className="contents">
                <StatCard label="Pending approvals" value={summary.counts?.pendingApprovals ?? 0} sub="new sign-ups" accent="amber" />
              </Link>
            )}
          </Reveal>

          <Reveal delay={STAGGER[1]} className="grid grid-cols-2 gap-6 mb-6 max-nav:grid-cols-1">
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
                  { name: 'Direct conversion', value: k.byType.DIRECT_CONVERSION },
                ]}
              />
            </Card>
          </Reveal>

          <Reveal delay={STAGGER[2]} className="grid grid-cols-2 gap-6 mb-6 max-nav:grid-cols-1">
            <NeedsAttentionCard sla={summary.sla} />
            <RecentActivityCard items={summary.recentActivity || []} />
          </Reveal>

          <Reveal delay={STAGGER[3]} className="mb-6">
            <PerformanceCard rows={summary.performance || []} isAdmin={isAdmin} />
          </Reveal>

          {summary.cities ? (
            <Reveal delay={STAGGER[4]} className="grid grid-cols-2 gap-6 max-nav:grid-cols-1">
              <Card title="Top performers">
                {(summary.leaderboardPreview || []).length === 0 ? (
                  <p className="text-sm text-muted">No approved points yet.</p>
                ) : (
                  <BarChart data={summary.leaderboardPreview} height={Math.max(160, summary.leaderboardPreview.length * 42)} />
                )}
              </Card>
              <CitiesCard cities={summary.cities} />
            </Reveal>
          ) : (
            <Reveal delay={STAGGER[4]}>
              <Card title="Top performers">
                {(summary.leaderboardPreview || []).length === 0 ? (
                  <p className="text-sm text-muted">No approved points yet.</p>
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
