import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';
import { ANNOUNCEMENT_CATEGORY_LABEL, ANNOUNCEMENT_TYPES } from '../../constants.js';

const PRIORITY_TONE = {
  URGENT: 'bg-danger-soft text-danger',
  IMPORTANT: 'bg-warning-soft text-warning',
  NORMAL: 'bg-surface-2 text-muted',
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * @param {object}  announcement
 * @param {boolean} [featured]  Full-width treatment used for pinned
 *   announcements at the top of the feed: the card spans the whole row with
 *   the cover image beside the text instead of stacked above it.
 */
export default function AnnouncementCard({ announcement: a, featured = false }) {
  // Key off the attachment's content type rather than the announcement's
  // declared `type` so a photo attached to a TEXT/DOCUMENT announcement still
  // shows as the cover.
  const first = a.attachments?.[0];
  const image = first?.url && first.contentType?.startsWith('image/') ? first : null;
  const firstDoc = a.type === ANNOUNCEMENT_TYPES.DOCUMENT ? first : null;
  const summary = stripHtml(a.description).slice(0, featured ? 260 : 140);
  const clamped = summary.length === (featured ? 260 : 140);

  return (
    <article
      className={`glow-card bg-surface/80 backdrop-blur-md border rounded-card overflow-hidden shadow-card ${
        featured
          ? 'flex w-full border-primary/35 max-tablet:flex-col'
          : 'flex flex-col border-border'
      }`}
    >
      {image && (
        <img
          src={assetUrl(image.url)}
          alt=""
          className={
            featured
              ? 'w-64 shrink-0 self-stretch object-cover max-tablet:w-full max-tablet:h-40'
              : 'w-full h-36 object-cover'
          }
        />
      )}
      <div className="p-4 flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {a.isPinned && (
              <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-on-primary">
                <Icon name="pin" size={11} /> Pinned
              </span>
            )}
            <span className="text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary-soft text-primary">
              {ANNOUNCEMENT_CATEGORY_LABEL[a.category] || a.category}
            </span>
          </div>
          {a.priority !== 'NORMAL' && (
            <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${PRIORITY_TONE[a.priority]}`}>
              {a.priority}
            </span>
          )}
        </div>

        <h3 className={`font-semibold text-white leading-snug ${featured ? 'text-lg' : 'text-base'}`}>{a.title}</h3>
        <p className="text-xs text-muted mt-1">{fmtDate(a.publishDate)}</p>
        {summary && <p className="text-sm text-muted mt-2 flex-1">{summary}{clamped ? '…' : ''}</p>}

        {firstDoc && (
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted">
            <Icon name="fileText" size={14} />
            <span className="truncate">{firstDoc.fileName}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-3.5">
          {a.attachments?.length > 0 && (
            <a
              href={assetUrl(a.attachments[0].url)}
              download={a.attachments[0].fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-white transition-colors"
            >
              <Icon name="download" size={14} /> Download
            </a>
          )}
          <Link
            to={`/announcements/${a.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline ml-auto"
          >
            Read more <Icon name="arrowRight" size={12} />
          </Link>
        </div>
      </div>
    </article>
  );
}
