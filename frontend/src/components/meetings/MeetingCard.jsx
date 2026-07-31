import { Badge } from '../ui/index.jsx';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';
import { MEETING_TYPES } from '../../constants.js';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const TYPE_TAG = {
  [MEETING_TYPES.GROUP]: { label: 'Group', className: 'bg-success-soft text-success' },
  [MEETING_TYPES.DIRECT_CONVERSION]: { label: 'Direct conversion', className: 'bg-info/15 text-info' },
};
const DEFAULT_TAG = { label: '1-to-1', className: 'bg-primary-soft text-primary' };

/** Reusable meeting summary used in the review queue and history lists. */
export default function MeetingCard({ meeting, showExecutive, children }) {
  const isGroup = meeting.type === MEETING_TYPES.GROUP;
  const isDirectConversion = meeting.type === MEETING_TYPES.DIRECT_CONVERSION;
  const title = isGroup
    ? meeting.group?.name
    : isDirectConversion
      ? meeting.directConversion?.name
      : meeting.customer?.name;
  const tag = TYPE_TAG[meeting.type] || DEFAULT_TAG;
  // `photos` is the current field; `photo` is all a pre-multi-photo meeting has.
  const photoCount = meeting.photos?.length || (meeting.photo ? 1 : 0);
  const cover = meeting.photos?.[0] || meeting.photo;

  return (
    <article className="glow-card flex gap-4 bg-surface/80 backdrop-blur-md border border-border rounded-card p-3.5 shadow-card">
      <div className="relative w-24 h-24 rounded-control overflow-hidden shrink-0 bg-surface-2">
        {cover?.url ? (
          <img
            src={assetUrl(cover.url)}
            alt="proof"
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = 'none')}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted/50">
            <Icon name={isGroup ? 'users' : isDirectConversion ? 'trendingUp' : 'user'} size={30} />
          </div>
        )}
        {/* A meeting can carry up to 3 proof photos; flag the extras so a
            reviewer knows to open it rather than judging by the thumbnail. */}
        {photoCount > 1 && (
          <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 text-2xs font-bold text-white bg-black/70 rounded-md px-1.5 py-0.5">
            <Icon name="image" size={10} /> {photoCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3">
          <div>
            <span className={`text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${tag.className}`}>
              {tag.label}
            </span>
            <h4 className="text-base mt-1 font-semibold">{title || 'Untitled meeting'}</h4>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge status={meeting.status} />
            {meeting.slaBreached && (
              <span className="text-2xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-danger-soft text-danger">
                {Math.round(meeting.ageHours)}h — overdue
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3.5 mt-2.5 text-sm text-muted">
          {showExecutive && meeting.employeeName && (
            <span className="inline-flex items-center gap-1.5"><Icon name="user" size={14} />{meeting.employeeName}</span>
          )}
          {isGroup ? (
            <span className="inline-flex items-center gap-1.5"><Icon name="users" size={14} />{meeting.group?.attendees} attendees</span>
          ) : isDirectConversion ? (
            <>
              {meeting.directConversion?.phone && (
                <span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} />{meeting.directConversion.phone}</span>
              )}
              <span className="font-semibold text-primary">
                {meeting.directConversion?.stakingType} · {meeting.directConversion?.stakingVolume?.toLocaleString()}
              </span>
            </>
          ) : (
            meeting.customer?.phone && (
              <span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} />{meeting.customer.phone}</span>
            )
          )}
          {meeting.isPremiumClient && <span className="text-warning font-semibold">★ Premium</span>}
          <span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} />{fmt(meeting.createdAt)}</span>
        </div>

        {meeting.business?.purpose && <p className="mt-2.5 text-sm text-ink">{meeting.business.purpose}</p>}

        {meeting.status === 'APPROVED' && (
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <div className="inline-block bg-success-soft text-success font-bold px-3 py-1 rounded-lg text-sm">
              +{meeting.points?.awarded ?? 0} pts
            </div>
            {meeting.review?.qualityScore && (
              <div className="inline-flex items-center gap-0.5 text-primary text-sm" title={`Quality: ${meeting.review.qualityScore}/5`}>
                {'★'.repeat(meeting.review.qualityScore)}
                <span className="text-muted/40">{'★'.repeat(5 - meeting.review.qualityScore)}</span>
              </div>
            )}
          </div>
        )}
        {meeting.review?.reason && meeting.status !== 'APPROVED' && (
          <div className="mt-2.5 text-sm text-danger">Reason: {meeting.review.reason}</div>
        )}

        {children && <div className="flex gap-2 mt-3.5 flex-wrap">{children}</div>}
      </div>
    </article>
  );
}
