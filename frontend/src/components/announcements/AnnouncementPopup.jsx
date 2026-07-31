import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchAnnouncements } from '../../features/announcements/announcementsSlice.js';
import { Button } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { ANNOUNCEMENT_ANIMATION, ANNOUNCEMENT_CATEGORY_LABEL } from '../../constants.js';

const SEEN_KEY = 'ff_seen_popups';

function getSeen() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function markSeen(id) {
  const seen = getSeen();
  seen.add(id);
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

/**
 * Phase-1 "display animation": a centered popup modal (fade+zoom) shown once
 * per browser session for the highest-priority POPUP-flagged announcement the
 * caller hasn't dismissed yet. Slide Panel / Login Splash are documented
 * roadmap, not built here.
 */
export default function AnnouncementPopup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector((s) => s.announcements);
  const [candidate, setCandidate] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchAnnouncements({}));
  }, [dispatch]);

  useEffect(() => {
    if (!list.length) return;
    const seen = getSeen();
    const next = list.find(
      (a) =>
        a.animationType === ANNOUNCEMENT_ANIMATION.POPUP &&
        (a.priority === 'URGENT' || a.priority === 'IMPORTANT') &&
        !seen.has(a.id)
    );
    if (next) {
      setCandidate(next);
      // Let the modal mount closed, then flip to open on the next tick so the
      // fade+zoom transition actually animates instead of snapping in.
      requestAnimationFrame(() => setVisible(true));
    }
  }, [list]);

  if (!candidate) return null;

  const dismiss = () => {
    setVisible(false);
    markSeen(candidate.id);
    setTimeout(() => setCandidate(null), 200);
  };

  const viewDetails = () => {
    markSeen(candidate.id);
    setVisible(false);
    navigate(`/announcements/${candidate.id}`);
  };

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={candidate.title}
    >
      <div
        className={`relative w-full max-w-105 bg-surface border border-border rounded-[16px] shadow-card p-6 transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 text-muted hover:text-white cursor-pointer"
        >
          <Icon name="x" size={18} />
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-danger-soft text-danger mb-3">
          <Icon name="alertTriangle" size={12} /> {candidate.priority}
        </span>
        <h2 className="text-xl font-bold font-heading text-white">{candidate.title}</h2>
        <p className="text-xs text-muted mt-1">{ANNOUNCEMENT_CATEGORY_LABEL[candidate.category] || candidate.category}</p>

        <div className="flex gap-2.5 mt-6">
          <Button className="flex-1" onClick={viewDetails}>View Details</Button>
          <Button variant="ghost" onClick={dismiss}>Close</Button>
        </div>
      </div>
    </div>
  );
}
