import { el, injectStyle, openDialog } from './dialog';

const CSS = `
.le-tools { display: flex; align-items: center; gap: 18px; font-size: 22px; color: #8a8170; }
.le-tools .le-count { flex: 1; }
.le-link { padding: 0; font: inherit; color: #1e4fbf; background: none; border: none; text-decoration: underline; cursor: pointer; }
.le-list { min-height: 120px; max-height: 42vh; overflow: auto; padding: 8px; background: #fff;
  border: 3px solid #d8ccb0; border-radius: 18px; }
.le-row { display: flex; align-items: center; gap: 14px; padding: 6px 10px; border-radius: 12px; font-size: 26px; cursor: pointer; }
.le-row:hover { background: #fbf3df; }
.le-row input { width: 26px; height: 26px; margin: 0; accent-color: #2e9e44; cursor: pointer; }
.le-row.off .le-text { color: #a39a88; }
.le-del { margin-left: auto; padding: 2px 12px; font: inherit; font-size: 24px; color: #b3121b; background: none;
  border: none; border-radius: 10px; cursor: pointer; }
.le-del:hover { background: #fde8e8; }
.le-empty { padding: 16px; font-size: 22px; color: #8a8170; }
.le-add { display: flex; gap: 12px; }
.le-add textarea { flex: 1; height: 84px; padding: 10px 14px; resize: vertical; font: inherit; font-size: 24px;
  color: inherit; background: #fff; border: 3px solid #d8ccb0; border-radius: 14px; }
.le-add textarea:focus { outline: none; border-color: #1e4fbf; }
.le-msg { min-height: 24px; margin: 0; font-size: 20px; color: #b3121b; }
`;

export interface ListEditorOptions {
  title: string;
  help: string;
  placeholder: string;
  /** Kayıtlı öğeler. */
  items: string[];
  /** Seçili olmayan öğelerin anahtarları. */
  off: string[];
  /** Aynı öğe mi kontrolü için anahtar. */
  key: (item: string) => string;
  /** Eklenecek yazıyı ayrıştırır: alınacak öğeler ve alınmayanlar için mesajlar. */
  parse: (text: string) => { items: string[]; issues: string[] };
  onSave: (items: string[], off: string[]) => void;
}

/**
 * Öğretmenin kayıtlı kelime/cümle listesi: her öğe işaretlenip kaldırılabilir
 * ya da silinebilir, alttan yenileri eklenir. Yalnız işaretliler oyuna girer.
 */
export function openListEditor(o: ListEditorOptions) {
  injectStyle('le-list-style', CSS);
  const off = new Set(o.off);
  let items = [...o.items];

  const { box, close } = openDialog(o.title, o.help);
  const count = el('span', 'le-count');
  const all = el('button', 'le-link', 'Tümünü seç');
  const none = el('button', 'le-link', 'Hiçbiri');
  const tools = el('div', 'le-tools');
  tools.append(count, all, none);
  const list = el('div', 'le-list');
  const area = el('textarea');
  area.placeholder = o.placeholder;
  area.spellcheck = false;
  area.setAttribute('autocapitalize', 'off');
  const add = el('button', 'le-btn le-blue', 'Ekle');
  const addRow = el('div', 'le-add');
  addRow.append(area, add);
  const msg = el('p', 'le-msg');
  const cancel = el('button', 'le-btn le-plain', 'Vazgeç');
  const save = el('button', 'le-btn le-green', 'Kaydet');
  const actions = el('div', 'le-actions');
  actions.append(cancel, save);
  box.append(tools, list, addRow, msg, actions);

  const render = () => {
    const rows = items.map((item) => {
      const k = o.key(item);
      const row = el('label', 'le-row' + (off.has(k) ? ' off' : ''));
      const check = el('input');
      check.type = 'checkbox';
      check.checked = !off.has(k);
      check.onchange = () => {
        if (check.checked) off.delete(k);
        else off.add(k);
        render();
      };
      const del = el('button', 'le-del', '✕');
      del.title = 'Sil';
      del.onclick = (e) => {
        e.preventDefault();
        items = items.filter((x) => x !== item);
        off.delete(k);
        render();
      };
      row.append(check, el('span', 'le-text', item), del);
      return row;
    });
    list.replaceChildren(...(rows.length ? rows : [el('div', 'le-empty', 'Henüz bir şey eklenmedi. Aşağıya yazıp "Ekle"ye basın.')]));
    const on = items.filter((x) => !off.has(o.key(x))).length;
    count.textContent = items.length ? `${on} / ${items.length} seçili` : '';
  };

  const addItems = () => {
    const { items: fresh, issues } = o.parse(area.value);
    const have = new Set(items.map(o.key));
    const dup: string[] = [];
    for (const item of fresh) {
      const k = o.key(item);
      if (have.has(k)) dup.push(item);
      else {
        items.push(item);
        have.add(k);
        off.delete(k);
      }
    }
    const notes = [...issues, ...dup.map((d) => `${d}: zaten listede`)];
    msg.textContent = notes.join(' · ');
    area.value = '';
    render();
    list.scrollTop = list.scrollHeight;
    area.focus();
  };

  all.onclick = () => {
    off.clear();
    render();
  };
  none.onclick = () => {
    items.forEach((x) => off.add(o.key(x)));
    render();
  };
  add.onclick = addItems;
  cancel.onclick = close;
  save.onclick = () => {
    // Kaydet'e basmadan önce kutuda kalan yazı da eklensin.
    if (area.value.trim()) addItems();
    close();
    o.onSave(items, items.map(o.key).filter((k) => off.has(k)));
  };
  area.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addItems();
  });

  render();
  area.focus();
}
