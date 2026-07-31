import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { MEETING_PHOTO_MAX, IMAGE_UPLOAD_MAX_BYTES, formatBytes as fmtSize } from '../../constants.js';

/** Ask the browser for the device's current GPS fix. */
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location permission is required to attach a meeting photo')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Burn a timestamp + GPS watermark bar into the bottom of the image.
 *
 * `maxBytes` caps the OUTPUT, because the canvas re-encode is what actually
 * gets uploaded — checking the file the user picked would police the wrong
 * bytes. An oversized photo is downscaled and re-encoded at progressively
 * lower quality until it fits rather than being rejected outright: someone
 * shooting on a high-megapixel phone shouldn't be blocked for something we
 * can handle.
 */
function watermarkImage(file, location, maxBytes) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        // Cap the longest edge before drawing: a 48MP source re-encodes above
        // the limit at any quality worth keeping.
        const MAX_EDGE = 2400;
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const barHeight = Math.max(56, Math.round(height * 0.08));
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        const pad = 14;
        const lineHeight = Math.round(barHeight / 2.4);
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'top';

        ctx.font = `600 ${Math.max(13, Math.round(barHeight * 0.3))}px sans-serif`;
        ctx.fillText(new Date().toLocaleString(), pad, canvas.height - barHeight + pad);

        ctx.font = `400 ${Math.max(12, Math.round(barHeight * 0.26))}px sans-serif`;
        ctx.fillText(
          `Lat ${location.lat.toFixed(6)}, Lng ${location.lng.toFixed(6)}`,
          pad,
          canvas.height - barHeight + pad + lineHeight
        );

        const encode = (quality) =>
          new Promise((res) => canvas.toBlob((blob) => res(blob), 'image/jpeg', quality));

        let blob = null;
        for (const quality of [0.92, 0.82, 0.7, 0.6, 0.5]) {
          blob = await encode(quality);
          if (!blob || blob.size <= maxBytes) break;
        }

        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error('Failed to process the photo'));
          return;
        }
        if (blob.size > maxBytes) {
          reject(
            new Error(`"${file.name}" is still ${fmtSize(blob.size)} after compression — please use a smaller photo.`)
          );
          return;
        }
        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('Failed to process the photo'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load the selected photo'));
    };
    img.src = objectUrl;
  });
}

/**
 * Multi-photo upload with a mandatory GPS/timestamp watermark, used for every
 * meeting type. Up to MEETING_PHOTO_MAX photos, each kept under
 * IMAGE_UPLOAD_MAX_BYTES after watermarking.
 *
 * The location is captured once, on the first photo, and reused for the rest:
 * these photos document one meeting at one place, so re-prompting per photo
 * would slow the flow down and let the watermarks disagree with each other.
 *
 * @param {File[]} files                       Current photos (owned by the parent).
 * @param {(files: File[]) => void} onSelect   Receives the full updated list.
 * @param {(loc: object|null) => void} onLocation
 */
export default function PhotoUpload({ files, onSelect, onLocation }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | working | error
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  const remaining = MEETING_PHOTO_MAX - files.length;

  const handle = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-picking the same file after a removal
    if (!picked.length) return;

    setError('');

    if (picked.length > remaining) {
      setError(
        remaining === 0
          ? `You've already attached the maximum of ${MEETING_PHOTO_MAX} photos.`
          : `You can add ${remaining} more photo${remaining === 1 ? '' : 's'} (max ${MEETING_PHOTO_MAX}).`
      );
      return;
    }

    setStatus('working');
    try {
      const fix = location || (await getLocation());

      const processed = [];
      const added = [];
      for (const file of picked) {
        const watermarked = await watermarkImage(file, fix, IMAGE_UPLOAD_MAX_BYTES);
        processed.push(watermarked);
        added.push({ url: URL.createObjectURL(watermarked), name: file.name, size: watermarked.size });
      }

      setLocation(fix);
      onLocation(fix);
      setPreviews((prev) => [...prev, ...added]);
      onSelect([...files, ...processed]);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Could not attach photo');
    }
  };

  const remove = (i) => {
    URL.revokeObjectURL(previews[i]?.url);
    const nextFiles = files.filter((_, idx) => idx !== i);
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    onSelect(nextFiles);
    setError('');
    // Dropping the last photo drops the location with it, so the next one
    // captures a fresh fix instead of reusing a stale one.
    if (nextFiles.length === 0) {
      setLocation(null);
      onLocation(null);
    }
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 mb-2.5 max-[420px]:grid-cols-2">
          {previews.map((p, i) => (
            <li key={`${p.name}-${i}`} className="relative rounded-[9px] overflow-hidden border border-border">
              <img src={p.url} alt={`Meeting proof ${i + 1}`} className="w-full h-24 object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove ${p.name}`}
                className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-black/65 text-white hover:bg-danger cursor-pointer"
              >
                <Icon name="x" size={12} />
              </button>
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">
                {fmtSize(p.size)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Add meeting photo"
          className="border-2 border-dashed border-border rounded-[14px] p-2 cursor-pointer transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openPicker();
            }
          }}
        >
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handle} tabIndex={-1} />
          {status === 'working' ? (
            <div className="flex flex-col items-center gap-1.5 p-7 text-muted">
              <Icon name="mapPin" size={28} className="text-muted/60" />
              <span>{location ? 'Processing photo…' : 'Getting your location…'}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-7 text-muted">
              <Icon name="image" size={28} className="text-muted/60" />
              <span>{files.length ? 'Add another photo' : 'Click to upload meeting photo'}</span>
              <span className="text-xs">
                Up to {MEETING_PHOTO_MAX} photos, {fmtSize(IMAGE_UPLOAD_MAX_BYTES)} or smaller each
              </span>
              <span className="text-xs">A GPS + timestamp watermark is added automatically</span>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted mt-2 text-center">
        {files.length} of {MEETING_PHOTO_MAX} photos attached
      </p>
      {error && <p className="text-danger text-xs text-center mt-1 px-2">{error}</p>}
    </div>
  );
}
