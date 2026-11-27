# ODA-TASARIM: çevrimiçi oda sistemi (Görev ODA-0)

Durum: **tasarım** (2026-11-27). Bu görevde kod yazılmadı; mekanik, kural sürümü (108) ve kayıt sürümü (`SAVE_VERSION` 28) değişmedi.

Amaç: Game Master'ın savaşta yaptığı her değişiklik oyuncuların cihazına anında yansısın. Her oyuncu kendi karakterini kendi
cihazından oynasın. İlk sürümde hesap yok, katılım oda koduyla. Google/Supabase girişi en son, yalnız bir bağlantı türü olarak eklenir.
Ağ katmanı bu yüzden değiştirilebilir olmalı.

Bu belge bugünkü kodun üstüne kurulur:

- yerel oda kaydı `src/oda/`: `Oda.kod` alanı şimdilik boş; kurallar, HP görünürlüğü ve savaş kilidi burada,
- tek komut yolu `execute` → olaylar → `applyEvent` (`src/battle/reduce.ts`), `replay(events)`,
- komut bağlamı `CommandContext { playerId, isGm }` ve `canControl` (`src/battle/common.ts`),
- zar defteri `NeedDice`/`NeedReaction`/`runStep` (`src/rules/manualDice.ts`),
- savaş kaydı (`src/app/battleSave.ts`: olay günlüğü + `content` + `hp`).

---

## 0. Verilen kararlar ve bu belgedeki yorumu

| Karar | Belgedeki karşılığı | İtiraz / ek |
|---|---|---|
| Yetkili taraf GM cihazı (host) | Yalnız host `execute` çalıştırır. İstemciler komut gönderir, olayları alır, kendi reducer'larıyla uygular. Aktarıcı sunucu oyun mantığı çalıştırmaz, yalnız iletir. | Yok. |
| 6 haneli oda kodu, hesapsız | Kodu host üretir (`100000–999999`: baştaki sıfır yazarken kaybolmasın diye `0` ile başlamaz). İstemci kimliği anonim `istemciId` (cihazda saklanır). Host katılımda bir de **oturum anahtarı** verir; yeniden girişte ikisi birlikte istenir. | **Ek:** `istemciId`'yi istemci kendisi söyler. Anahtar olmazsa başka bir cihaz aynı kimliği söyleyip kopan oyuncunun karakterini ele geçirebilir. Bu yüzden anahtar şart. |
| Oyuncu karakterini kendi cihazında seçer, GM'e kopya gönderir | `karakter_gonder` mesajı `SavedCharacter` kopyası taşır. GM tarafında `characterProblems` ile doğrulanır, oda partisine **kopya** olarak girer (oyuncunun asıl kaydı onun cihazında kalır). | **Ek:** karakter, GM cihazında olmayan bir dış paket alt sınıfı kullanabilir. Bkz. Karar bekleyen 4. Savaş sonucu karaktere geri yazılmalı. Bkz. Karar bekleyen 8. |
| Zarlar GM cihazında atılır, `dice_rolled`'a yazılır | Host'un kaydedici Rng'si (`recordingRng`) bütün otomatik zarları atar. Zar modu "yalnızca oyuncular"/"herkes" iken oyuncunun zarı (`NeedDice`) **o oyuncunun cihazından** istenir. Girilen değer host'a gelir, adım aynı defterle yeniden çalışır. Sonuç her durumda `dice_rolled` olayıdır. | Yok. Fiziksel zarda değeri oyuncu girer ama zarı yine host kaydeder. |
| Kurallar savaş başında kilitlenir | `battle_started.state.kuralSurumu`, `ruleToggles`/`ruleParams` ve oda `kilit`'i (`lockRoom`) aynen kullanılır. İstemci kural değiştiremez (komut yok). | Yok. |
| Kopan oyuncu aynı kodla geri girer; GM isterse "Yapay zekâ oynasın" | O4: GM'e karar menüsü çıkar (bekle / yapay zekâ / GM oynasın / turu atla). Yapay zekâ host'ta `chooseCommand` ile oynar. | Yok. |
| Her istemcide reducer | Korundu: istemci olay günlüğünü uygular, durumu host'unkiyle bire bir aynıdır. | **İtiraz (kısmi):** her istemcide tam durum olunca gizli bilgi (düşman HP'si, gizlenen düşmanın yeri) oyuncu cihazının belleğinde de durur. Görünüm süzgeci yalnız çizimi gizler; tarayıcı araçlarıyla okunabilir. Ev masası için kabul edilebilir. Yabancılarla internette oynanacaksa yetmez. Bkz. §4.4 ve Karar bekleyen 1. |
| Kod `src/room/` | Ağ katmanı `src/room/` (saf). Yerel oda kaydı `src/oda/` olduğu gibi kalır; `src/room/` onu içe aktarır. | Yok. İki klasör bilerek ayrı: `oda` = kayıt, `room` = ağ. |

---

## 1. Mimari özet

```
 Oyuncu cihazı (istemci)                 GM cihazı (host, yetkili)                    Diğer istemciler
 ───────────────────────                 ────────────────────────────                 ────────────────
 kullanıcı dokunur
   └─ Command ──── komut{istekId,cmd} ──▶ yetki (gönderen → ctx)
                                         execute(state, cmd, ctx, rng)
                                           ├─ NeedDice ── zar_iste ──▶ (zarı atacak oyuncu)
                                           ├─ NeedReaction ── tepki_sor ──▶ (tepki sahibi)
                                           └─ ok: events
                                         seq += events.length; günlüğe ekle; kaydet
 applyEvent ◀──────── olaylar{ilkSeq,events} ── yayın ─────────────────────────────▶ applyEvent
 görünüm(state, izleyici) → çizim                                                     görünüm(...) → çizim
```

