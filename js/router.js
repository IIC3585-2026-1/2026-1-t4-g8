const listeners = [];

export function onRoute(fn) {
  listeners.push(fn);
}

export function navigate(hash) {
  location.hash = hash;
}

function dispatch() {
  const hash = location.hash.slice(1) || '/';
  const noteMatch = hash.match(/^\/note\/(.+)$/);
  const route = noteMatch
    ? { name: 'note', id: noteMatch[1] }
    : { name: 'home' };
  listeners.forEach(fn => fn(route));
}

window.addEventListener('hashchange', dispatch);

export function initRouter() {
  dispatch();
}

export function currentNoteId() {
  const m = location.hash.slice(1).match(/^\/note\/(.+)$/);
  return m ? m[1] : null;
}
