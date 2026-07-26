import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchMyMeetings } from '../features/meetings/meetingsSlice.js';
import { Spinner, EmptyState, Button, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import MeetingCard from '../components/meetings/MeetingCard.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function MyMeetingsPage() {
  const dispatch = useDispatch();
  const { mine, status } = useSelector((s) => s.meetings);

  useEffect(() => { dispatch(fetchMyMeetings()); }, [dispatch]);

  return (
    <div>
      <PageHeader
        eyebrow="Your activity"
        title="My meetings"
        subtitle="Every meeting you've logged and its review status."
        actions={<Link to="/submit"><Button><Icon name="plus" size={16} /> Log meeting</Button></Link>}
      />

      {status === 'loading' ? (
        <Spinner label="Loading…" />
      ) : mine.length === 0 ? (
        <EmptyState title="No meetings yet" hint="Log your first client meeting to start earning points." />
      ) : (
        <Reveal className="grid gap-3.5">
          {mine.map((m) => (
            <MeetingCard key={m.meetingId} meeting={m} />
          ))}
        </Reveal>
      )}
    </div>
  );
}
