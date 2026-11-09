# Büyü × efekt tablosu (Kuyruk E3)

`npm run efekt-tablosu` üretir (`scripts/buyu-efekt-tablosu.mjs`, kurallar `scripts/lib/buyu-efekt.mjs`); elle düzenlenmez. Salt okuma denetimi: oyun kodu, veri ve görseller değişmedi. Büyü durumu (savaşta / savaş dışı) `harita/belgeler/BUYU-DURUM.md` ile aynı ölçüt (`scripts/lib/buyu-durum.mjs`).

## Yöntem

**Hazır** = büyünün asıl görsel ailesi (alan patlaması, iyileştirme, ışınlanma, duvar, zemin, durum döngüsü, koruma, çağırma) için efekt anahtarı kayıt defterinde var (`data/sprite-esleme.json` `efektler`/`zones`, `data/efekt-sprites.json`, Kuyruk E2: `data/efekt-e2.json`) **ve** dosyası depoda (`public/sprites/`, `public/efektler/`, `public/efekt/`) **ve** bağlama kodu bu büyü için o anahtarı gerçekten seçiyor (`src/ui/fx/fxPlan.ts`, `src/ui/damageFloats.ts`, `src/ui/statusFx.ts`, `src/ui/sprites.ts`; olay yolu `src/battle/spells.ts`). **Genel** = yalnız varsayılan/yedek görsel (`darbe-buyu`, `cagir-portal`, `aura-altin`, renkli altıgen yer tutucusu `.spell-zone`, koni/çizginin patlama olarak çizilmesi, yalnız hasar türü şeridi ya da durum ikonu, rozet). **Eksik** = günlük ve sayı dışında görsel yok. Hasar sayıları her büyüde çıkar, sayılmaz.

Koddan çıkan bağlama kuralları:

- Büyü saldırısı ve otomatik isabet (`attack_resolved`): `efekt-baglama.json` `darbe[hasar türü]`, yoksa varsayılan `darbe-buyu` (Kuyruk E2: hasar türüne göre `darbeTon` rengiyle); kritikte `kritik-vurus`. Hedefte hasar türü şeridi yalnız ateş (`burn`), soğuk (`freeze`), asit (`acid`), zehir (`poison`).
- Alan büyüsü (`executeAreaCast` → `spell_cast.area`): alan[hasar türü] (ateş, yıldırım, ışık, nekrotik, psişik, kuvvet, gök gürültüsü; Kuyruk E2 `alanEk`: soğuk, asit, zehir, ezme). Kuyruk E2: `spell_cast.area` yalnız görsel `shape`/`aim` taşır: koni `koni[tür]` dokusu, çizgi `isin[tür]` ışını olarak çizilir.
- Kuyruk E2 büyü bağlaması (`efekt-baglama.json` `buyu`): olay etiketinden büyü kimliği → mermi (uçan), ışın, hedef, kendi, alan, gökten düşen, koni, işaret simgesi + bağ çizgisi; `zemin` (kalıcı alan dokusu), `auraBuyu` (konsantrasyon/kendi aurası), `cagirRenk` (portal tonu), `rozetBuyu` (sayı oku rozeti, genel), `konturBuyu` (Faerie Fire jeton konturu); `temp_hp` → `koruma-kutsama`, `life_restored` → `iyilestir-buyuk`. Her E2 bağlaması gerçek motordan doğrulanır (`npx vite-node scripts/e2-dogrula.ts` → `data/efekt-e2-dogrulama.json`); tablo yalnız doğrulananları hazır sayar.
- Kalıcı alan (`m.zone` → `executeZoneCast`, alan patlaması yok): `sprite-esleme.json` `zones["spells:<id>"]` (Fog Cloud, Web, Grease, Stinking Cloud) ya da `efekt-baglama.json` `duvar` (Wall of Fire/Force/Ice, Wind Wall); kalanı renkli altıgen yer tutucusu. Yaratığa bağlı alan → aura (renk hasar türünden, yoksa `aura-altin`).
- `healed` → `iyilestir-kucuk/buyuk`; `teleported` → `isinlan-cikis/giris`; `summoned` → `cagir-ruh`/`cagir-dogal` (veri listesi, dokunulamaz çağrı ruh), yoksa varsayılan `cagir-portal`; `pushed` → `itme-toz`.
- Süren etki (`effect_added`) yalnız dost/kendine: `koruma` tablosu (ac/acMin → kalkan; wardedFrom/resist/immune → ruh; +zar/tempHp/saveAdv → kutsama). Düşmana etki ve `buff_added` (Shield of Faith, Divine Favor, Magic Weapon) görsel üretmez.
- Durum: döngü şeridi (Paralyzed, Stunned, Incapacitated, Frightened, Charmed, Restrained, Grappled; Poisoned `jetonDongu`), CSS jeton filtresi (Petrified, Blinded, Invisible, Unconscious, Prone, Exhaustion), yoksa yalnız ikon (Deafened).
- Spirit Guardians yayılımı konsantrasyonda tutulur; Kuyruk E2: `groundFx` konsantrasyonu `auraBuyu`’da olan büyücünün çevresine aura çizer.

Kısmi ya da sığmayan notlu büyü: 0 (K58 sonrası 0; ayrı efekt ihtiyacı yok).

## 1. Özet

Seviye grubu × sınıf. Bir büyü birden çok sınıfta sayılır; "Tümü" satırı tekil büyü sayısıdır. **Yeni anim.** = genel ya da eksik olup bir eksik animasyon ailesine bağlanan savaş büyüsü.