- **Tek yetkili.** Durumu yalnız host'un `execute`'u değiştirir. İstemci hiçbir zaman olay üretmez. İstemci "tahmin edip önden uygulama" (iyimser güncelleme) da yapmaz: komutu gönderir, "bekleniyor" gösterir, host'tan olay gelince çizer. Yerel ağda gecikme birkaç ms olduğu için bu yeter, ayrışma riski de yok.
- **Önizleme istemcide.** Hamle önizleme kartı, menzil, hedef listeleri (`previewCommand`, `attackChoices`, `spellTargets` kuru çalıştırması) istemcide yerel durumla hesaplanır. Bu olay üretmez, ağa gitmez. Durum aynı olduğu için önizleme host'takiyle aynı çıkar.
- **Sıra numarası (`seq`).** Host'un olay günlüğündeki sıradır: `battle_started` = 0, sonraki her olay +1. Her `olaylar` mesajı `ilkSeq` ve olay listesini taşır. İstemci kendi `sonrakiSeq`'ini tutar:
  - `ilkSeq === sonrakiSeq` ise olayları uygular, sayacı ilerletir;
  - `ilkSeq < sonrakiSeq` ise (yinelenen) zaten uygulanmış kısmı atlar;
  - `ilkSeq > sonrakiSeq` ise (boşluk var) uygulamaz, `yakala{sonSeq}` ister.
- **Eşitleme = anlık durum + olay günlüğü.** Host istemciye bir tabanla ondan sonraki olayları gönderir (`anlik`, §3). Varsayılan taban: **tam olay günlüğü** (`seq 0..N`). İstemci bunu `restoreSession` ile aynı yoldan (`migrateFlippedMaps` → `replay`) kurar. Böylece savaş günlüğü (`describeEvents`) de eksiksiz çıkar. Günlük çok büyürse (eşik O1'de ölçülecek, öneri 2 MB) taban `BattleState` anlık görüntüsüne geçer: `{ tabanSeq, durum, sonOlaylar }`. Bu durumda günlükte yalnız son olaylar görünür. `BattleState` düz JSON'dur (`Set`/`Map` yok), doğrudan gönderilebilir.
- **Geç katılan.** Savaş sürerken katılan yeni istemci `anlik` alır. Kendi karakteri savaşta değilse **izleyici** olur; savaşa karakter eklemek kurulum işidir (bkz. Karar bekleyen 8 notu).
- **Yeniden bağlanan.** `katil{istemciId, anahtar, sonSeq}` gönderir. Host, `sonSeq`'ten sonrası günlükte varsa yalnız eksik `olaylar`'ı, yoksa `anlik` gönderir. Kopukken host'ta oyun sürmüş olabilir (GM'in kararıyla); istemci yalnız yakalar.
- **Durum özeti.** Host her K komutta bir (öneri 20) `ozet{seq, hash}` yayar. Hash, durumun kanonik JSON'undan hesaplanır; çizim için tutulan alanlar hariç tutulur. İstemci kendi hash'ini karşılaştırır, tutmazsa `yakala{sonSeq:-1}` ile tam anlık durum ister. Farklı uygulama sürümü ya da reducer hatası ancak böyle yakalanır. Testte sessizce geçmesin diye hata olarak loglanır.
- **Savaş öncesi (lobi).** Oda üyeleri, karakter kopyaları ve oda ayarlarının özeti savaş olayı değildir. Bunlar ayrı `oda_durumu` mesajıyla gider (`src/oda/model.ts` alanlarından türetilir). Savaş kurulumu (`status: 'setup'`, jeton yerleştirme) ise zaten olaylarla yürür; oyuncular kurulumu da canlı izler.
- **Kayıt.** Yalnız host kaydeder: mevcut `SAVE_KEY` + oda `kilit`'i. Kayıt biçimi aynı, **kayıt sürümü değişmez**. Host sayfası yeniden açılınca savaş kayıttan devam eder, aynı kodla oda yeniden açılır, istemciler yeniden bağlanır (O4). İstemciler isterse son günlüğü yalnız hızlı yeniden bağlanma için önbellekte tutar; bu bir kayıt sayılmaz.
- **Yapay zekâ turları.** Host'ta bugünkü gibi `autoplayEnemyTurns` çalışır; her komutun olayları ayrı `olaylar` mesajıyla yayılır, istemcide de animasyon sırası korunur. "Yapay zekâ oynasın" olarak işaretlenmiş parti karakteri için host `chooseCommand` çalıştırır. Bu işaret oda/host durumudur, savaş olayı değildir; kural ve kayıt sürümü değişmez.
- **Sürüm el sıkışması.** `katil` şunları taşır: `protokol` (`ODA_PROTOKOL` 1), `uygulama` (build kimliği; Vite `define` ile üretilir) ve `kuralSurumuAzami` (`defaultRuleVersion()`). Host aynı build'i ister, farklıysa `red{neden:'surum'}` döner (bkz. Karar bekleyen 3).

---

## 2. Bağlantı arayüzü: `RoomTransport`

Oyun kodu yalnız bu arayüzü görür. Aktarıcı mesajın içine bakmaz, yalnız zarfı (`kime`) okur.

