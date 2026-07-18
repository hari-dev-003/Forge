// Captures the `beforeinstallprompt` event as early as the bundle loads — before
// React mounts — so the custom "Install app" button never misses it (Chrome can
// fire the event before a component's useEffect runs). Import this for its side
// effect at the very top of main.jsx.
let deferredPrompt = null;
const listeners = new Set();

function emit() {
  for (const fn of listeners) fn(deferredPrompt);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // stop Chrome's default mini-infobar; we drive the UI
    deferredPrompt = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    emit();
  });
}

export const installPrompt = {
  get: () => deferredPrompt,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  async prompt() {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    emit();
    return outcome;
  },
};

export default installPrompt;
