import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  fetchManagedAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  resetCreate,
} from '../features/announcements/announcementsSlice.js';
import { pushToast } from '../features/ui/uiSlice.js';
import { api, unwrap, apiError } from '../api/client.js';
import { Card, Button, Field, Input, Select, Checkbox, Badge, Spinner, EmptyState, PageHeader } from '../components/ui/index.jsx';
import Reveal from '../components/ui/Reveal.jsx';
import Icon from '../components/ui/Icon.jsx';
import RichTextEditor from '../components/announcements/RichTextEditor.jsx';
import AttachmentUpload from '../components/announcements/AttachmentUpload.jsx';
import {
  ANNOUNCEMENT_CATEGORY_LABEL,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_PRIORITY,
  ANNOUNCEMENT_ANIMATION,
  ROLES,
} from '../constants.js';

// Mirrors MAX_PINNED_ANNOUNCEMENTS in the backend constants — the server is
// the one that enforces it; this just stops the admin from composing a whole
// announcement only to be rejected on submit.
const MAX_PINNED = 5;

const emptyForm = {
  title: '',
  category: 'GENERAL',
  type: ANNOUNCEMENT_TYPES.TEXT,
  priority: ANNOUNCEMENT_PRIORITY.NORMAL,
  isPinned: false,
  status: 'PUBLISH_NOW',
  publishDate: '',
  expiryDate: '',
  animationType: ANNOUNCEMENT_ANIMATION.NONE,
  targetRoles: [ROLES.MANAGER, ROLES.USER],
};

const TH = 'text-left px-3.5 py-3 text-muted text-xs uppercase tracking-wide border-b border-border';
const TD = 'px-3.5 py-3 border-b border-border';
const GRID_2 = 'grid grid-cols-2 gap-4 max-[860px]:grid-cols-1';

/**
 * Upload one attachment straight to storage via a presigned PUT.
 *
 * `file.type` is empty for plenty of real files (Windows reports nothing for
 * .zip / extension-less files), and an empty content type gets baked into the
 * S3 signature — the browser then sends its own sniffed value and S3 rejects
 * the PUT with 403 SignatureDoesNotMatch. Always send a concrete type, and
 * always PUT with exactly the headers the server signed.
 */
async function uploadFile(file) {
  const contentType = file.type || 'application/octet-stream';
  const target = unwrap(
    await api.post('/uploads/presign', { contentType, prefix: 'announcements', filename: file.name })
  );
  try {
    await axios.put(target.uploadUrl, file, { headers: target.headers });
  } catch (err) {
    const status = err?.response?.status;
    if (status === 403) {
      throw new Error(
        `Storage rejected the upload of "${file.name}" (403). The S3 bucket policy or IAM role must allow ` +
          `s3:PutObject on the announcements/ prefix, and the bucket must accept the presigned request.`
      );
    }
    throw new Error(`Upload of "${file.name}" failed${status ? ` (HTTP ${status})` : ''}.`);
  }
  // Record the content type the server actually signed, not the browser's guess.
  return {
    key: target.key,
    fileName: file.name,
    contentType: target.headers?.['Content-Type'] || contentType,
    sizeBytes: file.size,
  };
}

