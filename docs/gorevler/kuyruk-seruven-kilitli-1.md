# KİLİTLİ: Serüven kuyruğu 1 (K49'dan ayrılan harita ve gezinti işleri)

**Durum: KİLİTLİ (2026-11-05, kullanıcı kararı).** Oyun mekaniği tamamen bitene dek CC'ye VERİLMEZ. Kullanıcı kararları (2026-11-04) geçerli: gezinti = bölgelere bölünecek + bölge geçişinde yükleme ekranı, her bölgenin içinde orman/dağ/göl dahil her yer yürünür. "Hızlı seyahat" ekran düğmesi kaldırılacak.

Başlık: `main` güncel; yeni dal `wip/k5x` (numarayı CC seçer). Her adım ayrı commit. Soru sorma, en makul kararı ver, `DECISIONS.md`'ye yaz. Goliath dosyalarına dokunma. Kayıt anahtarlarına ve NOTICE'e dokunma. Ana parça `index` ≤ 440 kB.

## Adım C. Ana harita verisi ve temizlik
1. **Kıta adı:** "Hexonya" etiketi (`kita`, şu an 6300,2250) haritanın en üstünde, kıta dışındaki boş denizde dursun. Karoda sakin/boş bir bölge bul (piksel analizi), koordinatı raporla. Yalnızca uzak yakınlaştırmada görünsün.
2. **İsimler:** "Cadı Bataklığı" → "Cadı Kazanı" (TR; EN "Witch's Cauldron"; kimlik `bolge_bataklik` kalsın, tüm arayüz/metin/test/belge geçişlerini güncelle). Haritada bataklığın içinde (yakınlaşınca, ızgara F6 çevresi, "Kamp ateşleri" yazısının üstünde) "İklim Vadisi" yazan bir etiket var; bu yer yanlış yazılmış: bataklığın kendisi, yani şu an "İklim Vadisi" yazan yer **"Cadı Kazanı"** yazmalı (Cadı Bataklığı bölge etiketiyle çakışan çift yazıyı tek etikette birleştir). "İklim Vadisi" adı ise doğru yerinde, bu bataklığın sağındaki Oduncu kampı ve Hutame Çölü'nün bulunduğu adacık/bölgenin adı olmalı: etiketi oraya taşı. `etiketler.json` kayıtlarında "iklim" geçen kimlik yok, yazı büyük olasılıkla düğüm verisinden (`tum_dugumler_dunya.json`, yerleşim/yer adları) geliyor: "İklim" geçen tüm yerleri ara, hangi kayıttan geldiğini raporla. Kesin konum belirsizse en makul yeri seç, koordinatları raporla; kullanıcı `etiketler.json`dan düzeltir.
3. **Yollardaki minik yuvarlaklar:** parti jetonlarıymış (gezinti şeklimiz). YAPMA, kaldırma: yürüme/gezinti modu değişince zaten kalkacak. Bu madde iptal.
4. **Ekrandaki "Hızlı seyahat" düğmesini kaldır.** Mekanik değişmez: gemi (iskele düğümünden), portal (Volkan), Su Altı Geçidi (gizli geçit), uçuş (binekle) dünya içi düğümlerden çalışsın. `hizliSeyahat` anahtarı verisi kalsın, yalnız düğme/panel gitsin.
5. **Bölgeler arası yollar:** yürünebilirlik maskesi + A* ile bölge çiftleri arasındaki en ucuz yolları çıkar, geçişi zayıf (dolambaçlı/çok pahalı) olan bölge çiftlerini listele. `yol-katmani.json`'a makul yeni yollar ekle (mevcut araziye uyumlu, ucuz koridor, köprü/geçit varsa kullan) ve görüntüleyicide ince bir yol çizgisiyle göster. Rapor: eklenen yollar, önce/sonra yürüme maliyeti.
6. **Ana haritada olmayan haritalar:** savaş/sayfa haritalarından dünya haritasında karşılığı (düğüm, yerleşim, sefer durağı, boss, sayfa çıkışı) OLMAYANLARI listele (yeraltı haritaları hariç, onlar kalır). İlk commit yalnız liste (`harita/belgeler/ana-haritada-olmayanlar.md`), ikinci commit yetim olanları kaldır; testlerde sayı beklentisi varsa güncelle. Başka bir yerde kullanılan haritayı (sefer, test, öğretici) kaldırma, raporda ayrı listele.
7. **Deniz animasyonu:** YAPMA (yük ve kalite riski). Not düş.

## Adım D. Gezinti: bölgeler ve yükleme ekranları
- Dünya haritası bölgelere ayrılır (en az: Karkedon, Cüce Eyeri, Ahmak Ormanı, Hutame Çölü, Cadı Kazanı, Gözcü Kıyısı, Tenhausser, Kum Buzulu; adalar kendi bölgesi). Sınırlar `etiketler.json` bölge etiketleri, `sayfa-dunya-esleme` ve arazi maskesinden türetilir; poligon/maske verisi `data/harita/` altında, parametre dosyası.
- Parti bir bölge sınırını geçince kısa bir geçiş/yükleme ekranı: bölge adı + ince arka plan + gerçek karo ön yüklemesi (yeni bölgenin karoları z3–z4 hazırlanır). Süre ~0,6–1,2 sn, hareket azaltmada kısa solma. Aynı bölge içinde kesinti yok.
- Bölge içinde orman, dağ, göl ve nehir dahil her yer yürünür. Maliyet haritasını buna göre güncelle: orman/dağ pahalı ama geçilebilir; dar su (göl/nehir) yüzülür (Atletizm beyaz kontrol, mevcut `deepWater` kuralı, ağır zırhta uyarı/red, başarısızlıkta süre kaybı); açık deniz, uçurum ve büyük kayalık kütleler geçilmez kalır. Parametre dosyasında tut.
- GM anahtarı `bolgeYukleme` (varsayılan AÇIK). Kapalıyken K47 davranışı.
- Geçiş animasyonları: uçuş (yükselip inme) ve gemi mevcut; **yüzme** (yarı suya gömülü jeton, halka dalgalar) EKLE. Pokémon tarzı efektleri test edebilmek için GM/ayarlar altında "Animasyon önizleme": uçuş, gemi, yüzme düğmeleri (parti bu hareketi yapmasa da gösterir).
- Test: bölge sınırı geçişi, ön yükleme, anahtar kapalı eski davranış, yüzme kontrolü ve ağır zırh, yeni maliyet haritasında A*, kayıt/yükleme, hareket azaltma.

## Rapor
Her adım için kısa özet: neyin değiştiği, seçilen koordinatlar/isimler, eşleme tabloları, açık kalanlar.