| Seviye | Sınıf | Toplam | Savaş dışı | Hazır | Genel | Eksik | Yeni anim. |
|---|---|---|---|---|---|---|---|
| 0–3 | Bard | 73 | 31 | 38 | 4 | 0 | 1 |
| 0–3 | Cleric | 58 | 22 | 29 | 7 | 0 | 2 |
| 0–3 | Druid | 63 | 19 | 39 | 5 | 0 | 1 |
| 0–3 | Paladin | 30 | 10 | 18 | 2 | 0 | 1 |
| 0–3 | Ranger | 40 | 14 | 21 | 5 | 0 | 2 |
| 0–3 | Sorcerer | 85 | 17 | 62 | 6 | 0 | 2 |
| 0–3 | Warlock | 40 | 12 | 24 | 4 | 0 | 0 |
| 0–3 | Wizard | 110 | 36 | 68 | 6 | 0 | 1 |
| 0–3 | **Tümü** | **183** | 53 | **117** | **13** | **0** | **3** |
| 4–5 | Bard | 27 | 13 | 14 | 0 | 0 | 0 |
| 4–5 | Cleric | 22 | 11 | 10 | 1 | 0 | 0 |
| 4–5 | Druid | 33 | 11 | 21 | 1 | 0 | 1 |
| 4–5 | Paladin | 8 | 3 | 4 | 1 | 0 | 0 |
| 4–5 | Ranger | 8 | 2 | 6 | 0 | 0 | 0 |
| 4–5 | Sorcerer | 25 | 3 | 20 | 2 | 0 | 2 |
| 4–5 | Warlock | 12 | 6 | 6 | 0 | 0 | 0 |
| 4–5 | Wizard | 50 | 21 | 27 | 2 | 0 | 2 |
| 4–5 | **Tümü** | **72** | 27 | **42** | **3** | **0** | **2** |
| 6–9 | Bard | 30 | 13 | 13 | 3 | 1 | 2 |
| 6–9 | Cleric | 29 | 13 | 14 | 2 | 0 | 2 |
| 6–9 | Druid | 28 | 14 | 11 | 2 | 1 | 3 |
| 6–9 | Sorcerer | 30 | 4 | 21 | 3 | 2 | 4 |
| 6–9 | Warlock | 20 | 6 | 12 | 1 | 1 | 1 |
| 6–9 | Wizard | 58 | 22 | 30 | 4 | 2 | 4 |
| 6–9 | **Tümü** | **84** | 34 | **40** | **8** | **2** | **7** |
| **0–9** | **Tümü** | **339** | 114 | **199** | **24** | **2** | **12** |

Savaşta kullanılan 225 büyünün 199'i hazır (88%), 24'i genel, 2'i eksik; 12 büyü yeni animasyon (ya da bağlama) bekliyor.

Türe göre (savaş büyüleri):

| Tür | Hazır | Genel | Eksik |
|---|---|---|---|
| koruma | 29 | 9 | 0 |
| durum | 17 | 5 | 1 |
| zemin | 15 | 4 | 0 |
| küre/alan | 17 | 0 | 1 |
| çağırma | 16 | 0 | 0 |
| iyileştirme | 11 | 0 | 0 |
| tek hedef | 11 | 0 | 0 |
| dönüşüm | 10 | 1 | 0 |
| mermi | 10 | 0 | 0 |
| silah | 10 | 0 | 0 |
| ışın | 9 | 0 | 0 |
| aura | 8 | 0 | 0 |
| duvar | 4 | 4 | 0 |
| işaret | 7 | 0 | 0 |
| ışınlanma | 7 | 0 | 0 |
| gökten düşen | 6 | 0 | 0 |
| koni | 6 | 0 | 0 |
| dokunuş | 3 | 0 | 0 |
| iptal | 3 | 0 | 0 |
| yok | 0 | 1 | 0 |

## 2. Büyü tablosu (339)

Tür: mermi, ışın, koni, küre/alan, duvar, zemin, aura, çağırma, dönüşüm, işaret, koruma, ışınlanma, durum, yok; ayrıca tek hedef (save’li darbe), dokunuş, silah, iyileştirme, iptal, gökten düşen. Anahtar önekleri: `hasar:` hedefteki hasar türü şeridi (`public/efektler/`), `durum:` döngü şeridi, `css:` jeton filtresi, `ikon:` durum ikonu, `zemin:` yüzey sprite’ı, `yer-tutucu:` renkli altıgen, `rozet:` emoji rozeti; öneksiz olanlar `public/sprites/efekt-<ad>.webp`.

