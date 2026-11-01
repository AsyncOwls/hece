# Hece Birleştir

1. sınıf ilk okuma-yazma için akıllı tahta oyunu (PixiJS). Öğrenciler karışık heceleri
sürükleyip (ya da dokunup) sırayla yerleştirerek kelime kurar.

Kelimeler, ses gruplarına göre aşamalı "Hece ve Kelime Tablosu" çalışma kağıtlarından
alınmıştır (`src/data/tables.ts`). Her tabloda yalnızca o ana kadar öğrenilmiş harflerle
yazılan kelimeler kullanılır; heceleme `src/data/syllabify.ts` içinde otomatik yapılır.

## Nasıl oynanır

- **Öğretmen ekranı (menü):** İki kelime kaynağı var, ikisi ayrı ayrı açılıp kapanır:
  - **Harf tablosu kelimeleri:** Bir ya da birden çok tablo seçilir; farklı ses gruplarından
    karışık seçilebilir. Grup adına dokunmak gruptaki tüm tabloları seçer (hepsi seçiliyse kaldırır).
  - **Benim kelimelerim:** Öğretmen kendi kelimelerini yazar; heceler kendiliğinden ayrılır,
    istenirse tireyle elle verilir (`kap-lum-ba-ğa`). Yalnız bu kart açıksa oyun yalnızca bu
    kelimelerle, ikisi açıksa karışık oynanır.

  Altta fazladan hece, hedef kelime, hece rengi (Renkli / Tek renk) ve **Ses** (Açık / Okuma kapalı / Sessiz) ayarları vardır.
  Ses açıkken "Okuyan ses" satırından tarayıcıdaki Türkçe sesler denenip değiştirilebilir.
- **Çocuk ekranı:** Gökyüzünde boş bulutlar, çimenlerin üstünde heceler. Başka düğme yoktur.
  Heceler sürüklenerek (ya da dokunularak) sırayla bulutlara konur. Kelime tamamlanınca
  heceler tek bulutta birleşir, gökkuşağı çıkar ve kelime okunur; oyun kendiliğinden sonraki
  kelimeye geçer. Tur bitince "Aferin!" ve yeniden oyna (▶) düğmesi gelir.
- Kelime başta sesli okunur; boş bir buluta dokunmak kelimeyi yeniden okutur.
  "Hedef kelime: Bulutta soluk" seçilirse heceler bulutların içinde soluk yazılı görünür.
- Menüye dönmek için sağ üstteki soluk çarka **basılı tutun** (çocuklar yanlışlıkla açmasın diye).

### Cümle Okuyorum

Menünün üstündeki **Cümle Okuyorum** sekmesinden açılır. İki sayfa vardır:

- **Akvaryum:** Renk renk balıklar yüzer.
- **Kediler:** Bir ev ve bahçe resmi; kediler bacada, pencerelerde, duvarda, ağaç dalında ve kutuda oturur.

Bir balığa ya da kediye dokununca ayrı bir cümle büyük yazıyla çıkar. Çocuk okuyup ✓'e basar,
o hayvanın üstünde yıldız belirir; hepsi okununca "Aferin!" gelir. Ses açıksa hoparlör düğmesi
cümleyi, cümledeki bir kelimeye dokunmak o kelimeyi okur.

- **Hazır cümleler:** Seçili tablolara kadar öğrenilen harflerle okunabilen cümleler (`src/data/sentences.ts`;
  her cümle harflerine göre kendiliğinden doğru tabloya yerleşir). Önce seçili tablolarla okunabilir hale
  gelen cümleler gelir.
- **Benim cümlelerim:** Öğretmen her satıra bir cümle yazar; bunlar her zaman önce gelir.
- Ekrandaki balık/kedi sayısı 4, 6 ya da 8 seçilebilir.

Okuma kalitesi tarayıcının Türkçe sesine bağlıdır. En doğal sesler: Microsoft Edge'de
"Emel Online (Natural)", macOS'ta Sistem Ayarları → Erişilebilirlik → Seslendirilen İçerik
bölümünden indirilen "Yelda (Gelişmiş/Premium)". Oyun bu sesleri varsa kendiliğinden seçer.

Klavye (öğretmen için): `Boşluk` / `Enter` kelimeyi yeniden oku / sonraki, `F` tam ekran, `Esc` menü.

## Geliştirme

```sh
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # dist/ (font dahil, internet gerekmez; bir web sunucusundan açılmalı)
```
