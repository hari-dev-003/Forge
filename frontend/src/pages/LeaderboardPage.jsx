import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoard, fetchMyStanding } from '../features/leaderboard/leaderboardSlice.js';
import { Card, Spinner, EmptyState, StatCard } from '../components/ui/index.jsx';
import { LEADERBOARD_SCOPES, ROLES } from '../constants.js';

const SCOPES = [
  { key: LEADERBOARD_SCOPES.ALLTIME, label: 'All-time' },
  { key: LEADERBOARD_SCOPES.WEEKLY, label: 'This week' },
  { key: LEADERBOARD_SCOPES.MONTHLY, label: 'This month' },
];

const RANK_TONE = [
  'bg-primary/20 text-primary border border-primary/40 font-extrabold shadow-[0_0_8px_rgba(238,179,28,0.3)]',
  'bg-white/10 text-white border border-white/20 font-bold',
  'bg-amber-700/20 text-amber-400 border border-amber-600/30 font-bold',
];
const rankTone = (i) => RANK_TONE[i] || 'bg-surface-2 text-muted border border-border';

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-white">Leaderboard</h1>
        <p className="text-muted text-sm mt-1">Ranked by approved points. Updates the moment a manager approves a meeting.</p>
      </div>

      {user.role === ROLES.USER && me && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mb-5">
          <StatCard label="All-time rank" value={me.alltime.rank ? `#${me.alltime.rank}` : '—'} sub={`${me.alltime.points} pts`} accent="indigo" />
          <StatCard label="Gap to next" value={me.alltime.gapToNext ?? 0} sub="points" accent="amber" />
          <StatCard label="Weekly rank" value={me.weekly.rank ? `#${me.weekly.rank}` : '—'} sub={`${me.weekly.points} pts`} accent="blue" />
          <StatCard label="Monthly rank" value={me.monthly.rank ? `#${me.monthly.rank}` : '—'} sub={`${me.monthly.points} pts`} accent="green" />
        </div>
      )}

      <Card
        title="Rankings"
        actions={
          <div className="flex gap-2">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                className={`px-3 py-1.75 text-[13px] rounded-[9px] font-semibold cursor-pointer transition-all duration-200 ${
                  scope === s.key
                    ? 'bg-primary text-[#08090d] font-bold shadow-[0_0_10px_rgba(238,179,28,0.3)]'
                    : 'bg-transparent text-muted border border-border hover:bg-surface-2 hover:text-white'
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
          board.map((r, i) => (
            <div
              className={`flex items-center gap-4 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-white/5 transition-colors ${
                r.userId === user.id ? 'bg-primary-soft/80 border-l-4 border-l-primary rounded-[9px]' : ''
              }`}
              key={r.userId}
            >
              <span className={`w-8.5 h-8.5 rounded-full grid place-items-center ${rankTone(i)}`}>{r.rank}</span>
              <span className="flex-1 font-semibold text-white">
                {r.name}
                {r.userId === user.id && <span className="text-primary font-normal ml-1.5">(you)</span>}
              </span>
              <span className="font-bold text-primary">{r.points} pts</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

