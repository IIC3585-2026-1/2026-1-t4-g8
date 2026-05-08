import { openDB }                                  from './js/db.js';
import { createNote, updateNote, deleteNote, listNotes } from './js/notes.js';
import { initRouter, onRoute, navigate }            from './js/router.js';
import { initSidebar, setNotes, setSelectedId, updateNoteRow } from './js/ui/sidebar.js';
import { initEditor, loadNote, clearEditor }        from './js/ui/editor.js';
import { setReminder, clearReminder, updateReminderTitle } from './js/reminders.js';

let allNotes = [];

// ── Bootstrap ────────────────────────────────────────────────────────

async function init() {
  // Register caching service worker (teammate's file)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(e =>
      console.warn('[SW] Registration failed:', e.message)
    );
  }

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
