import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQueue, decideMeeting } from '../features/approvals/approvalsSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { Spinner, EmptyState, Button, Input } from '../components/ui/index.jsx';
import MeetingCard from '../components/meetings/MeetingCard.jsx';

export default function ReviewQueuePage() {
  const dispatch = useDispatch();
  const { queue, status, decidingId } = useSelector((s) => s.approvals);
  const [rejectFor, setRejectFor] = useState(null);
  const [reason, setReason] = useState('');
  const [ratings, setRatings] = useState({});

  useEffect(() => { dispatch(fetchQueue('PENDING')); }, [dispatch]);

  const decide = async (id, decision, why, qualityScore) => {
    const res = await dispatch(decideMeeting({ id, decision, reason: why, qualityScore }));
    if (res.meta.requestStatus === 'fulfilled') {
      const pts = res.payload.points?.awarded;
      dispatch(pushToast({
        message: decision === 'APPROVE' ? `Approved — ${pts} pts awarded` : 'Meeting rejected',
        type: decision === 'APPROVE' ? 'success' : 'info',
      }));
      setRejectFor(null);
      setReason('');
    } else {
      dispatch(pushToast({ message: res.payload || 'Action failed', type: 'error' }));
    }
  };

  const confirmReject = (id) => {
    if (!reason.trim()) return dispatch(pushToast({ message: 'A reason is required', type: 'error' }));
    decide(id, 'REJECT', reason.trim());
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Review queue</h1>
        <p className="text-muted text-sm mt-1">Approve or reject meetings submitted by your team. Approving awards points instantly.</p>
      </div>

      {status === 'loading' ? (
        <Spinner label="Loading queue…" />
      ) : queue.length === 0 ? (
        <EmptyState title="All caught up 🎉" hint="No meetings are waiting for review." />
      ) : (
        <div className="grid gap-3.5">
          {queue.map((m) => (
            <MeetingCard key={m.meetingId} meeting={m} showEmployee>
              {rejectFor === m.meetingId ? (
                <div className="flex gap-2 w-full flex-wrap">
                  <Input
                    autoFocus
                    placeholder="Reason for rejection…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="flex-1 min-w-50"
                  />
                  <Button variant="danger" size="sm" loading={decidingId === m.meetingId} onClick={() => confirmReject(m.meetingId)}>
                    Confirm reject
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setRejectFor(null); setReason(''); }}>Cancel</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-0.5" aria-label="Quality rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`text-lg leading-none cursor-pointer transition-colors ${
                          n <= (ratings[m.meetingId] || 0) ? 'text-primary' : 'text-muted/40 hover:text-muted'
                        }`}
                        onClick={() => setRatings({ ...ratings, [m.meetingId]: n === ratings[m.meetingId] ? 0 : n })}
                        title={`${n} star${n > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    loading={decidingId === m.meetingId}
                    onClick={() => decide(m.meetingId, 'APPROVE', undefined, ratings[m.meetingId] || undefined)}
                  >
                    ✓ Approve
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setRejectFor(m.meetingId); setReason(''); }}>
                    ✕ Reject
                  </Button>
                </>
              )}
            </MeetingCard>
          ))}
        </div>
      )}
    </div>
  );
}
