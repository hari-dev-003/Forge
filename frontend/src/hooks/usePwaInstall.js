import { useEffect, useState } from 'react';
import { installPrompt } from '../pwa/installPrompt.js';

/**
 * Exposes install state + trigger. The actual `beforeinstallprompt` event is
 * captured at page-load time in pwa/installPrompt.js (before React mounts), so
 * this hook just subscribes to it — no events are missed.
 *
 * iOS Safari never fires the event (users add via Share → Add to Home Screen),
 * so we also report isIOS/isStandalone to tailor the UI hint.
 */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(!!installPrompt.get());

  useEffect(() => installPrompt.subscribe((p) => setCanInstall(!!p)), []);

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

  return { canInstall, promptInstall: installPrompt.prompt, installed: false, isIOS, isStandalone };
}

export default usePwaInstall;
