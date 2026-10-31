# Yolculuk modu — tasarım (Görev J0)

Durum: **yalnızca tasarım**, kod yok. Kural çerçevesi SRD 5.2.1; ev kuralları ayrıca işaretlidir ("**Ev kuralı**"). Tarih: 2026-10-30; kararlar 2026-10-31 (Görev Z3).

Yolculuk; tek tek savaşları, kalıcı parti durumu olan bir **güzergâha** bağlayan moddur. Savaş motoru değişmez. Yolculuk motorun üstünde ince bir katmandır: savaşlar arasında ne olacağını seçer, dinlenmeyi ve ödülleri yönetir.


## Kararlar (Görev Z3, 2026-10-31)

Bu bölüm belgenin geri kalanından önce gelir; aşağıdaki gövdeyle çeliştiği yerde **bu bölüm geçerlidir**. "Kullanıcı" işaretli maddeler kullanıcı kararıdır. "Claude kararı" işaretlileri kullanıcı açıkça karar vermediği için varsayılan olarak alınmıştır; değiştirilebilir.

1. **İlerleme: kilometre taşı** (kullanıcı). Seviye atlama rotadaki belirli düğümlerde olur (şablonda işaretli "seviye düğümü"). XP sayacı yok; §3'teki XP önerisi düştü. Seviye atlama yine mevcut sihirbazın seviye adımıyla.
2. **Ölüm: seçilebilir** (kullanıcı).
   - Varsayılan SRD gibi kalıcı: ölen karakter ancak geri getirme büyüsüyle döner (Revivify vb.; büyü yoksa ölü kalır).
   - **"Kolay mod"** seçeneği: düşenler (0 HP / ölü) dinlenme düğümünde ayağa kalkar. **Ev kuralı**, rota başında seçilir.
3. **Dinlenme** (kullanıcı):
   - Yalnızca **dinlenme düğümlerinde**, düğüm başına **bir kısa ya da bir uzun** dinlenme.
   - Rota başına dinlenme düğümü sayısı sınırlıdır (şablonda sabit).
   - §2'deki saat sayacı ve "16 saat" koşulu düştü: dinlenme hakkı düğümle sınırlanır.
4. **Kayıt** (kullanıcı): MVP'de **yalnızca yerel** (localStorage). Bulut senkronizasyonu (§5 Supabase taslağı) çevrimiçi odalarla birlikte, sonraki aşamada.
5. **MVP kapsamı** (kullanıcı):
   - MVP = **hazır şablon rota** (veride elle yazılmış; tohumlu üretim yok).
   - **Tek oyunculu varyant** ve **eşya/ödül sistemi** (altın, tüccar, ganimet) MVP dışı.
   - Okuma: "tek oyunculu varyant" ayrı bir tek kişilik mod olarak anlaşıldı. MVP mevcut tek ekran paylaşımlı oyun düzenini (Game Master + oyuncular) kullanır.
6. **Savaş sonunda süren etkiler düşer** (Claude kararı; **Ev kuralı**, §2'deki gibi): konsantrasyon, çağrılmış yaratıklar ve geçici HP sonraki durağa taşınmaz.
7. **Rota uzunluğu** (Claude kararı): MVP şablonu 6–8 durak; en az 2 dinlenme düğümü ve 1–2 seviye düğümü.
8. **Zincir denge hedefi** (Claude kararı): standart parti, 3. seviye, iki dinlenme düğümü arası 3 savaş → %70–85 bitirme. Ölçüm Y4'te (sim "zincir" kipi); tutmazsa şablonun düşman listeleri ayarlanır, canavar verisi değil.

**Yol haritasına etkisi:**
- Y1 (doğrusal yolculuk) şablon rotayla birleşir.
- Y2'deki tohumlu üretim MVP sonrasına kalır.
- Y3 (olaylar, tüccar, ganimet) MVP dışıdır.
- Y8 (bulut) çevrimiçi odalarla aynı aşamadadır.

---

## 1. Mod ve güzergâh yapısı

**Öneri: düğümlü güzergâh (dallı, döngüsüz grafik).**

- Bir yolculuk 6–12 **durak**tan oluşur ve sütunlar hâlinde soldan sağa ilerler. Her sütunda 1–3 seçenek bulunur; bir duraktan bir sonraki sütunda en çok 2 durağa bağlantı çıkar.
- Durak türleri:
  - **Savaş:** harita + karşılaşma; Game Master kurulumuyla aynı veri.
  - **Zorlu savaş:** bütçe ×1,5 ve ödül fazlası.
  - **Dinlenme yeri:** kısa dinlenme, ya da ateş yakılırsa uzun dinlenme (bkz. §2).
  - **Olay:** metin + seçim. Örnek: "köprü çökük, Athletics DC 12 ya da dolaşıp 1 saat kaybet". Sonuç HP, kaynak ya da eşya olur.
  - **Tüccar / tapınak:** SRD donanım ve iksir; tapınakta diriltme hizmeti.
  - **Son durak:** boss savaşı (örneğin S0'daki Ejder Yuvası).
- **Kaynak:** güzergâh veride durur (`data/yolculuk/<kimlik>.json`): duraklar, bağlantılar, harita/karşılaşma kimlikleri, olay metinleri (TR/EN). Rastgele üretim tohumla yapılır (`seeded(seed)`); aynı tohum aynı güzergâhı verir.
- **Game Master rolü:** Game Master yolculuğu seçer ya da tohum verir. Her savaş durağında mevcut kurulum ekranına önceden doldurulmuş olarak düşülür; Game Master düşmanı değiştirebilir.

**Alternatifler:**

| Seçenek | Artı | Eksi |
|---|---|---|
| A) Doğrusal liste (N savaş arka arkaya) | En basit (S) | Seçim yok, tekrar oynanmaz |
| B) Düğümlü güzergâh (önerilen) | Seçim + tekrar oynanabilirlik; veride tanımlı | Orta (M) |
| C) Serbest dünya haritası (hex-crawl) | En zengin | Büyük (XL); keşif sistemi (S0 §5) önce gelmeli |

