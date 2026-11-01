import { el, injectStyle, openDialog } from './dialog';

const CSS = `
.le-url { width: 100%; box-sizing: border-box; padding: 12px 14px; font: inherit; font-size: 20px; color: inherit;
  background: #fff; border: 3px solid #d8ccb0; border-radius: 14px; }
.le-note { min-height: 24px; margin: 0; font-size: 20px; color: #2e9e44; }
.le-note.warn { color: #e07b00; }
`;

/** Bu uzunluğun üstündeki adresleri bazı mesajlaşma uygulamaları kesebilir. */
const LONG_URL = 4000;

/** Paylaşılan oyun adresini gösterir; kopyalanabilir ya da yeni sekmede açılabilir. */
export function openShareDialog(url: string, what: string) {
  injectStyle('le-share-style', CSS);
  const { box, close } = openDialog(
    'Oyun adresi',
    `Bu adresi açan kişi menüyü görmeden doğrudan bu ayarlarla ${what} oynar. Öğrencilere gönderebilir ya da başka bir tahtada açabilirsiniz.`,
  );

  const input = el('input', 'le-url');
  input.readOnly = true;
  input.value = url;
  input.onfocus = () => input.select();
  const note = el('p', 'le-note' + (url.length > LONG_URL ? ' warn' : ''));
  if (url.length > LONG_URL) note.textContent = 'Adres çok uzun; bazı mesajlaşma uygulamaları kesebilir. Kelime/cümle sayısını azaltmayı deneyin.';

  const open = el('a', 'le-btn le-plain', 'Yeni sekmede aç');
  open.href = url;
  open.target = '_blank';
  open.rel = 'noopener';
  const copy = el('button', 'le-btn le-blue', 'Kopyala');
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Pano API'si yalnızca güvenli bağlantıda (https/localhost) çalışır; ağdan http ile açılan tahtada eski yol.
      input.focus();
      input.select();
      document.execCommand('copy');
    }
    note.className = 'le-note';
    note.textContent = 'Adres kopyalandı.';
  };
  const done = el('button', 'le-btn le-plain', 'Kapat');
  done.onclick = close;

  const actions = el('div', 'le-actions');
  actions.append(open, copy, done);
  box.append(input, note, actions);
  input.focus();
}
