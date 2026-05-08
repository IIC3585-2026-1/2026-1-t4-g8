// ── Firebase configuration ──────────────────────────────────────────
// Teammate fills in these values from the Firebase Console.
const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

const FB_VERSION = '10.12.0';
const BASE = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;

let _app = null;
let _fsHelpers = null;

async function getHelpers() {
  if (_fsHelpers) return _fsHelpers;

  const [appMod, fsMod] = await Promise.all([
    import(`${BASE}/firebase-app.js`),
    import(`${BASE}/firebase-firestore.js`),
  ]);

  if (!_app) _app = appMod.initializeApp(FIREBASE_CONFIG);
  const db = fsMod.getFirestore(_app);

  _fsHelpers = {
    doc:       (path, ...segs) => fsMod.doc(db, path, ...segs),
    setDoc:    fsMod.setDoc,
    deleteDoc: fsMod.deleteDoc,
  };
  return _fsHelpers;
}

export async function getFirebaseApp() {
  await getHelpers();
  return _app;
}

export async function writeReminderDoc(noteId, { token, title, notifyAt }) {
  const fs = await getHelpers();
  const ref = fs.doc('reminders', noteId);
  await fs.setDoc(ref, { token, title, notifyAt });
}

export async function deleteReminderDoc(noteId) {
  const fs = await getHelpers();
  const ref = fs.doc('reminders', noteId);
  await fs.deleteDoc(ref);
}
