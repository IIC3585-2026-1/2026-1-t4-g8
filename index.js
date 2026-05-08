import { openDB }                                  from './js/db.js';
import { createNote, updateNote, deleteNote, listNotes } from './js/notes.js';
import { initRouter, onRoute, navigate }            from './js/router.js';
import { initSidebar, setNotes, setSelectedId, updateNoteRow } from './js/ui/sidebar.js';
import { initEditor, loadNote, clearEditor }        from './js/ui/editor.js';
import { setReminder, clearReminder, updateReminderTitle } from './js/reminders.js';

import { firebaseConfig, VAPID_KEY } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging.js';

let allNotes = [];
let messaging = null;

// ── Bootstrap ────────────────────────────────────────────────────────

async function init() {
  // Register caching service worker (teammate's file)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(e =>
      console.warn('[SW] Registration failed:', e.message)
    );
  }

  // Firebase Cloud Messaging setup
  const app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  onMessage(messaging, (payload) => {
    console.log('Foreground:', payload);
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(payload.notification.title, { body: payload.notification.body });
    });
  });

  await openDB();
  allNotes = await listNotes();

  initSidebar({ onSelect: selectNote, onCreate: handleCreate });

  initEditor({
    onSave:          handleSave,
    onDelete:        handleDelete,
    onSetReminder:   handleSetReminder,
    onClearReminder: handleClearReminder,
  });

  setNotes(allNotes);

  const btnNotif = document.getElementById('btn-notif');
  if (btnNotif) btnNotif.addEventListener('click', requestPermission);

  onRoute(({ name, id }) => {
    if (name === 'note') {
      const note = allNotes.find(n => n.id === id);
      if (note) {
        setSelectedId(note.id);
        const isNew = !note.title && !note.content;
        loadNote(note, { focusTitle: isNew });
        showEditor();
      } else {
        navigate('/');
      }
    } else {
      setSelectedId(null);
      clearEditor();
      showSidebar();
    }
  });

  initRouter();
}

function requestPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      getToken(messaging, { vapidKey: VAPID_KEY }).then((token) => {
        console.log('Token:', token);
        navigator.clipboard?.writeText(token);
        alert(token);
      });
    }
  });
}

// ── Note actions ─────────────────────────────────────────────────────

function selectNote(id) {
  navigate(`/note/${id}`);
}

async function handleCreate() {
  const note = await createNote();
  allNotes   = [note, ...allNotes];
  setNotes(allNotes);
  navigate(`/note/${note.id}`);
}

async function handleSave(id, patch) {
  const updated = await updateNote(id, patch);
  const idx     = allNotes.findIndex(n => n.id === id);
  if (idx !== -1) {
    allNotes[idx] = updated;
    allNotes.sort((a, b) => b.updatedAt - a.updatedAt);
    setNotes(allNotes);
    setSelectedId(id);
  }
  return updated;
}

async function handleDelete(id) {
  const note = allNotes.find(n => n.id === id);
  if (note?.reminderAt) {
    clearReminder(note).catch(() => {});
  }
  await deleteNote(id);
  allNotes = allNotes.filter(n => n.id !== id);
  setNotes(allNotes);
  navigate('/');
}

async function handleSetReminder(note, notifyAt, opts = {}) {
  if (opts.titleOnly) {
    await updateReminderTitle({ ...note, title: document.getElementById('note-title').value });
    return note;
  }
  const updated = await setReminder(note, notifyAt);
  const idx     = allNotes.findIndex(n => n.id === note.id);
  if (idx !== -1) { allNotes[idx] = updated; updateNoteRow(updated); }
  return updated;
}

async function handleClearReminder(note) {
  const updated = await clearReminder(note);
  const idx     = allNotes.findIndex(n => n.id === note.id);
  if (idx !== -1) { allNotes[idx] = updated; updateNoteRow(updated); }
  return updated;
}

// ── Mobile pane management ───────────────────────────────────────────

function showSidebar() {
  document.getElementById('sidebar').classList.remove('hidden');
  document.getElementById('main').classList.remove('active');
}

function showEditor() {
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('main').classList.add('active');
}

init().catch(console.error);
