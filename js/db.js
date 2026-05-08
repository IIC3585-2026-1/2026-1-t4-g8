let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('bangle-notes', 1);

    req.onupgradeneeded = ({ target: { result: db } }) => {
      if (!db.objectStoreNames.contains('notes')) {
        const store = db.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('reminderAt', 'reminderAt');
      }
    };

    req.onsuccess = ({ target: { result: db } }) => { _db = db; resolve(db); };
    req.onerror   = ({ target: { error } })       => reject(error);
  });
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', mode);
    transaction.onerror = ({ target: { error } }) => reject(error);
    fn(transaction.objectStore('notes'), resolve, reject);
  }));
}

export const dbGet = key => tx('readonly', (store, res) => {
  const req = store.get(key);
  req.onsuccess = () => res(req.result);
});

export const dbPut = value => tx('readwrite', (store, res) => {
  const req = store.put(value);
  req.onsuccess = () => res(req.result);
});

export const dbDelete = key => tx('readwrite', (store, res) => {
  const req = store.delete(key);
  req.onsuccess = () => res();
});

export const dbGetAll = () => tx('readonly', (store, res) => {
  const req = store.getAll();
  req.onsuccess = () => res(req.result);
});
