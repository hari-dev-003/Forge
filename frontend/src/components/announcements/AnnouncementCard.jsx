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

export default function AnnouncementCard({ announcement: a }) {
  const image = a.type === ANNOUNCEMENT_TYPES.IMAGE ? a.attachments?.[0] : null;
  const firstDoc = a.type === ANNOUNCEMENT_TYPES.DOCUMENT ? a.attachments?.[0] : null;
  const summary = stripHtml(a.description).slice(0, 140);

  return (
    <article className="glow-card flex flex-col bg-surface/80 backdrop-blur-md border border-border rounded-[14px] overflow-hidden shadow-card">
      {image?.url && (
        <img src={assetUrl(image.url)} alt="" className="w-full h-36 object-cover" />
      )}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {a.isPinned && <Icon name="pin" size={12} className="text-primary" />}
            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary-soft text-primary">
              {ANNOUNCEMENT_CATEGORY_LABEL[a.category] || a.category}
            </span>
          </div>
          {a.priority !== 'NORMAL' && (
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${PRIORITY_TONE[a.priority]}`}>
              {a.priority}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold text-white leading-snug">{a.title}</h3>
        <p className="text-xs text-muted mt-1">{fmtDate(a.publishDate)}</p>
        {summary && <p className="text-[13px] text-muted mt-2 flex-1">{summary}{summary.length === 140 ? '…' : ''}</p>}

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
