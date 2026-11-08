# Hece Birleştir

1. sınıf ilk okuma-yazma için akıllı tahta oyunu (PixiJS). Öğrenciler karışık heceleri
sürükleyip (ya da dokunup) sırayla yerleştirerek kelime kurar.

Kelimeler, ses gruplarına göre aşamalı "Hece ve Kelime Tablosu" çalışma kağıtlarından
alınmıştır (`src/data/tables.ts`). Her tabloda yalnızca o ana kadar öğrenilmiş harflerle
yazılan kelimeler kullanılır; heceleme `src/data/syllabify.ts` içinde otomatik yapılır.

## Nasıl oynanır

- **Öğretmen ekranı (menü):** Başlıksız iki kart vardır; ikisindeki seçimler aynı havuzda karışır:
  - **Sol kart, harf tabloları:** Bir ya da birden çok tablo seçilir; farklı ses gruplarından
    karışık seçilebilir. Satır başındaki "1. Ses Grubu" gibi grup düğmeleri gruptaki tüm tabloları birden seçer
    (hepsi seçiliyse kaldırır); grubun hepsi seçiliyken düğme dolu görünür. Hiç tablo seçilmezse
    yalnız öğretmenin kelimeleri oynanır.
  - **Sağ kart, öğretmenin kelimeleri:** Öğretmen kendi kelimelerini ekler; heceler kendiliğinden ayrılır,
    istenirse tireyle elle verilir (`kap-lum-ba-ğa`). Kelimeler kayıtlı kalır; listeden oyunda
    çıkacak olanlar işaretlenir, istenmeyenler silinir.

  Altta fazladan hece, hedef kelime, hece rengi (Renkli / Tek renk) ve **Ses** (Açık / Okuma kapalı / Sessiz) ayarları vardır.
  Ses açıkken "Okuyan ses" satırından tarayıcıdaki Türkçe sesler denenip değiştirilebilir.
- **Çocuk ekranı:** Gökyüzünde boş bulutlar, çimenlerin üstünde heceler. Kelime bitince çıkan ✓ dışında düğme yoktur.
  Heceler sürüklenerek (ya da dokunularak) sırayla bulutlara konur. Kelime tamamlanınca
  heceler tek bulutta birleşir, gökkuşağı çıkar ve kelime okunur; gökkuşağından sonra altta yeşil ✓
  çıkar, çocuk okuyup ✓'e basınca sonraki kelimeye geçilir. Tur bitince "Aferin!" ve yeniden oyna (✓) düğmesi gelir.
- Kelime başta sesli okunur; boş bir buluta dokunmak kelimeyi yeniden okutur.
  "Hedef kelime: Bulutta soluk" seçilirse heceler bulutların içinde soluk yazılı görünür.
- Menüye dönmek için sağ üstteki soluk çarka **basılı tutun** (çocuklar yanlışlıkla açmasın diye).

### Cümle Okuyorum

Menünün üstündeki **Cümle Okuyorum** sekmesinden açılır. Ekranda büyük bir akvaryum ve renk renk
balıklar vardır. Hangi balığa dokunulursa dokunulsun havuzdan **yeni bir cümle** büyük yazıyla çıkar;
çocuk okuyup ✓'e basar. Havuzdaki cümleler bitene kadar hiçbiri tekrar gelmez, bitince "Aferin!" gelir.
Ses açıksa hoparlör düğmesi cümleyi, cümledeki bir kelimeye dokunmak o kelimeyi okur.

Menüde başlıksız iki kart vardır; ikisindeki seçimler aynı havuzda karışır:

- **Sol kart, hazır cümleler** (`src/data/sentences.ts`): iki grup düğmesi, **ANETİL** (40 cümle) ve **OKURIM**
  (2. ses grubu fişleri O, K, U, R, I, M; 48 cümle). Biri, ikisi ya da hiçbiri seçilebilir; altında seçili
  cümlelerin hepsi listelenir (liste parmakla/fareyle sürüklenerek ya da tekerlekle kaydırılır). Harf tablosu seçiminden bağımsızdır.
- **Sağ kart, öğretmenin cümleleri:** "Cümle Yaz / Seç / Düzenle" ile her satıra bir cümle yazılır; kayıtlı
  kalır, listeden oyunda çıkacak olanlar işaretlenir. Seçili cümlelerin hepsi kartta kaydırılabilir listede görünür.
- Akvaryumdaki balık sayısı 4, 6 ya da 8 seçilebilir.

### Heceleri Bul (deneme)

Menünün üstündeki **Heceleri Bul** sekmesinden açılır. Harf tabloları ve "Benim kelimelerim" Hece Birleştir ile
aynıdır, ama bu bölümde büyük harf hiç görünmez (tablo düğmeleri küçük harfle yazılır) ve özel isim seçeneği
yoktur: yalnız iki heceli, özel isim olmayan kelimeler kullanılır. **Tahta** ayarı 2×2 ya da 4×4'tür (sayfa her açıldığında 2×2 başlar);
yeşil ▶ düğmesi bu ekranda açar, **Adres Ver** paylaşır. Kelime yetmezse tekrar eder.

Tahtada karışık heceler vardır. Çocuk iki bloğun yerini değiştirir (sürükleyerek ya da sırayla iki bloğa dokunarak).
Aynı satırda yan yana gelen iki hece kelime olunca bloklar birleşir, renklenir ve yerinde sabit kalır. Yalnız tahtaya
konan kelimeler değil, seçili tablolara kadar okunabilen her iki heceli kelime kabul edilir. Bu yüzden kalan heceler
kelimesiz kalabilir (ör. tahtada "nene" ve "tatil" varken "tane" kurulursa geriye "ne", "til" kalır); o zaman en az hece
dönerek değişir ("til" → "ne") ve tahta yine bitirilebilir. Kelimeler soldan sağa okunduğu için yalnız satır içinde kurulur; bu yüzden tahta hep çifttir ve her satır tam
kelimelere bölünür. Ortada kurulan bir kelime satırı tıkayacaksa (4'lük satırda 2-3. sütunlar gibi) blok kenara kayar. Oyun tahta tamamen
dolunca biter.

Oyun gökyüzünde geçer; tahtanın zemini yoktur. Heceler mavi kenarlı beyaz balonlardır; kelime kurulunca iki balon su damlası gibi birbirine akıp
şeker gibi uzun, parlak tek bir balon olur ve jöle gibi sallanır. Kelime balonları sırayla gökkuşağının renklerini
alır. Oyun bitince tahta görünür kalır (küçülüp ortalanır), arkasında büyük gökkuşağı çizilirken kelime balonlarının
çevresinde beyaz kenar belirir, ardından altta yeniden oyna (✓) düğmesi çıkar. "Aferin!" yazısı çıkmaz.

### Adres Ver (paylaşılan oyun)

Her bölümdeki yeşil ▶ / "Akvaryum" düğmesinin yanındaki **Adres Ver**, o anki bölümün ayarlarını ve öğretmenin
işaretli kelime/cümlelerini tek bir adrese gömer: `play.html?data=…` (veri, URL'ye uygun base64'te JSON).
Adresi açan kişi öğretmen menüsünü görmeden, büyük "Hadi Oynayalım!" düğmesine dokunarak doğrudan o oyunu oynar; çark ve
Esc menüye götürmez. Bu sayfa hiçbir şey kaydetmez (öğretmenin tarayıcısındaki kayıtlar etkilenmez).
Okuma sesi cihaza özel olduğu için adrese girmez; açılan cihazdaki en iyi Türkçe ses kullanılır.

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
