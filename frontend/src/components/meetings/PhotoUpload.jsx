import { useRef, useState } from 'react';

/**
 * Gallery photo upload (no camera lock — plain file picker per the simplified
 * spec). Shows a preview and hands the File up via onSelect.
 */
export default function PhotoUpload({ onSelect }) {
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

  return (
    <div
      className="border-2 border-dashed border-border rounded-[14px] p-2 cursor-pointer transition-colors hover:border-primary"
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handle} />
      {preview ? (
        <div>
          <img src={preview} alt="Meeting proof" className="w-full max-h-70 object-cover rounded-[9px]" />
          <span className="block text-center text-xs text-muted mt-2">{name} — click to change</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-9 text-muted">
          <span className="text-[34px]">🖼️</span>
          <span>Click to upload meeting photo</span>
          <span className="text-xs">JPG / PNG from your gallery</span>
        </div>
      )}
    </div>
  );
}
