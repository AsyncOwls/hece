import { defineConfig } from 'vite';

export default defineConfig({
  // Göreli yollar: build çıktısı bir klasörden / USB'den açılabilsin.
  base: './',
  build: {
    rollupOptions: {
      // Öğretmen sayfası ve paylaşılan oyun sayfası (play.html?data=…).
      input: { main: 'index.html', play: 'play.html' },
    },
  },
});