```ts
// src/room/transport.ts (saf; React/DOM yok — tarayıcı API'si yalnız bağdaştırıcıda)
export type Rol = 'host' | 'oyuncu' | 'izleyici';
export interface Uye { istemciId: string; rol: Rol }

export interface Zarf {
  oda: string;            // 6 haneli kod
  kimden: string;         // gönderen istemciId (aktarıcı doldurur/denetler; istemcinin yazdığına güvenilmez)
  kime?: string;          // yoksa: host'tan herkese yayın / istemciden host'a
  m: OdaMesaji;           // §3
}

export type BaglantiDurumu =
  | { tur: 'baglaniyor' } | { tur: 'bagli' } | { tur: 'koptu'; neden: string }
  | { tur: 'uye_geldi'; uye: Uye } | { tur: 'uye_gitti'; istemciId: string }
  | { tur: 'kod_dolu' } | { tur: 'oda_yok' };

export interface RoomTransport {
  readonly tur: 'bellek' | 'sekme' | 'yerel-ag' | 'supabase';
  /** Host için: kodu sahiplenir (dolu ise `kod_dolu`). Oyuncu için: odaya bağlanır (yoksa `oda_yok`). */
  katil(kod: string, uye: Uye): Promise<void>;
  /** `kime` verilmezse: host gönderiyorsa herkese, istemci gönderiyorsa host'a. */
  gonder(m: OdaMesaji, kime?: string): void;
  dinle(fn: (z: Zarf) => void): () => void;
  durum(fn: (d: BaglantiDurumu) => void): () => void;
  ayril(): Promise<void>;
}
```

Bağdaştırıcılar:

| | Kullanım | Uygulama | Varlık algısı (kopma) |
|---|---|---|---|
| **bellek** (yalnız test) | vitest: host + N sanal istemci tek süreçte | `bellekHub()` → her üyeye bir `RoomTransport`. Mesajı sıraya koyar; testte elle boşaltılır, kasıtlı düşürme/geciktirme/çoğaltma kancası var (`hata: { dusur, cogalt, geciktir }`) | `hub.kopar(id)`, `hub.bagla(id)` |
| **(a) sekme** BroadcastChannel | Aynı tarayıcıda sekmeler: geliştirme, "GM bilgisayarda + oyuncu sekmesi", O1 deneyleri | Kanal `dice-hex-oda-<kod>`. Host kanalda kodu sahiplenir: `kim_var` sorar, 300 ms yanıt gelmezse kod onundur. Zarf olduğu gibi gönderilir (yapısal kopya) | Her üye 5 sn'de bir `nabiz` atar, 15 sn duyulmayan "koptu" sayılır. `pagehide`'da `ayril` |
| **(b) yerel-ağ** WebSocket aktarıcı | Aynı Wi-Fi'daki cihazlar | Bilgisayarda `npm run oda-sunucu` (`scripts/oda-sunucu.mjs`, node): **tek port**ta hem `dist/`'i sunar hem `/oda` yolunda WebSocket aktarır. Açılınca yerel IP adreslerini ve bağlantı adresini yazar (`http://192.168.x.x:5180`). Telefonlar uygulamayı bu adresten açar, böylece aynı köken olur, CORS ve karışık içerik sorunu çıkmaz. Sunucu oda kodu → {host, istemciler} eşlemesini tutar, `kimden`'i soket kimliğinden **kendisi** yazar, mesajı iletir. Kalıcılık ve oyun mantığı yok. Geliştirmede aynı aktarıcı Vite eklentisiyle `npm run dev -- --host`'a da takılır (`configureServer` upgrade). | WebSocket kapanışı + 15 sn ping/pong. Sunucu `uye_gitti` yayar |
| **(c) supabase** Realtime | İnternet üzerinden (O5) | Yer tutucu: kanal `oda:<kod>`, Broadcast mesajları, Presence ile varlık. Kimlik anonim oturum, sonra Google girişi. Mesaj boyutu sınırı yüzünden `anlik` parçalı gönderilir (`parca i/n`, §3). Ayrıntı O5'te. | Presence |

Seçim arayüzde tek yerde yapılır (`baglantiSec(ayar)`). Oyun kodu hangi bağdaştırıcıda olduğunu bilmez.

---

## 3. Mesaj protokolü

Bütün mesajlar `{ t: <tür>, ... }` biçiminde düz JSON'dur. Doğrulayıcı `src/room/protocol.ts` `mesajMi(x)` bilinmeyen türü, eksik alanı ve aşırı boyutu (öneri 4 MB) reddeder. Bozuk mesaj sessizce atılır, testte sayılır.

**İstemci → host**

| Tür | Alanlar | Not |
|---|---|---|
| `katil` | `istemciId`, `ad`, `anahtar?`, `sonSeq?`, `protokol`, `uygulama`, `kuralSurumuAzami` | İlk giriş anahtarsızdır. Yeniden girişte anahtar ve `sonSeq` gelir. |
| `karakter_gonder` | `kopya: SavedCharacter`, `paketler?: PaketJson[]` | Yalnız lobi/kurulumda. Kopya `characterProblems` ve dış içerik şemasıyla doğrulanır. |
| `karakter_geri_al` | `karakterId` | Lobide partiden çıkma (`leaveRoom`). |
| `komut` | `istekId`, `cmd: Command`, `tabanSeq` | `istekId` istemcide benzersizdir; host istemci başına son 64'ünü tutar, aynısı gelirse ilk sonucu yeniden yollar (çift dokunuş, yeniden gönderim). `tabanSeq` yalnız bilgi amaçlı; motor komutu güncel durumda yine doğrular. |
| `zar_cevap` | `istekId`, `degerler: number[]` \| `otomatik: true` | Yalnız `zar_iste` gönderilen istemciden kabul edilir. |
| `tepki_cevap` | `istekId`, `cevap: ReactionAnswer` | Yalnız `tepki_sor` gönderilen istemciden kabul edilir. |
| `yakala` | `sonSeq` (−1 = tam anlık) | Boşluk ya da özet tutmazlığında. |
| `ayril` | — | Bilerek çıkış: karakter "ayrıldı" sayılır (kopma değil). |
| `nabiz` | — | Yalnız aktarıcı varlık algısı yapamıyorsa (sekme). |

