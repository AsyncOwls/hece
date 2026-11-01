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
  - **Benim kelimelerim:** Öğretmen kendi kelimelerini ekler; heceler kendiliğinden ayrılır,
    istenirse tireyle elle verilir (`kap-lum-ba-ğa`). Kelimeler kayıtlı kalır; listeden oyunda
    çıkacak olanlar işaretlenir, istenmeyenler silinir. Yalnız bu kart açıksa oyun yalnızca işaretli
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

Menünün üstündeki **Cümle Okuyorum** sekmesinden açılır. Ekranda büyük bir akvaryum ve renk renk
balıklar vardır. Hangi balığa dokunulursa dokunulsun havuzdan **yeni bir cümle** büyük yazıyla çıkar;
çocuk okuyup ✓'e basar. Havuzdaki cümleler bitene kadar hiçbiri tekrar gelmez, bitince "Aferin!" gelir.
Ses açıksa hoparlör düğmesi cümleyi, cümledeki bir kelimeye dokunmak o kelimeyi okur.

- **Hazır cümleler:** Öğretmenin verdiği fişlerdeki cümleler (şu an ANETİL fişi, 40 cümle;
  `src/data/sentences.ts`). Harf tablosu seçiminden bağımsızdır.
- **Benim cümlelerim:** Öğretmen her satıra bir cümle yazarak ekler. Cümleler kayıtlı kalır; listeden
  oyunda çıkacak olanlar işaretlenir, istenmeyenler silinir. İkisi de açıksa işaretliler hazır cümlelerle
  aynı havuzda karışır.
- Akvaryumdaki balık sayısı 4, 6 ya da 8 seçilebilir.

Öğretmenin kelime ve cümleleri tarayıcıda saklanır (aynı bilgisayar ve tarayıcıda kalıcıdır).

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
