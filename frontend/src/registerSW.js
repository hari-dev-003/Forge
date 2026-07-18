// Registers the service worker in production only. In dev we proactively
// unregister any existing SW so it never serves stale modules during HMR.
export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.error('SW registration failed:', err);
      });
    });
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
  }
}
