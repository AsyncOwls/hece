# Hece Birleştir

1. sınıf ilk okuma-yazma için akıllı tahta oyunu (PixiJS). Öğrenciler karışık heceleri
sürükleyip (ya da dokunup) sırayla yerleştirerek kelime kurar.

Kelimeler, ses gruplarına göre aşamalı "Hece ve Kelime Tablosu" çalışma kağıtlarından
alınmıştır (`src/data/tables.ts`). Her tabloda yalnızca o ana kadar öğrenilmiş harflerle
yazılan kelimeler kullanılır; heceleme `src/data/syllabify.ts` içinde otomatik yapılır.

## Nasıl oynanır

- **Öğretmen ekranı (menü):** Ses grubu, harf tablosu ve seçenekler burada seçilir, sonra **Oyunu Başlat**.
- **Çocuk ekranı:** Gökyüzünde boş bulutlar, çimenlerin üstünde heceler. Başka düğme yoktur.
  Heceler sürüklenerek (ya da dokunularak) sırayla bulutlara konur. Kelime tamamlanınca
  heceler tek bulutta birleşir, gökkuşağı çıkar ve kelime okunur; oyun kendiliğinden sonraki
  kelimeye geçer. Tur bitince "Aferin!" ve yeniden oyna (▶) düğmesi gelir.
- Kelime başta sesli okunur; boş bir buluta dokunmak kelimeyi yeniden okutur.
  "Hedef kelime: Bulutta soluk" seçilirse heceler bulutların içinde soluk yazılı görünür.
- Menüye dönmek için sağ üstteki soluk çarka **basılı tutun** (çocuklar yanlışlıkla açmasın diye).

Klavye (öğretmen için): `Boşluk` / `Enter` kelimeyi yeniden oku / sonraki, `F` tam ekran, `Esc` menü.

## Geliştirme

```sh
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/ (font dahil, internet gerekmez; bir web sunucusundan açılmalı)
```
