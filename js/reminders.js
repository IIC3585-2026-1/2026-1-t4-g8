import { updateNote }                          from './notes.js';
import { writeReminderDoc, deleteReminderDoc } from './firebase.js';
import { ensurePermissionAndToken }            from './fcm.js';

export async function setReminder(note, notifyAt) {
  const token   = await ensurePermissionAndToken();
  const updated = await updateNote(note.id, { reminderAt: notifyAt });

  await writeReminderDoc(note.id, {
    token,
    title: note.title || 'Untitled',
    notifyAt,
  });

  return updated;
}

export async function clearReminder(note) {
  const updated = await updateNote(note.id, { reminderAt: null });
  await deleteReminderDoc(note.id);
  return updated;
}

// Called when the note title changes while a reminder is active,
// so the eventual push notification shows the latest title.
export async function updateReminderTitle(note) {
  if (!note.reminderAt) return;
  const token = localStorage.getItem('fcmToken');
  if (!token) return;
  try {
    await writeReminderDoc(note.id, {
      token,
      title: note.title || 'Untitled',
      notifyAt: note.reminderAt,
    });
  } catch (e) {
    // non-critical — swallow silently
  }
}
