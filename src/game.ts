import { Application, Container, Graphics } from 'pixi.js';
import { C, H, W, setTextResolution } from './theme';
import { loadSettings, saveSettings, type Settings } from './settings';
import { configureAudio } from './audio';

export interface Scene {
  view: Container;
  onKey?(e: KeyboardEvent): void;
  destroy(): void;
}

export class Game {
  readonly app = new Application();
  /** W×H sanal alan; pencereye sığacak şekilde ölçeklenir. */
  readonly root = new Container();
  settings: Settings = loadSettings();
  private scene?: Scene;
  private backdrop = new Graphics();

  async init() {
    await this.app.init({
      resizeTo: window,
      background: C.bg,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    document.body.appendChild(this.app.canvas);
    this.app.stage.addChild(this.root);
    this.root.addChild(this.backdrop);
    this.drawBackdrop();

    this.app.renderer.on('resize', () => this.layout());
    this.layout();

    configureAudio(this.settings);
    window.addEventListener('keydown', (e) => {
      // Kelime penceresinde yazarken kısayollar çalışmasın.
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'f' || e.key === 'F') this.toggleFullscreen();
      else this.scene?.onKey?.(e);
    });
  }

  private drawBackdrop() {
    // Çalışma kağıtlarındaki gibi hafif yıldızlar.
    const g = this.backdrop;
    const colors = [0xf3d9a4, 0xf2c4d8, 0xc9e4c5];
    for (let i = 0; i < 40; i++) {
      const x = (i * 397) % W;
      const y = (i * 241 + 60) % H;
      g.star(x, y, 5, 12 + (i % 3) * 5, 6).fill({ color: colors[i % 3], alpha: 0.55 });
    }
  }

  private layout() {
    const { width, height } = this.app.screen;
    const s = Math.min(width / W, height / H);
    this.root.scale.set(s);
    this.root.position.set((width - W * s) / 2, (height - H * s) / 2);
    setTextResolution(this.app.renderer.resolution * Math.max(1, s), this.root);
  }

  go(make: (game: Game) => Scene) {
    this.scene?.destroy();
    this.scene?.view.destroy({ children: true });
    this.scene = make(this);
    this.root.addChild(this.scene.view);
    this.layout();
  }

  save() {
    saveSettings(this.settings);
    configureAudio(this.settings);
  }

  toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  }
}
