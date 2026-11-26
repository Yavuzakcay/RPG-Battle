# KATALOG-1 F — Mühür Ruhu bossları ve evrim çizgileri: tasarım (Aşama 1)

Görev KATALOG-1 F, Aşama 1. Bu dosya yalnızca belgedir: kod, veri ve test değişmedi. Aşama 2 bu belge onaylandıktan ve BOSS-GORSEL-1 `birlesik`'e birleştikten sonra başlar (`public/boss/` ve `data/boss-gorsel.json` yoksa Aşama 2 durur).

- **Dal:** `claude/katalog-1-f-tasarim`, `origin/birlesik` (15a05761) üstünden açıldı.
- **Kural sürümü:** 106 (`data/kural-surumu.json`; SRD-TAMAMLAMA-1 B). Kayıt sürümü bu dalda 25, `birlesik`'te CLAUDE.md'ye göre 27. Aşama 2 yalnızca veri ekler: **ikisi de değişmez**.
- **Ön durum:** KATALOG-1 A–E `birlesik`'te. KATALOG-1 G (anlatım, d917d884) kendi dalında, birleşmedi. SRD-TAMAMLAMA-1 A–C bitti.
- **Kaynak:** depo dışındaki `docs/katalog/` altında iki PDF, `pdftotext -layout` ile okundu:
  - *Kaltakkıran'ın Paladin Zırhı ve On Mühür Taşı Sistemi* (21 s.): §4 taş kademeleri, §5 on Seviye 3 taş, §6 on bölge bossu ve fazları.
  - *Kadim Yaratıklar ve Mücevher Ejderhası Kataloğu*: F2'ye kaldı (§11).

## Onaylar ve kararlar (kullanıcı, 2026-11-26)

| Karar | İçerik |
|---|---|
| K1 (güncellendi) | CR kademeleri: Sv.1 CR 2–3, Sv.2 CR 8–10 (Cimbom CR 10), Sv.3 CR 20–26. **Cimbombom CR 26, en güçlü boss**; diğer dokuzu CR 20–25. Hiçbirinin hasarı, canı ve saldırı sayısı Cimbombom'u geçmez |
| K2 | Fiend; ışıltı çizgisi (Lumbo, Lighty, Lightaur) Celestial |
| K3 | Faz 2 yalnızca Game Master notu; motora faz tetiği eklenmez |
| K4 | Efsanevi direnç 3/gün, efsanevi eylem 3 |
| K5 | Kadim yaratıklar F2'ye |
| K6 | Boyut tablosu (§2) olduğu gibi |
| K7 | Ateş bossu **"Cimbombom, Lion of the Hell"** (`cimbombom`), Sv.2 "Cimbom", Sv.1 "Cim" |
| Ad değişikliği | Zehir bossu **Mothraq** (`mothraq`). PDF'teki eski adlar yalnızca `eskiAd` alanında kalır |
| Ek kurallar | Hazırlıklı parti varsayımı (§3), karşı element zayıflığı, Faz 2'de zayıflığın kalkması, Soulslike desen (§4) |

Onay bekleyen: bu belgedeki bütün sayılar, ayrıca §12'deki K8–K10.

## 0. Önce bilinmesi gereken bulgular

1. **PDF'te bölge bosslarının stat bloğu yok.** PDF §6 yalnızca elementi, bir cümlelik Faz 1 kimliğini ve Faz 2'yi (Taş Uyanışı) verir. §5 bunlara bossun taşından gelen bağışıklığı ve taşın Savaş Sanatı'nı ekler; PDF bu sanatı "bölge boss'undan miras" diye anar. CR, HP, AC, saldırı, nefes ve efsanevi eylem bu belgenin önerisidir.
2. **Motorda faz tetiği yok** (K3). Faz 2'deki her şeyi Game Master elle uygular ve anlatır.
3. **Game Master'ın zayıflığı kaldıracak komutu yok.** Elindeki komutlar `set_condition`, `adjust_hp`, `set_exhaustion` ve `place_surface`.
   - Faz 2'de motorda zayıflık sürer. Game Master karşı elementle gelen her isabette fazla alınan hasarı (alınanın yarısı) `adjust_hp` ile geri verir.
   - Efsanevi `buff` eylemi yarı canda kendiliğinden çalışır ama yalnızca geçici HP ve AC verir (Shimmering Shield, `boss.ts`); direnç veremez. Bu yüzden kullanılmadı.
4. **Canavar eylemleri yüzey oluşturamaz.** PDF sanatlarındaki "alan N tur alev, buz, asit yüzeyi olur" parçaları sığmıyor (§5).
5. **Simülasyon hazırlıklı partiyi kuramaz.** Sim partilerinde elemente karşı direnç ve karşı element büyüsü yok; yeni parti de eklenmeyecek. Boss ölçümleri dirençsiz partiyi ölçer: kural 2 gereği "dirençsiz parti ezilir" sonucu beklenir (K8).

## 1. Kimlik, sınıf ve dosya düzeni (Aşama 2)

- **Sınıf etiketi:** "Mühür Ruhu" / "Seal Spirit". Ad ve unvan İngilizce (SD4), açıklama Türkçe.
- **Veri dosyası:** `data/bosslar-muhur.json`, 30 kayıt, `Monster` biçiminde. `data/monsters.json`'a yazılmaz (`srdCanavar.test.ts` 330 SRD canavarını karşılaştırır).
  - Ek alanlar: `kaynak: "katalog-1"`, `sinif: "muhur-ruhu"`, `element`, `kademe` (1–3), `cizgi`, `eskiAd` (yalnızca bosslarda), `unvan` TR/EN, `ganimet`, `gmNot` (Faz 2), `katalog` (PDF sayfası).
  - Jeton: `avatar: "boss/<kimlik>.webp"`.
- **Güç bağlamaları** mevcut dosyalara yeni anahtarla yazılır:
  - `data/efsanevi.json`: 3 efsanevi eylem
  - `data/canavar-yetenekleri.json`: sanat, `pull`, aura
  - `data/canavar-ekleri-a2.json`: süreli durum, itme, Grappled, AC aşındırma, `escalate`
  - `data/multiattack.json`: sabit sıra
  - `unsupported` dizisi: durum bağışıklığı ve duyular
  - `traits` metni: "Legendary Resistance (3/Day)"
- **Yeni kod yalnızca yükleyicide.** `loadMonsters()` boss dosyasını tembel yükleyip `getMonster` aramasına ekler. Yaratık türü kayıttan okunur. Canavar dizisini 330 sayan bir test varsa bosslar ayrı dizide tutulur. Ana parçaya girmez (sınır 465 kB, şu an 460,93 kB).
- **Ortam:** `data/monster-ortamlari.json`, `tema: "Mühür Ruhları"`. Düğüm yerleşimi Serüven'e kalır.
- **Görsel:** `public/boss/<kimlik>.webp`; bağlama Aşama 2'de yapılır. Ham görseller depo dışında `assets-ham/boss/`: 30 görselin 26'sı var, `mirit`, `mirath`, `darkit`, `darkath` eksik. Görsel yoksa jeton `Avatar`'ın `onError` yedeğine düşer.

