const CSS = `
.le-overlay { position: fixed; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center;
  background: rgba(31, 42, 68, 0.45); font-family: Andika, sans-serif; color: #1f2a44; touch-action: auto; }
.le-box { width: min(1000px, 92vw); max-height: 94vh; box-sizing: border-box; padding: 28px 36px;
  display: flex; flex-direction: column; gap: 14px; background: #fdf6e3; border-radius: 28px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25); }
.le-box h2 { margin: 0; font-size: 34px; color: #b3121b; }
.le-help { margin: 0; font-size: 20px; color: #8a8170; }
.le-actions { display: flex; justify-content: flex-end; gap: 14px; }
.le-btn { padding: 12px 30px; font: inherit; font-size: 26px; font-weight: 700; text-decoration: none;
  border-radius: 18px; cursor: pointer; }
.le-plain { color: #1f2a44; background: #fff; border: 3px solid #d8ccb0; }
.le-blue { color: #fff; background: #1e4fbf; border: 3px solid #1e4fbf; }
.le-green { color: #fff; background: #2e9e44; border: 3px solid #2e9e44; }
`;

export function injectStyle(id: string, css: string) {
  if (document.getElementById(id)) return;
  const style = el('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const e = document.createElement(tag);
  e.className = className;
  e.textContent = text;
  return e;
}

/**
 * Canvas'ın üstünde açılan HTML penceresi (canvas yazı girişi desteklemez).
 * Esc kapatır; açıkken tuşlar arkadaki sahneye gitmez (Enter oyunu başlatmasın).
 */
export function openDialog(title: string, help: string): { box: HTMLDivElement; close: () => void } {
  injectStyle('le-style', CSS);
  const overlay = el('div', 'le-overlay');
  const box = el('div', 'le-box');
  box.append(el('h2', '', title), el('p', 'le-help', help));
  overlay.appendChild(box);

  const close = () => overlay.remove();
  overlay.tabIndex = -1;
  overlay.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  });
  document.body.appendChild(overlay);
  return { box, close };
}
