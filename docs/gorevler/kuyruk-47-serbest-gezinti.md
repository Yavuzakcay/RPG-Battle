# Kuyruk K47: Serüven serbest gezinti (tıkla-yürü, hızlı seyahat, yumuşak kilitler)

Başlık: K45/K46 birleştirilmiş olmalı. Yeni dal `wip/k47`. Her büyük görev sonrası commit+push. Kural sürümüne dokunma gerekirse yeni alanlar eski kayıtta boş = eski davranış. Mevcut yolculuk motorunu (5 duraklı güzergâh, `src/journey/`) yeniden kullan, çoğaltma. Veri dosyaları `data/harita/` altında (komsuluk-grafi, yol-katmani, deniz-yollari, yurume-maliyet-1_4.png, kita-izgara). Kaynak: kullanıcı kararı 2026-11-03.

## 1. Yürüme (savaş modu kapalıyken)
- **Tıkla-git:** haritada bir noktaya tıkla, parti jetonu oraya yürür. Altıgenler (savaş hex'i) GÖRÜNMEZ; hex yalnızca savaş açılınca belirir. Izgara katmanı (A–L × 1–6) varsayılan KAPALI, GM için açılabilir.
- **Yol bulma:** `yurume-maliyet-1_4.png` (3426×1500, 1/4 ölçek; 0 = geçilmez, 1..255 = maliyet×20; 20 = çim, 10 = yol/patika, 36 = kar, 80 = dağ ve küçük engeller, 52 = orman). A* ile en ucuz yol. Yollar (`yol-katmani.json`) ucuz, köprüler ve nehir geçidi açık koridor. Geçilmez: deniz, büyük nehir/göl, büyük kayalık kütleler. Maske TASLAKTIR: CC yürünebilirliği gözle doğrulayıp gerekirse düzeltsin (düzeltme listesi raporda).
- **Adalar** kıta maskesiyle bağlı DEĞİL; kıtadan yürünmez. Erişim: gemi, portal, uçuş, gizli geçit.
- **Hız:** yaya 24 mil/gün (1 mil/saat), 1 hücre = 50 mil. Yürüyüş animasyonu hızlı (saniyeler), oyun saati eylemlere göre ilerler.
- Yürürken parti jetonu yol boyunca ilerler, kamera takip eder, istenirse durdurulur. Keşif sisi yürüdükçe açılır (K46).

## 2. Eylem tabanlı saat
Oyun saati gerçek zamana değil eylemlere (yürüyüş, dinlenme, konuşma, savaş, yolculuk) göre ilerler. Gün ve saat tutulur (K46'daki Hapishane haftalık çıkışı ve 6 saatlik pencere buna bağlı; saat çözünürlüğü yoksa burada ekle). Zaman baskısı yok.

## 3. Karşılaşmalar (yolculuk motoru)
Hücre başına karşılaşma olasılığı (bölge, gece/gündüz, yol üstü mü): parametre dosyası, kodda sabit değil. Yol üstü az, yabani arazi çok. Karşılaşma olunca yürüme durur, mevcut savaş/olay akışına geçilir. Bu görevde yalnızca altyapı + varsayılan değerler (denge turunda ölçülür).

## 4. Yumuşak kilitler (hiçbir yer sert kilitli değil)
- Kilit yerine beceri/bilgi ile ek yol açılır: Mielikki gizli geçidi Algı/Doğa kontrolüyle ya da NPC'den öğrenerek açılır; çalılık geçit, dağ patikası, kapı gibi engellerde beceri kontrolü kısa yol açar.
- **Kırmızı / beyaz kontrol:** kırmızı = bir kez denenir; beyaz = beceri/ekipman/dünya durumu değişince yeniden denenir. Mevcut zar sistemi (`rules/checks`) kullanılır, sonuçlar kayıtta tutulur.
- **Pasif kontrol:** parti pasif Algı eşiği geçerse gizli yer/işaret haritada belirir.
- **Gizli geçit Heykel Mağarası = `yeralti-nehri` haritası:** Mielikki şelale arkası (6170,2740) ↔ Vaha batı kıyısı (8850,4460), anında geçilir (`sureGun`=0), bayrakla bulunduysa "Gizli geçit" düğmesi. Hub olarak hızlı seyahat ağına bağla.

## 5. Hızlı seyahat
- **Merkezler (hub):** ziyaret edilmiş yerleşimler ve iskeleler (Beyaz Şehir, Liman, Kral Kalesi, Hobbit Köyü, Elf, Gnom, Ork, Goliath, Cüce; iskeleler: Beyaz Şehir, Liman, Kral Kalesi, Hapishane, Korsan). Başta yalnız ırk yurdu açık, gerisi gidince açılır.
- **Gemi:** iskeleden iskeleye (`deniz-yollari.json`). Hapishane yalnızca yüzeydeki günde, Saklı Cennet ve Kemik yalnızca Korsan seferiyle.
- **Uçuş:** uçan binek/anahtarı olan karakter için (Göksel Ada ve keşfedilmiş merkezler). Kırık Kanat süzülmesi uçuş sayılmaz.
- **Portal:** Volkan (mevcut).
- **Maliyet:** süre mesafeden (gemi 72 mil/gün, uçuş parametre), karşılaşma kontrolü rota boyunca (gemi/uçuşta düşük, Kraken bölgesinde yüksek).

### Animasyon (Pokémon "Fly" tarzı)
- **Uçuş:** jeton yükselir (kuş/binek silüeti), küçülüp bulutlara karışır, harita hedefe kayar, hedefte iner. ~2,5 sn.
- **Gemi:** jeton gemi simgesine biner, gemi rota çizgisi boyunca ilerler, kamera takip eder, dalgalar ve gün sayacı akar. ~3–4 sn; Kraken bölgesinden geçerken kısa gerilim efekti.
- İkisi de atlanabilir (dokun). **Hareket azaltma** açıkken kısa geçiş/solma. Ses: mevcut ses sistemi (`data/ses.json`), yoksa sessiz. Varışta gün sayısı güncellenir, yolculuk olayları oynar.

## 5b. Karakter animasyonları (yürüme, uçuş, gemi, yüzme)
Önce hazır görsellerle (yeni sanat gerekmez).
- **Gösterim:** parti lideri büyük jeton, diğer üyeler (en çok 6) küçük jetonlar olarak arkasından sıra halinde takip eder. GM ayarı: yalnız lider / tüm parti. Jetonlar mevcut karakter jetonları.
- **Yürüme:** jeton ZIPLAMAZ. Adım ritminde çok hafif yalpalar: ±3° eğilme, dikeyde en çok 1–2 piksel, gölge adımla hafifçe daralıp genişler. Yönüne bakar (yatay çevirme), arkasında küçük ayak izi/toz (zemine göre). Hız zemin maliyetine göre. Duraksayınca ince nefes salınımı. İleride (isteğe bağlı): tek genel "yolcu" sprite'ı.
- **Uçuş:** jeton havalanır (gölge yerde küçülür), kuş/binek silüeti, kanat çırpma; Pokémon tarzı geçişle iner.
- **Gemi:** jeton güvertede, gemi dalgalanır, arkasında köpük izi.
- **Yüzme:** jeton yarı suya gömülü, halka dalgalar, yavaş.
- **Teknik:** kanvas/CSS animasyonu, spritesheet gerektirmez; "Efekt animasyonu" ayarına ve hareket azaltmaya uyar.

### Yüzme (nehir geçişi)
Büyük nehirler normalde geçilmez. Dar nehir ve göl kıyılarında oyuncu yüzerek geçmeyi seçebilir: beyaz kontrol Atletizm (`deepWater` kuralı mevcut: ağır zırhlıda batma sayacı, DC 12). Başarısızsa geçiş yarım kalır: ekipman riski yok, süre kaybı ve yorgunluk (parametre); ağır zırhta otomatik batma tehlikesi (geçiş reddedilir ya da uyarılır). Köprü/geçit varsa yüzme gerekmez. Büyük göl ve deniz yüzülmez. Yüzme yalnızca tanımlı geçiş noktalarında (`yuzme-gecitleri` listesi, CC maskeye bakıp çıkarır, örnek: Mielikki çıkışı güneyi, Kanyon nehri).

## 5c. Kararlar
1. **Uçuş kimlere açık:** yalnızca uçan binek ya da anahtarı olan karakter(ler); parti tek birim: biri sahibiyse parti uçabilir (parametre, öneri tüm parti).
2. **Uçuşla gidilebilen yerler:** yalnızca keşfedilmiş merkezler (hub) ve Göksel Ada (anahtarla).
3. **Karşılaşma sıklığı:** yol üstü az, yabani arazi çok; varsayılan parametre.

## 6. Veri ve kayıt
Kayıt alanları: parti konumu (dünya pikseli), saat (gün/saat), keşif ızgarası (K46), açılmış hub listesi, çözülmüş kontroller. Alan yoksa varsayılan = başlangıç. GM anahtarları: `serbestGezinti` (varsayılan AÇIK Serüven'de), `hizliSeyahat`, `haritaSisi`, `hapishaneHaftalik`, karşılaşma çarpanı.

## Test
Yürüme (yol bulma, geçilmez alanlar, köprü/nehir geçidi), saat ilerleme, kayıt/yükleme, hızlı seyahat (hub açılış, gemi, uçuş), animasyon atlama ve hareket azaltma, kontrol kırmızı/beyaz, eski kayıt, anahtar kapalıyken eski Serüven davranışı.

## Dışı
Deniz paketi karşılaşmaları (Kraken savaşı), Kefaret görevleri, bölge dengesi, isimler.

## Kabul
typecheck, ilgili testler, build, check:harita, check:ses temiz; ana parça ≤440 kB; kısa rapor: yürünebilirlik maskesinde düzeltilen yerler, açık kalanlar.