| # | Element | Çizgi (Sv.1 → Sv.2 → Sv.3) | Boss adı, unvan | `eskiAd` | Taş (Sv.3 ganimeti) | Tür | Önerilen `ortam` |
|---|---|---|---|---|---|---|---|
| 1 | Ateş | `cim` → `cimbom` → `cimbombom` | Cimbombom, Lion of the Hell | Erimiş Örs Muhafızı | `ember-core` | Fiend | `volkanik-demirhane`, `lav-tapinagi`, `derinlikler-lav-salonu`, `volkan` |
| 2 | Soğuk | `doggie` → `wolfie` → `wolfgang` | Wolfgang, Blizzard Wolf | Tipi Yutan Dev | `frost-heart` | Fiend | `buzul-kayalik`, `buzul-acik`, `buzul-tapinak`, `buzul-kamp` |
| 3 | Yıldırım | `sparkle` → `thunderse` → `stormer` | Stormer, Thunder Stallion | Şimşek Süvarisi | `storm-spire` | Fiend | `dag-kayalik`, `dag-kopru`, `dag-nobetci`, `dag` |
| 4 | Gürültü | `twinkle` → `gongi` → `gongar` | Gongar, Bell Shell Brute | Kör Çan Devi | `resonance-seal` | Fiend | `col-kanyon-nehri`, `col-sutun-harabesi`, `kanyon-koprusu` |
| 5 | Asit | `hydrop` → `hydras` → `hydraxe` | Hydraxe, Sulphur Hydra | Sülfür Hidrası | `dissolution-drop` | Fiend | `batak-cukur`, `batak-adalar`, `batak-kale`, `bataklik` |
| 6 | Zehir | `sporlet` → `mothcoon` → `mothraq` | Mothraq, Spore Moth | Spor Hükümdarı | `venom-essence` | Fiend | `derinlikler-mantar-magarasi`, `orman-kemik-acikligi`, `orman-heykel-golu` |
| 7 | Işıltı | `lumbo` → `lighty` → `lightaur` | Lightaur, Bull of Celestial | Kırık Hale Şövalyesi | `blinding-sun-shard` | Celestial | `kasaba-demirci-tapinak`, `buzul-tapinak`, `lav-tapinagi` |
| 8 | Nekrotik | `cerbit` → `cerbedo` → `cerbones` | Cerbones, Crematorium | Kemik Toplayıcı Lord | `sepulcher-orb` | Fiend | `orman-kemik-acikligi`, `derinlikler-mezar-labirenti` |
| 9 | Psişik | `mirit` → `mirath` → `mirage` | Mirage, Life Stealer | Ayna Zihin Avcısı | `whisper-crystal` | Fiend | `col-sutun-harabesi`, `isinlanma-salonu`, `beyaz-sehir-saray-avlusu` |
| 10 | Kuvvet | `darkit` → `darkath` → `darkape` | Darkape, Kong of the Void | Yörünge Nöbetçisi | `void-fracture` | Fiend | `dag-karakol`, `kanyon-koprusu`, `isinlanma-salonu` |

**Ganimet.** Sv.1 `cracked-elemental-stone-<tür>` (Çatlak Taş), Sv.2 `awakened-elemental-stone-<tür>` (Uyanmış Taş), Sv.3 yukarıdaki benzersiz taş. Bu PDF §4 ile çelişmiyor:

- Sv.1: "sandık, elit ganimet"
- Sv.2: "zindan ara boss'ları"
- Sv.3: "yalnızca 10 Bölge Bossu"

Motor ganimet düşürmez. `ganimet` alanı yalnızca veridir; taş Serüven düğümünün `reward.items` alanıyla verilir.

## 2. Boyut ve harita (K6, onaylı)

`multiHex` kapalıyken her boyut tek altıgen kaplar. Açıkken Large 3, Huge 7 altıgen kaplar. Gargantuan kullanılmaz.

| Boss | Boyut | `multiHex` açık | Harita |
|---|---|---|---|
| Cimbombom, Wolfgang, Gongar, Hydraxe, Mothraq, Cerbones, Darkape | Huge | 7 altıgen | 21×11 ve üstü |
| Stormer, Lightaur | Large | 3 | 15×7 ve üstü |
| Mirage | Medium | 1 | 15×7 ve üstü |

Sv.1 Small; Sv.2 Large (Mirath Medium).

## 3. Sayı modeli: hazırlıklı parti

**Kaynak tablo.** SRD 5.2.1'de canavar yaratma tablosu yok. CR hedefleri DMG 2014'ün "Monster Statistics by Challenge Rating" tablosundandır; bu tablo SRD'de olmadığı için yalnızca hesapta kullanıldı, metni depoya girmez.

**Varsayım 1: hazırlıklı ve dirençli parti (kural 2).** Boss savaşı özeldir. Parti bossun elementine karşı **dirençli** gelir (Sv.2 Uyanmış Taş, Potion of Resistance, Protection from Energy).

- Bossun ham hasarının yaklaşık %75'i element, %25'i fizikseldir.
- Dirençli partiye düşen etkin hasar: ham × (0,75 × ½ + 0,25) = **ham × 0,625**.
- CR'nin saldırı yarısı bu etkin hasara göre seçildi. Dirençsiz parti hasarın tamamını yer, yani 1,6 kat; bilerek ezilir.

**Varsayım 2: hazırlıklı parti karşı elementi de getirir.** Partinin hasarının **f = %25**'i bossun zayıf olduğu elementtendir.

- **Faz 1** (zayıflık açık): parti bossa ×(1 + f) = ×1,25 hasar verir.
- **Faz 2** (zayıflık kalktı): ×1,00.
- Canın ikinci yarısı ilk yarıdan **%25 daha uzun** dayanır. Bu, zayıflık gidince dayanıklılığın artışıdır.
- f = %50 olursa artış %50'dir.
- Zayıflığı olmayan Stormer'da artış yoktur.

**Etkin can:** ham HP × (0,5 / 1,25 + 0,5) = ham HP × **0,90**, üstüne efsanevi direnç 3/gün için +90 (DMG kuralı, kullanım başına 30).

- Lightaur'un yenilenmesi 3 tur için +30 sayıldı.
- Canın savunma yarısı CR bandının ortasına bu etkin cana göre oturtuldu.
- Faz 2'nin %25 uzaması hesaba baştan katıldı; Faz 1 canı ayrıca kısılmadı.

**Faz 2 hasarı.** Motor Faz 2'de aynı hasarı verir. Game Master nefes alanını büyütürse (nefes 2 yerine 3 hedef) tur hasarı nefesin üçte biri kadar artar (§10 "Faz 2 hasarı" sütunu). Faz 2 hem %25 uzun sürer hem büyük nefesle %10 daha sert vurur. Bu yüzden öneri: **parti zorlanıyorsa Game Master nefesi büyütmez**, yalnızca zayıflığı kaldırır.

