import { useCallback, useEffect } from 'react';
import Icon from '../ui/Icon.jsx';
import { assetUrl } from '../../api/client.js';

/**
 * Full-screen preview for announcement image attachments.
 *
 * Opened by clicking a thumbnail in the detail view. Closes on Esc or a
 * backdrop click; arrow keys step through the set when an announcement has
 * more than one image. Rendering is driven entirely by `index` — `null` means
 * closed, so the parent only has to track a single piece of state.
 */
export default function ImageLightbox({ images, index, onClose, onIndexChange }) {
  const open = index !== null && index !== undefined && images.length > 0;

  const step = useCallback(
    (delta) => {
      if (images.length < 2) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [images.length, index, onIndexChange]
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);

    // The backdrop covers the page, so stop the page itself from scrolling
    // underneath it while the preview is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose, step]);

  if (!open) return null;

  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={current.fileName || 'Image preview'}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0">
        <span className="text-sm truncate">{current.fileName}</span>
        <div className="flex items-center gap-3 shrink-0">
          {images.length > 1 && (
            <span className="text-xs text-white/60">
              {index + 1} / {images.length}
            </span>
          )}
          <a
            href={assetUrl(current.url)}
            download={current.fileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Download ${current.fileName}`}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <Icon name="download" size={18} />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="text-white/70 hover:text-white cursor-pointer"
          >
            <Icon name="x" size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center gap-2 px-2 pb-4">
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(-1); }}
            aria-label="Previous image"
            className="shrink-0 w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <Icon name="arrowRight" size={18} className="rotate-180" />
          </button>
        )}

        {/* Stop the backdrop handler from firing when the image itself is clicked. */}
        <img
          src={assetUrl(current.url)}
          alt={current.fileName || ''}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain rounded-[10px]"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); step(1); }}
            aria-label="Next image"
            className="shrink-0 w-10 h-10 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <Icon name="arrowRight" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
