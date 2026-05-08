export function parseMarkdown(raw) {
  if (!raw) return '';
  const html = window.marked.parse(raw);
  return sanitize(html);
}

function sanitize(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const root = template.content;

  root.querySelectorAll('script, style').forEach(el => el.remove());

  root.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (attr.name === 'href' || attr.name === 'src') {
        if (attr.value.trim().toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  const div = document.createElement('div');
  div.appendChild(root.cloneNode(true));
  return div.innerHTML;
}
