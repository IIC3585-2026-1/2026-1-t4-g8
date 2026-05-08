import { dbGet, dbPut, dbDelete, dbGetAll } from './db.js';

export async function createNote() {
  const now = Date.now();
  const note = {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    content: '',
    createdAt: now,
    updatedAt: now,
    reminderAt: null,
  };
  await dbPut(note);
  return note;
}

export const getNote = id => dbGet(id);

export async function updateNote(id, patch) {
  const note = await dbGet(id);
  if (!note) throw new Error(`Note ${id} not found`);
  const updated = { ...note, ...patch, updatedAt: Date.now() };
  await dbPut(updated);
  return updated;
}

export async function deleteNote(id) {
  await dbDelete(id);
}

export async function listNotes() {
  const all = await dbGetAll();
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function searchNotes(notes, query) {
  if (!query.trim()) return notes;
  const q = query.toLowerCase();
  return notes.filter(n =>
    (n.title       || '').toLowerCase().includes(q) ||
    (n.description || '').toLowerCase().includes(q) ||
    (n.content     || '').toLowerCase().includes(q)
  );
}
