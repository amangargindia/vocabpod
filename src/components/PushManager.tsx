"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushManager() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const registerPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Request notification permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!publicVapidKey) return;

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Send subscription to server
        await fetch('/api/web-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'subscribe',
            userId: user.id,
            subscription
          })
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerPush();
  }, [user]);

  return null;
}
