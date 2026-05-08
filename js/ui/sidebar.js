import { iconPlus }    from './icons.js';
import { searchNotes } from '../notes.js';

let _notes      = [];
let _selectedId = null;
let _callbacks  = {};

export function initSidebar({ onSelect, onCreate }) {
  _callbacks = { onSelect, onCreate };

  const btnNew = document.getElementById('btn-new');
  btnNew.innerHTML = iconPlus;
  btnNew.addEventListener('click', onCreate);

  const btnNewCenter = document.getElementById('btn-new-center');
  if (btnNewCenter) btnNewCenter.addEventListener('click', onCreate);

  document.getElementById('search-input').addEventListener('input', e => {
    renderList(searchNotes(_notes, e.target.value));
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    document.getElementById('sidebar-footer').innerHTML =
      '<span class="install-badge">Installed ✓</span>';
  }
}

export function setNotes(notes) {
  _notes = notes;
  const query = document.getElementById('search-input').value;
  renderList(query ? searchNotes(notes, query) : notes);
}

export function setSelectedId(id) {
  _selectedId = id;
  document.querySelectorAll('.note-row').forEach(el =>
    el.classList.toggle('selected', el.dataset.id === id)
  );
}

export function updateNoteRow(note) {
  const el = document.querySelector(`.note-row[data-id="${note.id}"]`);
  if (!el) return;

  el.querySelector('.note-row-title').textContent = note.title || '';
  el.querySelector('.note-row-desc').textContent  = note.description || '';
  el.querySelector('.note-row-time').textContent  = relativeTime(note.updatedAt);

  const chip = el.querySelector('.note-row-reminder');
  if (note.reminderAt) {
    chip.textContent = '🔔 ' + formatTime(note.reminderAt);
    el.classList.add('has-reminder');
  } else {
    chip.textContent = '';
    el.classList.remove('has-reminder');
  }
}

function renderList(notes) {
  const list  = document.getElementById('notes-list');
  const query = document.getElementById('search-input').value;

  if (notes.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <p>${query
          ? `No notes match &ldquo;<strong>${esc(query)}</strong>&rdquo;`
          : 'No notes yet'}</p>
        ${!query ? '<button class="btn-primary" id="btn-new-empty">+ New note</button>' : ''}
      </li>`;
    const btn = document.getElementById('btn-new-empty');
    if (btn) btn.addEventListener('click', _callbacks.onCreate);
    return;
  }

  list.innerHTML = notes.map(n => `
    <li class="note-row${n.id === _selectedId ? ' selected' : ''}${n.reminderAt ? ' has-reminder' : ''}"
        data-id="${n.id}" role="button" tabindex="0">
      <div class="note-row-title">${esc(n.title || '')}</div>
      <div class="note-row-desc">${esc(n.description || '')}</div>
      <div class="note-row-time">${relativeTime(n.updatedAt)}</div>
      <div class="note-row-reminder">${n.reminderAt ? '🔔 ' + formatTime(n.reminderAt) : ''}</div>
    </li>`).join('');

  list.querySelectorAll('.note-row').forEach(el => {
    el.addEventListener('click', ()  => _callbacks.onSelect(el.dataset.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') _callbacks.onSelect(el.dataset.id);
    });
  });
}

function relativeTime(ms) {
  const diff = Date.now() - ms;
  if (diff < 60_000)        return 'just now';
  if (diff < 3_600_000)     return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)    return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000)   return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ms).toLocaleDateString();
}

function formatTime(ms) {
  return new Intl.DateTimeFormat([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ms));
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
