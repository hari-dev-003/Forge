import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchAnnouncement, markAnnouncementRead, clearCurrent } from '../features/announcements/announcementsSlice.js';
import { Card, Button, Spinner, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import AnnouncementCard from '../components/announcements/AnnouncementCard.jsx';
import { assetUrl } from '../api/client.js';
import { ANNOUNCEMENT_CATEGORY_LABEL, ANNOUNCEMENT_TYPES } from '../constants.js';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '');

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: a, related, detailStatus } = useSelector((s) => s.announcements);

  useEffect(() => {
    dispatch(fetchAnnouncement(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  if (detailStatus === 'loading' || !a) return <Spinner label="Loading announcement…" />;

  const image = a.type === ANNOUNCEMENT_TYPES.IMAGE ? a.attachments?.[0] : null;

  return (
    <div>
      <PageHeader
        eyebrow={ANNOUNCEMENT_CATEGORY_LABEL[a.category] || a.category}
        title={a.title}
        subtitle={fmtDate(a.publishDate)}
        actions={
          <Link to="/announcements" className="text-sm text-muted hover:text-white inline-flex items-center gap-1">
            <Icon name="arrowRight" size={14} className="rotate-180" /> Back
          </Link>
        }
      />

      <Reveal>
        <Card>
          {image?.url && (
            <img src={assetUrl(image.url)} alt="" className="w-full max-h-96 object-cover rounded-[10px] mb-5" />
          )}

          <div className="prose-announcement text-[15px] leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: a.description }} />

          {a.attachments?.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-2.5">Attachments</h4>
              {a.type === ANNOUNCEMENT_TYPES.DOCUMENT && a.attachments[0]?.contentType === 'application/pdf' && a.attachments[0]?.url && (
                <iframe
                  src={assetUrl(a.attachments[0].url)}
                  title={a.attachments[0].fileName}
                  className="w-full h-96 rounded-[10px] border border-border mb-3"
                />
              )}
              <div className="flex flex-col gap-2">
                {a.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={assetUrl(att.url)}
                    download={att.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-surface-2 border border-border rounded-[9px] px-3 py-2.5 hover:border-primary/40 transition-colors"
                  >
                    <Icon name="fileText" size={16} className="text-muted shrink-0" />
                    <span className="flex-1 text-sm text-white truncate">{att.fileName}</span>
                    <Icon name="download" size={14} className="text-muted shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
            <span className="text-xs text-muted">{a.viewCount ?? 0} views</span>
            {a.hasRead ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                <Icon name="check" size={14} /> Marked as read
              </span>
            ) : (
              <Button size="sm" onClick={() => dispatch(markAnnouncementRead(id))}>
                Mark as read
              </Button>
            )}
          </div>
        </Card>
      </Reveal>

      {related.length > 0 && (
        <Reveal delay={80}>
          <h4 className="text-sm font-bold uppercase tracking-wide text-muted mb-3 mt-2">Related announcements</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {related.map((r) => <AnnouncementCard key={r.id} announcement={r} />)}
          </div>
        </Reveal>
      )}
    </div>
  );
}
