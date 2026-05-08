import { firebaseConfig as FIREBASE_CONFIG } from '../firebase-config.js';

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

export async function saveToken(token) {
  const fs = await getHelpers();
  const ref = fs.doc('tokens', 'current');
  await fs.setDoc(ref, { token, updatedAt: Date.now() });
}
