import { useRef, useState } from 'react';

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

/** Burn a timestamp + GPS watermark bar into the bottom of the image. */
function watermarkImage(file, location) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const barHeight = Math.max(56, Math.round(img.height * 0.08));
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

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error('Failed to process the photo'));
            return;
          }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load the selected photo'));
    };
    img.src = objectUrl;
  });
}

/**
 * Photo upload with a mandatory GPS/timestamp watermark: on selection we grab
 * the device's current location, burn a timestamp + lat/lng bar into the
 * bottom of the image, and only then hand the watermarked file (and the raw
 * location) up to the caller.
 */
export default function PhotoUpload({ onSelect, onLocation }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | locating | error
  const [error, setError] = useState('');

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setStatus('locating');
    try {
      const location = await getLocation();
      const watermarked = await watermarkImage(file, location);
      setName(file.name);
      setPreview(URL.createObjectURL(watermarked));
      onLocation(location);
      onSelect(watermarked);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Could not attach photo');
      onSelect(null);
      onLocation(null);
      e.target.value = '';
    }
  };

  return (
    <div
      className="border-2 border-dashed border-border rounded-[14px] p-2 cursor-pointer transition-colors hover:border-primary"
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handle} />
      {status === 'locating' ? (
        <div className="flex flex-col items-center gap-1.5 p-9 text-muted">
          <span className="text-[34px]">📍</span>
          <span>Getting your location…</span>
        </div>
      ) : preview ? (
        <div>
          <img src={preview} alt="Meeting proof" className="w-full max-h-70 object-cover rounded-[9px]" />
          <span className="block text-center text-xs text-muted mt-2">{name} — click to change</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-9 text-muted">
          <span className="text-[34px]">🖼️</span>
          <span>Click to upload meeting photo</span>
          <span className="text-xs">A GPS + timestamp watermark is added automatically</span>
        </div>
      )}
      {error && <p className="text-danger text-xs text-center mt-2 px-2">{error}</p>}
    </div>
  );
}
