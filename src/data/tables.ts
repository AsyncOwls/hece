/**
 * "İlk Okuma ve Yazma – Hece ve Kelime Tablosu" çalışma kağıtlarından
 * (mehmetogretmen.com) aktarılan ses grupları ve harf tabloları.
 *
 * Her tabloda o harfle birlikte öğrenilmiş harflerle okunabilen hece ve
 * kelimeler bulunur. Tek heceli girdiler (an, ta, kol…) burada da duruyor;
 * oyun yalnızca en az iki heceli kelimeleri kullanır.
 */

export interface RawTable {
  /** Tabloyla birlikte öğretilen yeni harf(ler), küçük harfle. */
  letters: string[];
  /** Ekranda gösterilecek etiket. */
  label: string;
  /** Boşlukla ayrılmış hece ve kelimeler. */
  words: string;
}

export interface RawGroup {
  name: string;
  tables: RawTable[];
}

export const GROUPS: RawGroup[] = [
  {
    name: '1. Ses Grubu',
    tables: [
      {
        letters: ['a', 'n', 'e', 't', 'i'],
        label: 'A N E T İ',
        words: `an en in at et it na ne ni ta te ti nin nit tin tit tat ant ten Tan Ata
          net ana nene nane anne tane anten tente ani ait inat etti itti nine itina`,
      },
      {
        letters: ['l'],
        label: 'L',
        words: `al el il la le li lat let Ela Nil Ali Lale Nail İnan İnal Talat nal tel
          ile etli alet atlet tatil elli aile taneli telli laleli naneli antenli aletli tenteli`,
      },
    ],
  },
  {
    name: '2. Ses Grubu',
    tables: [
      {
        letters: ['o'],
        label: 'O',
        words: `on ot ol no to lo na nat Onat te tel otel nota ta olta la lan olan ton
          tonton alo oteli otelin otla ona`,
      },
      {
        letters: ['k'],
        label: 'K',
        words: `ak ek ik ok ka ke ki ko kal kel kil kol kat ket kit kot kek iki kan ken
          kekik keklik Okan toka İlke Kaan kalk kantin inek Ekin otlak otlakta
          kano kilo koli koala ikili tilki ilkeli etiket nokta konak kitli kitle kanat
          kale ekti ektik etkin etkinlik kellik kokla tokan kolile konakta otlaktan
          kilit kilitli kilitle etiketli etiketle kalite kaliteli annelik`,
      },
      {
        letters: ['u'],
        label: 'U',
        words: `un ut ul uk nu tu lu ku kul kut tut lut kuk luk lak oku okul Utku kutu
          kule kulak koku konuk kutlu kutla kukla koltuk kullan kokulu kuleli tutuklu okullu`,
      },
      {
        letters: ['r'],
        label: 'R',
        words: `ar er ir or ur ra re ri ro ru rak rek rik rok ruk kar ker kir kor iri
          roka lira kara tere tarak nar erik Rana Nur Eren Onur Lara Taner Nurten Ural
          Erol terlik renk terli onar
          anar kork korku korkak korkar korkulu korkuluk kurt kurtlar kart kartal kirli
          arka kira okur tur turla turlar raket roket kural kurallar tarla tarlalar kuru
          karne karneler teker tekerler tekerlek torun turta kitler katlar kutlar takar
          kurut kurutur ellerin terlikler`,
      },
      {
        letters: ['ı'],
        label: 'I',
        words: `ın ıt ıl ık ır nı tı lı kı rı tır tıl rık tık kıl tın lın lık lır kır
          tırtıl anı arı Anıl Tarık Itır Akın atkı taktı altın atlı tatlı tattı tanı
          tanıt tanık katıl katır kırık kırk
          takı ılık akıl akıllı kalır kalırlar kıta kalın kalınlık katı atık atıklar
          kına kınalar katkı katkılı katkılar karın tırnak tırnaklı kılık alır alırlar
          anlatır karanlık tokalı kiralık kınalı`,
      },
      {
        letters: ['m'],
        label: 'M',
        words: `em im om um ım ma me mi mo mu mı lem kalem mut armut mum kim minik elma
          Mete mek ekmek Kemal Mine Meltem marul Emine Metin limon Mert lokum kemik
          Meral Kamil Melek Emel Kerem Temel Melike Irmak mutlu tulum nemli
          manken maket Alman martı mama imam ikram mermer emek merak millet tamam konum
          emir omlet market takım mimar rakam reklam Emin Umut mantı mantık mamut motor
          mola mart kimlik tutum keman kilim ekim komutan makine kalemlik makarna
          mineral koruma karamel makara meraklı kelime minare`,
      },
    ],
  },
  {
    name: '3. Ses Grubu',
    tables: [
      {
        letters: ['ü'],
        label: 'Ü',
        words: `ün üt ül ük ür üm nü tü lü kü rü mü kül kür tüm tür tül tüllü tüller ütü
          ütüle ütülü ütüler ütüleme ünlü küllü küller ünlem kütük kütükte kütükten
          kütükler ülke ülkem ülken ülkeler kürek kürekli kürekle kürekler küme kümeli
          kümeler menü menüler tünel tüneli tünele
          küre küreli küreler lüle lüleli Türk Türkler kürk kürklü kürkler kütlet
          kütletti ürk ürkek ürküt ürktü ürktün ürktüm ürküttü ürkütme ürkütür Tümer
          Tülin Ümit Ünal Ülkü Ümran Atatürk ümitli ümitlen kültür kültürlü kültürle
          kültürlen kültürler ülkülü ülkemi ülkeni ülkene ülkeme tüketim tüketti ünite
          mükemmel`,
      },
      {
        letters: ['s'],
        label: 'S',
        words: `as es ıs is os us üs sa se sı si so su sü Sara Sare Sena Senem Seda
          Salim Selim Sinem Sinan Esin Asım Kasım Suna Suat Aslı Esma Sıla Sultan asa
          kas askı tasma aslan asker asma asmak makas askılık kaslı asar aseton asır
          astar astı astın astım
          kes eski eskir eskiler kestane testere ısı ısır ıslak ıskalar kis risk riskli
          isim misket iskele iskelet İslam ister isteme İsmet uslu usta susam küs üst
          üstte üstten üstüne üstün üstlük ser ses sek sesli sene serin sera sert selam
          kese keser
          sat sar sarıl saat sarı arsa satar salı salon saman sakin sansar insan kasa
          tasa sana sarık sarkar santim masa masal salkım kask sarımsak salata
          salatalık salla sallar sallarım samanlık sarılır sakar sakarlık satılık sis
          sil sim simli simit sisli siler sinek sinema sitil asil
          sır sırt sık sıra sırık sıska sıktı sıktın sıktım sıkar sıktılar mısır
          mısırlar sırtın sırtına satsın taksın alsın sarsın satsınlar alsınlar
          taksınlar sarsınlar sor son sos sol soslu soru sorun sokak sorumlu
          sorumluluk sollar sür sürü sürer süt süslü sulu suluk musluk susamlı`,
      },
      {
        letters: ['ö'],
        label: 'Ö',
        words: `ön öt öl ök ör öm ös nö tö lö kö rö mö sö Ömer Önal Ömür Ökten Köksal
          Öner önlük önlüklü önemli önem öneri öttü öttür öter ötsün öteki öksür
          öksürük ört örtü örtülü örttü örttün örttüm örter örnek örnekler tören aktör
          kömür kömürlük kötü kötülük köklü monitör traktör`,
      },
      {
        letters: ['y'],
        label: 'Y',
        words: `ay ey ıy iy oy öy uy üy ya ye yı yi yo yö yu yü Ayla Aylin Yaman Yasin
          Yasemin Öykü Oya Oktay Kaya Leyla Koray Meyra Meryem kay kayar kayak kaykay
          kayık kaynak kaynar kamyon kamyonet koy köy köylü köylüler kolye koyun maymun
          leylek yelek ray soy soylu soylular
          say sayı sayılar sayarlar sayar sayarım sayarsın ayı tay niye neyi neyim
          yarım yarın yarınlar yat yattı yattım yattın yatar yatak yaka yalan yalın
          ayna oyna oynar oynarım oynarsın oynarlar oyun ayak ayaklı ayaklık ayaklar
          yıka yırt yak yakar yaktı yaktın yaktım yaktılar yakıyor uy uyar uyum uyumlu
          uyku uykulu yer yeri yerim yerler yersin yiyor yemek yemekler yeterli yor
          yorum yürü yürüt yürütür yürüttü yürüttüm yürüttün söyle söyler söylerim
          söylersin yurt tüy tüyler tüylü yok yokluk yoksul yoklar olay olaylı olaylar
          onay onayla onaylı onaylar yumurta Türkiye yarasa yılan yunus kuyu kolonya`,
      },
      {
        letters: ['d'],
        label: 'D',
        words: `ad ed ıd id od öd ud üd da de dı di do dö du dü Ada Arda Adem Aydın
          Adnan Adil Diyar Dilek Didem Dilara Serdar Eda Damla Doruk Derya Demir Kader
          Kadir dal dar dam adam dayı dana Adana oda darı soda radyo damar damat adres
          mandal onda ondan oradan
          daire adalet mandalina den der ders del des deste destek adet ördek dedi dede
          neden yedek minder desen mide deri derin demir maden dere rende lider kurdele
          din dik dil diken dikkat dikkatli kedi kendi direk dikmek mendil melodi midye
          dilek kandil kadın nadir yedi sendeki ondaki
          dol dos dost dolu doku dola doldu doktor dolma doydu doydum domates dön dök
          döktü döktüm döktün döker döner dört dut dur durmak duman duyu duydu duydum
          duydun duyar uydu uyudu uydur uydurma durak dudak duyuru ordu odun dokuma
          dondurma dün dür Dünya dünkü dükkan dürüm düdük ödül`,
      },
      {
        letters: ['z'],
        label: 'Z',
        words: `az ez ız iz oz öz uz üz za ze zı zi zo zö zu zü Arzu Azmi Azra Deniz
          İzzet Kazım Mirza Nazan Nazlı Nazım Ozan Özlem Remzi Rıza Sezai Suzan Yılmaz
          Zeki Zeren Zerrin Ziya Zümra Rize İzmir Denizli Erzurum Trabzon ayaz azar
          erzak ezan ikaz imza kaz kaza kazak
          kazan kazı kazma kızamık kiraz koza manzara naz olamaz saz tuzak uzak yaz
          yazar zam zaman zar zarar zalim sazlık yazarlık zamansız zeki zeka taze dize
          müze zemin zeytin teyze kuzen düzine ezel kuzey nezle düzen merkez mazeret
          düzenli düzeltti düzensiz lezzetli mayonez yazı tatsız
          kız razı tazı sakız yazık lazım yalnız kırmızı imkansız zil izin mazi ezik
          azim nazik sekiz müzik deniz emzik zindan titiz rezil terzi temiz telsiz
          renksiz dertsiz terazi analiz ziyaret dizili zor koz toz tozlu tozsuz zorlu
          dozer ozan mazot takoz sezon ıstakoz dinozor maydanoz azimli kazılı
          köz söz sözsüz sözlük tuz muz kuzu uzun uzuyor otuz omuz zurna uzman kurnaz
          tuzluk temmuz sonsuz sonsuzluk mutsuz uzay uzaylı domuz mezun dokuz zulüm
          uzmanlık uzunluk düz yüz üzüm öküz yüzük düzlük ütüsüz üzüntü üzümlü üzmek
          üzerinde uykusuz mandalsız dikkatsiz desteksiz ödülsüz uyumsuz yalansız tüysüz`,
      },
    ],
  },
  {
    name: '4. Ses Grubu',
    tables: [
      {
        letters: ['ç'],
        label: 'Ç',
        words: `aç eç ıç iç oç öç uç üç ça çe çı çi ço çö çu çü açma açmak açtı açlık
          açı amaç kaç kaçak maç saç saçma salça sütlaç taç uçak ilaç çadır çakal çakı
          çakıl çakmak çalım çalı çan çam çamlık çamur çanta çare çaresiz çarık çatal
          çatı çay çayır çayırlık akçe çek çekil çekim çekirdek çekyat çekiç çelimsiz
          çelik çene çenesiz çerez
          çeyiz çeyrek içeri kemençe kokoreç kraliçe reçel reçete seç seçenek seçim
          seçkin seçmek seçtim serçe çık açık alçı çıkar çıkardı çınar çıra çırak çıta
          inatçı kaçık kaçınmak kaçın sıçramak tarçın dinç elçi içi için içlik içmek
          içten keçi kireç niçin çiçek çiçekçi çil çile çilek çim çimen çimento çini
          çirkin çita çikolata çitle çitlemek çiz çizer çizik çizim çizme çizmek
          çök çöl çömlek çörek çöz çözmek çözüm çok çorak çolak çokluk çoktan ayraç
          inanç korkunç okçu oruç sonuç suç suçlu uçmak uçsuz uçurum uçurtma utanç
          çulluk çukur çürük çürümek çünkü küçük külçe ölçü ödünç sütçü üç üçer Açelya
          Ayça Aytaç Çetin Çınar Çorum Elçin Erdinç Kıraç Meriç Miraç Orçun Seçkin Seçil
          Selçuk Tunç Türkçe Yalçın`,
      },
      {
        letters: ['b'],
        label: 'B',
        words: `ab eb ıb ib ob öb ub üb ba be bı bi bo bö bu bü abi abla baba akbaba
          akraba araba badem badana bak bakan bakım bakar bakır bakkal bal balık balkon
          balon balta baldır balo bale balerin bamya bana bando bank banka bant baraka
          barbunya bardak bas baret basamak basket basketbol baskı baskül basit baston
          batı bateri bay bayan bayat bayılmak bayrak bayram baza bazen banyo çaba
          çoban çorba ebat kaba kabak kaban kalabalık kablo kasaba kibar kurban lamba
          oba sabun soba tabak taban tablet tablo torba bebek beden
          bekçi bekle bekler bekar bel belli belki ben benek benekli bere berber
          beraber berrak besin beslenme beter bey beyin bez biber biberon beton ebe
          kelebek kulübe körebe leblebi nöbet rütbe sebze sobe sobele tebrik tembel
          zebra sabır bırak bıraktı bıçak abide biblo bidon biçer bile bilek bilet
          bilim bilinç bilye bin bina biner binlik bir biri birden biraz birisi birlik
          birlikte bisiklet bilardo bitki bitti ibre ibrik elbise kibrit labirent
          mobilya sabit tabi tombik bizim kabin abone bodrum boksör bol bone boru bot
          boy boya boyar boyama boyun boz boza
          bozuk bordo kobra robot sembol böl bölme bölük börek böbrek böyle öbür
          bulanık bulantı bulut burası burktu burs but butik buton buz buzluk bukle
          çabuk kabuk kabul kabus kambur tabure tombul buzdolabı sabunluk kurabiye
          Balıkesir büst büro bütün bütünlük büyük büyüklük dürbün bülbül otobüs albüm
          minibüs Aybüke Bade Banu Basri Bedir Bekir Berat Beril Berkan Berna Berra
          Berrin Betül Birol Bora Buket Bülent Burak Burçak Burçin Buse Ebru Kübra Sabri
          Berke Bodrum Batman Bartın Bursa Bitlis Bolu İstanbul`,
      },
      {
        letters: ['g'],
        label: 'G',
        words: `ag eg ıg ig og ög ug üg ga ge gı gi go gö gu gü gak gaga dalga gar
          garson galiba gargara gaz gazi gazete gazoz ızgara karga kırılgan omurga
          mangal organ otogar rüzgar utangaç yorgan gayret bölge çekirge çengel denge
          engel ergen gel gelin gelinlik genç geç geçit gerçek gerçeklik gergedan
          gergin gez gezi gezgin geyik gemi sünger üçgen yenge yüzgeç geriye aygıt
          çalgı dalgıç dargın gıda kaygı kızgın sargı saygı kırgın bilgi bilgin
          çizgili dergi gibi gider git gir gitmek gitar giy giyim giysi giz gizli
          gizemli ilginç
          sergi silgi zengin gol goril kargo mango açgözlü göbek gök gökyüzü göl gölet
          gölge göm gömlek göç göçtü görgü göz gözlük gözlüklü gözleme örgü bulgu
          bulgur solgun olgun uygun dolgu dolgun gurur gururlu kanguru yorgun bugün
          düzgün gübre güç güçlü güçsüz gül gülmek gülümse gümrük gün güney günaydın
          gür güz güzel güzellik üzgün Begüm Bengü Bilge Bilgin Ege Ergin Gamze Gaye
          Giray Gizem Gökçe Gökçen Gönül Görkem Gözde Güler Güllü Güzin Müge Nilgün Özge
          Özgür Sezgin Simge Songül Tolga Tugay Bingöl Giresun Yozgat`,
      },
      {
        letters: ['c'],
        label: 'C',
        words: `ac ec ıc ic oc öc uc üc ca ce cı ci co cö cu cü acı amca acaba açacak
          alacak atmaca baca bacak cadde cadı cacık cam cambaz cami can cani canım
          cansız icat karınca koca kucak mercan ocak oyuncak rica salıncak seccade
          sıcak solucan tüccar yonca acele acemi beceri bilmece böcek ceket cennet
          cesur ceylan ceza cezalı çekmece eczane gece görümce güncel içecek ince
          incelik macera örümcek önce önceki öncelik tencere tümce yüce akıncı çaycı
          cılız cımbız kiracı sıkıcı yazıcı kazıcı acımak acıdı sancı acil bencil
          birinci cici ciddi
          ciklet cilt cila cilalı cins cimri cimcime cisim cirit eskici inci incir izci
          kaleci mercimek minicik mucit mucize tacir tamirci ormancı boncuk çocuk cuma
          korucu macun oduncu oyuncu sucuk sunucu turuncu ucuz ucuzluk uykucu yolcu
          cumartesi bücür cüce cücük cüzdan cümle golcü öncü sözcü sözcük ücra ücret
          üzücü Burcu Can Canan Caner Cansu Celil Cem Cemil Cemile Cemre Cengiz Cenk
          Cennet Ceren Ceyda Ceylan Ceylin Cezmi Cüneyt Dicle Ece Ecem Ecrin Gonca
          Necmettin Olcay Yonca Bilecik Düzce Erzincan Kocaeli Tunceli`,
      },
      {
        letters: ['ş'],
        label: 'Ş',
        words: `aş eş ış iş oş öş uş üş şa şe şı şi şo şö şu şü baş kaş şal şan şaş
          taş aşçı marş maşa şair şaka şato şart uşak yaşa akşam başak başka kumaş
          kuşak nişan şanlı şarkı taşlı tıraş yaşam yaşlı başarı başkan dışarı işaret
          meşale şalgam başkent şanslı şaşkın yoldaş nişasta yaşamak arkadaş yumuşak
          çarşamba şaşırmak araştırma başlangıç beş şey ateş eşek eşya gişe köşe meşe
          neşe çeşme eşsiz güneş güreş keşke şeker şekil şerit kardeş meşgul neşeli
          şelale şenlik şerbet şimşek menekşe menteşe şemsiye aşı dış kış
          şık alış satış aşık ışık alkış aşırı barış çarşı çıkış karış kaşık kayış
          nakış tanış taşıt yarış açılış alışık altmış kışlık ulaşım yanlış bulaşık
          karışık şımarık şırınga çalışkan sarmaşık yanlışlık kuşbaşı diş şiş ekşi
          eşik eşit işçi işte şiir şişe beşik bitiş dikiş dişçi geniş giriş işlem
          şimdi şirin yemiş yeşil enişte erişte geçmiş ilişki şirket şişkin şişman
          şişmek yetmiş bitişik diriliş eşitlik işitmek şikayet tebeşir birleşik
          iletişim titreşim koş loş şok koşu şort komşu koşmak koşucu konuşmak köşk
          şömine şöyle coşku duş kuş Muş şut tuş aşure baykuş
          boşuna buluşma dolmuş konuş kurşun kurtuluş kuruş kuşku oluş şubat şurada
          turşu yokuş üşü düş şükür gülüş gülüşmek üşümek düşman şükran müşteri
          teşekkür gümüş Ayşe Ayşen Barış Başak Büşra Coşkun Gülşen Şadiye Şakir Şamil
          Şebnem Şenay Şener Şermin Şeyma Şule Şükran Ulaş Yaşar Yeşim düştü düştüm
          düştün düşüyor yaş yaşar yaşıyor yaşıyorum yaşıyorsun yaşıyoruz yaşıyorlar`,
      },
    ],
  },
  {
    name: '5. Ses Grubu',
    tables: [
      {
        letters: ['p'],
        label: 'P',
        words: `ap ep ıp ip op öp up üp pa pe pı pi po pö pu pü kap pak pas pat pay sap
          yap etap kalp kamp kupa paça pala pano para park pati plan sıpa sopa çorap
          dolap ispat kasap kebap kitap kopar paket palet palto pamuk panik parça parke
          parti pasta paten patik pazar pikap şapka topaç çarpma kapalı kaplan kaptan
          ketçap papyon parlak parmak paspas pastel patron yaprak palmiye palyaço
          papatya paraşüt patates yelpaze koparmak pantolon patlıcan pazartesi cep kep
          pek per pes sep tep ipek küpe peki tepe
          akrep kepçe köpek pedal pembe perde peron peruk peşin petek pipet prens salep
          sebep sepet süper tepki tepsi deprem küpeli pekmez pergel petrol peynir
          kelepçe pencere penguen perişan serpmek perşembe pelikan zımpara tıp zıp kapı
          kırp yapı çarpı kalıp kayıp zıpla çarpım çıplak pırasa kıpırtı yapışık
          kapışmak yapışmak postacı pil pim dip pis tip ekip grip ipli klip pide pike
          pist tipi galip iptal kirpi pilot piriz pişir pizza rakip takip kirpik kumpir
          piknik pirinç pislik pişman piyano pratik sincap spiker terapi diploma
          pirzola pişirmek inkılap kop pot poz top
          depo pota spor koptu kupon polar polis posta poşet tempo topla toplu topuk
          mikrop ponpon poster toprak toplum popüler toplama porselen portakal
          toplamak çöp löp köprü çöpçü çöplük pırlanta kup pul pus put puan tapu turp
          pullu ampul kopuk kutup pudra karpuz mektup puding kulp kulplu tüp küp püre
          tüpçü kulüp süpürge püskül köpük Alp Alper Alperen İpek Sarp Necip Pelin
          Pınar Polat Pusat Serap Yakup Poyraz Serpil Sertap Toprak Zeynep`,
      },
      {
        letters: ['h'],
        label: 'H',
        words: `ah eh ıh ih oh öh uh üh ha he hı hi ho hö hu hü hal hak ham han hap has
          hat şah dahi hala halı halk hata saha taht bahar bahçe buhar hakem hakim
          haklı halat halay halka hamak hamam hamle hamsi hangi hapis haram hasat hasır
          hasta hatır hayat hayır hazır kahya rahat sabah sahan siyah tahin tahta
          bahane hademe hadsiz halsiz hançer hardal harita hasret haşere haydut hazine
          lahana pahalı şahane tahmin tezgah timsah zahmet ahtapot anahtar hastane
          haziran kahkaha mahalle sabahçı hareket muhabir halsizlik hastalık siyahlık
          hem hep her hece ahenk hekim helal helke henüz hepsi hesap sehpa şüphe hediye
          heykel herkes hemşire heyecan tehlike helallik mühendis helikopter ahır hırs
          hırka hızlı kahır tahıl hırsız ıhlamur hiç his hile sahi ahize hilal hindi
          hisar ihmal kahin nehir sahil sahip şahin şehir tarih zehir zihin hikaye
          hizmet müthiş sürahi tesbih sahiden hop hobi hoca hopla horoz horlar hortum
          hostes sohbet horultu homurtu şöhret köhne huy huni humus hurda hurma huzur
          nohut tohum huysuz meşhur muhtaç muhtar cumhur cumhuriyet hür hük tüh hücum
          hüzün hüsran hüküm hürriyet hükmetmek
          Ahu Nuh Hale Ruhi Ahmet Allah Hacer Hakan Halil Haluk Hande Harun Hasan Hilal
          Hilmi Hülya Hüsnü İhsan İlhan Mahir Tahir Talha Mahmut Mehmet Mehtap Serhat
          Hüseyin Abdullah Hayrettin Hasret`,
      },
      {
        letters: ['v'],
        label: 'V',
        words: `av ev ıv iv ov öv uv üv va ve vı vi vo vö vu vü lav ova vah var vay avcı
          avlu ayva hava kova havlu oval tava vadi vali vana vazo yuva cevap çuval
          devam divan duvar helva kavurucu kavak kavga kıvam kovan manav miyav pilav
          prova sınav şınav tavla vagon vahşi vakit valiz varış varil vapur vatan eyvah
          bedava cıvata hayvan lavabo tavşan vasıta kavanoz tavsiye tuvalet kahvaltı
          pehlivan vatandaşlık yuvarlak yuvarlar Avrupa bulvar dev sev ver deve evet
          evli ödev şive veda veli zevk cezve çevre
          evcil evlat evrak görev güveç güven ilave kahve küvet levha meyve sevgi vergi
          vezir vezne zirve devrik elveda kevgir kuvvet mevcut mevsim vesika vesile
          eldiven vekalet verimli güvercin lacivert vestiyer veteriner vır vız sıvı
          kıvır tavır kıvrık vızıltı kıvranmak civ çivi kivi mavi vida vinç vize avize
          ceviz çevik kavim villa vişne vites civciv tedavi vicdan virgül vitrin
          vitamin kov vokal kovboy valide övgü övün övme gövde voleybol vur avuç davul
          havuç havuz kavun tavuk avukat kılavuz randevu kavurma vidalı kavgalı
          vesikalık kahveci kahvehane kuvvetli verimsiz vücut çevreci görevli çeviklik
          Evrim Elvan Evran Alev Mevlüt Neval Sevil Sevim Sevinç Şevval Yavuz Avni Evren
          Levent Nevzat Rıdvan Savaş Vildan Vehbi Veysel Vedat Vural Veli Velit Volkan
          Vahit Pervin Merve`,
      },
      {
        letters: ['ğ'],
        label: 'Ğ',
        words: `ağ eğ ığ iğ oğ öğ uğ üğ ağa bağ çağ dağ sağ yağ ağaç ağla ağrı boğa doğa
          bağla bağlı boğaz doğan doğar doğal soğan yağdı yağla yağlı yağan ağabey
          bağcık çağdaş dağlık mağara mağaza mağdur poğaça sağdık sağlam sağlık yağmur
          ağlamak armağan kurbağa papağan sağanak yanardağ yağmurlu yağmurluk
          kaplumbağa rağmen sağlıklı eğer eğit eğri beğen ciğer değer diğer eğlen leğen
          yeğen değnek eğitim akciğer değerli eğlence sığ çığ ağıl ağır ağıt ağız bağır
          bağış çağır kağıt kağnı sağır sığır yağış
          yığın buzağı çığlık ağırlık dağınık sığınak sığırcık eğik eğil eğim iğne
          değil iğrenç değişik değirmen doğ doğu doğdu doğra doğru doğum koğuş oğlak
          oğlan doğmuş doğramak yoğurmak öğle öğlen öğret öğretim öğrenci öğretmen çoğu
          kuğu oğul boğum çoğul doğuş soğuk tuğla uğrak uğraş yoğun buğday soğuma
          soğutma yoğurt ağustos öğün öğüt düğme düğün göğüs söğüt düğmeli Oğuz Uğur
          Buğra Çağla Çağrı Doğan Doğuş Tuğba Yağız Yiğit Çağlar Çiğdem Göktuğ Tuğrul
          Çağatay Ertuğrul Niğde Muğla Elazığ Tekirdağ`,
      },
      {
        letters: ['f'],
        label: 'F',
        words: `af ef ıf if of öf uf üf fa fe fı fi fo fö fu fü fan far kaf laf raf saf
          defa fare fark harf kafa şifa ufak vefa zarf esnaf fakat fakir fanus fazla
          hafta hoşaf sayfa afacan alfabe çarşaf asfalt farklı fayton mutfak şeffaf
          zürafa fabrika fasulye faydalı affetmek fen fer fes şef afet büfe feda fena
          kafe küfe fener ferah hedef kafes nefes sefer zafer aferin defter efsane
          ferman körfez lütfen nefer fedakar feribot kıyafet şeftali fesleğen festival
          teneffüs şeref fıçı sırf fıkra fırça fırın sınıf sıfır
          zayıf fındık fıstık fırfır fırsat fırtına fırıldak kadife fil fiş fit lif afiş
          çift file film filo fino fire ofis fidan fikir filiz firma fişek fiyat hafif
          iftar keşif keyif nefis şifre tarif zarif afiyet biftek çiftçi define fincan
          teklif telafi trafik bonfile fatura fon fos sofra forma fosil telefon formül
          gofret fotoğraf fotokopi yulaf şoför kuaför köfte öfke fuar füze nüfus futbol
          fular yufka üfle üflemek parfüm Efe Arif Elif Fuat Ufuk Defne Efsun Faruk
          Fatih Fatma Feray Ferda Ferdi Ferit Fırat Figen Filiz Fulya Funda Füsun Fadime`,
      },
      {
        letters: ['j'],
        label: 'J',
        words: `aj ej ıj ij oj öj uj üj ja je jı ji jo jö ju jü ajan guaj imaj jant plaj
          şarj bagaj baraj mesaj pasaj viraj bandaj jaguar jakuzi makyaj montaj peyzaj
          pijama avantaj deterjan jandarma bej jel jet oje obje jeton kolej ojeli proje
          ejderha jelatin jelibon oksijen enjektör projektör jip reji jilet rejim
          alerji enerji hijyen dijital nostalji lojman joker jokey jimnastik jön jöle
          jöleli hidrojen kaju judo judocu abajur panjur jüri jübile Ajda Jale Ajdar
          Müjde Nejat Tanju Tijen Jülide Müjdat Müjgan Nejdet Japon Japonca Japonya
          Jüpiter`,
      },
    ],
  },
];
