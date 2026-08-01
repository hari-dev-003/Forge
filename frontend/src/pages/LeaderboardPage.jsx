import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoard, fetchMyStanding } from '../features/leaderboard/leaderboardSlice.js';
import { Card, Spinner, EmptyState, StatCard, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import { LEADERBOARD_SCOPES, ROLES } from '../constants.js';

const SCOPES = [
  { key: LEADERBOARD_SCOPES.ALLTIME, label: 'All-time' },
  { key: LEADERBOARD_SCOPES.WEEKLY, label: 'This week' },
  { key: LEADERBOARD_SCOPES.MONTHLY, label: 'This month' },
];

const RANK_TONE = [
  'bg-gradient-to-br from-primary via-[#ffd54f] to-[#ffb300] text-[#08090d] font-bold shadow-[0_0_12px_rgba(238,179,28,0.3)] border-0 scale-105',
  'bg-gradient-to-br from-white/30 via-white/15 to-transparent text-white font-bold border border-white/20',
  'bg-gradient-to-br from-[#cd7f32]/40 via-[#cd7f32]/20 to-transparent text-[#ffb07c] font-bold border border-[#cd7f32]/35',
];
const rankTone = (i) => RANK_TONE[i] || 'bg-surface-2/60 text-muted border border-border/40';

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { board, scope, me, status } = useSelector((s) => s.leaderboard);

  useEffect(() => {
    dispatch(fetchBoard(LEADERBOARD_SCOPES.ALLTIME));
    if (user.role === ROLES.USER) dispatch(fetchMyStanding());
  }, [dispatch, user.role]);

  return (
    <div>
      <PageHeader eyebrow="Rankings" title="Leaderboard" subtitle="Ranked by approved points. Updates the moment a manager approves a meeting." />

      {user.role === ROLES.USER && me && (
        <Reveal className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6 mb-6">
          <StatCard label="All-time rank" value={me.alltime.rank ? `#${me.alltime.rank}` : '—'} sub={`${me.alltime.points} pts`} accent="indigo" />
          <StatCard label="Gap to next" value={me.alltime.gapToNext ?? 0} sub="points" accent="amber" />
          <StatCard label="Weekly rank" value={me.weekly.rank ? `#${me.weekly.rank}` : '—'} sub={`${me.weekly.points} pts`} accent="blue" />
          <StatCard label="Monthly rank" value={me.monthly.rank ? `#${me.monthly.rank}` : '—'} sub={`${me.monthly.points} pts`} accent="green" />
        </Reveal>
      )}

      <Card
        title="Rankings"
        actions={
          <div className="flex gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                className={`px-4 py-1.75 text-sm rounded-full font-semibold cursor-pointer transition-all duration-200 ${
                  scope === s.key
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-transparent text-muted border border-border/40 hover:bg-surface-2 hover:text-white'
                }`}
                onClick={() => dispatch(fetchBoard(s.key))}
              >
                {s.label}
              </button>
            ))}
          </div>
        }
      >
        {status === 'loading' ? (
          <Spinner label="Loading…" />
        ) : board.length === 0 ? (
          <EmptyState title="No points yet" hint="Approved meetings will populate the leaderboard." />
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4 px-4 pb-3 border-b border-border/30 text-2xs uppercase tracking-wider font-bold text-muted/70 select-none">
              <span className="w-8.5 text-center shrink-0">Rank</span>
              <div className="w-9 shrink-0" />
              <span className="flex-1">Member</span>
              <span className="w-24 max-mobile:w-20 text-right shrink-0">Meetings</span>
              <span className="w-18 max-mobile:w-16 text-right shrink-0">Points</span>
            </div>

            {board.map((r, i) => (
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-control transition-all ${
                  r.userId === user.id
                    ? 'bg-primary-soft/90 border border-primary/30 shadow-[0_4px_16px_rgba(238,179,28,0.06)]'
                    : 'border border-transparent hover:bg-white/5'
                }`}
                key={r.userId}
              >
                <span className={`w-8.5 h-8.5 rounded-full grid place-items-center text-sm ${rankTone(i)}`}>{r.rank}</span>
                
                <div className="w-9 h-9 rounded-full bg-surface-2 text-muted border border-border/40 flex items-center justify-center font-bold text-xs shrink-0">
                  {(r.name || '?').charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white flex items-center gap-1.5 truncate">
                    {r.name}
                    {r.userId === user.id && <span className="text-primary text-2xs font-normal bg-primary-soft/85 border border-primary/25 px-1.5 py-0.25 rounded shrink-0">(you)</span>}
                  </div>
                </div>
                
                <div className="text-sm text-muted font-medium text-right shrink-0 min-w-24 max-mobile:min-w-20">
                  {r.conductedCount ?? 0} {r.conductedCount === 1 ? 'meeting' : 'meetings'}
                </div>

                <div className="font-bold text-primary tabular text-right shrink-0 min-w-18 max-mobile:min-w-16">
                  {r.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

