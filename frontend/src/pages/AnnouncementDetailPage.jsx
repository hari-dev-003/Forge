import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchAnnouncement, markAnnouncementRead, clearCurrent } from '../features/announcements/announcementsSlice.js';
import { Card, Button, Spinner, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import AnnouncementCard from '../components/announcements/AnnouncementCard.jsx';
import ImageLightbox from '../components/announcements/ImageLightbox.jsx';
import { assetUrl } from '../api/client.js';
import { ANNOUNCEMENT_CATEGORY_LABEL } from '../constants.js';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '');

const isImage = (att) => !!att?.contentType?.startsWith('image/');
const fmtSize = (b) => (!b ? '' : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: a, related, detailStatus } = useSelector((s) => s.announcements);
  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchAnnouncement(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  // Split by content type, not by the announcement's declared `type`: an
  // announcement categorised TEXT or DOCUMENT can still carry photos, and
  // those should preview just the same.
  const images = useMemo(() => (a?.attachments || []).filter((att) => isImage(att) && att.url), [a]);
  const files = useMemo(() => (a?.attachments || []).filter((att) => !isImage(att)), [a]);

  if (detailStatus === 'loading' || !a) return <Spinner label="Loading announcement…" />;

  const [hero, ...gallery] = images;

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
          {/* Hero image — click anywhere on it to open the full-size preview. */}
          {hero && (
            <button
              type="button"
              onClick={() => setPreviewIndex(0)}
              aria-label={`Preview ${hero.fileName}`}
              className="group relative block w-full mb-5 rounded-[10px] overflow-hidden cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
            >
              <img src={assetUrl(hero.url)} alt={hero.fileName || ''} className="w-full max-h-96 object-cover" />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-black/60 rounded-full px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="eye" size={13} /> Click to preview
              </span>
            </button>
          )}

          <div className="prose-announcement text-[15px] leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: a.description }} />

          {/* Remaining photos as a thumbnail strip — each opens the same preview. */}
          {gallery.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-2.5">
                Photos ({images.length})
              </h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
                {gallery.map((att, i) => (
                  <button
                    key={att.key || i}
                    type="button"
                    onClick={() => setPreviewIndex(i + 1)}
                    aria-label={`Preview ${att.fileName}`}
                    className="group relative aspect-4/3 rounded-[9px] overflow-hidden border border-border cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <img
                      src={assetUrl(att.url)}
                      alt={att.fileName || ''}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted mb-2.5">Attachments</h4>
              {files[0]?.contentType === 'application/pdf' && files[0]?.url && (
                <iframe
                  src={assetUrl(files[0].url)}
                  title={files[0].fileName}
                  className="w-full h-96 rounded-[10px] border border-border mb-3"
                />
              )}
              <div className="flex flex-col gap-2">
                {files.map((att, i) => (
                  <a
                    key={att.key || i}
                    href={assetUrl(att.url)}
                    download={att.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 bg-surface-2 border border-border rounded-[9px] px-3 py-2.5 hover:border-primary/40 transition-colors"
                  >
                    <Icon name="fileText" size={16} className="text-muted shrink-0" />
                    <span className="flex-1 text-sm text-white truncate">{att.fileName}</span>
                    {att.sizeBytes ? <span className="text-xs text-muted shrink-0">{fmtSize(att.sizeBytes)}</span> : null}
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

      <ImageLightbox
        images={images}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