// The form speaks the admin's *intent* (what the Select offers); POST /announcements
// takes that intent, while PATCH takes the stored status enum. Translate at the
// boundary in both directions — otherwise editing an announcement either shows a
// blank Select or PATCHes an intent value the update schema rejects.
const STATUS_INTENT_FROM_STORED = { DRAFT: 'DRAFT', PUBLISHED: 'PUBLISH_NOW', SCHEDULED: 'SCHEDULE' };
const STATUS_STORED_FROM_INTENT = { DRAFT: 'DRAFT', PUBLISH_NOW: 'PUBLISHED', SCHEDULE: 'SCHEDULED' };

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AnnouncementAdminPage() {
  const dispatch = useDispatch();
  const { managed, managedStatus, createStatus, error } = useSelector((s) => s.announcements);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [description, setDescription] = useState('');
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { dispatch(fetchManagedAnnouncements()); }, [dispatch]);

  // An announcement being edited already owns its slot, so it must not count
  // against the cap when re-saved — same rule the server applies.
  const pinnedCount = managed.filter((a) => a.isPinned).length;
  const pinsFull = managed.filter((a) => a.isPinned && a.id !== editingId).length >= MAX_PINNED;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleTargetRole = (role) => {
    setForm((f) => {
      const has = f.targetRoles.includes(role);
      const next = has ? f.targetRoles.filter((r) => r !== role) : [...f.targetRoles, role];
      return { ...f, targetRoles: next.length ? next : f.targetRoles }; // never allow zero targets
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDescription('');
    setExistingAttachments([]);
    setNewFiles([]);
    dispatch(resetCreate());
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      type: a.type,
      priority: a.priority,
      isPinned: a.isPinned,
      status: STATUS_INTENT_FROM_STORED[a.status] || 'PUBLISH_NOW',
      publishDate: toLocalInputValue(a.publishDate),
      expiryDate: toLocalInputValue(a.expiryDate),
      animationType: a.animationType || ANNOUNCEMENT_ANIMATION.NONE,
      targetRoles: a.targetRoles?.length ? a.targetRoles : [ROLES.MANAGER, ROLES.USER],
    });
    setDescription(a.description || '');
    setExistingAttachments(a.attachments || []);
    setNewFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeExistingAttachment = (i) => setExistingAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const uploaded = await Promise.all(newFiles.map(uploadFile));
      const attachments = [...existingAttachments, ...uploaded];

      const payload = {
        title: form.title,
        category: form.category,
        type: form.type,
        description,
        attachments,
        targetRoles: form.targetRoles,
        priority: form.priority,
        isPinned: form.isPinned,
        animationType: form.animationType,
        publishDate: form.publishDate ? new Date(form.publishDate).toISOString() : undefined,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        // POST takes the intent; PATCH takes the stored enum.
        status: editingId ? STATUS_STORED_FROM_INTENT[form.status] || form.status : form.status,
      };

      const res = editingId
        ? await dispatch(updateAnnouncement({ id: editingId, patch: payload }))
        : await dispatch(createAnnouncement(payload));

      if (res.meta.requestStatus === 'fulfilled') {
        dispatch(pushToast({ message: editingId ? 'Announcement updated' : 'Announcement created', type: 'success' }));
        resetForm();
        dispatch(fetchManagedAnnouncements());
      } else {
        dispatch(pushToast({ message: res.payload || 'Failed to save', type: 'error' }));
      }
    } catch (err) {
      dispatch(pushToast({ message: apiError(err), type: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const togglePin = async (a) => {
    const res = await dispatch(updateAnnouncement({ id: a.id, patch: { isPinned: !a.isPinned } }));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: a.isPinned ? 'Unpinned' : 'Pinned', type: 'success' }));
    } else {
      // Surfaces the server's pin-cap rejection — without this the button just
      // appeared to do nothing once all slots were full.
      dispatch(pushToast({ message: res.payload || 'Failed to update', type: 'error' }));
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
    const res = await dispatch(deleteAnnouncement(a.id));
    if (res.meta.requestStatus === 'fulfilled') {
      dispatch(pushToast({ message: 'Announcement deleted', type: 'success' }));
    } else {
      dispatch(pushToast({ message: res.payload || 'Failed to delete', type: 'error' }));
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Information" title="Manage Announcements" subtitle="Create, schedule, and publish announcements for Managers and Users." />

      <Reveal>
        <Card title={editingId ? 'Edit announcement' : 'Create announcement'}>
          <form onSubmit={submit}>
            <div className={GRID_2}>
              <Field label="Announcement title"><Input value={form.title} onChange={set('title')} placeholder="PELS Registration Started" required /></Field>
              <Field label="Category">
                <Select value={form.category} onChange={set('category')}>
                  {Object.entries(ANNOUNCEMENT_CATEGORY_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Announcement type">
                <Select value={form.type} onChange={set('type')}>
                  <option value={ANNOUNCEMENT_TYPES.IMAGE}>Image</option>
                  <option value={ANNOUNCEMENT_TYPES.TEXT}>Text</option>
                  <option value={ANNOUNCEMENT_TYPES.DOCUMENT}>Document</option>
                </Select>
              </Field>
              <Field label="Priority">
                <Select value={form.priority} onChange={set('priority')}>
                  <option value={ANNOUNCEMENT_PRIORITY.NORMAL}>Normal</option>
                  <option value={ANNOUNCEMENT_PRIORITY.IMPORTANT}>Important</option>
                  <option value={ANNOUNCEMENT_PRIORITY.URGENT}>Urgent</option>
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <RichTextEditor key={editingId || 'new'} value={description} onChange={setDescription} placeholder="Write the announcement…" />
            </Field>

            <Field label="Attachments">
              {existingAttachments.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2.5">
                  {existingAttachments.map((att, i) => (
                    <li key={att.key} className="flex items-center gap-2.5 bg-surface-2 border border-border rounded-[9px] px-3 py-2">
                      <Icon name="fileText" size={16} className="text-muted shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-sm text-white">{att.fileName}</span>
                      <button type="button" onClick={() => removeExistingAttachment(i)} aria-label={`Remove ${att.fileName}`} className="text-muted hover:text-danger cursor-pointer">
                        <Icon name="x" size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <AttachmentUpload files={newFiles} onChange={setNewFiles} />
            </Field>

            <div className={GRID_2}>
              <Field label="Status">
                <Select value={form.status} onChange={set('status')}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISH_NOW">Publish Now</option>
                  <option value="SCHEDULE">Schedule</option>
                </Select>
              </Field>
              {(form.status === 'SCHEDULE' || form.status === 'SCHEDULED') && (
                <Field label="Publish date">
                  <Input type="datetime-local" value={form.publishDate} onChange={set('publishDate')} required />
                </Field>
              )}
              <Field label="Expiry date (optional)">
                <Input type="datetime-local" value={form.expiryDate} onChange={set('expiryDate')} />
              </Field>
              <Field label="Display animation">
                <Select value={form.animationType} onChange={set('animationType')}>
                  <option value={ANNOUNCEMENT_ANIMATION.NONE}>None</option>
                  <option value={ANNOUNCEMENT_ANIMATION.POPUP}>Popup Modal</option>
                </Select>
              </Field>
            </div>

            <Field label="Target audience">
              <div className="flex items-center gap-4">
                <Checkbox label="Managers" checked={form.targetRoles.includes(ROLES.MANAGER)} onChange={() => toggleTargetRole(ROLES.MANAGER)} />
                <Checkbox label="Users" checked={form.targetRoles.includes(ROLES.USER)} onChange={() => toggleTargetRole(ROLES.USER)} />
              </div>
            </Field>

            <div className="mb-4">
              <Checkbox
                label="Pin this announcement"
                checked={form.isPinned}
                disabled={!form.isPinned && pinsFull}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              />
              <p className={`text-xs mt-1 ${pinsFull && !form.isPinned ? 'text-warning' : 'text-muted'}`}>
                {pinsFull && !form.isPinned
                  ? `All ${MAX_PINNED} pin slots are used — unpin one below to pin this.`
                  : `Pinned announcements show full-width at the top of the feed. ${pinnedCount} of ${MAX_PINNED} slots used.`}
              </p>
            </div>

            {error && <div className="bg-danger-soft text-danger px-3 py-2.5 rounded-[9px] text-[13px] mb-4">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" loading={createStatus === 'loading' || uploading}>
                {editingId ? 'Save changes' : 'Publish announcement'}
              </Button>
              {editingId && <Button type="button" variant="ghost" onClick={resetForm}>Cancel edit</Button>}
            </div>
          </form>
        </Card>
      </Reveal>

      <Reveal delay={80}>
        <Card title={`${managed.length} announcements`}>
          {managedStatus === 'loading' ? (
            <Spinner label="Loading…" />
          ) : managed.length === 0 ? (
            <EmptyState title="No announcements yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={TH}>Title</th><th className={TH}>Category</th><th className={TH}>Priority</th>
                    <th className={TH}>Status</th><th className={TH}>Publish date</th><th className={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {managed.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-2 last:[&>td]:border-b-0">
                      <td className={TD}>
                        <div className="flex items-center gap-1.5">
                          {a.isPinned && <Icon name="pin" size={13} className="text-primary shrink-0" />}
                          <span className="font-semibold text-white">{a.title}</span>
                        </div>
                      </td>
                      <td className={TD}>{ANNOUNCEMENT_CATEGORY_LABEL[a.category] || a.category}</td>
                      <td className={TD}><Badge>{a.priority}</Badge></td>
                      <td className={TD}><Badge>{a.status}</Badge></td>
                      <td className={TD}>{a.publishDate ? new Date(a.publishDate).toLocaleDateString() : '—'}</td>
                      <td className={TD}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => togglePin(a)} aria-label={a.isPinned ? 'Unpin' : 'Pin'}>
                            <Icon name="pin" size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(a)} aria-label="Edit">
                            <Icon name="edit" size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => remove(a)} aria-label="Delete">
                            <Icon name="trash" size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
