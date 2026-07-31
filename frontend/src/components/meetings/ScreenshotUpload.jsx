import { useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';

/**
 * Plain image upload — no GPS/watermark. Used for evidence that isn't a
 * live in-person photo (e.g. a staking/transaction confirmation screenshot).
 */
export default function ScreenshotUpload({ onSelect }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');

  const handle = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name);
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={preview ? `${name}, click to change screenshot` : 'Upload screenshot'}
      className="border-2 border-dashed border-border rounded-[14px] p-2 cursor-pointer transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
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
          <img src={preview} alt="Screenshot" className="w-full max-h-70 object-cover rounded-[9px]" />
          <span className="block text-center text-xs text-muted mt-2">{name} — click to change</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-9 text-muted">
          <Icon name="image" size={30} className="text-muted/60" />
          <span>Click to upload screenshot</span>
        </div>
      )}
    </div>
  );
}
