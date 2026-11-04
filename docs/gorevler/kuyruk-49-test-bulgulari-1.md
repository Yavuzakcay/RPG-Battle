# Kuyruk K49: 2026-11-04 test bulguları (1)

Başlık: K48 (`wip/k48`) `main`'e alındıktan sonra başla; yeni dal `wip/k49` (`main`'den). Her adım ayrı commit, her büyük adım sonrası push. Soru sorma, en makul kararı ver, `DECISIONS.md`'ye yaz. Goliath dosyalarına dokunma. Kayıt anahtarlarına ve NOTICE'e dokunma. Yeni alanlar eski kayıtta boş = eski davranış. Ana parça `index` sınırı 440 kB (şu an ~433,8): yeni kod tembel parçalara girsin. Kural kaynağı SRD 5.2.1. Her adım sonunda typecheck, ilgili testler, tam `npm test`, build, `check:*` temiz.

Kullanıcı kararları (2026-11-04): gezinti = bölgelere bölünecek + bölge geçişinde yükleme ekranı, her bölgenin içinde orman/dağ/göl dahil her yer yürünür. "Hızlı seyahat" ekran düğmesi kaldırılacak.

## Adım A. Celestial ırkı kartı geri gelsin (ÇOK YÜKSEK, önce bunu yap)
Neden görünmüyor: K20'de Celestial ev kuralı oldu; oluşturucuda kart `rpg-battle-deneysel.celestial` ayarı kapalı olduğu için gizli (DECISIONS "K20"). Kullanıcı bunu "Aasimar'ın yerine koyduğumuz ırk silinmiş" diye gördü.
- Celestial, SRD ırk listesinde Aasimar'ın olduğu yerde (alfabetik/yurt sırasında) HER ZAMAN görünsün. Ayar varsayılanı AÇIK olsun; "ev kuralı" etiketi ve Ayarlar anahtarı kalsın ya da kaldırılsın, hangisi daha az kırıcıysa. Anahtar kapatılırsa eski davranış (kart gizli, mevcut Celestial karakter görünür).
- Savaşta Celestial özellikleri (Şifa Eli, Göksel Uyanış, karanlık görüş, direnç) varsayılan olarak AKTİF olsun. Kayıtlı eski karakterlerin sonucu değişmesin (kural sürümü).
- Veride, arayüzde ve testlerde "Aasimar" hâlâ geçmemeli (mevcut test).
- Test: yeni oluşturucu açılışında Celestial kartı var; anahtar kapalı eski davranış; savaşta özellikler çalışır.

