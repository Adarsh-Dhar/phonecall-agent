import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/shared';

export function usePushSubscription() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check for service worker support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Register service worker
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service worker registered:', registration);
    }).catch((err) => {
      console.error('Service worker registration failed:', err);
    });

    // Check current permission
    setPermission(Notification.permission);

    // Get existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        if (sub) {
          setSubscription(sub);
        }
      });
    });
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      // Request permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        console.warn('Notification permission denied');
        return;
      }

      // Get public key from server
      const publicKeyRes = await apiFetch('/api/push/public-key');
      if (!publicKeyRes.ok) {
        throw new Error('Failed to get public key');
      }
      const { publicKey } = await publicKeyRes.json();

      // Convert base64 to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Subscribe
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      // Send subscription to server
      const keys = sub.toJSON().keys;
      if (!keys) {
        throw new Error('No keys in subscription');
      }
      await apiFetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }),
      });

      setSubscription(sub);
      console.log('Push subscription successful');
    } catch (err) {
      console.error('Push subscription failed:', err);
    }
  };

  return { subscription, permission, subscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