**Host → istemci(ler)**

| Tür | Kime | Alanlar |
|---|---|---|
| `kabul` | katılana | `istemciId`, `anahtar`, `rol`, `karakterler: string[]` (yönettiği savaşçıların `ownerId`'leri) |
| `red` | katılana | `neden: 'surum' \| 'anahtar' \| 'dolu' \| 'kilitli' \| 'kapali'`, `ayrinti?` |
| `oda_durumu` | herkes | `ad`, `asama: 'lobi' \| 'kurulum' \| 'savas' \| 'bitti'`, `uyeler: {istemciId, ad, rol, bagli, karakterler}[]`, `kurallarOzeti` (`rulesSummary`), `hpGorunurluk`, `zarModu`, `yzKarakterler: string[]` |
| `anlik` | katılana / yakalayana | `seq`, `olaylar: BattleEvent[]` **ya da** `{ tabanSeq, durum, sonOlaylar }`; büyükse `parca: {i, n, kimlik}` |
| `olaylar` | herkes | `ilkSeq`, `olaylar: BattleEvent[]`, `istekId?` (komutun sahibi kendi isteğini tanısın), `kimden?` (komutu gönderen istemci) |
| `komut_red` | gönderene | `istekId`, `neden: 'yetki' \| 'gecersiz' \| 'bekle' \| 'izleyici'`, `hata?` (motorun `fail` metni; `reasons.ts` ile okunur ad) |
| `zar_iste` | zarı atacak oyuncu | `istekId`, `istek: DiceRequest`. Ötekilere yalnız `bekleniyor{kim, tur:'zar'}` gider, içerik gitmez. |
| `tepki_sor` | tepki sahibi | `istekId`, `istek: ReactionRequest`, `sureMs` (öneri 20 000; dolunca motorun `suggested` önerisi). Ötekilere `bekleniyor{kim, tur:'tepki'}`. |
| `ozet` | herkes | `seq`, `hash` |
| `uye_durumu` | herkes | `istemciId`, `bagli`, `karar?: 'bekle' \| 'yz' \| 'gm'` (O4) |
| `karakter_sonuc` | karakterin sahibi | `karakterId`, `durum` (savaş sonu HP/kaynak/slot/Exhaustion; bkz. Karar bekleyen 8) |
| `oda_kapandi` | herkes | `neden` |

**Kopma ve yeniden bağlanma akışı**

1. Aktarıcı `uye_gitti` bildirir ya da nabız gelmez. Host üyeyi `bagli:false` yapar, `uye_durumu` yayar.
2. Sıra o oyuncunun karakterine gelmişse host bekler ve GM'e karar menüsünü açar (O4): **Bekle** / **Yapay zekâ oynasın** / **GM oynasın** (GM o turu kendi cihazından yönetir) / **Turu atla** (`end_turn`).
3. O oyuncuya açık bir `zar_iste`/`tepki_sor` varsa: tepki süre dolunca öneriyle, zar GM'in "otomatik at" düğmesiyle çözülür.
4. Oyuncu geri gelince `katil{istemciId, anahtar, sonSeq}` gönderir → `kabul` + eksik `olaylar` ya da `anlik`. Karar `yz` ise sıradaki turdan itibaren kontrol oyuncuya döner. O an oynanan turu yapay zekâ bitirir.

**Yetki reddi:** motor çalışmaz, olay üretilmez, yalnız `komut_red` döner. Aynı istemciden art arda gelen yetkisiz komutlar sayılır; 20'yi geçince GM'e bir uyarı satırı düşer (kötü niyet ya da hata).

---

## 4. Filtreli görünüm ve yetki

### 4.1 İzleyici modeli

Tek ekranda "kimin gözünden" bilgisi bugün sıradaki savaşçıdan türetiliyor (`src/ui/stealthView.ts` `viewerOf`). Ağda bu bilgi
cihaza sabitlenir:

```ts
// src/room/view.ts (saf)
export type Izleyici =
  | { tur: 'gm' }                                         // her şeyi görür (+ "Gizli alanlar" / gizli jeton anahtarları)
  | { tur: 'oyuncu'; ownerIds: string[]; savasciIds: string[] }  // kendi savaşçıları + aynı taraf
  | { tur: 'izleyici' };                                  // oyuncu görünümü, kendi savaşçısı yok
export function izleyiciGorunumu(state: BattleState, iz: Izleyici): GorunumBayraklari;
```

Çizim katmanı (`MapBattle`, jeton, günlük, önizleme, çekmece) bugünkü `viewerOf(state)` yerine bu izleyiciyi alır. Tek cihazda
izleyici yine sıradakinden türer, yani davranış değişmez.

### 4.2 Gizlenecek bilgi: motorda ne var, ne eksik

| Bilgi | Bugün var | Eksik (ağ için) |
|---|---|---|
| **Düşman HP'si** | 4 kademe `gizli/etiket/yuzde/tam` (`src/oda/active.ts` `HpVis`, `src/oda/hp.ts` `hpBand`/`hpBarFraction`); oda ayarı `hpGorunurluk`, kayıtta `hp`; yalnız arayüz. | Kademe tek global değişkende (`enemyHpVis()`): GM de aynı kademeyi görüyor. İzleyiciye bağlanmalı (`gm` → `tam`). Günlük satırlarında sayıyla hasar ve kalan HP (`src/ui/log.ts`), hasar sayıları (`damageFloats`), hamle önizleme kartındaki hedef HP'si, çekmece/stat kartındaki azami HP ve `hp_pool_*` olayları da aynı kademeye göre süzülmeli. Bu yerlerin tamamı O3'te taranıp listelenecek. |
| **Gizli tuzak** | Bulunmamış tuzak kimseye çizilmiyor (Bilinen eksikler: "GM'e gizli tuzak görünümü: yok"). Oyuncu tarafı bu yüzden zaten güvenli. | GM görünümünde tuzak katmanı yok; ağda GM'in tuzağı görebilmesi gerekiyor. Tuzak verisi harita kuralında, yani her istemcinin durumunda da duruyor (§4.4). |
| **Gizli nesne** | `concealed(state, o)`, `objectShown(state, o, gmView)` (`src/battle/hiddenObjects.ts`), `shownTerrainName`; bulunca `object_changed.found`. | `gmView` bugün ekran anahtarı; izleyiciden gelmeli. Başka eksik yok. |
| **Gizli alan** | Taraf düzeyinde `zoneShownTo(state, z, side, showAll)`, yaratık düzeyinde `zoneKnownBy(z, c)` (`src/battle/hiddenZones.ts`): Spike Growth kamuflajı `hiddenFrom`/`seenBy`, Phantasmal Force `visibleTo`; fark edince `zone_spotted`. | Oyuncu görünümü taraf düzeyinde: Phantasmal Force hedefinin yanılsamasını partinin bütün cihazları görüyor. İzleyicinin kendi savaşçılarıyla `zoneKnownBy` kullanılmalı (öneri: yanılsama yalnız hedefin oyuncusunda). Alan olayları (`zone_created`) günlükte de süzülmeli. |
| **Gizlenen düşmanın yeri** | Gözlemciye göre `hiddenTo` (`src/battle/k74Surum.ts`, Truesight dahil), `knowsWhere`, `canSeeTarget` (`src/battle/sight.ts`), `canSee` (`maprules.ts`); arayüzde `tokenView` → `invisible` (`stealthView.ts`). Hedef listeleri gizleneni dışlıyor (`ReadyPanel`). | `tokenView` izleyici parametresi almıyor. Gizli düşmanın `moved` yolu animasyonda ve günlükte ("X yürüdü") görünüyor; ses ve efekt (`fxShots`) de konum veriyor. Bunlar izleyiciye göre süzülmeli: görünmeyen yaratığın olayı "bir şey hareket etti" kalıbına iner ya da hiç çizilmez. Karanlıkta görülmeyen düşman için savaş sisi yok (tek ekranda herkes her jetonu görüyor). Öneri: ilk sürümde yalnız Hide/`hidden`; karanlık sisi sonra, ayrı karar. |
| **GM notları** | Büyü kartı/günlükte `gmNote`, `sigmayan` (`sigmayanNote`); Game Master panelleri (Hedefler, Gruplar/devriye rotası, Kural paneli, Nesne aracı) ayrı ekran ve rota. | Günlük girdilerinde görünürlük etiketi yok (`src/ui/logEntries.ts`). `gmOnly` sınıflandırması eklenmeli: GM notu, uyuyan grubun pasif Algı zarları, `dragon_perception`, `rouse_roll`, devriye (`patrol_moved` gizli grupta), alarm hazırlığı. GM panelleri oyuncu cihazında hiç yüklenmez. |
| **Sırası gelmemiş fiziksel zar** | Zar modu `askFor(mode, isPlayer)`, `NeedDice`/`DiceRequest`, `rollTag(rng, {by, kind})` etiketi, `dice_rolled`. Zar ancak adım bitince olaya yazılıyor. | İstek yalnız sahibine gider (§3), içerik başkasına sızmaz. `isPlayer` bugün "parti mi"; ağda "hangi istemci" sorusuna dönüşmeli (`ownerId` → istemci). GM'in gizli zarları (gizlenen düşmanın Stealth toplamı, GM'in `skill_check`'i) `dice_rolled` ile herkese gidiyor: oyuncu görünümünde zar animasyonu ve değeri `kind`'a göre gizlenmeli (liste O3'te). |
| **Yetki** | `canControl(c, ctx)`: parti savaşçısı `c.ownerId === ctx.playerId`, düşman/masum `ctx.isGm` (`src/battle/common.ts`); GM komutları `commands.ts`'te `ctx.isGm` denetimi; çağrılan yaratık sahibinin `ownerId`'sini alır (`summons.ts`); Dominate'te `allegiance` ile `ownerId` yönetene geçer; kontrollü binek `controlledBy`. | Arayüz bugün bağlamı komuttan türetiyor (`src/ui/session.ts` `contextFor`, `dispatch`). Kuru çalıştırmalar `isGm: true` veriyor (`hud.ts` `spellTargets`). Host bağlamı **gönderen istemciden** kurmalı, istemcinin söylediği bağlama asla güvenmemeli: `ctx = { playerId: cmd'nin savaşçısının ownerId'si, isGm: false }`, ama yalnız o `ownerId` istemcinin `karakterler`'indeyse. `actorId`'siz komutlar ve kurulum komutları yalnız GM'den. Zar ve tepki yanıtları yalnız sorulan istemciden. İzleyici hiç komut gönderemez. "Yapay zekâ oynasın" işaretli karakterin komutu oyuncudan gelirse reddedilir (`bekle`). |

### 4.3 Bir oyuncu başkasının komutunu gönderemez

Host'taki denetim sırası (`src/room/auth.ts`, saf):

1. Gönderen bağlı mı ve rolü `oyuncu` mu? Değilse `izleyici`.
2. Komutun `actorId`'si var mı? Yoksa yalnız GM gönderebilir.
3. `state.combatants[actorId].ownerId` gönderenin `karakterler` listesinde mi? Değilse `yetki`. (Çağrılan yaratık sahibinin `ownerId`'sini taşır; Dominate edilen yaratığınki yöneteninki olur.)
4. Karakter yapay zekâya verilmişse `bekle`.
5. `execute(state, cmd, { playerId: ownerId, isGm: false }, rng)` çalışır. Motorun kendi denetimleri (sıra, eylem ekonomisi, `canControl`) ikinci kat olarak kalır.

### 4.4 Gizliliğin düzeyi

İki kademe var.

- **Görünüm süzgeci** (O3, önerilen ilk sürüm): ham olaylar herkese gider, bütün süzme `src/room/view.ts` ile çizimde yapılır. Durum bire bir aynı kalır, önizleme doğru çalışır, replay testi basit olur. Bedeli: oyuncu cihazının belleğinde gizli bilgi de durur.
- **Sıkı mod** (sonra, isteğe bağlı): host her oyuncuya **izdüşürülmüş durum** (`izdus(state, izleyici)`) ile yalnız onun görebileceği olayları gönderir. İstemci reducer çalıştırmaz, yamayı uygular. Bunun bedelleri:
  - önizleme gizli bilgiye ihtiyaç duyarsa host'a sorulmalı,
  - durum ayrışma testi izdüşüm üzerinden yapılır,
  - host her komutta oyuncu başına izdüşüm ve fark hesaplar.

  İki kademede de süzme kuralları aynı saf fonksiyondadır, bu yüzden sıkı mod sonradan eklenebilir.

---

## 5. Kod yerleşimi ve paket boyutu

```
src/room/                    saf; React, DOM, localStorage yok (tarayıcı API'si yalnız bağdaştırıcı dosyalarında)
  transport.ts               RoomTransport, Zarf, BaglantiDurumu (yalnız tipler + yardımcı)
  protocol.ts                OdaMesaji birleşik tipi, ODA_PROTOKOL, mesajMi() doğrulayıcı, boyut sınırı, parçalama
  code.ts                    kodUret(rng) (6 hane), kodGecerli()
  host.ts                    OdaHost: üyeler, anahtarlar, seq günlüğü, komut kuyruğu (tek tek), istekId önbelleği,
                             NeedDice/NeedReaction yönlendirme, ozet, yakalama; execute'u enjekte alır (Rng de enjekte)
  client.ts                  OdaIstemci: sonrakiSeq, boşluk/yinelenen, anlik kurma (restoreSession yolu), bekleyen istekler
  auth.ts                    yetki denetimi (§4.3)
  view.ts                    Izleyici, izleyiciGorunumu, olay/günlük süzgeci (§4.2)
  hash.ts                    kanonik JSON özeti (ozet mesajı)
  adapters/
    memory.ts                bellekHub (test; hata enjeksiyonu)
    broadcast.ts             (a) BroadcastChannel
    websocket.ts             (b) tarayıcı WebSocket istemcisi
    supabase.ts              (c) yer tutucu (O5; SDK tembel import)
scripts/oda-sunucu.mjs       (b) aktarıcı + dist/ sunucusu (node; pakete girmez); package.json "oda-sunucu"
src/screens/                 OdaScreens.tsx'e "Çevrimiçi aç" (kod gösterir) ve "Kodla katıl"; yeni OdaLobi.tsx (tembel)
src/ui/                      MapBattle'a sürücü: `SavasSurucusu` (yerel = bugünkü dispatch; uzak = OdaIstemci.gonder);
                             izleyici prop'u; bağlantı/bekleniyor rozeti
src/i18n/strings.ts + .en.ts metinler (iki dosyaya birlikte)
```

- **Sınırlar.** `src/room/*` motoru (`execute`, `applyEvent`, `replay`) içe aktarır. Motor `src/room/`'u hiç içe aktarmaz. `src/oda/model.ts` yerel kayıt olarak kalır. Çevrimiçi parti girdisi (`{ karakterId, istemciId, kopya }`) O1'de bu modele eklenir ve `ODA_SURUM` 1 → 2 olur. Bu oda kaydının sürümüdür; savaş kaydı ve kural sürümü değişmez.
- **Tembellik.** `src/room/` yalnız tembel ekranlardan (`OdaKur`/`OdaKatil` zaten `lazy`, yeni `OdaLobi`) ve savaş parçasından dinamik `import()` ile yüklenir. Ana parça (`App.tsx`, giriş ekranı) `src/room/`'u statik içe aktarmaz. Supabase SDK yalnız (c) seçilince indirilir.
- **Paket bütçesi.** Ana parçaya etki ≈ 0 kB; yalnız menüdeki metinler, hedef ≤ 2 kB. Denetimi `scripts/paket-siniri.mjs` yapar (500 kB, şu an ≈457 kB). `src/room/` tahmini 25–40 kB, ayrı parçada.

---

## 6. Test planı

Hepsi vitest, node ortamı; görsel yok. Tohumlu Rng (`seeded`) ve `scripted` kullanılır.

1. **Protokol** (`protocol.test.ts`): her mesaj türü için geçerli ve bozuk örnek, boyut sınırı, parçalama/birleştirme.
2. **Bire bir replay** (`host.test.ts`): `bellekHub` + host + iki sanal istemci (A: `pc1`, B: `pc2`) + GM. Aynı komut dizisi (kurulum, hareket, saldırı, büyü, düşman yapay zekâ turları) aynı tohumla iki kez oynanır: (i) tek cihaz `dispatch` yolu, (ii) oda üzerinden. Beklenen:
   - host durumu ≡ (i)'nin durumu,
   - A'nın durumu ≡ B'nin durumu ≡ host durumu (`toEqual`),
   - `replay(host.olaylar)` ≡ host durumu,
   - olay günlükleri bire bir aynı.
3. **Yetki** (`auth.test.ts`): A, B'nin savaşçısı için komut gönderir → `komut_red{yetki}`, olay yok, seq değişmez. Oyuncu GM komutu (`set_hp`, `place_surface`, `actorId`'siz) gönderir → red. İzleyici komut gönderir → red. Çağrılan yaratığı sahibi yönetir, başkası yönetemez. Başkasına sorulmuş `zar_cevap`/`tepki_cevap` → yok sayılır.
4. **Zar ve tepki uzaktan:** zar modu `players`; A'nın saldırısı `NeedDice` → yalnız A'ya `zar_iste` gider, B'ye yalnız `bekleniyor`. A değer girer → sonuç, aynı değerlerle yerel `enterDice` yolunun sonucuyla aynı. Tepki sorusu süre dolunca `suggested` uygulanır.
5. **Ağ hataları:** hub mesaj düşürür → istemci boşluğu fark eder, `yakala` ister, sonunda durum eşit. Mesaj çoğaltma → yinelenen atlanır. `istekId` tekrarı → komut bir kez çalışır.
6. **Kopma ve yeniden bağlanma** (`reconnect.test.ts`): A savaş ortasında kopar, host 10 komut daha işler (GM kararı `yz`: A'nın turunu `chooseCommand` oynar). A doğru anahtarla döner → eksik olaylar → durum eşit. Yanlış anahtar → `red{anahtar}`. Günlük eşiği aşılınca `anlik` durum tabanına geçer, yine eşit.
7. **Geç katılan:** savaş 30 olay ilerledikten sonra katılan izleyici `anlik` ile kurar → eşit.
8. **Özet:** istemci durumunu elle bozan test → `ozet` tutmaz → tam anlık → düzelir.
9. **Görünüm süzgeci** (`view.test.ts`, O3): her gizli bilgi türü için bir sahne (gizlenen düşman, Spike Growth, Phantasmal Force, gizli nesne, `hpGorunurluk` 4 kademe, GM notlu günlük girdisi, gizli `dice_rolled`). GM izleyicisi görür, oyuncu izleyicisi görmez, kendi gizlenen savaşçısı "hidden-own" çizilir.
10. **Bağdaştırıcılar:** `broadcast.test.ts` (node 22'de `BroadcastChannel` global, iki örnek); `websocket.test.ts` (O2) `scripts/oda-sunucu.mjs`'yi rastgele portta başlatır, iki istemciyle 2. testi tekrarlar.
11. **Uçtan uca (elle/betik, `npm test` dışında):** `node scripts/oda-e2e.mjs`: Playwright ile iki tarayıcı bağlamı (GM + oyuncu), oda sunucusu üstünden kur → katıl → savaş → hamle. Tek ekran görüntüsü.
12. **Gerileme:** tek cihaz yolu değişmez. Mevcut `MapBattle`/`dikeyYerlesim`/oda testleri (`od1-oda`, `od1b`, `od1c`) olduğu gibi geçmeli.

---

## 7. Aşamalar

Büyüklük: **K** küçük (≈1 oturum), **O** orta (2–3), **B** büyük (4+).

| Aşama | Kapsam | Büyüklük | Bitti ölçütü |
|---|---|---|---|
| **O1** Bağlantı arayüzü + oda kodu + sekmeler arası | `transport.ts`, `protocol.ts`, `code.ts`, `host.ts`/`client.ts` çekirdeği (seq, anlik, yakala, ozet), bellek ve BroadcastChannel bağdaştırıcıları. Arayüz: Oda kur'da "Çevrimiçi aç" (kod gösterir), Odaya katıl'da "Kodla katıl", lobi (üyeler, bağlı/kopuk, karakter kopyası gönder/geri al), `ODA_SURUM` 2. Savaş **salt izleme**: oyuncu sekmesi GM'in savaşını canlı görür. Günlük boyutu ölçümü. | O | Aynı tarayıcıda iki sekme: GM oda açar, oyuncu kodla katılır ve karakter kopyası gönderir, GM savaşı başlatır, oyuncu sekmesinde her komut anında görünür. Testler 1, 2 (izleme), 5, 7, 8 yeşil. Ana parça +≤ 2 kB. typecheck/build/check:harita/check:ses yeşil. |
| **O2** Yerel ağ aktarıcı + canlı savaş | `scripts/oda-sunucu.mjs` + `npm run oda-sunucu`, WebSocket bağdaştırıcısı, Vite geliştirme eklentisi. `SavasSurucusu` (yerel/uzak), oyuncu kendi cihazından komut gönderir; uzak `zar_iste`/`tepki_sor` istemleri (mevcut zar tepsisi ve tepki sorusu yeniden kullanılır); temel yetki (§4.3 adım 1–3, 5). | B | Aynı Wi-Fi'da bilgisayar (GM) + iki telefon: telefonlar bilgisayarın yazdığı adresten uygulamayı açar, kodla katılır, kendi karakterleriyle tam bir savaş oynar; fiziksel zar modunda zarı kendi telefonundan girer. Testler 2 (komutlu), 3 (temel), 4, 10 yeşil. Tek cihaz yolu değişmedi. |
| **O3** Filtreli görünüm + yetki | `view.ts` izleyici modeli; §4.2'deki eksiklerin hepsi (HP kademesi izleyiciye bağlı, `tokenView` izleyicili, gizli düşmanın olay/animasyon/günlük süzgeci, `zoneKnownBy` oyuncu düzeyi, gizli nesne, GM tuzak katmanı, `gmOnly` günlük girdileri, gizli zarlar). Tam yetki matrisi (izleyici, yapay zekâdaki karakter, GM komutları, yanıt sahipliği, yetkisiz komut sayacı). | O | Testler 3 (tam), 9 yeşil. Elle: oyuncu telefonunda gizlenen ork, Spike Growth, gizli sandık ve "gizli" HP görünmez; GM'de görünür. Tek cihaz davranışı aynı. |
| **O4** Kopma, yeniden bağlanma, GM karar menüsü | Anahtarlı yeniden giriş, eksik olay ya da anlık ile yakalama, GM karar menüsü (bekle / yapay zekâ oynasın / GM oynasın / turu atla), açık zar/tepki isteklerinin çözümü, host sayfası yeniden açılınca odayı aynı kodla diriltme (`SAVE_KEY` + oda kaydı), Wake Lock, kopukluk rozetleri. | O | Test 6 yeşil. Elle: savaş ortasında oyuncunun Wi-Fi'ı kesilir; GM "Yapay zekâ oynasın" der, tur oynanır; oyuncu döner ve kaldığı yerden devam eder. GM sayfayı yeniler, savaş ve oda geri gelir, iki istemci kendiliğinden yeniden bağlanır. |
| **O5** Supabase bağdaştırıcısı | `adapters/supabase.ts` (Realtime Broadcast + Presence, anonim oturum, parçalı `anlik`), ortam ayarı, katılım onayı, sonra Google girişi. İsteğe bağlı sıkı mod (§4.4) burada karara bağlanır. | B | Farklı ağlardaki iki cihaz kodla aynı odada savaş oynar; O1–O4 testleri bağdaştırıcı değişmeden geçer. Mesaj boyutu sınırı parçalamayla aşılır. Ana parça değişmez (SDK tembel). |

---

## 8. Riskler ve karar bekleyenler

1. **Gizliliğin düzeyi.** Ham olaylar her oyuncuya gidince gizli bilgi tarayıcı araçlarıyla okunabilir. **Öneri:** O3'te görünüm süzgeci (ev masası için yeterli; durum aynı, önizleme doğru). Sıkı modu (host'un izdüşürdüğü durum) O5'te, yalnız internet odaları için ayrıca karara bağla.
2. **Host cihazı uyur ya da arka plana düşer.** Telefondaki GM sekmesi kilitlenince WebSocket kopar, zamanlayıcılar kısılır ve bütün oda durur. **Öneri:** GM için bilgisayar/tablet önerisi. Savaş ekranında Screen Wake Lock API. Host her komutta zaten kaydettiği için O4'teki "odayı aynı kodla dirilt" yolu en kötü durumu kurtarır.
3. **Uygulama sürümü uyumsuzluğu.** Farklı build'deki reducer farklı durum üretir ve sessizce ayrışır. **Öneri:** `katil`'de build kimliği eşitliği zorunlu (`red{surum}` + "sayfayı yenile"), artı `ozet` hash denetimi. Yerel ağda telefonlar uygulamayı oda sunucusundan açtığı için normalde zaten aynı build'i alırlar.
4. **Dış içerik paketi.** Oyuncunun karakteri GM cihazında olmayan bir paket alt sınıfını kullanabilir (mobilde `icerik/` yok). GM tarafında `combatantFromSheet` alt sınıfı bulamaz. Savaş başladıktan sonra sorun yok, çünkü paket `Combatant.paket`'e kopyalanır. **Öneri:** `karakter_gonder` karakterin kullandığı paket JSON'unu da taşısın. GM tarafında şema doğrulamasından geçirilip **yalnız oda belleğine** (localStorage'a değil) yüklensin, GM listede "dış içerik" uyarısını görsün.
5. **Aktarıcı için bağımlılık.** Node'da yerleşik WebSocket sunucusu yok. **Öneri:** `ws` paketini `devDependency` olarak ekle (yalnız `scripts/oda-sunucu.mjs`, uygulama paketine girmez). Alternatif: ≈150 satırlık kendi el sıkışma ve çerçeve kodu, bağımlılıksız ama bakım yükü var.
6. **Mobil/APK ve şifresiz bağlantı.** Uygulama `https`'ten ya da APK WebView'dan açılırsa `ws://192.168…` karışık içerik ya da cleartext yasağına takılır. **Öneri:** yerel ağda oyuncular uygulamayı oda sunucusunun kendi `http://` adresinden açsın (sunucu `dist/`'i de sunar). APK için cleartext izni ayrı karar. İnternet odaları O5'te `wss://` (Supabase) ile.
7. **Oda kodu güvenliği.** 6 hane tahmin edilebilir; internette biri odaya düşebilir. **Öneri:** yerel ağda yeterli. O5'te GM'in **katılım onayı** ("X katılmak istiyor: Kabul/Ret"), aktarıcıda hız sınırı, savaş sürerken yeni katılımı yalnız izleyici olarak almak.
8. **Savaş sonucunun karaktere dönüşü.** Bugün savaş sonu HP/kaynak/slot/Exhaustion karakter kaydına yazılıyor. Çevrimiçide karakter oyuncunun cihazında, savaştaki ise kopya. Oyuncu bu arada karakteri değiştirmiş olabilir. **Öneri:** savaş bitince host her sahibine `karakter_sonuc` göndersin, oyuncu cihazı otomatik uygulasın. Kopyada `kopyaZamani` damgası tutulsun; asıl karakter o tarihten sonra değişmişse "Savaş sonucu uygulanacak: üzerine yaz / atla" sorulsun. Savaş ortasında yeni karakter eklenmesin (yalnız kurulumda).