## Adım B. Karakter oluşturucu düzeltmeleri
1. **Seviye seçimi 1–20:** şu an en çok 5. seviye seçiliyor. 1–20 arası her seviye seçilebilsin. 11+ seviye özellikleri bazıları henüz yok (Overchannel, Mystic Arcanum, Greater Divine Intervention, Spell Mastery, Signature Spells): arayüzü kısıtlama, eksik özellikleri raporda listele; seçimde küçük bir not ("bu seviyede şu özellikler henüz yok") göstermen yeter.
2. **GM seviyeyi değiştirsin:** GM ekranında her karakter için "Seviye değiştir". Yükseltmede mevcut seviye atlama akışı (ortalama HP, yeni özellikler, büyü yuvaları); düşürmede onay iste. Olay kaydına yazılsın (event-sourced). Çevrimiçi odalar henüz yok: yerel GM ekranına koy, `DECISIONS.md`'de not düş.
3. **Geçmiş (background):** bonusların altındaki "özgün" yazısı kaldırılsın. Görünen adlar (TR): Madenci, Tüccar, Soytarı, Şifacı, Soylu, Mürettebat, Köylü, Ödül Avcısı (EN: Miner, Merchant, Jester, Healer, Noble, Crew, Villager, Bounty Hunter). Mevcut geçmişlerden en yakın eşleşmeyi seç, eşlemeyi raporla. Kimlikler (id) ve kayıtlı karakterler değişmesin; yalnız görünen ad. Sekiz adın dışında kalan geçmiş varsa DOKUNMA, raporda listele.
4. **Alt sınıf adları:** "dış içerik" yazısı kaldırılsın. İstisna: yazı üçüncü taraf kaynağı belirtiyorsa kalsın ve raporla (çekirdek yalnız SRD, imza alt sınıflar kullanıcının kendi içeriği). "Psişik Hançerler (Kirpi)" yalnız "Kirpi" olarak görünsün (EN karşılığı da aynı mantık). Başka alt sınıfta parantezli takma ad varsa tara, raporla.
5. **Tekrarlayan alt sınıflar:** kullanıcı şu sekizinin listede İKİ KEZ göründüğünü bildirdi: Path of the Berserker, College of Lore, Life Domain, Warrior of the Open Hand, Oath of Devotion, Draconic Sorcery, Fiend Patron, Evoker. Bunlar SRD 5.2.1 çekirdek alt sınıflarıdır, SİLME. Her birinin tek bir kopyası kalsın (çekirdek kayıt; fazladan olan ek/eski kayıt çıkar). Kayıtlı karakterler iki kimliği de bulabilsin (eski id → yeni id eşleme). Test: sekizi de tam bir kez listelenir, kayıtlı eski karakter açılır.
6. **Eşya seçimi:** eşya sayısı çok. Kategorilere ayır: tür (silah, zırh, kalkan, tüketilebilir, aksesuar/mücevher, sihirli eşya, araç gereç) ve etki seviyesi (sıradan, olağandışı, nadir, çok nadir, efsanevi ya da uygun güç sınıflaması). Çip filtreleri + katlanır gruplar + arama; mevcut eşya sayıları ve fiyatlar aynı kalsın.

## Adım C. Ana harita verisi ve temizlik
1. **Kıta adı:** "Hexonya" etiketi (`kita`, şu an 6300,2250) haritanın en üstünde, kıta dışındaki boş denizde dursun. Karoda sakin/boş bir bölge bul (piksel analizi), koordinatı raporla. Yalnızca uzak yakınlaştırmada görünsün.
2. **İsimler:** "Cadı Bataklığı" → "Cadı Kazanı" (TR; EN "Witch's Cauldron"; kimlik `bolge_bataklik` kalsın, tüm arayüz/metin/test/belge geçişlerini güncelle). Kullanıcı ayrıca haritada "İklim Vadisi" adlı bir yazının yerinin yanlış olduğunu söylüyor: doğru yer, sağındaki Oduncu kampı ve Hutame Çölü'nün bulunduğu adacık/bölge; şu an Cadı Bataklığı yazısıyla çakışıyor. `etiketler.json` ve tüm veri/arayüzde "İklim" geçen adları ara, hangi etiketten bahsedildiğini raporla, çakışmayı gider, kararın konumu yaz. (Etiket kayıtlarında "iklim" geçen kimlik bulunamadı; metin başka bir yerden geliyor olabilir.) Kesin yer belirsizse en makul konumu seç, koordinatları raporla; kullanıcı `etiketler.json`dan düzeltir.
3. **Yollardaki minik yuvarlaklar:** nedir (yol katmanı noktaları, hub işaretleri, takipçi jetonu, hata ayıklama?) bul, amacını raporla ve kaldır (hata ayıklama ise GM/geliştirici anahtarının arkasına).
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
Her adım için kısa özet: neyin değiştiği, seçilen koordinatlar/isimler, kaldırılan harita ve eşya listesi, eşleme tabloları, açık kalanlar.

## Dışı (başka kuyruklarda)
- Disco Elysium "Motivasyon" = Moral: K48 Adım B'de.
- Seçilen savaş haritasına göre büyü etkisi (çölde ateş, dağda buz) ve altıgen/büyü alanı etkileşimi (her altıgene büyü, alan çakışması, üstünlük/etkisizleştirme): önce tasarım belgesi (Claude hazırlıyor), sonra kuyruk.
- Negatif Alan Zaptı su altı katmanının Gemini ile yeniden çizimi (sanat işi, CC değil).
- Deniz dalga animasyonu: yapılmayacak.