---

## 2. Kalıcı durum ve SRD dinlenmeleri

Mevcut altyapı yeniden kullanılır: savaş sonrası HP, kaynak, slot ve bitkinlik karaktere yazılır (`applyBattleResult`, `src/app/partyStatus.ts`). Kısa ve uzun dinlenme `src/rules/characterRest.ts` içindedir.

**SRD 5.2.1 "Resting" kuralı:**

- **Kısa dinlenme:** 1 saat. HP zarları harcanır, kısa dinlenmede yenilenen kaynaklar dolar.
- **Uzun dinlenme:** 8 saat. HP tam, harcanan HP zarlarının yarısı geri gelir, bitkinlik −1. Aynı 24 saatte bir kez yapılır; uzun dinlenme bölünürse fayda yoktur.

**Yolculukta uygulama:**

- **Zaman sayacı:** yolculuk saat tutar. Durak türüne göre süre geçer: savaş ≈ 0, olay 0–1 sa, yürüyüş 2–4 sa, kısa dinlenme 1 sa, uzun dinlenme 8 sa.
  - Uzun dinlenme yalnızca dinlenme yerinde ve son uzun dinlenmeden en az 16 saat sonra yapılabilir. Böylece SRD'nin "24 saatte bir" kuralı korunur.
- **Kısa dinlenme hakkı:** her yürüyüş durağından sonra isteğe bağlıdır (1 saat). Sayısı zamana bağlıdır, ayrı bir sınır yoktur.
  - **Ev kuralı seçeneği:** "iki uzun dinlenme arası en çok 2 kısa dinlenme" (zorluk ayarı).
- **Ölüm:** ölen karakter yolculukta ölü kalır.
  - Tapınakta SRD *Revivify* / *Raise Dead* bedeli ödenerek diriltilir: büyü bileşeni elmas, altın karşılığı.
  - Partide büyüyü bilen ve slotu olan biri varsa o da diriltebilir. 4.+ seviye büyüler motorda yok; Raise Dead yalnızca hizmet olarak sunulur.
- **Kalıcı olanlar:** HP, HP zarları, kaynaklar, slotlar, bitkinlik, harcanan sarf malzemeleri (iksir, ok), altın, eşya ve XP.
- **Kalıcı olmayanlar:** süren etkiler, konsantrasyon, çağrılmış yaratıklar ve geçici HP. Savaş biterken bunlar düşer.
  - Bu kural SRD'ye uymaz: süreli büyüler savaştan sonra da sürebilir. Ölçeği küçük tutmak için **Ev kuralı** olarak kabul edilir.

---

## 3. İlerleme

- **XP (SRD):** canavar XP'si partiye bölünür. Seviye eşikleri SRD "Character Advancement" tablosundan gelir.
  - Seviye atlama yalnızca uzun dinlenmede olur, mevcut sihirbazın "Seviye" adımıyla (ASI/feat, büyü seçimi).
- **Alternatif: kilometre taşı (milestone).** Her N savaş durağında bir seviye. Basittir ve dengesi öngörülebilir.
  - Öneri: Game Master ayarı, varsayılan XP.
