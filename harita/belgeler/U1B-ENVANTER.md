# U1b envanteri: alt sınıf uçuş verisi (Kuyruk U1b, Görev 0)

Durum: kural sürümü 67 (güncel), uçuş kademeleri 61+ (U1a). Bu iş **yalnız veri**: yeni ilkel/alan/komut yok. Paket dosyaları
(`icerik/`) gitignore'da; commit'lenen: bu belge, envanter betiği ve testi, doğrulama, DECISIONS.md.

## 0. ENGEL: `icerik/` bu çalışma kopyasında yok

Görev 0 (a) paketlerin kendisini okumayı ister. Bu bulut kopyasında `icerik/` klasörü yok (`ls icerik` → yok; `data/custom/` de yok;
U1a belgesi de aynı durumu not etmişti). Bu yüzden **(a) paket düzeyinde yapılamadı** ve Görev 1 (veriyi bağlama) bu kopyada
başlatılmadı: paket özellik kimlik/ad/seviyesi tahmin edilemez ("tahmin etme" kuralı), `scripts/ek-yama.mjs` de özelliği
sınıf + alt sınıf + TR ad + seviyeyle eşler (hepsi pakette).

Yerine konanlar:
- **Envanter betiği** (yeni, commit'li): `node scripts/u1b-envanter.mjs [klasör] [--yaz]` (mantık `scripts/lib/ucus-envanter.mjs`,
  test `src/content/ucusEnvanter.test.ts`). Yerelde `icerik/` üstünde çalıştırılınca bölüm 1'in gerçek tablosunu verir: uçuşla ilgili
  her özellik (kimlik · ad · seviye · durum), `ucus` ilkeli parametreleri (bilinmeyen alan `?` önekli), `bicim.ucusFt`, `cagir`, phase
  (`engeldenGec`), metinde uçuş sözcüğü işareti ve uçan paket yaratıkları (`hiz.ucma`; `hiz.ucus` yanlış anahtar olarak işaretlenir).
  Çıktıda paket metni yok; `--yaz` `harita/belgeler/U1B-ENVANTER-YEREL.md` yazar (gitignore'da).
- **İzlenen kaynaktan alt sınıf eşleşmesi** (`icerik-liste.txt`, 96 satırlık eski liste): bölüm 1.

## 1. (a) Görevdeki alt sınıf listesi → paket listesi eşleşmesi

Kaynak: `icerik-liste.txt` (depoda izlenen eski döküm; güncel `icerik/` ile farklı olabilir). Eşleşme yalnız kimlik ya da TR ad üzerinden.

| Sınıf | Görevdeki ad | Listede | Not |
|---|---|---|---|
| cleric | Fırtına | `firtina-alani` | |
| cleric | Yakamoz | `yakamoz-alani` | |
| fighter | Hissi Kablel | `hissi-kablel` | |
| monk | Ejderha Disiplini | `ejderha-disiplini` | |
| monk | Element Disiplini | `element-disiplini` | veri yok (Fly büyü yolu) |
| paladin | İntikam Yemini | `intikam-yemini` | |
| rogue | Kamufle | `kamufle` | |
| sorcerer | **Pulkanat** | **bulunamadı** | listede sorcerer: alevbaz, ceren-urperten, ilahi-kan, lanetli, otonom-evren, paratoner, titan-kani. Yazım farkı ya da paket güncel listede olabilir: tahmin edilmedi. |
| sorcerer | İlahi Kan | `ilahi-kan` | |
| sorcerer | Paratoner | `paratoner` | |
| warlock | Cin | `cin` | |
| warlock | Gulyabani | `gulyabani` | |
| ranger | Ejder Muhafızı | `ejder-muhafizi` | Seviye çelişkisi: bu görev 14, U1a belgesi "15 (kullanıcı)" yazıyor. Pakette neyse o; doğrulanacak. |
| barbarian | Şaman | `saman-yolu` (Şaman Yolu) | uçuş verisi yok (biçim sistemi), dokunulmaz |
| druid | kuş biçimleri | — | Wild Shape/biçim sistemi; dokunulmaz |
| cleric | Aydın (özgün) | `aydin-alani` | |
| warlock | Melek (özgün) | `melek` | |
| wizard | Anka (özgün) | `anka-ogretisi` | `anka-cemberi` druid'in: karıştırılmadı |
| bard | Islık (özgün) | `islik-koleji` | |
| druid | Element Çemberi (özgün) | `element-cemberi` | |
| sorcerer | Alevbaz (özgün) | `alevbaz` | |
| warlock | Ruhsar (özgün) | `ruhsar` | |

**Bulunamayan: Sorcerer Pulkanat.** Tiefling Kanatlı (AS1) kapsam dışı.

Uçuşla ilgili özellik kayıtları (kimlik · ad · seviye · mevcut ilkeller): **bu kopyadan çıkarılamadı** (betiği yerelde çalıştır, çıktıyı ya
da `--yaz` dosyasını ilet). Bilinen tek ikinci el kayıt: `ejder-muhafizi` (çağrılan ejderha uçar, binek yok) ve `ejderha-disiplini`
(seviye bilinmiyor): `harita/belgeler/UCUS-ENVANTER.md` §3.

## 2. (b) U1a kademe sözleşmesi (`ucus` ilkeli; kaynak `src/content/ilkelSema.ts` `ILKELLER.ucus`, çözücü `src/battle/flightPrim.ts`)

| Alan | Anlam / aralık | Notlar |
|---|---|---|
| `tetik` | `pasif` (kalıcı), `bonus`, `eylem`, `savasBasi` | kısa süreli ve süzülme düğmesi `bonus` |
| `hizFt` | uçuş hızı (ft; formül ya da `"yurume"`) | `hizCarpani` ile birlikte yazılmaz. Varsayılan: yürüme hızı |
| `hizCarpani` | yürüme hızı × çarpan, 5'in katına aşağı; 0 < x ≤ 4 | `hizFt` ile birlikte yazılmaz |
| `azamiIrtifaFt` | uçuşla çıkılabilecek en yüksek irtifa; 5'in katı | yoksa haritanın uçuş sınırı (60 ft). Başka sınırsız uçuş kaynağı varsa sınır yok |
| `sureDakika` / `sure` | süre: dakika (1 dk = 10 tur, 0 < x ≤ 600) / tur (1–100, `"kalici"`) | birlikte yazılmaz |
| `kullanim` | `{ "sayi", "yenilenme": "uzun" \| "kisa" }` | yalnız `bonus`/`eylem`; ilkelde `id` gerekir; örtük kaynak `kullanim-<id>`; `kaynak` ile birlikte yazılmaz |
| `kaynak` | `{ "id", "maliyet" }`: ayrı kaynak ilkeli ya da sınıf kaynağı (`focus`, …) | düğme başına bir kez harcar |
| `yeredegmez` | süzülme: zorlu zemin, çamur, tuzak plakası, sığ su işlemez; lav, derin su, zemin alanı büyüleri/yüzeyler işler; K8 verilmez | |
| `zorunluInis` | yalnız kendi turunda uçar; tur sonunda biter, havadaysa düşer | Kırık Kanat kipi |
| `seviyeEsigi` + `esikSonrasi` | eşikten sonra üste yazılan parametreler (2–20) | ikisi birlikte; `esikSonrasi` yalnız uçuş parametreleri |

Kademe kalıpları (DECISIONS.md U1a):
- **Kalıcı:** `{ "tur": "ucus", "tetik": "pasif" }` (+ `"hizFt": 60` gerekirse).
- **Kısa süreli:** `{ "tur": "ucus", "id": "<id>", "tetik": "bonus", "sureDakika": 1, "kullanim": { "sayi": 1, "yenilenme": "uzun" } }`.
- **Süzülme:** kısa süreliye `"azamiIrtifaFt": 5, "yeredegmez": true`.

## 3. (c) Mevcut ırk uçuşları (dokunulmaz)

| Kaynak | Seviye | Eylem | Hız | Süre | Kullanım | Yer |
|---|---|---|---|---|---|---|
| Dragonborn Draconic Flight | 5 | bonus eylem | yürüme hızı | 10 dk (100 tur) | uzun dinlenmede 1 (kaynak `draconicFlight`) | `src/battle/species.ts` (`srdK19` anahtarı), `data/srd/species.json` |
| Celestial Kırık Kanat | 3–12 | Göksel Uyanış (bonus), 10 tur | yürüme hızı × 0,5 | yalnız kendi turunda; tur sonunda iner | uzun dinlenmede 1 | `data/celestial.json` `kirik-kanat.ucus` (sürüm 61+; 60 ve altı `flyFraction`) |
| Celestial Kırık Kanat | 13+ | aynı | yürüme hızı | Göksel Uyanış'ın 10 turu, inmek zorunda değil | aynı | aynı |

## 4. Görev 1 satırları için ifade edilebilirlik ön analizi (mevcut ilkellerle)

"Eksik bir yol çıkarsa DUR" gereği, paket olmadan da görülebilen engeller:

| Satır | Mevcut ilkelle yazılabilir mi | Açık nokta |
|---|---|---|
| Kalıcı (Fırtına 17, İlahi Kan 14, Pulkanat 14, Aydın, Melek) | Evet: `{tur:'ucus', tetik:'pasif'}` | Pulkanat paketi bulunamadı |
| Kalıcı 60 ft (İntikam Yemini 20, Paratoner 18) | Evet: `"hizFt": 60`; haritanın sınırı zaten 60 ft | Paratoner "dostla paylaşım" metni pakette; `ucus` hedefi yalnız kendi (başkasına uçuş verme yolu yok). Varsa **eksik yol** |
| Kısa süreli (Hissi Kablel, Kamufle, Gulyabani, Anka) | Evet (kalıp yukarıda) | Kamufle ve Gulyabani'de aynı özellikte mevcut phase (`engeldenGec`) ilkeli yan yana durabilir (ilkeller listesi); pakette doğrulanacak |
| Cin (6; bonus, 10 dk, 30 ft) | Evet: `"hizFt": 30, "sureDakika": 10` | Kullanım sayısı/yenilenme "kitaba göre": değer bende yok (kullanıcıdan/paketten) |
| Yakamoz (6; loş/karanlık şartı) | Şart **bağlanamaz**: `KOSULLAR` listesinde ışık koşulu yok | Görev kuralı: yalnız metinde bırak, raporla. Uçuş yine kısa süreli |
| Ejderha Disiplini (6; Step of the Wind ile) | Step of the Wind'e doğrudan bağlanamaz: paket ilkellerinde Focus eylemi kancası yok | Görev yedeği: `{tur:'ucus', tetik:'bonus', hizFt:'yurume', kaynak:{id:'focus', maliyet:1}, sure:1}` (ayrı Ki bedelli bonus eylem; `focus` geçerli sınıf kaynağı). "Tur sonuna dek" = `sure: 1`: davranışı Görev 1'de testlenecek |
| Element Disiplini | Veri yok (Fly büyü yolu) | — |
| Ejder Muhafızı (14) | `ucus` yazılmaz; yalnız "binek bekliyor" notu | Çağrılan ejderha `cagir` + yaratık `hiz.ucma` ile zaten uçar (U1a testi) |
| Süzülme (Islık, Element Çemberi, Alevbaz, Ruhsar) | Evet (kalıp yukarıda) | — |
| Özgün eklemeler | Her açıklamaya "kitapta yok, bizim eklememiz" notu | metin değişikliği gerekir (paketin kendi açıklaması) |

## 5. Durma noktası ve yerelde istenenler

1. `node scripts/u1b-envanter.mjs --yaz` (yerel `icerik/` üstünde) → `harita/belgeler/U1B-ENVANTER-YEREL.md` içeriğini ilet; bölüm 1'in
   eksik sütunları (özellik kimlik/ad/seviye, mevcut ilkeller) buradan tamamlanır.
2. Pulkanat için doğru paket adı/kimliği.
3. Cin kullanım sayısı/yenilenme; Ejder Muhafızı seviyesi (14 mü, 15 mi); Paratoner "dostla paylaşım" metninin var olup olmadığı.
4. Görev 1'i yama dosyasıyla (`docs/ek-yama/u1b.yama.json` + `node scripts/ek-yama.mjs`) yapmayı öneririm: yama izlenir, paket
   dosyaları izlenmez. Özellik adları/seviyeleri yukarıdaki çıktıdan gelir.
