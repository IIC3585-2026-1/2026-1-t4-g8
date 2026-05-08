import { getFirebaseApp } from './firebase.js';

// Teammate fills in the VAPID key from Firebase Console → Project Settings → Cloud Messaging
const VAPID_KEY = 'BCBcPbPxRarXIpxxE69UoZNOZOSHk3xODjokKNoh28KJV6ti5jqj_d60i29YJ7HoL0w-8kZdBsapa389-rDf4dM';

const FB_VERSION = '10.12.0';
const BASE = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;

let _token     = null;
let _msgInst   = null;
let _msgMod    = null;

async function loadMessaging() {
  if (_msgInst) return;
  const app = await getFirebaseApp();
  _msgMod  = await import(`${BASE}/firebase-messaging.js`);
  _msgInst = _msgMod.getMessaging(app);
}

export async function ensurePermissionAndToken() {
  if (_token) return _token;

  // Return cached token from previous session if permission is still granted
  const cached = localStorage.getItem('fcmToken');
  if (cached && Notification.permission === 'granted') {
    _token = cached;
    return _token;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission denied');

  await loadMessaging();

  // Register (or reuse) the FCM service worker
  const fcmSwReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

  _token = await _msgMod.getToken(_msgInst, {
    serviceWorkerRegistration: fcmSwReg,
    vapidKey: VAPID_KEY,
  });

  localStorage.setItem('fcmToken', _token);
  console.info('[FCM] Token registered:', _token);
  return _token;
}

