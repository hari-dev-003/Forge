import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnnouncements } from '../features/announcements/announcementsSlice.js';
import { Card, Input, Select, Skeleton, EmptyState, PageHeader } from '../components/ui/index.jsx';
import Reveal, { STAGGER } from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import AnnouncementCard from '../components/announcements/AnnouncementCard.jsx';
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_CATEGORY_LABEL } from '../constants.js';

const FILTER_CHIPS = [
  { key: '', label: 'All' },
  { key: ANNOUNCEMENT_CATEGORIES.EVENT, label: 'Events' },
  { key: ANNOUNCEMENT_CATEGORIES.NEWS, label: 'News' },
  { key: ANNOUNCEMENT_CATEGORIES.CIRCULAR, label: 'Circular' },
  { key: ANNOUNCEMENT_CATEGORIES.TRAINING, label: 'Training' },
  { key: '__important', label: 'Important' },
];

export default function AnnouncementsPage() {
  const dispatch = useDispatch();
  const { list, status } = useSelector((s) => s.announcements);
  const [category, setCategory] = useState('');
  const [important, setImportant] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    dispatch(fetchAnnouncements({ category: category || undefined, search: search || undefined, sort }));
  }, [dispatch, category, search, sort]);

  const items = important ? list.filter((a) => a.priority !== 'NORMAL') : list;

  // The server already returns pinned announcements first; splitting them out
  // here lets them render full-width above the grid rather than as ordinary
  // cells. Both halves keep the server's ordering (newest first).
  const pinned = items.filter((a) => a.isPinned);
  const rest = items.filter((a) => !a.isPinned);

  const selectChip = (key) => {
    if (key === '__important') {
      setImportant((v) => !v);
      return;
    }
    setImportant(false);
    setCategory(key);
  };

  return (
    <div>
      <PageHeader eyebrow="Information" title="Information & News" subtitle="Announcements, circulars, and updates from your organisation." />

      <Reveal>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTER_CHIPS.map((c) => {
            const active = c.key === '__important' ? important : !important && category === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => selectChip(c.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                  active ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted hover:text-white border border-border'
                }`}
              >
                {c.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements…" className="pl-9 w-56" />
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-40">
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
              <option value="mostViewed">Most Viewed</option>
            </Select>
          </div>
        </div>
      </Reveal>

      <Reveal delay={STAGGER[1]}>
        {status === 'loading' ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : items.length === 0 ? (
          <Card>
            <EmptyState title="No announcements yet" hint="Check back soon, or try a different filter." icon={<Icon name="megaphone" size={20} />} />
          </Card>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="flex flex-col gap-4 mb-4">
                {pinned.map((a) => (
                  <AnnouncementCard key={a.id} announcement={a} featured />
                ))}
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {rest.map((a) => <AnnouncementCard key={a.id} announcement={a} />)}
              </div>
            )}
          </>
        )}
      </Reveal>
    </div>
  );
}
