import { iconBack, iconBell, iconTrash } from './icons.js';
import { parseMarkdown }                from '../markdown.js';

let _note              = null;
let _mode              = 'edit';
let _callbacks         = {};
let _saveTimer         = null;
let _reminderTitleTimer = null;

export function initEditor({ onSave, onDelete, onSetReminder, onClearReminder }) {
  _callbacks = { onSave, onDelete, onSetReminder, onClearReminder };

  document.getElementById('btn-back').innerHTML    = iconBack;
  document.getElementById('btn-reminder').innerHTML = iconBell;
  document.getElementById('btn-delete').innerHTML   = iconTrash;

  document.getElementById('btn-back').addEventListener('click', () => {
    location.hash = '/';
  });

  document.getElementById('btn-edit-mode').addEventListener('click', ()    => setMode('edit'));
  document.getElementById('btn-preview-mode').addEventListener('click', () => setMode('preview'));

  ['note-title', 'note-description', 'note-content'].forEach(id =>
    document.getElementById(id).addEventListener('input', scheduleSave)
  );

  document.getElementById('note-title').addEventListener('input', scheduleReminderTitleUpdate);

  document.getElementById('btn-reminder').addEventListener('click', toggleReminderPopover);
  document.getElementById('btn-reminder-save').addEventListener('click', handleReminderSave);
  document.getElementById('btn-reminder-clear').addEventListener('click', handleReminderClear);
  document.getElementById('btn-delete').addEventListener('click', handleDelete);

  updateReminderAvailability();
  window.addEventListener('online',  updateReminderAvailability);
  window.addEventListener('offline', updateReminderAvailability);
}

export function loadNote(note, { focusTitle = false } = {}) {
  _note = note;
  clearTimeout(_saveTimer);
  clearTimeout(_reminderTitleTimer);

  document.getElementById('note-title').value       = note.title       || '';
  document.getElementById('note-description').value = note.description || '';
  document.getElementById('note-content').value     = note.content     || '';

  setMode(_mode, focusTitle);
  updateReminderButton(note);
  closeReminderPopover();

  document.getElementById('editor-placeholder').hidden = true;
  document.getElementById('note-editor').hidden        = false;
}

export function clearEditor() {
  _note = null;
  clearTimeout(_saveTimer);
  document.getElementById('editor-placeholder').hidden = false;
  document.getElementById('note-editor').hidden        = true;
  closeReminderPopover();
}

// ── Mode toggle ─────────────────────────────────────────────────────

function setMode(mode, focusTitle = false) {
  _mode = mode;
  const textarea   = document.getElementById('note-content');
  const preview    = document.getElementById('note-preview');
  const btnEdit    = document.getElementById('btn-edit-mode');
  const btnPreview = document.getElementById('btn-preview-mode');

  if (mode === 'preview') {
    preview.innerHTML = parseMarkdown(textarea.value);
    preview.hidden    = false;
    textarea.hidden   = true;
    btnEdit.classList.remove('active');
    btnPreview.classList.add('active');
  } else {
    textarea.hidden   = false;
    preview.hidden    = true;
    btnEdit.classList.add('active');
    btnPreview.classList.remove('active');
    if (focusTitle) {
      document.getElementById('note-title').focus();
    } else {
      textarea.focus();
    }
  }
}

// ── Auto-save ────────────────────────────────────────────────────────

function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(doSave, 400);
}

async function doSave() {
  if (!_note) return;
  const patch = {
    title:       document.getElementById('note-title').value,
    description: document.getElementById('note-description').value,
    content:     document.getElementById('note-content').value,
  };
  try {
    const updated = await _callbacks.onSave(_note.id, patch);
    _note = updated;
  } catch (e) {
    console.error('[Editor] Save failed:', e);
  }
}

// ── Reminder title sync ──────────────────────────────────────────────

function scheduleReminderTitleUpdate() {
  clearTimeout(_reminderTitleTimer);
  _reminderTitleTimer = setTimeout(async () => {
    if (_note?.reminderAt) {
      const title = document.getElementById('note-title').value;
      await _callbacks.onSetReminder?.({ ..._note, title }, _note.reminderAt, { titleOnly: true });
    }
  }, 1200);
}

// ── Online/offline reminder availability ─────────────────────────────

function updateReminderAvailability() {
  const btn = document.getElementById('btn-reminder');
  if (!navigator.onLine) {
    btn.title  = 'Reminders require an internet connection';
    btn.style.opacity = '0.4';
    btn.style.cursor  = 'not-allowed';
  } else {
    btn.title  = _note?.reminderAt ? 'Edit reminder' : 'Set reminder';
    btn.style.opacity = '';
    btn.style.cursor  = '';
  }
}

// ── Reminder popover ─────────────────────────────────────────────────

function toggleReminderPopover() {
  if (!navigator.onLine) return;
  const popover = document.getElementById('reminder-popover');
  popover.hidden ? openReminderPopover() : closeReminderPopover();
}

function openReminderPopover() {
  const popover = document.getElementById('reminder-popover');
  const input   = document.getElementById('reminder-input');
  const error   = document.getElementById('reminder-error');

  error.hidden    = true;
  popover.hidden  = false;

  const base = _note?.reminderAt ? new Date(_note.reminderAt) : new Date(Date.now() + 3_600_000);
  // datetime-local value must be in local ISO format (no timezone suffix)
  const local = new Date(base.getTime() - base.getTimezoneOffset() * 60_000);
  input.value = local.toISOString().slice(0, 16);
  input.focus();
}

function closeReminderPopover() {
  document.getElementById('reminder-popover').hidden = true;
  document.getElementById('reminder-error').hidden   = true;
}

async function handleReminderSave() {
  if (!_note) return;
  const input = document.getElementById('reminder-input');
  const error = document.getElementById('reminder-error');
  const btn   = document.getElementById('btn-reminder-save');

  const ts = new Date(input.value).getTime();
  if (!ts || ts <= Date.now()) {
    showReminderError('Please pick a time in the future.');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Saving…';
  error.hidden    = true;

  try {
    const updated = await _callbacks.onSetReminder(_note, ts);
    _note = updated;
    updateReminderButton(_note);
    closeReminderPopover();
  } catch (e) {
    showReminderError("Couldn't schedule — check your connection.");
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save';
  }
}

async function handleReminderClear() {
  if (!_note) return;
  const btn = document.getElementById('btn-reminder-clear');
  btn.disabled = true;
  try {
    const updated = await _callbacks.onClearReminder(_note);
    _note = updated;
    updateReminderButton(_note);
    closeReminderPopover();
  } catch (e) {
    showReminderError("Couldn't clear reminder.");
  } finally {
    btn.disabled = false;
  }
}

function updateReminderButton(note) {
  const btn = document.getElementById('btn-reminder');
  if (note?.reminderAt) {
    const time = new Intl.DateTimeFormat([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(note.reminderAt));
    btn.innerHTML = `<span class="reminder-chip">${iconBell}${time}</span>`;
    btn.classList.add('has-chip');
  } else {
    btn.innerHTML = iconBell;
    btn.classList.remove('has-chip');
  }
  updateReminderAvailability();
}

function showReminderError(msg) {
  const el  = document.getElementById('reminder-error');
  el.textContent = msg;
  el.hidden      = false;
}

// ── Delete ───────────────────────────────────────────────────────────

async function handleDelete() {
  if (!_note) return;
  const title = _note.title || 'Untitled';
  if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
  await _callbacks.onDelete(_note.id);
}