| Kimlik | Sv | Okul | Tür | Efekt anahtarları | Kalite notu | Durum | Eksik aile |
|---|---|---|---|---|---|---|---|
| acid-splash | 0 | Evocation | küre/alan | `hasar:acid`, `alan:alan-asit` | E2: alan:alan-asit | hazır | — |
| chill-touch | 0 | Necromancy | dokunuş | `darbe-buyu`, `darbe-buyu+ton(necrotic)` | E2: darbe-buyu+ton(necrotic) | hazır | — |
| dancing-lights | 0 | Illusion | zemin | `yer-tutucu:.spell-zone`, `isik-katmani (zone.light)` | renkli altıgen yer tutucusu (spec.color/icon) | hazır | — |
| druidcraft | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| eldritch-blast | 0 | Evocation | ışın | `darbe-buyu`, `isin:isin-isik` | E2: isin:isin-isik | hazır | — |
| elementalism | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| fire-bolt | 0 | Evocation | mermi | `darbe-buyu`, `hasar:burn`, `mermi:mermi-kure` | E2: mermi:mermi-kure | hazır | — |
| guidance | 0 | Divination | koruma | `koruma-kutsama` |  | hazır | — |
| light | 0 | Evocation | koruma | `isik-katmani (litHexes)` |  | hazır | — |
| mage-hand | 0 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mending | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| message | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| minor-illusion | 0 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| poison-spray | 0 | Necromancy | mermi | `darbe-buyu`, `hasar:poison`, `isin:isin-asit` | E2: isin:isin-asit | hazır | — |
| prestidigitation | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| produce-flame | 0 | Conjuration | mermi | `darbe-buyu`, `hasar:burn`, `mermi:mermi-kure` | E2: mermi:mermi-kure | hazır | — |
| ray-of-frost | 0 | Evocation | ışın | `darbe-buyu`, `hasar:freeze`, `isin:isin-buz` | E2: isin:isin-buz | hazır | — |
| resistance | 0 | Abjuration | koruma | `rozet:ok-direnc` | E2 rozet: ok-direnc | genel | — |
| sacred-flame | 0 | Evocation | gökten düşen | `gokten:gokten-sutun` | E2: gokten:gokten-sutun | hazır | — |
| shillelagh | 0 | Transmutation | silah | `kendi:silah-halka` | E2: kendi:silah-halka | hazır | — |
| shocking-grasp | 0 | Evocation | dokunuş | `darbe-buyu`, `darbe-buyu+ton(lightning)` | E2: darbe-buyu+ton(lightning) | hazır | — |
| sorcerous-burst | 0 | Evocation | mermi | `darbe-buyu`, `hasar:burn`, `mermi:mermi-kivilcim` | E2: mermi:mermi-kivilcim | hazır | — |
| spare-the-dying | 0 | Necromancy | iyileştirme | `hedef:iyilestir-kucuk` | E2: hedef:iyilestir-kucuk | hazır | — |
| starry-wisp | 0 | Evocation | mermi | `darbe-buyu`, `mermi:mermi-kivilcim` | E2: mermi:mermi-kivilcim | hazır | — |
| thaumaturgy | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| true-strike | 0 | Divination | silah | `darbe-buyu`, `kendi:silah-kivilcim` | E2: kendi:silah-kivilcim | hazır | — |
| vicious-mockery | 0 | Enchantment | tek hedef | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| alarm | 1 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animal-friendship | 1 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| bane | 1 | Enchantment | durum | `rozet:ok-zar-eksi` | E2 rozet: ok-zar-eksi | genel | — |
| bless | 1 | Enchantment | koruma | `koruma-kutsama`, `rozet:ok-zar-arti` |  | hazır | — |
| burning-hands | 1 | Evocation | koni | `alan-ates`, `hasar:burn`, `koni:koni-ates` | E2: koni:koni-ates | hazır | — |
| charm-person | 1 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| chromatic-orb | 1 | Evocation | mermi | `darbe-buyu`, `hasar:burn`, `mermi:mermi-kure` | E2: mermi:mermi-kure | hazır | — |
| color-spray | 1 | Illusion | koni | `css:blinded`, `koni:koni-isik` | E2: koni:koni-isik | hazır | — |
| command | 1 | Enchantment | durum | `rozet:ok-dezavantaj` | E2 rozet: ok-dezavantaj | genel | — |
| comprehend-languages | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| create-or-destroy-water | 1 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cure-wounds | 1 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| detect-evil-and-good | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| detect-magic | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| detect-poison-and-disease | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| disguise-self | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dissonant-whispers | 1 | Enchantment | tek hedef | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| divine-favor | 1 | Transmutation | silah | `kendi:silah-kilic` | E2: kendi:silah-kilic | hazır | — |
| divine-smite | 1 | Evocation | silah | `darbe-<silah türü>`, `hedef:silah-kivilcim` | E2: hedef:silah-kivilcim | hazır | — |
| ensnaring-strike | 1 | Conjuration | silah | `darbe-<silah türü>`, `hedef:silah-kivilcim` | E2: hedef:silah-kivilcim | hazır | — |
| entangle | 1 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `durum:restrained`, `zemin:zemin-diken` | E2: zemin:zemin-diken | hazır | — |
| expeditious-retreat | 1 | Transmutation | koruma | `rozet:ok-hiz-arti` | E2 rozet: ok-hiz-arti | genel | — |
| faerie-fire | 1 | Evocation | küre/alan | `alan:alan-isik` | E2: alan:alan-isik | hazır | — |
| false-life | 1 | Necromancy | koruma | `kendi:koruma-kutsama` | E2: kendi:koruma-kutsama | hazır | — |
| feather-fall | 1 | Transmutation | koruma | `kendi:koruma-ruh` | E2: kendi:koruma-ruh | hazır | — |
| find-familiar | 1 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| floating-disk | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| fog-cloud | 1 | Conjuration | zemin | `zemin:yuzey-sis` |  | hazır | — |
| goodberry | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| grease | 1 | Conjuration | zemin | `zemin:yuzey-gres`, `zemin:zemin-yag` | E2: zemin:zemin-yag | hazır | — |
| guiding-bolt | 1 | Evocation | mermi | `darbe-buyu`, `gokten:gokten-yildiz` | E2: gokten:gokten-yildiz | hazır | — |
| healing-word | 1 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| hellish-rebuke | 1 | Evocation | tek hedef | `hasar:burn`, `hedef:alan-ates` | E2: hedef:alan-ates | hazır | — |
| heroism | 1 | Enchantment | koruma | `koruma-ruh` |  | hazır | — |
| hex | 1 | Enchantment | işaret | `isaret:isaret-lanet` | E2: isaret:isaret-lanet | hazır | — |
| hideous-laughter | 1 | Enchantment | durum | `css:prone`, `durum:incapacitated` |  | hazır | — |
| hunters-mark | 1 | Divination | işaret | `isaret:isaret-nisan` | E2: isaret:isaret-nisan | hazır | — |
| ice-knife | 1 | Conjuration | mermi | `darbe-delme`, `mermi:mermi-igne+alan-buz` | E2: mermi:mermi-igne+alan-buz | hazır | — |
| identify | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| illusory-script | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| inflict-wounds | 1 | Necromancy | tek hedef | `hedef:alan-nekrotik` | E2: hedef:alan-nekrotik | hazır | — |
| jump | 1 | Transmutation | koruma | `rozet:ok-kanat` | E2 rozet: ok-kanat | genel | — |
| longstrider | 1 | Transmutation | koruma | `rozet:ok-hiz-arti` | E2 rozet: ok-hiz-arti | genel | — |
| mage-armor | 1 | Abjuration | koruma | `koruma-kalkan` |  | hazır | — |
| magic-missile | 1 | Evocation | mermi | `darbe-buyu`, `mermi:mermi-ok` | E2: mermi:mermi-ok | hazır | — |
| protection-from-evil-and-good | 1 | Abjuration | koruma | `hedef:koruma-ruh`, `rozet:ok-kutsal-kalkan` | E2: hedef:koruma-ruh | hazır | — |
| purify-food-and-drink | 1 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| ray-of-sickness | 1 | Necromancy | ışın | `darbe-buyu`, `hasar:poison`, `isin:isin-nekrotik` | E2: isin:isin-nekrotik | hazır | — |
| sanctuary | 1 | Abjuration | koruma | `rozet:ok-kutsal-kalkan` | E2 rozet: ok-kutsal-kalkan | genel | — |
| searing-smite | 1 | Evocation | silah | `darbe-<silah türü>`, `hasar:burn`, `hedef:silah-kivilcim` | E2: hedef:silah-kivilcim | hazır | — |
| shield | 1 | Abjuration | koruma | `kendi:koruma-kalkan` | E2: kendi:koruma-kalkan | hazır | — |
| shield-of-faith | 1 | Abjuration | koruma | `hedef:koruma-kalkan`, `rozet:ok-ac-arti` | E2: hedef:koruma-kalkan | hazır | — |
| silent-image | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sleep | 1 | Enchantment | küre/alan | `durum:incapacitated` |  | hazır | — |
| speak-with-animals | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| thunderwave | 1 | Evocation | küre/alan | `alan-ses`, `itme-toz` |  | hazır | — |
| unseen-servant | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| acid-arrow | 2 | Evocation | mermi | `darbe-buyu`, `hasar:acid`, `mermi:mermi-ok` | E2: mermi:mermi-ok | hazır | — |
| aid | 2 | Abjuration | koruma | `hedef:koruma-kutsama` | E2: hedef:koruma-kutsama | hazır | — |
| alter-self | 2 | Transmutation | dönüşüm | `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| animal-messenger | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcane-lock | 2 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcanists-magic-aura | 2 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| augury | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| barkskin | 2 | Transmutation | koruma | `koruma-kalkan` |  | hazır | — |
| blindness-deafness | 2 | Transmutation | durum | `css:blinded` |  | hazır | — |
| blur | 2 | Illusion | dönüşüm | `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| calm-emotions | 2 | Enchantment | küre/alan | `alan:moral-huzur` | E2: alan:moral-huzur | hazır | — |
| continual-flame | 2 | Evocation | koruma | `isik-katmani (litHexes)` |  | hazır | — |
| darkness | 2 | Evocation | zemin | `yer-tutucu:.spell-zone`, `zemin:zemin-kara-halka` | E2: zemin:zemin-kara-halka | hazır | — |
| darkvision | 2 | Transmutation | koruma | `hedef:goz-nabiz` | E2: hedef:goz-nabiz | hazır | — |
| detect-thoughts | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dragons-breath | 2 | Transmutation | koni | `koni:koni-<nefes türü>` | E2: koni:koni-<nefes türü> | hazır | — |
| enhance-ability | 2 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| enlarge-reduce | 2 | Transmutation | dönüşüm | `hedef:buyume-halka` | E2: hedef:buyume-halka | hazır | — |
| enthrall | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| find-steed | 2 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| find-traps | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flame-blade | 2 | Evocation | silah | `darbe-buyu`, `hasar:burn`, `kendi:silah-kilic` | E2: kendi:silah-kilic | hazır | — |
| flaming-sphere | 2 | Conjuration | çağırma | `cagir-ruh`, `cagir:cagir-ruh+ton` | E2: cagir:cagir-ruh+ton | hazır | — |
| gentle-repose | 2 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| gust-of-wind | 2 | Evocation | ışın | `itme-toz`, `isin:alan-ruzgar` | E2: isin:alan-ruzgar | hazır | — |
| heat-metal | 2 | Transmutation | silah | `darbe-buyu`, `hasar:burn`, `hedef:silah-halka` | E2: hedef:silah-halka | hazır | — |
| hold-person | 2 | Enchantment | durum | `durum:paralyzed` |  | hazır | — |
| invisibility | 2 | Illusion | koruma | `css:invisible` |  | hazır | — |
| knock | 2 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| lesser-restoration | 2 | Abjuration | iyileştirme | `hedef:iyilestir-kucuk` | E2: hedef:iyilestir-kucuk | hazır | — |
| levitate | 2 | Transmutation | dönüşüm | `rozet:🪽` | Havalanma rozeti (🪽); yükselme toz sütunu. | genel | Ters yerçekimi / deprem |
| locate-animals-or-plants | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| locate-object | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| magic-mouth | 2 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| magic-weapon | 2 | Transmutation | silah | `hedef:silah-kilic` | E2: hedef:silah-kilic | hazır | — |
| mind-spike | 2 | Divination | tek hedef | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| mirror-image | 2 | Illusion | dönüşüm | `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| misty-step | 2 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| moonbeam | 2 | Evocation | zemin | `yer-tutucu:.spell-zone`, `gokten:gokten-sutun`, `zemin:gokten-sutun` | E2: gokten:gokten-sutun, zemin:gokten-sutun | hazır | — |
| pass-without-trace | 2 | Abjuration | aura | `aura:aura-buz` | E2: aura:aura-buz | hazır | — |
| phantasmal-force | 2 | Illusion | durum | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| prayer-of-healing | 2 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| protection-from-poison | 2 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| ray-of-enfeeblement | 2 | Necromancy | durum | `rozet:ok-hasar-eksi` | E2 rozet: ok-hasar-eksi | genel | — |
| rope-trick | 2 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| scorching-ray | 2 | Evocation | ışın | `darbe-buyu`, `hasar:burn`, `isin:isin-ates` | E2: isin:isin-ates | hazır | — |
| see-invisibility | 2 | Divination | koruma | `hedef:goz-nabiz` | E2: hedef:goz-nabiz | hazır | — |
| shatter | 2 | Evocation | küre/alan | `alan-ses` |  | hazır | — |
| shining-smite | 2 | Transmutation | silah | `darbe-<silah türü>`, `hedef:silah-kivilcim` | E2: hedef:silah-kivilcim | hazır | — |
| silence | 2 | Illusion | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| spider-climb | 2 | Transmutation | koruma | `rozet:ok-hiz-arti` | E2 rozet: ok-hiz-arti | genel | — |
| spike-growth | 2 | Transmutation | zemin | `yer-tutucu:.spell-zone`, `zemin:zemin-dikenli` | E2: zemin:zemin-dikenli | hazır | — |
| spiritual-weapon | 2 | Evocation | çağırma | `darbe-buyu`, `hedef:ruh-balta` | E2: hedef:ruh-balta | hazır | — |
| suggestion | 2 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| warding-bond | 2 | Abjuration | işaret | `koruma-kalkan`, `isaret:isaret-zincir` | E2: isaret:isaret-zincir | hazır | — |
| web | 2 | Conjuration | zemin | `zemin:yuzey-ag`, `durum:restrained` |  | hazır | — |
| zone-of-truth | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animate-dead | 3 | Necromancy | çağırma | `cagir-ruh` |  | hazır | — |
| beacon-of-hope | 3 | Abjuration | koruma | `koruma-kutsama` |  | hazır | — |
| bestow-curse | 3 | Necromancy | işaret | `isaret:isaret-lanet` | E2: isaret:isaret-lanet | hazır | — |
| blink | 3 | Transmutation | ışınlanma | `kendi:run-cember` | E2: kendi:run-cember | hazır | — |
| call-lightning | 3 | Conjuration | gökten düşen | `alan-yildirim`, `gokten:gokten-yildirim` | E2: gokten:gokten-yildirim | hazır | — |
| clairvoyance | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| conjure-animals | 3 | Conjuration | çağırma | `cagir-dogal` | eşlik eden alan: renkli yer tutucu | hazır | — |
| counterspell | 3 | Abjuration | iptal | `kendi:iptal-muhur` | E2: kendi:iptal-muhur | hazır | — |
| create-food-and-water | 3 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| daylight | 3 | Evocation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Işık alanı ışık katmanına yazılır; küre dokusu yok. | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| dispel-magic | 3 | Abjuration | iptal | `hedef:iptal-muhur` | E2: hedef:iptal-muhur | hazır | — |
| fear | 3 | Illusion | koni | `durum:frightened`, `koni:koni-yesil` | E2: koni:koni-yesil | hazır | — |
| fireball | 3 | Evocation | küre/alan | `alan-ates`, `hasar:burn` |  | hazır | — |
| fly | 3 | Transmutation | dönüşüm | `rozet:🪽`, `hedef:kanat-melek` | E2: hedef:kanat-melek | hazır | — |
| gaseous-form | 3 | Transmutation | dönüşüm | `koruma-ruh`, `rozet:🪽` |  | hazır | — |
| glyph-of-warding | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| haste | 3 | Transmutation | koruma | `koruma-kalkan`, `hedef:zaman-girdap` | E2: hedef:zaman-girdap | hazır | — |
| hypnotic-pattern | 3 | Illusion | küre/alan | `durum:charmed`, `durum:incapacitated` |  | hazır | — |
| lightning-bolt | 3 | Evocation | ışın | `alan-yildirim`, `isin:isin-sok` | E2: isin:isin-sok | hazır | — |
| magic-circle | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| major-image | 3 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-healing-word | 3 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| meld-into-stone | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| nondetection | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| phantom-steed | 3 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| plant-growth | 3 | Transmutation | zemin | `yer-tutucu:.spell-zone`, `zemin:zemin-bitki` | E2: zemin:zemin-bitki | hazır | — |
| protection-from-energy | 3 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| remove-curse | 3 | Abjuration | iptal | `hedef:iptal-muhur` | E2: hedef:iptal-muhur | hazır | — |
| revivify | 3 | Necromancy | iyileştirme | `hedef:iyilestir-buyuk` | E2: hedef:iyilestir-buyuk | hazır | — |
| sending | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sleet-storm | 3 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `zemin:zemin-sulu-kar` | E2: zemin:zemin-sulu-kar | hazır | — |
| slow | 3 | Transmutation | durum | `hedef:zaman-kadran` | E2: hedef:zaman-kadran | hazır | — |
| speak-with-dead | 3 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| speak-with-plants | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| spirit-guardians | 3 | Conjuration | aura | `alan-isik`, `aura:aura-altin` | E2: aura:aura-altin | hazır | — |
| stinking-cloud | 3 | Conjuration | zemin | `zemin:yuzey-zehir`, `durum:poison` |  | hazır | — |
| tiny-hut | 3 | Evocation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| tongues | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| vampiric-touch | 3 | Necromancy | dokunuş | `darbe-buyu`, `darbe-buyu+ton(necrotic)` | E2: darbe-buyu+ton(necrotic) | hazır | — |
| water-breathing | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| water-walk | 3 | Transmutation | koruma | `rozet:ok-hiz-arti` | E2 rozet: ok-hiz-arti | genel | — |
| wind-wall | 3 | Evocation | duvar | `duvar-kuvvet` |  | hazır | — |
| arcane-eye | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| aura-of-life | 4 | Abjuration | aura | `koruma-ruh`, `aura:aura-altin` | E2: aura:aura-altin | hazır | — |
| banishment | 4 | Abjuration | ışınlanma | `durum:incapacitated`, `hedef:run-cember` | E2: hedef:run-cember | hazır | — |
| black-tentacles | 4 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `durum:restrained`, `zemin:zemin-dokunac` | E2: zemin:zemin-dokunac | hazır | — |
| blight | 4 | Necromancy | tek hedef | `hedef:alan-nekrotik` | E2: hedef:alan-nekrotik | hazır | — |
| charm-monster | 4 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| compulsion | 4 | Enchantment | küre/alan | `durum:charmed` |  | hazır | — |
| confusion | 4 | Enchantment | küre/alan | `alan:alan-psisik` | E2: alan:alan-psisik | hazır | — |
| conjure-minor-elementals | 4 | Conjuration | çağırma | `aura:aura-kirmizi` | E2: aura:aura-kirmizi | hazır | — |
| conjure-woodland-beings | 4 | Conjuration | aura | `alan-kuvvet`, `aura:aura-altin` | E2: aura:aura-altin | hazır | — |
| control-water | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| death-ward | 4 | Abjuration | koruma | `rozet:ok-yenilenme` | E2 rozet: ok-yenilenme | genel | — |
| dimension-door | 4 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| divination | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dominate-beast | 4 | Enchantment | işaret | `durum:charmed`, `isaret:isaret-pence` | E2: isaret:isaret-pence | hazır | — |
| fabricate | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| faithful-hound | 4 | Conjuration | çağırma | `yer-tutucu:.spell-zone`, `zemin:zemin-buz-run` | E2: zemin:zemin-buz-run | hazır | — |
| fire-shield | 4 | Evocation | aura | `koruma-ruh`, `aura:aura-kirmizi` | E2: aura:aura-kirmizi | hazır | — |
| freedom-of-movement | 4 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| giant-insect | 4 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| greater-invisibility | 4 | Illusion | koruma | `css:invisible` |  | hazır | — |
| guardian-of-faith | 4 | Conjuration | çağırma | `yer-tutucu:.spell-zone`, `zemin:zemin-duman-halka` | E2: zemin:zemin-duman-halka | hazır | — |
| hallucinatory-terrain | 4 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| ice-storm | 4 | Evocation | küre/alan | `hasar:freeze`, `alan:alan-buz` | E2: alan:alan-buz | hazır | — |
| locate-creature | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| phantasmal-killer | 4 | Illusion | tek hedef | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| polymorph | 4 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu`, `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| private-sanctum | 4 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| resilient-sphere | 4 | Abjuration | koruma | `hedef:kalkan-kure` | E2: hedef:kalkan-kure | hazır | — |
| secret-chest | 4 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| stone-shape | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| stoneskin | 4 | Transmutation | koruma | `koruma-ruh` |  | hazır | — |
| vitriolic-sphere | 4 | Evocation | küre/alan | `hasar:acid`, `alan:alan-asit` | E2: alan:alan-asit | hazır | — |
| wall-of-fire | 4 | Evocation | duvar | `duvar-ates`, `hasar:burn` |  | hazır | — |
| animate-objects | 5 | Transmutation | çağırma | `cagir-portal`, `cagir:cagir-portal+ton` | E2: cagir:cagir-portal+ton | hazır | — |
| antilife-shell | 5 | Abjuration | aura | `aura-altin`, `kendi:kalkan-kure` | E2: kendi:kalkan-kure | hazır | — |
| arcane-hand | 5 | Evocation | çağırma | `cagir-portal`, `cagir:cagir-portal+ton` | E2: cagir:cagir-portal+ton | hazır | — |
| awaken | 5 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cloudkill | 5 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `hasar:poison`, `zemin:zemin-spor` | E2: zemin:zemin-spor | hazır | — |
| commune | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| commune-with-nature | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cone-of-cold | 5 | Evocation | koni | `hasar:freeze`, `koni:koni-buz` | E2: koni:koni-buz | hazır | — |
| conjure-elemental | 5 | Conjuration | çağırma | `cagir-portal`, `cagir:cagir-portal+ton` | E2: cagir:cagir-portal+ton | hazır | — |
| contact-other-plane | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| contagion | 5 | Necromancy | tek hedef | `durum:poison`, `hedef:alan-zehir` | E2: hedef:alan-zehir | hazır | — |
| creation | 5 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dispel-evil-and-good | 5 | Abjuration | koruma | `hedef:iptal-muhur` | E2: hedef:iptal-muhur | hazır | — |
| dominate-person | 5 | Enchantment | işaret | `durum:charmed`, `isaret:isaret-kristal` | E2: isaret:isaret-kristal | hazır | — |
| dream | 5 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flame-strike | 5 | Evocation | gökten düşen | `alan-isik`, `gokten:gokten-sutun` | E2: gokten:gokten-sutun | hazır | — |
| geas | 5 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| greater-restoration | 5 | Abjuration | iyileştirme | `hedef:iyilestir-buyuk` | E2: hedef:iyilestir-buyuk | hazır | — |
| hallow | 5 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| hold-monster | 5 | Enchantment | durum | `durum:paralyzed` |  | hazır | — |
| insect-plague | 5 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `zemin:zemin-bocek` | E2: zemin:zemin-bocek | hazır | — |
| legend-lore | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-cure-wounds | 5 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| mislead | 5 | Illusion | koruma | `css:invisible` |  | hazır | — |
| modify-memory | 5 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| passwall | 5 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| planar-binding | 5 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| raise-dead | 5 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| reincarnate | 5 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| scrying | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| seeming | 5 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| summon-dragon | 5 | Conjuration | çağırma | `cagir-portal`, `cagir:cagir-portal+ton` | E2: cagir:cagir-portal+ton | hazır | — |
| telekinesis | 5 | Transmutation | durum | `itme-toz`, `durum:restrained` | Taşıma: itme-toz değil (yer değiştirme olayı); yükselme toz sütunu. | genel | Ters yerçekimi / deprem |
| telepathic-bond | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| teleportation-circle | 5 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| tree-stride | 5 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| wall-of-force | 5 | Evocation | duvar | `duvar-kuvvet` |  | hazır | — |
| wall-of-stone | 5 | Evocation | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| blade-barrier | 6 | Evocation | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| chain-lightning | 6 | Evocation | ışın | `isin:isin-sok` | E2: isin:isin-sok | hazır | — |
| circle-of-death | 6 | Necromancy | küre/alan | `alan-nekrotik` |  | hazır | — |
| conjure-fey | 6 | Conjuration | çağırma | `darbe-buyu`, `hedef:ruh-hancer` | E2: hedef:ruh-hancer | hazır | — |
| contingency | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| create-undead | 6 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| disintegrate | 6 | Transmutation | ışın | `isin:isin-kuvvet` | E2: isin:isin-kuvvet | hazır | — |
| eyebite | 6 | Necromancy | durum | `css:unconscious`, `durum:frightened` |  | hazır | — |
| find-the-path | 6 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flesh-to-stone | 6 | Transmutation | durum | `durum:restrained` |  | hazır | — |
| forbiddance | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| freezing-sphere | 6 | Evocation | küre/alan | `hasar:freeze`, `alan:alan-buz` | E2: alan:alan-buz | hazır | — |
| globe-of-invulnerability | 6 | Abjuration | koruma | `kendi:kalkan-kure` | E2: kendi:kalkan-kure | hazır | — |
| guards-and-wards | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| harm | 6 | Necromancy | tek hedef | `hedef:alan-nekrotik` | E2: hedef:alan-nekrotik | hazır | — |
| heal | 6 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| heroes-feast | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| instant-summons | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| irresistible-dance | 6 | Enchantment | durum | `rozet:ok-dezavantaj` | E2 rozet: ok-dezavantaj | genel | — |
| magic-jar | 6 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-suggestion | 6 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| move-earth | 6 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| planar-ally | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| programmed-illusion | 6 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sunbeam | 6 | Evocation | ışın | `alan-isik`, `css:blinded`, `isin:isin-isik` | E2: isin:isin-isik | hazır | — |
| transport-via-plants | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| true-seeing | 6 | Divination | koruma | `hedef:goz-nabiz` | E2: hedef:goz-nabiz | hazır | — |
| wall-of-ice | 6 | Evocation | duvar | `duvar-buz`, `hasar:freeze` |  | hazır | — |
| wall-of-thorns | 6 | Conjuration | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| wind-walk | 6 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| word-of-recall | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcane-sword | 7 | Evocation | çağırma | `darbe-buyu`, `hedef:ruh-hancer` | E2: hedef:ruh-hancer | hazır | — |
| conjure-celestial | 7 | Conjuration | gökten düşen | `yer-tutucu:.spell-zone`, `gokten:gokten-sutun`, `zemin:gokten-sutun` | E2: gokten:gokten-sutun, zemin:gokten-sutun | hazır | — |
| delayed-blast-fireball | 7 | Evocation | zemin | `yer-tutucu:.spell-zone`, `hasar:burn` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| divine-word | 7 | Evocation | durum | `gokten:gokten-sutun` | E2: gokten:gokten-sutun | hazır | — |
| etherealness | 7 | Conjuration | dönüşüm | `kendi:run-cember` | E2: kendi:run-cember | hazır | — |
| finger-of-death | 7 | Necromancy | tek hedef | `isin:isin-nekrotik` | E2: isin:isin-nekrotik | hazır | — |
| fire-storm | 7 | Evocation | küre/alan | `alan-ates`, `hasar:burn` |  | hazır | — |
| forcecage | 7 | Evocation | durum | `yer-tutucu:.spell-zone`, `hedef:kafes` | E2: hedef:kafes | hazır | — |
| magnificent-mansion | 7 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mirage-arcane | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| plane-shift | 7 | Conjuration | ışınlanma | `hedef:run-cember` | E2: hedef:run-cember | hazır | — |
| prismatic-spray | 7 | Evocation | koni | `isin:isin-prizma` | E2: isin:isin-prizma | hazır | — |
| project-image | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| regenerate | 7 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| resurrection | 7 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| reverse-gravity | 7 | Transmutation | küre/alan | — |  | eksik | Ters yerçekimi / deprem |
| sequester | 7 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| simulacrum | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| symbol | 7 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| teleport | 7 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animal-shapes | 8 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| antimagic-field | 8 | Abjuration | aura | `kendi:kalkan-kure` | E2: kendi:kalkan-kure | hazır | — |
| antipathy-sympathy | 8 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| befuddlement | 8 | Enchantment | tek hedef | `hedef:alan-psisik` | E2: hedef:alan-psisik | hazır | — |
| clone | 8 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| control-weather | 8 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| demiplane | 8 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dominate-monster | 8 | Enchantment | işaret | `durum:charmed`, `isaret:isaret-kristal` | E2: isaret:isaret-kristal | hazır | — |
| earthquake | 8 | Transmutation | zemin | `yer-tutucu:.spell-zone`, `css:prone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Ters yerçekimi / deprem |
| glibness | 8 | Enchantment | koruma | `rozet:ok-avantaj` | E2 rozet: ok-avantaj | genel | — |
| holy-aura | 8 | Abjuration | aura | `koruma-kutsama`, `aura:aura-altin` | E2: aura:aura-altin | hazır | — |
| incendiary-cloud | 8 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `hasar:burn`, `zemin:duman-kor` | E2: zemin:duman-kor | hazır | — |
| maze | 8 | Conjuration | ışınlanma | `durum:incapacitated`, `hedef:run-cember` | E2: hedef:run-cember | hazır | — |
| mind-blank | 8 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| power-word-stun | 8 | Enchantment | durum | `durum:stunned` | Stunned döngüsü (durum). | hazır | — |
| sunburst | 8 | Evocation | küre/alan | `alan-isik`, `css:blinded` |  | hazır | — |
| tsunami | 8 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| astral-projection | 9 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| foresight | 9 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| gate | 9 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| imprisonment | 9 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-heal | 9 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| meteor-swarm | 9 | Evocation | gökten düşen | `alan-ates`, `hasar:burn`, `gokten:gokten-meteor` | E2: gokten:gokten-meteor | hazır | — |
| power-word-heal | 9 | Enchantment | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| power-word-kill | 9 | Enchantment | durum | — | Ölüm tozu (olum-toz) hedef ölünce zaten; sözün kendisi görselsiz. | eksik | Öldürme sözü (tek seferlik) |
| prismatic-wall | 9 | Abjuration | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Prizma (gökkuşağı) ışını/duvarı |
| shapechange | 9 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu`, `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| storm-of-vengeance | 9 | Conjuration | gökten düşen | `yer-tutucu:.spell-zone`, `ikon:deafened`, `gokten:gokten-yildirim`, `zemin:gokten-yildirim` | E2: gokten:gokten-yildirim, zemin:gokten-yildirim | hazır | — |
| time-stop | 9 | Transmutation | durum | `kendi:zaman-kure` | E2: kendi:zaman-kure | hazır | — |
| true-polymorph | 9 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu`, `hedef:donusum-flas` | E2: hedef:donusum-flas | hazır | — |
| true-resurrection | 9 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| weird | 9 | Illusion | küre/alan | `alan-psisik`, `durum:frightened` |  | hazır | — |
| wish | 9 | Conjuration | yok | `kopyalanan büyünün efekti` |  | genel | — |

## 3. Eksik animasyon aileleri

Çözüm: **kod** mevcut sprite + bağlama/CSS/hue; **E2** depoda olup içe aktarılmamış ham sayfa (`assets-ham/efekt/`, aşağıdaki tablo; içe aktarma ve bağlama CC işi); **Gemini** yeni sayfa (4. bölüm).

| Aile | Büyü | Çözüm | Mevcut kaynak / E2 satırları | Büyüler |
|---|---|---|---|---|
| Ters yerçekimi / deprem (`yercekimi`) | 4 | Gemini |  | levitate, telekinesis, reverse-gravity, earthquake |
| Zemin kutuları (kalıcı büyü alanı dokusu) (`zemin-kutu`) | 3 | E2 + Gemini | zemin-kutulari.jpg: lav/kor, spor bulutu, diken/sarmaşık, mor girdap, buz rün halkası, duman halkası, bitki, kara halka | silence, daylight, delayed-blast-fireball |
| Eksik duvar türleri (`duvar-ek`) | 3 | Gemini |  | wall-of-stone, blade-barrier, wall-of-thorns |
| Öldürme sözü (tek seferlik) (`durum-ek`) | 1 | Gemini |  | power-word-kill |
| Prizma (gökkuşağı) ışını/duvarı (`prizma`) | 1 | Gemini |  | prismatic-wall |

### İçe aktarılmamış E2 ham sayfaları

`assets-ham/efekt/` içinde `data/efekt-kesim.json`’da kaydı olmayan 0 sayfa (Gemini’den gelmiş, `npm run sprite-ice -- --efekt` ile içe aktarılmamış). Satırlar görsel incelemeyle; hepsi siyah zeminli (ikon sayfaları macenta zeminli). Bu sayfalar efekt sayılmadı (hazır değil).

Kuyruk E2: 12 sayfanın hepsi içe aktarıldı (`data/efekt-kesim.json` `klasor: efekt` → `public/efekt/`, kayıt `data/efekt-e2.json`).


## 4. Önerilen Gemini sayfaları

Yalnız E2 sayfalarında ve mevcut efektlerde karşılığı olmayan ihtiyaçlar. Aynı hücre birden çok büyüyü karşılıyorsa bir kez sayılır. Biçim mevcut sayfalarla aynı: siyah zemin, satır başına bir animasyon, 8 kare (duvar parçaları yatay şerit, `duvar-parcalar` gibi).

| Sayfa adı | Hücre | Hücreler (büyüler) |
|---|---|---|
| efekt-yercekimi | 2 | ters yerçekimi yükselen toz sütunu (levitate, telekinesis, reverse-gravity); deprem yarığı zemin kutusu (earthquake) |
| efekt-zemin-kutu | 2 | sessizlik küresi (silence); gün ışığı küresi (daylight) |
| efekt-duvar-ek | 3 | taş duvar parçası (wall-of-stone); bıçak bariyeri parçası (blade-barrier); diken duvarı parçası (wall-of-thorns) |
| efekt-durum-ek | 1 | ölüm sözü (kafatası rün, tek seferlik) (power-word-kill) |
| efekt-prizma | 1 | prizma duvar parçası (prismatic-wall) |

Toplam 5 Gemini sayfası, 9 hücre.

## 5. Kodla çözülecekler (CC işi)

0 madde. Hepsi yalnız görsel (fxPlan / efekt-baglama / CSS); kural, sayı ve kural sürümü değişmez.


## 6. Savaş dışı büyüler (114)

Efekt gerekmez: kartta "savaş dışı", günlükte Game Master notu (`spell_cast` notu) yeter.

- **0–3** (53): druidcraft, elementalism, mage-hand, mending, message, minor-illusion, prestidigitation, thaumaturgy, alarm, comprehend-languages, create-or-destroy-water, detect-evil-and-good, detect-magic, detect-poison-and-disease, disguise-self, floating-disk, goodberry, identify, illusory-script, purify-food-and-drink, silent-image, speak-with-animals, unseen-servant, animal-messenger, arcane-lock, arcanists-magic-aura, augury, detect-thoughts, enhance-ability, enthrall, find-traps, gentle-repose, knock, locate-animals-or-plants, locate-object, magic-mouth, prayer-of-healing, rope-trick, zone-of-truth, clairvoyance, create-food-and-water, glyph-of-warding, magic-circle, major-image, meld-into-stone, nondetection, phantom-steed, sending, speak-with-dead, speak-with-plants, tiny-hut, tongues, water-breathing
- **4–5** (27): arcane-eye, control-water, divination, fabricate, hallucinatory-terrain, locate-creature, private-sanctum, secret-chest, stone-shape, awaken, commune, commune-with-nature, contact-other-plane, creation, dream, geas, hallow, legend-lore, modify-memory, passwall, planar-binding, raise-dead, reincarnate, scrying, seeming, telepathic-bond, teleportation-circle
- **6–9** (34): contingency, create-undead, find-the-path, forbiddance, guards-and-wards, heroes-feast, instant-summons, magic-jar, move-earth, planar-ally, programmed-illusion, transport-via-plants, wind-walk, word-of-recall, magnificent-mansion, mirage-arcane, project-image, regenerate, resurrection, sequester, simulacrum, symbol, teleport, animal-shapes, antipathy-sympathy, clone, control-weather, demiplane, tsunami, astral-projection, foresight, gate, imprisonment, true-resurrection
