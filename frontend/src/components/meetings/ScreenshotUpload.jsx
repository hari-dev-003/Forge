import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { IMAGE_UPLOAD_MAX_BYTES, formatBytes } from '../../constants.js';

/**
 * Plain image upload — no GPS/watermark. Used for evidence that isn't a
 * live in-person photo (e.g. a staking/transaction confirmation screenshot).
 *
 * Held to the same IMAGE_UPLOAD_MAX_BYTES cap as every other image in the app.
 * Unlike PhotoUpload this rejects an oversized file rather than compressing it
 * down: this component does not re-encode at all, and silently degrading a
 * transaction screenshot could make the very figures it exists to evidence
 * unreadable. The server re-checks the stored object either way.
 */
export default function ScreenshotUpload({ onSelect }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState(0);
  const [error, setError] = useState('');

  const handle = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file after a rejection
    if (!file) return;

    if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
      setError(
        `"${file.name}" is ${formatBytes(file.size)} — the screenshot must be ${formatBytes(IMAGE_UPLOAD_MAX_BYTES)} or smaller.`
      );
      return;
    }

    setError('');
    setName(file.name);
    setSize(file.size);
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={preview ? `${name}, click to change screenshot` : 'Upload screenshot'}
        className="border-2 border-dashed border-border rounded-card p-2 cursor-pointer transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handle} tabIndex={-1} />
        {preview ? (
          <div>
            <img src={preview} alt="Screenshot" className="w-full max-h-70 object-cover rounded-control" />
            <span className="block text-center text-xs text-muted mt-2">
              {name} ({formatBytes(size)}) — click to change
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-9 text-muted">
            <Icon name="image" size={30} className="text-muted/60" />
            <span>Click to upload screenshot</span>
            <span className="text-xs">{formatBytes(IMAGE_UPLOAD_MAX_BYTES)} or smaller</span>
          </div>
        )}
      </div>
      {error && <p className="text-danger text-xs text-center mt-2 px-2">{error}</p>}
    </div>
  );
}
