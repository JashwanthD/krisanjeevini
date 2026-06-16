import { useState, useEffect, useCallback } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface PWAState {
  isOffline: boolean;
  isUpdateAvailable: boolean;
  updateApp: () => void;
}

/**
 * Service worker & caching manager hook.
 * Registers the PWA service worker via vite-plugin-pwa.
 * Tracks online/offline state and SW update availability.
 */
export function usePWA(): PWAState {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [updateFn, setUpdateFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Register service worker
    try {
      const updateSW = registerSW({
        onNeedRefresh() {
          setIsUpdateAvailable(true);
          setUpdateFn(() => updateSW);
        },
        onOfflineReady() {
          console.log('[PWA] App is ready for offline use.');
        },
        onRegistered(registration) {
          console.log('[PWA] Service worker registered:', registration);
        },
        onRegisterError(error) {
          console.error('[PWA] Service worker registration error:', error);
        },
      });
    } catch (err) {
      console.warn('[PWA] Service worker registration skipped (dev mode):', err);
    }

    // Online/Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateApp = useCallback(() => {
    if (updateFn) {
      updateFn();
    }
  }, [updateFn]);

  return { isOffline, isUpdateAvailable, updateApp };
}
