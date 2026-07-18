import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyMeetings } from '../features/meetings/meetingsSlice.js';
import { Spinner, EmptyState, Button } from '../components/ui/index.jsx';
import MeetingCard from '../components/meetings/MeetingCard.jsx';

export default function MyMeetingsPage() {
  const dispatch = useDispatch();
  const { mine, status } = useSelector((s) => s.meetings);

  useEffect(() => { dispatch(fetchMyMeetings()); }, [dispatch]);

  return (
    <div>
      <div className="mb-6 flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">My meetings</h1>
          <p className="text-muted text-sm mt-1">Every meeting you've logged and its review status.</p>
        </div>
        <Link to="/submit"><Button>＋ Log meeting</Button></Link>
      </div>

      {status === 'loading' ? (
        <Spinner label="Loading…" />
      ) : mine.length === 0 ? (
        <EmptyState title="No meetings yet" hint="Log your first client meeting to start earning points." />
      ) : (
        <div className="grid gap-3.5">
          {mine.map((m) => (
            <MeetingCard key={m.meetingId} meeting={m} />
          ))}
        </div>
      )}
    </div>
  );
}