- **Ganimet:**
  - Altın: SRD hazine tablosu yaklaşığı. Karşılaşma XP'si × katsayı; katsayı veride.
  - Eşya: yalnızca motorun desteklediği SRD eşyaları (iksirler, +1 silah/zırh). Eşya etkisi motorda yoksa listelenmez.
- **Seviye tavanı:** başta 1–5 (sınıf özellikleri ve büyüler motorda 1–5'te en sağlam). 6+ "deneysel" uyarısıyla açılabilir.

---

## 4. Zorluk ve denge

- **Bütçe:** mevcut karşılaşma bütçesi kullanılır (SRD XP eşikleri; `data/sim-senaryolar.json` seviye listeleri gibi).
  - Durak bütçesi = partinin seviye bütçesi × durak katsayısı: savaş 1,0, zorlu 1,5, boss 2,0.
  - **Gün bütçesi:** iki uzun dinlenme arası toplam ≈ SRD "adventuring day" (seviye başına günlük XP). Güzergâh üreticisi bunu aşmaz.
- **Yıpranma ölçüsü:** simülasyona "zincir" kipi eklenir. Aynı parti, aralarında yalnızca kısa dinlenme olan N savaş oynar.
  - Ölçülenler: zincirin sonuna ulaşma oranı, durak başına ölüm ve kaynak tüketimi.
  - Hedef: standart parti 3. seviyede 3 savaşlık zinciri %70–85 bitirir. Hedef aralığı karar bekliyor.
- **Zorluk ayarı (Game Master):** Kolay / Normal / Zor. Değişenler bütçe katsayısı, kısa dinlenme sınırı ve ölümün kalıcılığı.
  - **Ev kuralı:** "Kolay"da ölen karakter durak sonunda 1 HP ile kalkar.
- **Yapay zekâ:** değişmez. Zincirde düşmanın "kaçma" davranışı yoktur; bu eksik kayda geçer.

---

## 5. Teknik

- **Yolculuk kaydı:** `YolculukState`.
  - İçerik: tohum, güzergâh kimliği, konum, zaman, altın, envanter, olay geçmişi ve parti karakter kimlikleri. Karakterler mevcut karakter deposunda kalır; yolculuk onlara kimlikle bağlanır.
  - Ayrı anahtarda saklanır (`rpg-battle-yolculuk`), kendi `JOURNEY_VERSION` ve `LOADABLE` listesiyle (`battleSave.ts` kalıbı).
- **Komut → olay:** yolculuk da savaş gibi olay günlüğü tutar.
  - Komut örnekleri: `choose_node`, `rest_short`, `rest_long`, `event_choice`, `buy`, `battle_result`.
  - Saf `executeJourney` + `reduceJourney` kullanılır; Rng enjeksiyonu ve zar defteri savaştakiyle aynıdır, olay zarları elle zar modunda istenir.
  - **Replay:** yolculuk olayları baştan oynatılınca aynı durum çıkar. Savaş durağının kendi savaş kaydı vardır; yolculuğa yalnızca sonucu girer (`battle_result`: karakter durumları, XP, ganimet).
- **Sürüm:** savaş kaydı (`SAVE_VERSION` 20) değişmez. Savaş yolculuktan açılınca oturumda `journeyNodeId` taşınır; bu isteğe bağlı bir alandır ve eski kayıtlar yüklenir.
- **Supabase (isteğe bağlı bulut kaydı; depoda henüz yok):**
  - **Tablolar:**
    - `journeys`: `id`, `owner uuid`, `data jsonb`, `version int`, `updated_at`.
    - `journey_events`: `journey_id`, `seq`, `event jsonb`. Ekleme salt-eklemedir (append-only).
    - `characters`: `owner`, `data jsonb`.
  - **RLS:**
    - Her tabloda `owner = auth.uid()` ile `select/insert/update`.
    - `journey_events`te `update/delete` yoktur, yalnızca `insert` (replay bütünlüğü). `seq` benzersizdir (`unique(journey_id, seq)`).
    - Paylaşılan yolculuk için `journey_members(journey_id, user_id, role)`. Okuma üyelere, yazma yalnızca `role = 'gm'` olana.
    - Servis anahtarı istemcide bulunmaz.
  - **Çakışma:** son yazan kazanmaz. `seq` çakışırsa istemci olayları yeniden çeker ve yeniden oynatır.
  - **Çevrimdışı:** localStorage birincildir, bulut eşitleme ikincildir.
- **Paket boyutu:** yolculuk ekranları tembel parçadır, ana parça ≤ 440 kB kalır. Güzergâh verisi tembel yüklenir.

---

## 6. Arayüz taslakları

```
┌ Yolculuk: Kuzey Geçidi ─────────────── Gün 2 · 14:00 · 120 alt ┐
│  ●──○──◆──○                                                    │
│      ╲   ╲                                                     │
│       ○──⛺──○──☠                                              │
│  [Parti şeridi: jeton · HP çubuğu · slot noktaları · HP zarı]  │
│  Seçili durak: "Orman yolu — eşkıya pususu" (Zor, 900 XP)      │
│                       [Kısa dinlen]   [Devam →]                │
└────────────────────────────────────────────────────────────────┘
```

- **Güzergâh ekranı:** düğüm haritası (SVG). Ulaşılabilir duraklar parlar, geçilenler sönüktür. Altta parti şeridi ve zaman/altın göstergesi bulunur.
- **Dinlenme ekranı:** mevcut karakter listesi dinlenme düğmelerinin aynısı. HP zarı harcama satır başınadır; uzun dinlenme süre koşulu sağlanmadıysa pasiftir ve gerekçesi gösterilir.
- **Olay ekranı:** metin + 2–3 seçenek. Gereken zar (beceri kontrolü) zar tepsisiyle atılır; elle zar modunda istenir.
- **Savaş sonu:** mevcut sonuç ekranına "XP, ganimet, Yolculuğa dön" eklenir.
- **Telefon:** düğüm haritası dikey kaydırılır; parti şeridi alta yapışır.

---

## 7. Aşamalı yol haritası

| Aşama | İçerik | Boyut | Bağımlılık |
|---|---|---|---|
| Y0 | `YolculukState`, komut/olay/reducer, kayıt + sürüm, testler (replay) | M | — |
| Y1 | Doğrusal yolculuk (Seçenek A): 3–5 savaş, kısa/uzun dinlenme, zaman sayacı, XP | M | Y0 |
| Y2 | Güzergâh ekranı + düğümlü yapı (Seçenek B), tohumlu üretim | M | Y1 |
| Y3 | Olaylar, tüccar/tapınak, altın, envanter (yalnızca motorun desteklediği eşyalar) | L | Y2 |
| Y4 | Sim "zincir" kipi + denge raporu | S–M | Y1 |
| Y5 | Geniş haritalı durak ve boss | M | **H1/H2** (bitti), **A6** (çok altıgen; boss için), **S0** (yüzeyler, hedefler) |
| Y6 | Gece/ışık durakları, gece yürüyüşü | S | **Gece B** |
| Y7 | Güzergâh üstünde haritalı keşif (hex-crawl) | XL | **Harita 2.0**, S0 §5 (keşif/sis) |
| Y8 | Supabase bulut kaydı + paylaşılan yolculuk | L | Y0; hesap sistemi |

Önerilen ilk dilim: Y0 + Y1 + Y4. Bu dilim oynanabilir bir "üç savaşlık gün" verir ve dengeyi ölçer.

---

## 8. Kapsam dışı ve riskler

**Kapsam dışı:**

- Hikâye/diyalog ağaçları, NPC ilişkileri
- Şehir yönetimi, zanaat
- 4.+ seviye büyüyle diriltme (Raise Dead yalnızca hizmet olarak sunulur)
- Ağ üzerinden eşzamanlı çok oyunculu (Y8 yalnızca kayıt paylaşımı)
- Binek ve seyahat hızı kuralları (SRD "Travel Pace" yalnızca süre için)

**Riskler:**

1. **Denge birikimi:** tek savaş dengesi zincirde bozulabilir (kaynak yıpranması). Y4 olmadan Y2'ye geçilmemeli.
2. **Kayıt şişmesi:** her savaşın olay günlüğü büyüktür. Yolculuk yalnızca sonuçları tutmalı; savaş kayıtları isteğe bağlıdır.
3. **Eksik motor özellikleri:** dinlenme özellikleri (Arcane Recovery…), efsanevi eylemler ve 4.+ büyüler eksik. Yolculuk bunları daha görünür kılar; önce "Bilinen eksikler" sırası izlenmeli.
4. **Sürüm göçü:** karakter verisi değişirse (yeni seçimler) yolculuk ortasında kayıt bozulmamalı. Karakterlerin kendi göçü olduğu için yolculuk yalnızca kimlik tutar.
5. **Bulut güvenliği:** RLS hatası başkasının kaydını açabilir. Politika testleri (pgTAP ya da betik) Y8'in parçasıdır.

---

## Karar bekleyenler

Kapandı (Görev Z3): sekiz maddenin hepsi yukarıdaki "Kararlar" bölümünde karara bağlandı (1 → K1, 2 → K6, 3 → K3, 4 → K2, 5 → K8, 6 → K7, 7 → K4, 8 → K5).