**Hasar bütçesi (tur başına, ham).** Multiattack %50 (bunun %15'lik payı fiziksel). Nefes, 2 hedef ve 3 turda bir kullanım sayılınca %20. Efsanevi eylemler %30: yakın ceza ve geri vuruş 2 hedef, menzilli ceza tek hedef; geri vuruş fizikseldir.

**Diğer değerler:**

- Saldırı bonusu: CR 20'de +10, CR 21–23'te +11, CR 24–26'da +12.
- Bossun kendi DC'si: CR 20'de 19, CR 21–23'te 20, CR 24–26'da 21.
- PDF taş sanatı DC 16 ve Faz 2 DC 15 **birebir** kalır, yani bossun DC'sinden düşüktür.
- AC 19 (DMG CR 17+); Gongar'ın kabuğu AC 20.

## 4. Soulslike düzeni (on bossun hepsi, yalnızca mevcut mekanik)

- **Az ağır vuruş:** Multiattack 2–3 saldırı, sabit sıra (`data/multiattack.json`). Oyuncu ezberleyebilir.
- **Nefes:** Recharge 5–6, savaşa dolu başlar. İki turluk hazırlık (telegraf) yok; Game Master nefes dolunca anlatım cümlesini okur.
- **Efsanevi eylemler (3/tur, her biri turda bir kez, `oncePerTurn`):**
  1. **Yakın ceza:** kendi çevresinde 10 ft yayılım, element ve çizginin durumu (`save`).
  2. **Menzilli ceza:** 120 ft tek ışın, element (`rays`).
     - Yaklaşık: yapay zekâ en yakın hedefi seçer (`boss.ts`). Game Master oynatırsa en uzaktakini seçer.
  3. **Geri vuruş:** kuyruk, kanat ya da kabuk süpürmesi. 10 ft yayılım, arkası ve yanları dahil, fiziksel + Prone ya da itme. Arkasında durmak güvenli değil.
- **Faz 2 (yarı can):** yalnızca Game Master notu (`gmNot`). Her bossta ortak cümle: **"yarı canda element güçlenir, zayıflık kalkar (karşı element normal hasara döner; direnç ya da bağışıklık olmaz)"**.
  - Uygulama: Game Master karşı elementli isabetlerde fazladan alınan yarıyı `adjust_hp` ile geri verir.
  - Ek olarak hamle değişimi, nefes alanının büyümesi (isteğe bağlı) ve PDF'in Faz 2 arena değişimi gelir; bunlar elle `place_surface`, `set_condition` ve çağırmayla uygulanır.
- **Savaşta bir kez:** PDF taş sanatı (DC 16), `uses: 1`.

Aşağıdaki desen satırlarında "T" = tur, "LA" = efsanevi eylem.

## 5. On boss

Her blokta durum işaretleri: **birebir** (mevcut veri alanı aynen), **yaklaşık** (en yakın mekanik), **sığmıyor** (§6'da listeli). Bloğun Faz 1 ve Faz 2 satırları Game Master'ın okuyacağı anlatım cümleleridir.

### 5.1 `cimbombom`: Cimbombom, Lion of the Hell (Ateş, CR 26)

- **Kimlik:** Huge Fiend, Mühür Ruhu; eskiAd Erimiş Örs Muhafızı.
- **HP / AC / hız:** 627 HP (38d12+380) / AC 19 / 50 ft.
- **Yetenekler:** STR 30, DEX 16, CON 30, INT 10, WIS 18, CHA 22. Yeterlilik +8. Kurtarma DEX +11, CON +18, WIS +12.
- **Savunma:** Ateş bağışıklığı. **Zayıflık: soğuk.** Darkvision 120.
- **Hasar dağılımı:** element %75 / fiziksel %25.
- **Multiattack (sabit):** Bite → Claw → Claw.
  - Her vuruş +12: 2d8+10 fiziksel + 8d10 ateş (ort. 63).
  - Bite'ta yanma eki: tur başı 2d6 ateş, DC 21 CON ile biter (A2 `dot`). Yaklaşık, doğrulanacak.
- **Nefes, Cehennem Kükremesi (Recharge 5–6):** 60 ft koni, DC 21 DEX, 21d10 ateş (ort. 115), başarıda yarı.
- **Efsanevi eylemler:**
  - Kor Halesi: 10 ft, DEX 21, 4d8 ateş.
  - Alev Tükürüğü: 120 ft ışın, +12, 7d10 ateş.
  - Kuyruk Süpürmesi: 10 ft, DEX 21, 2d8+10 ezici + Prone.
- **Sanat (PDF, savaşta 1):** Erimiş Örs Patlaması. 15 ft, DC 16 DEX, 5d6 ateş + 10 ft itme. Birebir; "2 tur alev yüzeyi" sığmıyor.
- **PDF Faz 1 (çekiçle yağ/kor sıçratma):** sığmıyor (yüzey).
- **Desen:**
  - T1: nefes.
  - T2: Bite → Claw → Claw.
  - T3: nefes dolduysa nefes, dolmadıysa Multiattack.
  - Başkalarının turunda: Kor Halesi yakına, Alev Tükürüğü uzağa, Kuyruk Süpürmesi arkaya.
- **Faz 1:** "Lav yeleli aslan dişlerini gösterir. Nefesi kor kokuyor; soğuk değen yerde pulları çatlıyor."
- **Faz 2 (Game Master notu):**
  - Ortak cümle (zayıflık kalkar; soğuk normal hasar).
  - Nefes 60 ft'ten 90 ft koniye (isteğe bağlı).
  - Hamle değişimi: Kuyruk Süpürmesi her turun ilk efsanevi eylemi olur.
  - PDF: kenar altıgenler 3 tur alev yüzeyi (`place_surface`); boss her tur başında 15 ft çevresine 2d6 ateş dalgası (elle).
  - Anlatım: "Göğsündeki Kor Çekirdeği yarılır; alev artık soğukla sönmüyor. Arena kenarları tutuşuyor."

### 5.2 `darkape`: Darkape, Kong of the Void (Kuvvet, CR 25)

- **Kimlik:** Huge Fiend; eskiAd Yörünge Nöbetçisi.
- **HP / AC / hız:** 578 HP (35d12+350) / AC 19 / 40 ft, tırmanma 40.
- **Yetenekler:** STR 30, DEX 14, CON 30, INT 8, WIS 16, CHA 14. Yeterlilik +8. Kurtarma STR +18, CON +18, WIS +11.
- **Savunma:** Kuvvet bağışıklığı. **Zayıflık: psişik** (madde canavarı zihin saldırısına açık).
- **Hasar dağılımı:** %74 / %26.
- **Multiattack:** Fist → Fist → Grab.
  - Her vuruş +12: 2d8+10 fiziksel + 7d10 kuvvet (ort. 58, Cimbombom'un 63'ünün altında).
  - Fist eki 10 ft itme; Grab eki Grappled (kaçış DC 21). Birebir.
- **Nefes, Boşluk Kükremesi (Recharge 5–6):** 60 ft koni, DC 21 STR, 19d10 kuvvet (ort. 104) + Prone.
- **Efsanevi eylemler:**
  - Yerçekimi Halkası: 10 ft, STR 21, 4d8 kuvvet + Prone.
  - Boşluk Taşı: 120 ft ışın, +12, 6d10 kuvvet.
  - Arka Kol Savuruşu: 10 ft, DEX 21, 2d8+10 ezici + 15 ft itme.
- **Sanat:** Yıldız Çöküşü. 30 ft içindekileri 15 ft çeker (STR 16), sonra 10 ft'te 6d6 kuvvet + Prone. Yaklaşık: iki ayrı yetenek.
- **PDF Faz 1:** itme/çekme kombosu. Birebir (`pull` 15 ft, itme eki).
- **Desen:**
  - T1: nefes.
  - T2: Fist → Fist → Grab (tutulan hedef bir sonraki Fist'in hedefi).
  - T3: nefes dolduysa nefes, dolmadıysa Multiattack.
  - LA: yakına Halka, uzağa Taş, arkaya Savuruş.
- **Faz 1:** "Kara kürklü dev, yerçekimini yumruğunda tutuyor. Fısıltılar onu sendeletiyor."
- **Faz 2:**
  - Ortak cümle (psişik normal hasar).
  - Nefes 90 ft (isteğe bağlı).
  - PDF: düşük yerçekimi (itme/çekme +5 ft, elle); her 2 turda bir merkez çekim 15 ft (`pull`'u Game Master tetikler).
  - Anlatım: "Boşluk Kırığı göğsünde açılıyor; artık hiçbir ses aklına ulaşmıyor."

### 5.3 `cerbones`: Cerbones, Crematorium (Nekrotik, CR 24)

- **Kimlik:** Huge Fiend, üç başlı; eskiAd Kemik Toplayıcı Lord.
- **HP / AC / hız:** 527 HP (34d12+306) / AC 19 / 50 ft.
- **Yetenekler:** STR 30, CON 28, WIS 16. Yeterlilik +7. Kurtarma CON +16, WIS +10.
- **Savunma:** Nekrotik bağışıklığı. **Zayıflık: ışıltı.**
- **Hasar dağılımı:** %78 / %22.
- **Multiattack:** Bite × 3 (üç baş, sabit; SRD `heads` kullanılmaz, çünkü baş çoğalıp Cimbombom'un 3 saldırısını aşar).
  - Her vuruş +12: 1d8+10 + 7d10 nekrotik (ort. 53).
  - Can emme: maks. HP düşüşü (`monsterDrain`, isabet). Yaklaşık.
- **Nefes, Krematoryum Nefesi (Recharge 5–6):** 60 ft koni, DC 21 CON, 18d10 nekrotik (ort. 99) + noHeal 1 tur (`effect.noHeal`). Yaklaşık.
- **Efsanevi eylemler:**
  - Kül Halesi: 10 ft, CON 21, 4d8 nekrotik.
  - Kara Kıvılcım: 120 ft ışın, 6d10 nekrotik.
  - Kuyruk Süpürmesi: 10 ft, DEX 21, 1d8+10 ezici + Prone.
- **Sanat:** Kara Alev Kesiği. 25 ft çizgi, DC 16 CON, 5d6 + noHeal. Yaklaşık; maks. HP törpüleme sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: sol, orta, sağ baş.
  - T3: nefes ya da üç baş.
  - LA: Hale yakına, Kıvılcım uzağa, Kuyruk arkaya.
- **Faz 1:** "Üç kafatası aynı anda nefes alıyor; ışık, kemiklerindeki külü dağıtıyor."
- **Faz 2:**
  - Ortak cümle (ışıltı normal hasar).
  - PDF: her tur başı 2 iskelet (`summon` Skeleton; Game Master çağırır); saldırılara +1d8 kara alev ve 10 ft iyileşme yarılaması (elle).
  - Anlatım: "Mezar Küresi kararıyor; ışık artık kemiğe işlemiyor."

### 5.4 `mirage`: Mirage, Life Stealer (Psişik, CR 24)

- **Kimlik:** Medium Fiend; eskiAd Ayna Zihin Avcısı.
- **HP / AC / hız:** 525 HP (50d8+300) / AC 19 / 40 ft.
- **Yetenekler:** STR 30, DEX 18, CON 22, INT 20, CHA 22. Yeterlilik +7. Kurtarma DEX +11, INT +12, CHA +13.
- **Savunma:** Psişik bağışıklığı; Charmed ve Frightened bağışıklığı. **Zayıflık: kuvvet** (yanılsama katı kuvvetle kırılır).
- **Hasar dağılımı:** %78 / %22.
- **Multiattack:** Soul Claw → Soul Claw → Soul Claw.
  - Her vuruş +12: 1d8+10 + 7d10 psişik (ort. 53).
  - İlk pençenin eki Charmed (WIS 21, sonraki turunun sonuna dek; büyüleyene saldırı yok, KALAN100). Birebir.
- **Nefes, Zihin Dalgası (Recharge 5–6):** 60 ft koni, DC 21 INT, 18d10 psişik (ort. 99) + Charmed.
- **Efsanevi eylemler:**
  - Ayna Çığlığı: 10 ft, INT 21, 4d8 psişik + Stunned (sonraki turunun sonuna dek).
  - Zihin İğnesi: 120 ft ışın, 6d10 psişik.
  - Yansıma Süpürmesi: 10 ft, DEX 21, 1d8+10 kesici + 10 ft itme.
  - Işınlanma: Misty Step 3/gün (canavar büyüsü), bonus eylem.
- **Sanat:** Zihin Kıran Çığlık. 20 ft, DC 16 INT, 5d6 + Stunned. Birebir.
- **PDF Faz 1:** sütunlar arası ışınlanma (birebir); sahte gölge çağırma (sığmıyor).
- **Desen:**
  - T1: nefes.
  - T2: üç pençe (ilki büyüler).
  - T3: Misty Step ile arkaya geçer, sonra nefes ya da pençe.
  - LA: Çığlık yakına, İğne uzağa, Süpürme arkaya.
- **Faz 1:** "Yüzünde senin yüzün var. Bir kılıç darbesi görüntüsünü titretiyor."
- **Faz 2:**
  - Ortak cümle (kuvvet normal hasar).
  - Mirror Image 3 suret (canavar büyüsü, Game Master açar).
  - Her tur başı bir oyuncuya korku (Frightened, `set_condition`).
  - Sis: anlatım.
  - Anlatım: "Vesvese Kristali çatlıyor; suretlerin hangisinin gerçek olduğunu artık kuvvet de göstermiyor."

### 5.5 `gongar`: Gongar, Bell Shell Brute (Gürültü, CR 23)

- **Kimlik:** Huge Fiend; eskiAd Kör Çan Devi.
- **HP / AC / hız:** 465 HP (30d12+270) / AC 20 (kabuk) / 30 ft.
- **Yetenekler:** STR 28, CON 28, WIS 14. Yeterlilik +7. Kurtarma STR +16, CON +16.
- **Savunma:** Gürültü bağışıklığı; Deafened bağışıklığı. Blindsight 60. **Zayıflık: yıldırım** (tunç kabuk yıldırımı çeker).
- **Hasar dağılımı:** %76 / %24.
- **Multiattack:** Bell Slam → Bell Slam → Shell Ram.
  - Her vuruş +11: 1d8+9 + 6d10 gürültü (ort. 47).
  - Bell Slam eki 10 ft itme; Shell Ram eki Deafened (2 tur yerine "1 dk, save ends"). Yaklaşık.
- **Nefes, Çan Kükremesi (Recharge 5–6):** 60 ft koni, DC 20 CON, 16d10 gürültü (ort. 88) + 15 ft itme + Prone.
- **Efsanevi eylemler:**
  - Çan Titreşimi: 10 ft, CON 20, 3d8 gürültü + Deafened.
  - Yankı Mermisi: 120 ft ışın, 5d10 gürültü.
  - Kabuk Dönüşü: 10 ft, DEX 20, 1d8+9 ezici + Prone.
  - `siegeMonster`.
- **Sanat:** Kanyon Yırtığı. 30 ft çizgi (10 ft genişlik), DC 16 CON, 5d6 + 15 ft itme + Prone + Deafened. Yaklaşık (süre).
- **Desen:**
  - T1: nefes.
  - T2: Slam → Slam → Ram.
  - T3: nefes ya da Multiattack.
  - LA: Titreşim yakına, Mermi uzağa, Dönüş arkaya.
- **Faz 1:** "Kabuğu çalan her darbe kanyonda yankılanıyor. Şimşek tuncunu kızartıyor."
- **Faz 2:**
  - Ortak cümle (yıldırım normal hasar).
  - PDF: tur başı 10 ft DC 15 CON yoksa Prone (aura `prone`; Game Master `set_condition`); sütunlar yıkılır (anlatım).
  - Anlatım: "Çınlama Mührü kabuğu kaplıyor; yıldırım artık metale tutunmuyor."

### 5.6 `lightaur`: Lightaur, Bull of Celestial (Işıltı, CR 23)

- **Kimlik:** Large Celestial; eskiAd Kırık Hale Şövalyesi.
- **HP / AC / hız:** 432 HP (32d10+256) / AC 19 / 50 ft.
- **Yetenekler:** STR 28, CON 26, WIS 18, CHA 20. Yeterlilik +7. Kurtarma CON +15, WIS +11, CHA +12.
- **Savunma:** Işıltı bağışıklığı; Blinded bağışıklığı. `illumination` 20 ft.
- **Kendini iyileştirme:** `regeneration` 10/tur. Birebir. Etkin cana +30 sayıldı, bu yüzden ham HP Gongar'dan düşük.
- **Zayıflık:** nekrotik.
- **Hasar dağılımı:** %76 / %24.
- **Multiattack:** Gore → Hoof → Hoof.
  - Her vuruş +11: 1d8+9 + 6d10 ışıltı (ort. 47).
  - Gore eki Blinded (CON 20, sonraki turunun sonuna dek); hücum eki (20 ft düz koşu, Prone). Birebir.
- **Nefes, Göksel Nefes (Recharge 5–6):** 60 ft koni, DC 20 CON, 16d10 ışıltı (ort. 88) + Blinded.
- **Efsanevi eylemler:**
  - Hale Parıltısı: 10 ft, CON 20, 3d8 ışıltı + Blinded.
  - Işın Mızrağı: 120 ft ışın, 5d10 ışıltı.
  - Arka Toynak: 10 ft, DEX 20, 1d8+9 ezici + 10 ft itme.
- **Sanat:** Altın Yargı Sütunu. 60 ft, 10 ft küre, DC 16 CON, 6d6 + Blinded. Yaklaşık; 40 ft silindir ve karanlık dağıtma sığmıyor.
- **Desen:**
  - T1: hücumla Gore → Hoof → Hoof.
  - T2: nefes.
  - T3: Multiattack.
  - LA: Hale yakına, Mızrak uzağa, Toynak arkaya.
- **Faz 1:** "Kırık halesi boynuzlarında yanıyor; gölge değen yerden ışığı sızıyor."
- **Faz 2:**
  - Ortak cümle (nekrotik normal hasar).
  - PDF: harita parlak ışık (anlatım); tur başı 15 ft DC 15 CON yoksa Blinded (`set_condition`).
  - Anlatım: "Kör Güneş Parçası tavanı yırtıyor; artık hiçbir gölge onu yaralamıyor."

### 5.7 `hydraxe`: Hydraxe, Sulphur Hydra (Asit, CR 22)

- **Kimlik:** Huge Fiend, çok başlı (görünüm ve anlatım; sabit 3 ısırık); eskiAd Sülfür Hidrası.
- **HP / AC / hız:** 419 HP (27d12+243) / AC 19 / 30 ft, yüzme 40.
- **Yetenekler:** STR 28, CON 28. Yeterlilik +7. Kurtarma CON +16, WIS +8.
- **Savunma:** Asit bağışıklığı. **Zayıflık: ateş** (başlar ateşle dağlanır).
- **Hasar dağılımı:** %76 / %24.
- **Multiattack:** Bite × 3.
  - Her vuruş +11: 1d8+9 + 6d10 asit (ort. 47).
  - Her ısırıkta zırh aşındırma (A2 aşındırma, AC −1). Birebir.
- **Nefes, Sülfür Fışkırması (Recharge 5–6):** 60 ft çizgi (10 ft genişlik), DC 20 DEX, 15d10 asit (ort. 82) + AC −2 (`effect.ac`, 1 dk). Yaklaşık.
- **Efsanevi eylemler:**
  - Asit Salyası: 10 ft, DEX 20, 3d8 asit.
  - Asit Tükürüğü: 120 ft ışın, 5d10 asit.
  - Kuyruk Süpürmesi: 10 ft, DEX 20, 1d8+9 ezici + Prone.
- **Sanat:** Sülfür Tufanı. 30 ft, 15 ft küre, DC 16 DEX, 5d6 + AC −3. Yaklaşık; yüzey sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: üç ısırık aynı hedefe (zırhı erit).
  - T3: nefes ya da ısırık.
  - LA: Salya yakına, Tükürük uzağa, Kuyruk arkaya.
- **Faz 1:** "Başlarından duman tütüyor; meşale yaklaştıkça boyunlar geriliyor."
- **Faz 2:**
  - Ortak cümle (ateş normal hasar).
  - PDF: kopan başın 10 ft'i asit yüzeyi (`place_surface`); yakın dövüşte saldırana 1d8 asit (elle).
  - Anlatım: "Erime Damlası boyunlara yayılıyor; ateş artık dağlamıyor."

### 5.8 `mothraq`: Mothraq, Spore Moth (Zehir, CR 22)

- **Kimlik:** Huge Fiend; eskiAd Spor Hükümdarı.
- **HP / AC / hız:** 421 HP (29d12+232) / AC 19 / 20 ft, uçuş 60.
- **Yetenekler:** STR 28, DEX 18, CON 26. Yeterlilik +7. Kurtarma DEX +11, CON +15.
- **Savunma:** Zehir bağışıklığı; Poisoned bağışıklığı. **Zayıflık: ışıltı** (güve ışığa çekilir, çürüme arınır).
- **Hasar dağılımı:** %76 / %24.
- **Multiattack:** Proboscis → Wing → Wing.
  - Her vuruş +11: 1d8+9 + 6d10 zehir (ort. 47).
  - Proboscis eki Poisoned → ikinci başarısızlıkta Paralyzed (A2 `escalate`, Görev A3). Birebir.
- **Nefes, Spor Fırtınası (Recharge 5–6):** 60 ft koni, DC 20 CON, 15d10 zehir (ort. 82) + Poisoned.
- **Efsanevi eylemler:**
  - Spor Patlaması: 10 ft, CON 20, 3d8 zehir + Poisoned.
  - Zehir İğnesi: 120 ft ışın, 5d10 zehir.
  - Kanat Süpürmesi: 10 ft, DEX 20, 1d8+9 ezici + 10 ft itme.
  - Bonus eylem: Poisoned hedefi 30 ft çekme (`pull` `needsCondition`). Birebir, PDF Faz 1.
- **Sanat:** Veba Bulutu. 15 ft küre, DC 16 CON, 4d6 + Poisoned. Yaklaşık; 3 tur bulut ve direnç aşma sığmıyor.
- **Desen:**
  - T1: nefes.
  - T2: Proboscis → Wing → Wing.
  - T3: zehirliyi çeker, sonra Multiattack.
  - LA: Patlama yakına, İğne uzağa, Kanat arkaya.
- **Faz 1:** "Kanatlarından spor yağıyor; meşalenin ışığı tozunu yakıyor."
- **Faz 2:**
  - Ortak cümle (ışıltı normal hasar).
  - PDF: 3 hareketli zehir bulutu (`place_surface`); 20 ft'teki ölüler spor hizmetkârı (Game Master çağırır).
  - Anlatım: "Ağu Özü kanatlara işliyor; ışık artık sporları yakmıyor."

### 5.9 `stormer`: Stormer, Thunder Stallion (Yıldırım, CR 21)

- **Kimlik:** Large Fiend; eskiAd Şimşek Süvarisi.
- **HP / AC / hız:** 338 HP (25d10+200) / AC 19 / 90 ft.
- **Yetenekler:** STR 28, DEX 20, CON 26. Yeterlilik +7. Kurtarma DEX +12, CON +15.
- **Savunma:** Yıldırım bağışıklığı.
- **Zayıflık: yok.** SRD türlerinde yıldırımın doğal karşıtı yok; gürültü aynı fırtınanın parçası. Zorla eklenmedi.
  - Etkin cana zayıflık indirimi girmediği için ham HP düşük tutuldu. Faz 2'de dayanıklılık artmaz.
- **Hasar dağılımı:** %75 / %25.
- **Multiattack:** Hoof → Hoof (az ama ağır).
  - Her vuruş +11: 2d8+9 + 8d10 yıldırım (ort. 62, Cimbombom'un altında).
  - Hücum eki (20 ft, Prone); bonus eylem Dash/Disengage. Birebir.
- **Nefes, Şimşek Yeli (Recharge 5–6):** 100 ft çizgi (10 ft genişlik), DC 20 DEX, 13d10 yıldırım (ort. 71) + sonraki tur tepki yok (`effect.noReactions`). Suda zincir `hexResolver`.
- **Efsanevi eylemler:**
  - Şimşek Toynağı: 10 ft, DEX 20, 3d8 yıldırım.
  - Zincir Şimşek: 120 ft, **3 ışın** (hız/zincir karakteri), ışın başına +11, 2d6 yıldırım (toplam ≈ 21).
  - Arka Tekme: 10 ft, DEX 20, 1d8+9 ezici + 10 ft itme.
- **Sanat:** Gök Mızrağı. 60 ft, 10 ft küre, DC 16 DEX, 6d6 + tepki yok; su zinciri. Birebir.
- **Desen:**
  - T1: koşup nefes.
  - T2: Hoof → Hoof, Disengage, uzaklaşır.
  - T3: nefes ya da Multiattack.
  - LA: Toynak yakına, Zincir uzağa (3 hedef), Tekme arkaya.
- **Faz 1:** "Yelesi şimşek; durduğu yerde hiç kalmıyor."
- **Faz 2:**
  - Zayıflık yok, ortak cümlenin zayıflık kısmı uygulanmaz (yalnızca "element güçlenir").
  - PDF: yağmur ve su altıgenleri (anlatım/`place_surface` su); tur sonu en yüksek ya da metal zırhlı hedefe yıldırım (Game Master seçer, Zincir Şimşek tek ışın).
  - Anlatım: "Fırtına Mili yeleye saplanıyor; gök artık onun için çakıyor."

### 5.10 `wolfgang`: Wolfgang, Blizzard Wolf (Soğuk, CR 20)

- **Kimlik:** Huge Fiend; eskiAd Tipi Yutan Dev.
- **HP / AC / hız:** 319 HP (22d12+176) / AC 19 / 50 ft, tırmanma 30.
- **Yetenekler:** STR 26, CON 26. Yeterlilik +6. Kurtarma CON +14, WIS +8.
- **Savunma:** Soğuk bağışıklığı; Ice Walk. **Zayıflık: ateş.**
- **Hasar dağılımı:** %73 / %27.
- **Multiattack:** Bite → Claw.
  - Her vuruş +10: 2d8+8 + 7d10 soğuk (ort. 56).
  - Bite eki Restrained (STR 19, sonraki turunun sonuna dek); Claw eki hız yarı (A2 hız kısıtı). Birebir.
- **Nefes, Tipi Nefesi (Recharge 5–6):** 60 ft koni, DC 19 CON, 11d10 soğuk (ort. 60) + Restrained.
- **Efsanevi eylemler:**
  - Ayaz Halesi: 10 ft, CON 19, 2d8 soğuk + hız yarı.
  - Buz Mızrağı: 120 ft ışın, 4d10 soğuk.
  - Kuyruk Süpürmesi: 10 ft, DEX 19, 1d8+8 ezici + Prone.
- **Sanat:** Kırağı Nefesi. 20 ft koni, DC 16 CON, 5d6 + Restrained. Birebir.
- **Desen:**
  - T1: nefes.
  - T2: Bite (tutar) → Claw (yavaşlatır).
  - T3: nefes ya da Multiattack.
  - LA: Hale yakına, Mızrak uzağa, Kuyruk arkaya.
- **Faz 1:** "Tipi onunla geliyor; meşale yaklaşınca geri çekiliyor."
- **Faz 2:**
  - Ortak cümle (ateş normal hasar).
  - PDF: haritanın yarısı buz (`place_surface` buz); tipi görüşü 30 ft (anlatım).
  - Anlatım: "Ayaz Kalbi kükrüyor; alev artık buzunu eritmiyor."

### 5.11 Güç sıralaması ve paylaşılan CR'ler

Sıra, Serüven'in doğudan batıya akışına ve hikâyeye göre: Buzul → Dağ → Orman ve Bataklık → Çöl ve Katedral → Derinlikler → Gözlemevi → Volkan (final).

| CR | Boss | Gerekçe |
|---|---|---|
| 26 | Cimbombom | Final. Volkan'a Derinliklerden portalla gidilir; hasarın, canın ve saldırı sayısının tavanı |
| 25 | Darkape | Volkan portalından önceki son eşik (Yıkık Gözlemevi) |
| 24 | Cerbones, Mirage | **Paylaşılan.** Derinliklerin iki kapısı (Kemik Ovası, Sisli Akademi): parti hangisini önce seçerse seçsin aynı güçte karşılaşır |
| 23 | Gongar, Lightaur | **Paylaşılan.** Çöl kanyonu ve Batı Kıyısı katedrali aynı aşamada, sırası serbest |
| 22 | Hydraxe, Mothraq | **Paylaşılan.** Orman ve Bataklık komşu sayfalar; ikisi de yıpratma bossu (asit ve zehir), sırası serbest |
| 21 | Stormer | Dağ, ikinci sayfa. Zayıflığı olmadığından eşit CR'de daha dayanıklıdır |
| 20 | Wolfgang | Buzul, ilk sayfa ve ilk bölge bossu |

Dokuz boss için CR 20–25 arasında yalnızca 6 değer var, bu yüzden en az 3 eş gerekiyor. Eşler, sırası serbest olan aynı aşamadaki bölgelerden seçildi. Eşlerin canları ve vuruşları çizgi karakteriyle farklılaşır: Lightaur'da yenilenme olduğu için ham canı düşük, Mirage Medium.

## 6. Sığmayanlar (Aşama 2'de `KATALOG-SIGMAYAN.md`)

| Boşluk | Boss | Yaklaşık yol | Önerilen yol (yeni mekanik izni gelirse) |
|---|---|---|---|
| %50 can faz tetiği | 10 | Game Master notu (K3) | Veride `faz2`, Bloodied geçişinde bir kez |
| Faz 2'de zayıflığın kalkması | 9 | `adjust_hp` ile elle geri verme | Game Master komutu ya da `faz2.vulnerabilities: []` |
| Canavar eylemiyle yüzey | 5 | `place_surface` (elle) | Canavar `save` yeteneğine `surface` |
| Faz 2 harita dönüşümü (buz, yağmur, sis, ışık, yerçekimi) | 6 | anlatım + `place_surface` | Faz kapılı harita kuralı |
| Kalıcı bulut, direnç aşma | Mothraq | anlık save | `zone` + `ignoreResist` |
| Zorla hareket bağışıklığı | Gongar, Darkape | yok | `forcedImmune` |
| Dokunana asit | Hydraxe | elle | `meleeRetaliate` |
| Silindir alan, karanlık dağıtma | Lightaur | küre | canavar alanına `cylinder` |
| İyileşme yarılama, maks. HP bağışıklığı | Cerbones | elle | aurada `healMult` |
| Tek eylemde çek + vur | Darkape | iki yetenek | yetenekte `then` |
| Uzaktakini seçen ışın | 10 (LA menzilli ceza) | yapay zekâ en yakını seçer; Game Master uzaktakini seçer | `rays` hedef kipi `far` |
| Sahte gölge çağırma | Mirage | `summon` Shadow | (Faz 1, PDF) |

## 7. Denge planı (Aşama 2)

- `npm run sim:boss -- 100`, Normal ve Kolay, `standart` parti, yeni parti yok. `data/sim-boss.json`'a çizgi başına 3 kayıt, toplam 30 kayıt ve 60 satır.

  | Kademe | Parti seviyesi | Normal | Kolay | Not |
  |---|---|---|---|---|
  | Sv.1 (CR 2–3) | 3 | Sv.1 ×2 | Sv.1 ×1 | `levels.3` verisi var |
  | Sv.2 (CR 8–10) | 9 | Sv.2 ×1 + Sv.1 ×2 | Sv.2 ×1 | `levels.9` verisi var |
  | Sv.3 (CR 20–26) | 20 | boss ×1 + Sv.2 ×1 | boss ×1 | 20. seviye verisi yok: `memberAt` 5. seviye sayfasını açar, ASI ve büyüler eksik kalır |

- **Beklenti (K8):** sim partisi dirençsiz ve hazırlıksız. Boss satırları büyük olasılıkla %0–10 çıkar. Bu, kural 2'nin "dirençsiz parti ezilir" sonucudur; denge hatası sayılmaz.
- Aralık dışı satırlar `harita/belgeler/DENGE.md`'ye yazılır, düzeltilmez.
- Sv.1 ve Sv.2 olağan karşılaşmadır: hazırlıksız parti varsayılır, hedef aralık geçerlidir.

## 8. Evrim çizgileri: Sv.1 ve Sv.2 (20 yaratık)

Bu yaratıklar PDF'te yok, kullanıcının tasarımıdır. Kimlik = dosya adı. Görünen ad kimliğin büyük harfle başlayan hâlidir ("Cim", "Wolfie"…). Tür bossla aynı (K2). Hasar bağışıklığı ve zayıflık bossunkiyle aynıdır.

**Ortak değerler:**

| Alan | Sv.1 (CR 2–3) | Sv.2 (CR 8–10) |
|---|---|---|
| Varsayım | Olağan karşılaşma, hazırlıksız parti; element payı ≈ %50 | Aynı; element ≈ %50 |
| HP / AC | CR 2: 60 / 13; CR 3: 75 / 14 | CR 8: 150 / 16; CR 9: 170 / 16; CR 10: 190 / 17 |
| Saldırı / DC | +5 / 12 | +7 (CR 10'da +8) / 16 (bossun PDF sanat DC'siyle aynı) |
| Saldırı düzeni | CR 2: tek saldırı, 1d10+3 fiziksel + 2d6 element (DPR ≈ 15); CR 3: 2 saldırı, her biri 1d8+3 + 1d6 element (≈ 22) | 2 saldırı, her biri 2d8+5 + 2d8 element (CR 8, ≈ 46); 2d8+5 + 2d10 (CR 9, ≈ 52); 2d8+6 + 3d8 (CR 10, ≈ 57) |
| Küçük sanat | yok | Bossun nefes şeklinin yarısı, Recharge 5–6, DC 16; CR 8: 4d6, CR 9: 4d6, CR 10: 5d6. Tur hasarına ≈ +9…12 ekler |
| Durum bağışıklığı | yok (yalnız zehirde Poisoned) | bossunki |
| Efsanevi direnç ve eylem, Faz 2 | yok | yok |
| Ganimet | Çatlak Taş | Uyanmış Taş |

**Sv.1 ve Sv.2 satırları** (çizgi karakteri, hız, ek):

| Çizgi | Sv.1 | Sv.2 |
|---|---|---|
| Ateş | **`cim`** CR 3, Small, 40 ft; 2 Bite (ikincisinde yanma eki 1d4, save ends); zayıflık soğuk | **`cimbom`** CR 10, Large, 50 ft; Bite → Claw; Küçük Cehennem Kükremesi 30 ft koni DEX; Pounce yok |
| Soğuk | **`doggie`** CR 2, Small, 40 ft; Bite (hız yarı eki); Ice Walk; zayıflık ateş | **`wolfie`** CR 8, Large, 50 ft, tırmanma 20; Bite (Restrained) → Claw; Küçük Tipi Nefesi 30 ft koni CON + Restrained |
| Yıldırım | **`sparkle`** CR 2, Small, 60 ft; Hoof; bonus Disengage; zayıflık yok | **`thunderse`** CR 8, Large, 70 ft; Hoof → Hoof (hücum eki); Küçük Şimşek Yeli 50 ft çizgi DEX + tepki yok |
| Gürültü | **`twinkle`** CR 3, Small, 25 ft; 2 Bell Tap (5 ft itme); Blindsight 30; zayıflık yıldırım | **`gongi`** CR 9, Large, 30 ft; Slam (10 ft itme) → Ram (Deafened); Küçük Çan Kükremesi 30 ft koni CON + Prone; `siegeMonster` |
| Asit | **`hydrop`** CR 2, Small, 20 ft, yüzme 30; Bite; zayıflık ateş | **`hydras`** CR 8, Large, 30 ft, yüzme 40; 2 Bite (aşındırma AC −1); Küçük Sülfür Fışkırması 30 ft çizgi DEX |
| Zehir | **`sporlet`** CR 2, Small, 10 ft, uçuş 30; Proboscis (Poisoned eki, DC 12); zayıflık ışıltı | **`mothcoon`** CR 8, Large, 20 ft, uçuş 50; Proboscis (Poisoned → Paralyzed `escalate`) → Wing; Poisoned'ı 20 ft çekme; Küçük Spor Fırtınası 30 ft koni CON |
| Işıltı | **`lumbo`** CR 3, Small, 40 ft; 2 Gore (ışıltı); `illumination` 10; zayıflık nekrotik; Celestial | **`lighty`** CR 9, Large, 50 ft; Gore (Blinded) → Hoof; `regeneration` 5; Küçük Göksel Nefes 30 ft koni CON + Blinded; Celestial |
| Nekrotik | **`cerbit`** CR 3, Small, 40 ft; 2 Bite (iki baş); zayıflık ışıltı | **`cerbedo`** CR 9, Large, 50 ft; 2 Bite (`monsterDrain`); Küçük Krematoryum Nefesi 30 ft koni CON + noHeal |
| Psişik | **`mirit`** CR 3, Small, 35 ft; 2 Soul Claw; zayıflık kuvvet | **`mirath`** CR 9, Medium, 40 ft; Soul Claw (Charmed, WIS 16) → Soul Claw; Misty Step 1/gün; Küçük Zihin Dalgası 30 ft koni INT (Stunned yok: CR 9'da çok güçlü) |
| Kuvvet | **`darkit`** CR 3, Small, 30 ft, tırmanma 30; 2 Fist (5 ft itme); zayıflık psişik | **`darkath`** CR 9, Large, 40 ft, tırmanma 40; Fist (10 ft itme) → Grab (Grappled DC 16); 15 ft çekme (`pull`); Küçük Boşluk Kükremesi 30 ft koni STR + Prone |

Her çizgide sıra: Buzul, Dağ, Orman ve Bataklık Sv.1 CR 2; diğerleri CR 3. Sv.2'de ilk dört bölge CR 8, sonrakiler CR 9; Cimbom CR 10.

**Ortam.** Sv.1 ve Sv.2, bossun `ortam` listesini paylaşır. Sv.1 ayrıca bölgenin ilk haritasına eklenir (`buzul-kamp`, `dag`, `bataklik`, `orman`…).

**Durum.** 20 yaratığın bütün özellikleri mevcut veri alanlarıyla birebir yazılır. Sığmayan parça yoktur; sığmayanlar küçültmede bilerek bırakıldı.

## 9. Faz 2 Game Master notu: ortak metin

`gmNot` alanına her bossta (Stormer'da zayıflık cümlesi olmadan) şu yazılır:

> Yarı canda element güçlenir, zayıflık kalkar (karşı element normal hasara döner; direnç ya da bağışıklık olmaz). Uygulama: bundan sonra karşı elementle gelen her isabette bossa fazladan işlenen hasarı (alınanın yarısı) `adjust_hp` ile geri ver. İsteğe bağlı: nefes alanını %50 büyüt (ek hedeflere aynı save'i elle uygula). Ardından bossun PDF Faz 2 arena değişimini uygula.

## 10. On boss: özet tablo (dirençli ve hazırlıklı parti)

Ham tur hasarı Multiattack, nefes (2 hedef, 3 turda bir) ve 3 efsanevi eylemden oluşur; sanat dahil değil. **Dirençli** sütunu ham × 0,625'tir.

| Sıra | Boss | CR | HP (ham) | Etkin HP | AC | Vuruş başı (ort.) | Saldırı | Tur hasarı ham / **dirençli** | Faz 2 hasarı (nefes büyürse) ham / dirençli | Zayıflık | Faz 2'de dayanıklılık | Faz 2 değişimi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **1** | **Cimbombom** | **26** | **627** | **654** | 19 | **63** | **3** | **379 / 237** | **418 / 261** | soğuk | +%25 | kuyruk önce; kenarlar alev; 15 ft ateş dalgası |
| 2 | Darkape | 25 | 578 | 610 | 19 | 58 | 3 | 352 / 220 | 387 / 242 | psişik | +%25 | düşük yerçekimi; merkez çekim |
| 3 | Cerbones | 24 | 527 | 564 | 19 | 53 | 3 | 323 / 202 | 356 / 223 | ışıltı | +%25 | iskeletler; iyileşme yarı |
| 3 | Mirage | 24 | 525 | 563 | 19 | 53 | 3 | 323 / 202 | 356 / 223 | kuvvet | +%25 | 3 suret; korku |
| 5 | Gongar | 23 | 465 | 509 | 20 | 47 | 3 | 280 / 175 | 309 / 193 | yıldırım | +%25 | Prone aurası; sütunlar |
| 5 | Lightaur | 23 | 432 | 509 | 19 | 47 | 3 | 280 / 175 | 309 / 193 | nekrotik | +%25 | parlak arena; Blinded aurası |
| 7 | Hydraxe | 22 | 419 | 467 | 19 | 47 | 3 | 276 / 173 | 304 / 190 | ateş | +%25 | asit yüzeyi; dokunana asit |
| 7 | Mothraq | 22 | 421 | 469 | 19 | 47 | 3 | 276 / 173 | 304 / 190 | ışıltı | +%25 | 3 zehir bulutu; spor hizmetkârı |
| 9 | Stormer | 21 | 338 | 428 | 19 | 62 | 2 | 248 / 155 | 272 / 170 | yok | 0 | yağmur; tepeye yıldırım |
| 10 | Wolfgang | 20 | 319 | 377 | 19 | 56 | 2 | 216 / 135 | 236 / 148 | ateş | +%25 | yarı harita buz; tipi |

**Cimbombom her sütunda zirvede:** CR, ham ve etkin HP, vuruş başı hasar, saldırı sayısı, tur hasarı ve Faz 2 hasarı. Faz 2'deki Darkape (242) bile Cimbombom'un Faz 1'ine (237) yalnızca nefes büyütülürse yaklaşır.

Stormer'ın vuruşu (62) ve Wolfgang'ınki (56) iki saldırıyla az ama ağır vuruş içindir; ikisi de 63'ün altındadır.

## 11. Kadim yaratıklar (K5: F2)

PDF'te var: Kıta Ejderhası V-I (CR 31) ve V-II (CR 40), Kozmik Anka Kuşu (CR 32), beş Mücevher Ejderhası, Uçurumun Yıldız-Kâbusu (CR 35). Ayrıntılı uyum tablosu bu belgenin önceki sürümündedir (commit 31cb7091) ve F2'ye taşınır. Bu görevde veri yazılmaz.

## 12. Açık sorular

- **K8. Sim'de hazırlıklı parti yok.** Boss ölçümleri dirençsiz partiyi ölçer ve büyük olasılıkla %0–10 çıkar.
  - Öneri: ölç, DENGE.md'ye "dirençsiz parti (bilerek)" notuyla yaz, düzeltme.
  - Alternatif: hazırlıklı ölçüm için ayrı görev. Partiye direnç vermek yeni parti ya da yeni sim alanı demektir.
- **K9. Faz 2 zayıflık kaldırması `adjust_hp` ile elle.** Kabul mü? Daha temiz yol (motor komutu) yeni mekanik olur.
- **K10. Sim seviyesi 20.** Boss sim'i 20. seviyede kurulur ama üye verisi yalnızca 1/3/5/7/9'da var; 20. seviye eksik ASI ve büyüyle kurulur.
  - Öneri: kabul, sonuçlara not.
  - Alternatif: boss satırını 9. seviyede de çalıştırmak (yalnızca karşılaştırma için).
