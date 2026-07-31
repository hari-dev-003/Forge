import { useRef } from 'react';
import Icon from '../ui/Icon.jsx';
import { pushToast } from '../../features/ui/uiSlice.js';
import { useDispatch } from 'react-redux';
import { IMAGE_UPLOAD_MAX_BYTES, formatBytes, isImageFile } from '../../constants.js';

// Images are held to the product-wide image cap (the same one meeting photos
// and the Direct Conversion screenshot obey). Documents are a different kind
// of thing — a deck or a circular is legitimately larger — so they keep their
// own, looser limit.
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB per non-image file
const MAX_FILES = 5;
const ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,' +
  'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/zip,application/x-zip-compressed';

const fmtSize = formatBytes;

/** The size cap that applies to this particular file. */
const limitFor = (file) => (isImageFile(file) ? IMAGE_UPLOAD_MAX_BYTES : MAX_DOCUMENT_BYTES);

/**
 * Multi-file attachment picker for announcements — any of the announcement
 * file types (image/PDF/PPT/DOC/XLSX/ZIP), up to 5 files.
 *
 * Two size caps, by kind: images must be IMAGE_UPLOAD_MAX_BYTES or smaller
 * (the product-wide rule for every image), documents may be up to
 * MAX_DOCUMENT_BYTES.
 *
 * A presigned PUT can't carry a size condition, so this check can't be the
 * only guard — announcementService re-checks every image against the object
 * actually stored in the bucket before saving the announcement.
 */
export default function AttachmentUpload({ files, onChange }) {
  const inputRef = useRef(null);
  const dispatch = useDispatch();

  const handle = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file after removal
    if (!picked.length) return;

    if (files.length + picked.length > MAX_FILES) {
      dispatch(pushToast({ message: `Up to ${MAX_FILES} attachments allowed`, type: 'error' }));
      return;
    }

    const tooLarge = picked.filter((f) => f.size > limitFor(f));
    if (tooLarge.length) {
      const detail = tooLarge
        .map((f) => `${f.name} (${fmtSize(f.size)}, max ${fmtSize(limitFor(f))})`)
        .join(', ');
      dispatch(pushToast({ message: `Too large: ${detail}`, type: 'error' }));
      return;
    }

    onChange([...files, ...picked]);
  };

  const remove = (i) => onChange(files.filter((_, idx) => idx !== i));

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-[14px] p-6 flex flex-col items-center gap-1.5 text-muted cursor-pointer transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      >
        <Icon name="paperclip" size={26} className="text-muted/60" />
        <span>Click to attach files</span>
        <span className="text-xs">
          Images up to {fmtSize(IMAGE_UPLOAD_MAX_BYTES)} · PDF, PPT, DOC, XLSX, ZIP up to{' '}
          {fmtSize(MAX_DOCUMENT_BYTES)} · {MAX_FILES} files max
        </span>
      </button>
      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={handle} />

      {files.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-3">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 bg-surface-2 border border-border rounded-[9px] px-3 py-2">
              <Icon name={f.type.startsWith('image/') ? 'image' : 'fileText'} size={16} className="text-muted shrink-0" />
              <span className="flex-1 min-w-0 truncate text-sm text-white">{f.name}</span>
              <span className="text-xs text-muted shrink-0">{fmtSize(f.size)}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${f.name}`}
                className="text-muted hover:text-danger cursor-pointer shrink-0"
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
