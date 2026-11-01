const CSS = `
.we-overlay { position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;
  background: rgba(31, 42, 68, 0.45); font-family: Andika, sans-serif; color: #1f2a44; touch-action: auto; }
.we-box { width: min(1100px, 92vw); max-height: 92vh; box-sizing: border-box; padding: 32px 40px;
  display: flex; flex-direction: column; gap: 16px; background: #fdf6e3; border-radius: 28px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25); }
.we-box h2 { margin: 0; font-size: 38px; color: #b3121b; }
.we-help { margin: 0; font-size: 22px; color: #8a8170; white-space: pre-line; }
.we-box textarea { height: 30vh; min-height: 160px; padding: 16px 20px; resize: vertical; font: inherit;
  font-size: 30px; line-height: 1.4; color: inherit; background: #fff; border: 3px solid #d8ccb0; border-radius: 18px; }
.we-box textarea:focus { outline: none; border-color: #1e4fbf; }
.we-preview { display: flex; flex-wrap: wrap; gap: 8px; max-height: 22vh; overflow: auto; font-size: 22px; }
.we-chip { padding: 4px 14px; border-radius: 999px; background: #fff; border: 2px solid #2e9e44; color: #2e9e44; font-weight: 700; }
.we-chip.bad { border-color: #b3121b; color: #b3121b; font-weight: 400; }
.we-actions { display: flex; align-items: center; gap: 16px; }
.we-count { flex: 1; font-size: 24px; color: #8a8170; }
.we-actions button { padding: 14px 36px; font: inherit; font-size: 28px; font-weight: 700; border-radius: 20px; cursor: pointer; }
.we-cancel { background: #fff; color: #1f2a44; border: 3px solid #d8ccb0; }
.we-save { background: #2e9e44; color: #fff; border: 3px solid #2e9e44; }
`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
}

export interface TextEditorOptions {
  title: string;
  help: string;
  placeholder: string;
  initial: string;
  /** Yazılanı denetler: alınacaklar, alınmayacaklar (nedeniyle) ve sayaç yazısı. */
  check: (text: string) => { ok: string[]; bad: string[]; count: string };
  onSave: (text: string) => void;
}

/**
 * Öğretmenin kendi kelime ya da cümlelerini yazdığı pencere. Canvas yazı
 * girişi desteklemediği için normal bir HTML penceresi olarak açılır.
 */
export function openTextEditor(opts: TextEditorOptions) {
  if (!document.getElementById('we-style')) {
    const style = el('style');
    style.id = 'we-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  const overlay = el('div', 'we-overlay');
  const box = el('div', 'we-box');
  const area = el('textarea');
  area.value = opts.initial;
  area.spellcheck = false;
  area.placeholder = opts.placeholder;
  area.setAttribute('autocapitalize', 'off');
  const preview = el('div', 'we-preview');
  const count = el('span', 'we-count');
  const cancel = el('button', 'we-cancel', 'Vazgeç');
  const save = el('button', 'we-save', 'Kaydet');

  const actions = el('div', 'we-actions');
  actions.append(count, cancel, save);
  box.append(el('h2', '', opts.title), el('p', 'we-help', opts.help), area, preview, actions);
  overlay.appendChild(box);

  const render = () => {
    const { ok, bad, count: n } = opts.check(area.value);
    preview.replaceChildren(...ok.map((t) => el('span', 'we-chip', t)), ...bad.map((t) => el('span', 'we-chip bad', t)));
    count.textContent = n;
  };

  const close = () => overlay.remove();
  cancel.onclick = close;
  save.onclick = () => {
    close();
    opts.onSave(area.value.trim());
  };
  area.addEventListener('input', render);
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save.click();
  });

  render();
  document.body.appendChild(overlay);
  area.focus();
}
