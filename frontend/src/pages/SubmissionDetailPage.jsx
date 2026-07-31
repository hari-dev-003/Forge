import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchSubmission, clearCurrent } from '../features/submissions/submissionsSlice.js';
import { Card, Badge, Spinner, EmptyState, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import ImageLightbox from '../components/announcements/ImageLightbox.jsx';
import { assetUrl } from '../api/client.js';
import { MEETING_TYPES, MEETING_STATUS } from '../constants.js';

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

const TYPE_LABEL = {
  [MEETING_TYPES.ONE_TO_ONE]: 'One-to-one',
  [MEETING_TYPES.GROUP]: 'Group meeting',
  [MEETING_TYPES.DIRECT_CONVERSION]: 'Direct conversion',
};

/** A single captured field. Renders an em dash rather than collapsing, so a
 *  blank the executive left is visible instead of silently missing. */
function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="text-[15px] text-white mt-0.5 break-words">{value || '—'}</dd>
    </div>
  );
}

const DL = 'grid grid-cols-3 gap-x-6 gap-y-4 max-[720px]:grid-cols-2 max-[460px]:grid-cols-1';
const TH = 'text-left px-3 py-2 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3 py-2.5 border-b border-border';

/**
 * Everything the executive recorded about the person/people they met — and
 * nothing else. The shape differs per meeting type because the submit form
 * captures different things for each.
 */
function ClientDetails({ meeting: m }) {
  if (m.type === MEETING_TYPES.GROUP) {
    const attendees = m.group?.attendeeList || [];
    return (
      <>
        <dl className={DL}>
          <Detail label="Session / group name" value={m.group?.name} />
          <Detail label="Attendees" value={attendees.length || m.group?.attendees} />
        </dl>

        {/* The submit form captures a name, phone and city for every attendee.
            The old inline panel showed only the headcount, so all of it was
            invisible to the reviewer. */}
        {attendees.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Phone number</th>
                  <th className={TH}>City</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((a, i) => (
                  <tr key={`${a.name}-${i}`} className="last:[&>td]:border-b-0">
                    <td className={`${TD} text-muted`}>{i + 1}</td>
                    <td className={`${TD} text-white font-medium`}>{a.name || '—'}</td>
                    <td className={TD}>{a.phone || '—'}</td>
                    <td className={TD}>{a.city || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  if (m.type === MEETING_TYPES.DIRECT_CONVERSION) {
    const dc = m.directConversion || {};
    return (
      <dl className={DL}>
        <Detail label="Name" value={dc.name} />
        <Detail label="Phone number" value={dc.phone} />
        <Detail label="Business centre" value={dc.businessCentre} />
        <Detail label="Nexus mail ID" value={dc.nexusMailId} />
        <Detail label="Staking volume" value={dc.stakingVolume?.toLocaleString()} />
        <Detail label="Stacking type" value={dc.stackingType} />
      </dl>
    );
  }

  return (
    <dl className={DL}>
      <Detail label="Name" value={m.customer?.name} />
      <Detail label="Phone number" value={m.customer?.phone} />
      <Detail label="City" value={m.customer?.city} />
    </dl>
  );
}

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: m, currentStatus, error } = useSelector((s) => s.submissions);
  const [previewIndex, setPreviewIndex] = useState(null);

  useEffect(() => {
    dispatch(fetchSubmission(id));
    return () => dispatch(clearCurrent());
  }, [dispatch, id]);

  // Proof photos plus the Direct Conversion screenshot, in one previewable set.
  // `photos` is the current field; `photo` is all a pre-multi-photo meeting has.
  const images = useMemo(() => {
    if (!m) return [];
    const proof = m.photos?.length ? m.photos : m.photo ? [m.photo] : [];
    const shots = m.directConversion?.screenshot ? [m.directConversion.screenshot] : [];
    return [...proof, ...shots]
      .filter((p) => p?.url)
      .map((p, i) => ({ ...p, fileName: p.fileName || `Photo ${i + 1}` }));
  }, [m]);

  const back = (
    <Link to="/submissions" className="text-sm text-muted hover:text-white inline-flex items-center gap-1">
      <Icon name="arrowRight" size={14} className="rotate-180" /> Back to submissions
    </Link>
  );

  if (currentStatus === 'loading' || (!m && currentStatus !== 'failed')) {
    return <Spinner label="Loading submission…" />;
  }

  if (!m) {
    return (
      <div>
        <PageHeader eyebrow="Submission" title="Not found" actions={back} />
        <Card>
          <EmptyState
            title="This submission isn't available"
            hint={error || "It may have been removed, or it belongs to another manager's team."}
            icon={<Icon name="alertTriangle" size={20} />}
          />
        </Card>
      </div>
    );
  }

  const title =
    m.type === MEETING_TYPES.GROUP
      ? m.group?.name
      : m.type === MEETING_TYPES.DIRECT_CONVERSION
        ? m.directConversion?.name
        : m.customer?.name;

  return (
    <div>
      <PageHeader
        eyebrow={TYPE_LABEL[m.type] || 'Submission'}
        title={title || 'Untitled meeting'}
        subtitle={`Logged by ${m.employeeName} · ${fmtDateTime(m.createdAt)}`}
        actions={back}
      />

      <Reveal>
        <Card
          title="Client details"
          actions={
            m.isPremiumClient ? (
              <span className="text-xs font-semibold text-warning">★ Premium client</span>
            ) : null
          }
        >
          <ClientDetails meeting={m} />
        </Card>
      </Reveal>

      {images.length > 0 && (
        <Reveal delay={80}>
          <Card title={`Proof ${images.length === 1 ? 'photo' : `photos (${images.length})`}`}>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {images.map((img, i) => (
                <button
                  key={img.key || i}
                  type="button"
                  onClick={() => setPreviewIndex(i)}
                  aria-label={`Preview ${img.fileName}`}
                  className="group relative aspect-4/3 rounded-[9px] overflow-hidden border border-border cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <img
                    src={assetUrl(img.url)}
                    alt={img.fileName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                </button>
              ))}
            </div>
          </Card>
        </Reveal>
      )}

      {/* Review outcome — the manager's decision, kept clearly apart from what
          the executive recorded above. */}
      <Reveal delay={160}>
        <Card title="Review">
          <dl className={DL}>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">Status</dt>
              <dd className="mt-1"><Badge status={m.status} /></dd>
            </div>
            <Detail
              label="Points awarded"
              value={m.status === MEETING_STATUS.APPROVED ? `+${m.points?.awarded ?? 0}` : null}
            />
            <Detail label="Reviewed by" value={m.review?.reviewerName} />
            {m.review?.qualityScore ? (
              <Detail label="Quality" value={'★'.repeat(m.review.qualityScore)} />
            ) : null}
            {m.review?.reviewedAt ? <Detail label="Reviewed at" value={fmtDateTime(m.review.reviewedAt)} /> : null}
          </dl>
          {m.review?.reason && (
            <p className="text-[13px] text-danger mt-4">
              <span className="text-muted">Reason: </span>
              {m.review.reason}
            </p>
          )}
        </Card>
      </Reveal>

      <ImageLightbox
        images={images}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onIndexChange={setPreviewIndex}
      />
    </div>
  );
}
