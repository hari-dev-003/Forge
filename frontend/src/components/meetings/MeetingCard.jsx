import { Badge } from '../ui/index.jsx';
import { assetUrl } from '../../api/client.js';
import { MEETING_TYPES } from '../../constants.js';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

/** Reusable meeting summary used in the review queue and history lists. */
export default function MeetingCard({ meeting, showEmployee, children }) {
  const isGroup = meeting.type === MEETING_TYPES.GROUP;
  const title = isGroup ? meeting.group?.name : meeting.customer?.name;

  return (
    <article className="flex gap-4 bg-surface border border-border rounded-[14px] p-3.5 shadow-card">
      <div className="w-24 h-24 rounded-[9px] overflow-hidden shrink-0 bg-surface-2">
        {meeting.photo?.url ? (
          <img
            src={assetUrl(meeting.photo.url)}
            alt="proof"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = 'none')}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-[34px]">{isGroup ? '👥' : '🧑'}</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                isGroup ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'
              }`}
            >
              {isGroup ? 'Group' : '1-to-1'}
            </span>
            <h4 className="text-base mt-1 font-semibold">{title || 'Untitled meeting'}</h4>
          </div>
          <Badge status={meeting.status} />
        </div>

        <div className="flex flex-wrap gap-3.5 mt-2.5 text-[13px] text-muted">
          {showEmployee && meeting.employeeName && <span>👤 {meeting.employeeName}</span>}
          {isGroup ? (
            <span>👥 {meeting.group?.attendees} attendees</span>
          ) : (
            meeting.customer?.phone && <span>📞 {meeting.customer.phone}</span>
          )}
          {meeting.isPremiumClient && <span className="text-warning font-semibold">★ Premium</span>}
          <span>🕒 {fmt(meeting.createdAt)}</span>
        </div>

        {meeting.business?.purpose && <p className="mt-2.5 text-[13px] text-ink">{meeting.business.purpose}</p>}

        {meeting.status === 'APPROVED' && (
          <div className="inline-block mt-2.5 bg-success-soft text-success font-bold px-3 py-1 rounded-lg text-sm">
            +{meeting.points?.awarded ?? 0} pts
          </div>
        )}
        {meeting.review?.reason && meeting.status !== 'APPROVED' && (
          <div className="mt-2.5 text-[13px] text-danger">Reason: {meeting.review.reason}</div>
        )}

        {children && <div className="flex gap-2 mt-3.5 flex-wrap">{children}</div>}
      </div>
    </article>
  );
}
