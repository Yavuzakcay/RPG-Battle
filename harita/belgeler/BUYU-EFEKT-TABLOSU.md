# Büyü × efekt tablosu (Kuyruk E3)

`npm run efekt-tablosu` üretir (`scripts/buyu-efekt-tablosu.mjs`, kurallar `scripts/lib/buyu-efekt.mjs`); elle düzenlenmez. Salt okuma denetimi: oyun kodu, veri ve görseller değişmedi. Büyü durumu (savaşta / savaş dışı) `harita/belgeler/BUYU-DURUM.md` ile aynı ölçüt (`scripts/lib/buyu-durum.mjs`).

## Yöntem

**Hazır** = büyünün asıl görsel ailesi (alan patlaması, iyileştirme, ışınlanma, duvar, zemin, durum döngüsü, koruma, çağırma) için efekt anahtarı kayıt defterinde var (`data/sprite-esleme.json` `efektler`/`zones`, `data/efekt-sprites.json`) **ve** dosyası depoda (`public/sprites/`, `public/efektler/`) **ve** bağlama kodu bu büyü için o anahtarı gerçekten seçiyor (`src/ui/fx/fxPlan.ts`, `src/ui/damageFloats.ts`, `src/ui/statusFx.ts`, `src/ui/sprites.ts`; olay yolu `src/battle/spells.ts`). **Genel** = yalnız varsayılan/yedek görsel (`darbe-buyu`, `cagir-portal`, `aura-altin`, renkli altıgen yer tutucusu `.spell-zone`, koni/çizginin patlama olarak çizilmesi, yalnız hasar türü şeridi ya da durum ikonu, rozet). **Eksik** = günlük ve sayı dışında görsel yok. Hasar sayıları her büyüde çıkar, sayılmaz.

Koddan çıkan bağlama kuralları:

- Büyü saldırısı ve otomatik isabet (`attack_resolved`): `efekt-baglama.json` `darbe[hasar türü]`, yoksa varsayılan `darbe-buyu`; kritikte `kritik-vurus`. Hedefte hasar türü şeridi yalnız ateş (`burn`), soğuk (`freeze`), asit (`acid`), zehir (`poison`). **Mermi/ışın çizilmez.**
- Alan büyüsü (`executeAreaCast` → `spell_cast.area`): alan[hasar türü] (ateş, yıldırım, ışık, nekrotik, psişik, kuvvet, gök gürültüsü). `spell_cast.area` **şekil taşımaz**: koni ve çizgi de merkezde patlama olarak çizilir (çizgiyi ışın yapan dal yalnız şekilli `area_used`’da: canavar nefesi, Dragonborn). Soğuk, asit, zehir, ezme/delme alanlarında patlama yok.
- Kalıcı alan (`m.zone` → `executeZoneCast`, alan patlaması yok): `sprite-esleme.json` `zones["spells:<id>"]` (Fog Cloud, Web, Grease, Stinking Cloud) ya da `efekt-baglama.json` `duvar` (Wall of Fire/Force/Ice, Wind Wall); kalanı renkli altıgen yer tutucusu. Yaratığa bağlı alan → aura (renk hasar türünden, yoksa `aura-altin`).
- `healed` → `iyilestir-kucuk/buyuk`; `teleported` → `isinlan-cikis/giris`; `summoned` → `cagir-ruh`/`cagir-dogal` (veri listesi, dokunulamaz çağrı ruh), yoksa varsayılan `cagir-portal`; `pushed` → `itme-toz`.
- Süren etki (`effect_added`) yalnız dost/kendine: `koruma` tablosu (ac/acMin → kalkan; wardedFrom/resist/immune → ruh; +zar/tempHp/saveAdv → kutsama). Düşmana etki ve `buff_added` (Shield of Faith, Divine Favor, Magic Weapon) görsel üretmez.
- Durum: döngü şeridi (Paralyzed, Stunned, Incapacitated, Frightened, Charmed, Restrained, Grappled; Poisoned `jetonDongu`), CSS jeton filtresi (Petrified, Blinded, Invisible, Unconscious, Prone, Exhaustion), yoksa yalnız ikon (Deafened).
- Spirit Guardians yayılımı konsantrasyonda tutulur (`concentration.aura`); `groundFx` yalnız etki `aura`/`auras` ve yaratığa bağlı alanları okur: yayılım çizilmez.

Kısmi ya da sığmayan notlu büyü: 0 (K58 sonrası 0; ayrı efekt ihtiyacı yok).

## 1. Özet

Seviye grubu × sınıf. Bir büyü birden çok sınıfta sayılır; "Tümü" satırı tekil büyü sayısıdır. **Yeni anim.** = genel ya da eksik olup bir eksik animasyon ailesine bağlanan savaş büyüsü.

| Seviye | Sınıf | Toplam | Savaş dışı | Hazır | Genel | Eksik | Yeni anim. |
|---|---|---|---|---|---|---|---|
| 0–3 | Bard | 73 | 30 | 18 | 7 | 18 | 25 |
| 0–3 | Cleric | 58 | 21 | 13 | 6 | 18 | 24 |
| 0–3 | Druid | 63 | 18 | 14 | 15 | 16 | 31 |
| 0–3 | Paladin | 30 | 10 | 5 | 5 | 10 | 15 |
| 0–3 | Ranger | 40 | 13 | 8 | 7 | 12 | 19 |
| 0–3 | Sorcerer | 85 | 16 | 20 | 26 | 23 | 49 |
| 0–3 | Warlock | 40 | 12 | 8 | 9 | 11 | 20 |
| 0–3 | Wizard | 110 | 35 | 24 | 24 | 27 | 51 |
| 0–3 | **Tümü** | **183** | 52 | **37** | **46** | **48** | **94** |
| 4–5 | Bard | 27 | 13 | 8 | 3 | 3 | 6 |
| 4–5 | Cleric | 22 | 11 | 2 | 6 | 3 | 9 |
| 4–5 | Druid | 33 | 11 | 7 | 9 | 6 | 15 |
| 4–5 | Paladin | 8 | 3 | 0 | 2 | 3 | 5 |
| 4–5 | Ranger | 8 | 2 | 3 | 2 | 1 | 3 |
| 4–5 | Sorcerer | 25 | 3 | 6 | 11 | 5 | 16 |
| 4–5 | Warlock | 12 | 6 | 4 | 1 | 1 | 2 |
| 4–5 | Wizard | 50 | 21 | 8 | 13 | 8 | 21 |
| 4–5 | **Tümü** | **72** | 27 | **13** | **21** | **11** | **32** |
| 6–9 | Bard | 30 | 13 | 5 | 4 | 8 | 12 |
| 6–9 | Cleric | 29 | 13 | 5 | 5 | 6 | 11 |
| 6–9 | Druid | 28 | 13 | 4 | 8 | 3 | 11 |
| 6–9 | Sorcerer | 30 | 4 | 8 | 6 | 12 | 17 |
| 6–9 | Warlock | 20 | 6 | 4 | 2 | 8 | 10 |
| 6–9 | Wizard | 58 | 22 | 10 | 10 | 16 | 25 |
| 6–9 | **Tümü** | **84** | 33 | **14** | **18** | **19** | **36** |
| **0–9** | **Tümü** | **339** | 112 | **64** | **85** | **78** | **162** |

Savaşta kullanılan 227 büyünün 64'i hazır (28%), 85'i genel, 78'i eksik; 162 büyü yeni animasyon (ya da bağlama) bekliyor.

Türe göre (savaş büyüleri):

| Tür | Hazır | Genel | Eksik |
|---|---|---|---|
| koruma | 16 | 1 | 22 |
| durum | 12 | 1 | 10 |
| küre/alan | 11 | 0 | 8 |
| zemin | 5 | 13 | 0 |
| çağırma | 5 | 10 | 1 |
| dönüşüm | 1 | 6 | 5 |
| iyileştirme | 7 | 0 | 4 |
| tek hedef | 0 | 2 | 9 |
| mermi | 0 | 10 | 0 |
| silah | 0 | 7 | 3 |
| ışın | 0 | 7 | 2 |
| aura | 0 | 6 | 2 |
| duvar | 4 | 4 | 0 |
| işaret | 0 | 4 | 3 |
| ışınlanma | 3 | 2 | 2 |
| gökten düşen | 0 | 5 | 1 |
| koni | 0 | 3 | 3 |
| dokunuş | 0 | 3 | 0 |
| iptal | 0 | 0 | 3 |
| yok | 0 | 1 | 0 |

## 2. Büyü tablosu (339)

Tür: mermi, ışın, koni, küre/alan, duvar, zemin, aura, çağırma, dönüşüm, işaret, koruma, ışınlanma, durum, yok; ayrıca tek hedef (save’li darbe), dokunuş, silah, iyileştirme, iptal, gökten düşen. Anahtar önekleri: `hasar:` hedefteki hasar türü şeridi (`public/efektler/`), `durum:` döngü şeridi, `css:` jeton filtresi, `ikon:` durum ikonu, `zemin:` yüzey sprite’ı, `yer-tutucu:` renkli altıgen, `rozet:` emoji rozeti; öneksiz olanlar `public/sprites/efekt-<ad>.webp`.

| Kimlik | Sv | Okul | Tür | Efekt anahtarları | Kalite notu | Durum | Eksik aile |
|---|---|---|---|---|---|---|---|
| acid-splash | 0 | Evocation | küre/alan | `hasar:acid` | alan satırı yok (acid) | eksik | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| chill-touch | 0 | Necromancy | dokunuş | `darbe-buyu` | varsayılan darbe (darbe-buyu) | genel | Dokunuş büyüsü darbesi (renkli darbe) |
| dancing-lights | 0 | Illusion | zemin | `yer-tutucu:.spell-zone`, `isik-katmani (zone.light)` | renkli altıgen yer tutucusu (spec.color/icon) | hazır | — |
| druidcraft | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| eldritch-blast | 0 | Evocation | ışın | `darbe-buyu` | varsayılan darbe (darbe-buyu) | genel | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| elementalism | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| fire-bolt | 0 | Evocation | mermi | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| guidance | 0 | Divination | koruma | `koruma-kutsama` |  | hazır | — |
| light | 0 | Evocation | koruma | `isik-katmani (litHexes)` |  | hazır | — |
| mage-hand | 0 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mending | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| message | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| minor-illusion | 0 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| poison-spray | 0 | Necromancy | mermi | `darbe-buyu`, `hasar:poison` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| prestidigitation | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| produce-flame | 0 | Conjuration | mermi | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| ray-of-frost | 0 | Evocation | ışın | `darbe-buyu`, `hasar:freeze` | varsayılan darbe (darbe-buyu) | genel | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| resistance | 0 | Abjuration | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| sacred-flame | 0 | Evocation | gökten düşen | — |  | eksik | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| shillelagh | 0 | Transmutation | silah | — | koruma satırı eşleşmiyor | eksik | Silah parıltısı (smite, büyülü silah) |
| shocking-grasp | 0 | Evocation | dokunuş | `darbe-buyu` | varsayılan darbe (darbe-buyu) | genel | Dokunuş büyüsü darbesi (renkli darbe) |
| sorcerous-burst | 0 | Evocation | mermi | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| spare-the-dying | 0 | Necromancy | iyileştirme | — | `life_restored`/durum kaldırma fx üretmez | eksik | Diriltme / durum temizleme |
| starry-wisp | 0 | Evocation | mermi | `darbe-buyu` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| thaumaturgy | 0 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| true-strike | 0 | Divination | silah | `darbe-buyu` | Silah saldırısı: darbe silahın türünden (hazır darbe), büyü parıltısı yok. | genel | Silah parıltısı (smite, büyülü silah) |
| vicious-mockery | 0 | Enchantment | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| alarm | 1 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animal-friendship | 1 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| bane | 1 | Enchantment | durum | — | düşmana süren etki görsel üretmez | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| bless | 1 | Enchantment | koruma | `koruma-kutsama` |  | hazır | — |
| burning-hands | 1 | Evocation | koni | `alan-ates`, `hasar:burn` | koni şekilsiz `spell_cast.area` → patlama olarak çizilir | genel | Koni dokusu |
| charm-person | 1 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| chromatic-orb | 1 | Evocation | mermi | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| color-spray | 1 | Illusion | koni | `css:blinded` | koni dokusu yok | genel | Koni dokusu |
| command | 1 | Enchantment | durum | — | düşmana süren etki görsel üretmez | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| comprehend-languages | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| create-or-destroy-water | 1 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cure-wounds | 1 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| detect-evil-and-good | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| detect-magic | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| detect-poison-and-disease | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| disguise-self | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dissonant-whispers | 1 | Enchantment | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| divine-favor | 1 | Transmutation | silah | — | `buff_added` görsel üretmez. | eksik | Silah parıltısı (smite, büyülü silah) |
| divine-smite | 1 | Evocation | silah | `darbe-<silah türü>` | isabet darbesi silahtan; smite parıltısı yok | genel | Silah parıltısı (smite, büyülü silah) |
| ensnaring-strike | 1 | Conjuration | silah | `darbe-<silah türü>` | isabet darbesi silahtan; smite parıltısı yok | genel | Silah parıltısı (smite, büyülü silah) |
| entangle | 1 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `durum:restrained` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| expeditious-retreat | 1 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| faerie-fire | 1 | Evocation | küre/alan | — | Ana hatlar (`outlined`) görselsiz. | eksik | Jeton parıltısı / ana hatları (CSS) |
| false-life | 1 | Necromancy | koruma | — | `tempHpNow` koruma satırında yok. | eksik | Geçici HP kazanımı |
| feather-fall | 1 | Transmutation | koruma | — | Tepki: düşme hasarı iptali; olay görseli yok. | eksik | Tepki parıltısı (Shield, Feather Fall, paket tepkileri) |
| find-familiar | 1 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| floating-disk | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| fog-cloud | 1 | Conjuration | zemin | `zemin:yuzey-sis` |  | hazır | — |
| goodberry | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| grease | 1 | Conjuration | zemin | `zemin:yuzey-gres` |  | hazır | — |
| guiding-bolt | 1 | Evocation | mermi | `darbe-buyu` | Yıldız kayması satırı (gokten-dusen). | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| healing-word | 1 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| hellish-rebuke | 1 | Evocation | tek hedef | `hasar:burn` |  | genel | Tek hedef büyü darbesi (save’li, saldırısız) |
| heroism | 1 | Enchantment | koruma | `koruma-ruh` |  | hazır | — |
| hex | 1 | Enchantment | işaret | — | işaret görselsiz (yalnız günlük) | eksik | İşaret simgesi ve bağ çizgisi |
| hideous-laughter | 1 | Enchantment | durum | `css:prone`, `durum:incapacitated` |  | hazır | — |
| hunters-mark | 1 | Divination | işaret | — | işaret görselsiz (yalnız günlük) | eksik | İşaret simgesi ve bağ çizgisi |
| ice-knife | 1 | Conjuration | mermi | `darbe-delme` | Mermi isabeti darbe-delme (piercing, hazır darbe); soğuk patlaması cold → alan satırı yok. | genel | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| identify | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| illusory-script | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| inflict-wounds | 1 | Necromancy | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| jump | 1 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| longstrider | 1 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| mage-armor | 1 | Abjuration | koruma | `koruma-kalkan` |  | hazır | — |
| magic-missile | 1 | Evocation | mermi | `darbe-buyu` | Otomatik isabet: her dart için darbe-buyu; mermi yok. | genel | Mermi (büyü oku, küre, dart) |
| protection-from-evil-and-good | 1 | Abjuration | koruma | — | `buff_added` görsel üretmez; koruma-ruh bağlanabilir (kod). | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| purify-food-and-drink | 1 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| ray-of-sickness | 1 | Necromancy | ışın | `darbe-buyu`, `hasar:poison` | varsayılan darbe (darbe-buyu) | genel | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| sanctuary | 1 | Abjuration | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| searing-smite | 1 | Evocation | silah | `darbe-<silah türü>`, `hasar:burn` | isabet darbesi silahtan; smite parıltısı yok | genel | Silah parıltısı (smite, büyülü silah) |
| shield | 1 | Abjuration | koruma | — | Tepki: AC işareti (`marks`), effect_added yok. | eksik | Tepki parıltısı (Shield, Feather Fall, paket tepkileri) |
| shield-of-faith | 1 | Abjuration | koruma | — | `buff_added` (ward) görsel üretmez; koruma-kalkan bağlanabilir (kod). | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| silent-image | 1 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sleep | 1 | Enchantment | küre/alan | `durum:incapacitated` |  | hazır | — |
| speak-with-animals | 1 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| thunderwave | 1 | Evocation | küre/alan | `alan-ses`, `itme-toz` |  | hazır | — |
| unseen-servant | 1 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| acid-arrow | 2 | Evocation | mermi | `darbe-buyu`, `hasar:acid` | varsayılan darbe (darbe-buyu) | genel | Mermi (büyü oku, küre, dart) |
| aid | 2 | Abjuration | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| alter-self | 2 | Transmutation | dönüşüm | — | boyut değişimi: jeton ölçeği yalnız görsel tablodan | eksik | Dönüşüm flaşı ve büyüme halkası |
| animal-messenger | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcane-lock | 2 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcanists-magic-aura | 2 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| augury | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| barkskin | 2 | Transmutation | koruma | `koruma-kalkan` |  | hazır | — |
| blindness-deafness | 2 | Transmutation | durum | `css:blinded` |  | hazır | — |
| blur | 2 | Illusion | dönüşüm | — | Bulanıklık CSS filtresi yok. | eksik | Dönüşüm flaşı ve büyüme halkası |
| calm-emotions | 2 | Enchantment | küre/alan | — | Özel yol (`calm`): alan patlaması yok; moral-huzur bağlanabilir. | eksik | Hasarsız alan büyüsüne alan patlaması |
| continual-flame | 2 | Evocation | koruma | `isik-katmani (litHexes)` |  | hazır | — |
| darkness | 2 | Evocation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Büyülü karanlık `magicDarkHexes` (karanlık katmanı) + yer tutucu. | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| darkvision | 2 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Görme büyüsü göz parıltısı |
| detect-thoughts | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dragons-breath | 2 | Transmutation | koni | — | koni dokusu yok; Döküm görselsiz; nefes `area_used` ile (şekilli): koni de patlama (alan-ates) olarak. | eksik | Koni dokusu |
| enhance-ability | 2 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| enlarge-reduce | 2 | Transmutation | dönüşüm | — | boyut değişimi: jeton ölçeği yalnız görsel tablodan | eksik | Dönüşüm flaşı ve büyüme halkası |
| enthrall | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| find-steed | 2 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| find-traps | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flame-blade | 2 | Evocation | silah | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Silah parıltısı (smite, büyülü silah) |
| flaming-sphere | 2 | Conjuration | çağırma | `cagir-ruh` | dokunulamaz çağrı → cagir-ruh (ateş küresi için yanlış renk); küre jetonu yok; eşlik eden alan: renkli yer tutucu | genel | Paket çağrısının renkli portalı |
| gentle-repose | 2 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| gust-of-wind | 2 | Evocation | ışın | `itme-toz` | çizgi dokusu yok; Rüzgâr çizgisi: itme-toz (pushed) hazır; rüzgâr dokusu yok. | genel | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| heat-metal | 2 | Transmutation | silah | `darbe-buyu`, `hasar:burn` | Otomatik isabet: darbe-buyu + burn şeridi; kızaran metal parıltısı yok. | genel | Silah parıltısı (smite, büyülü silah) |
| hold-person | 2 | Enchantment | durum | `durum:paralyzed` |  | hazır | — |
| invisibility | 2 | Illusion | koruma | `css:invisible` |  | hazır | — |
| knock | 2 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| lesser-restoration | 2 | Abjuration | iyileştirme | — | `life_restored`/durum kaldırma fx üretmez | eksik | Diriltme / durum temizleme |
| levitate | 2 | Transmutation | dönüşüm | `rozet:🪽` | Havalanma rozeti (🪽); yükselme toz sütunu. | genel | Ters yerçekimi / deprem |
| locate-animals-or-plants | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| locate-object | 2 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| magic-mouth | 2 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| magic-weapon | 2 | Transmutation | silah | — | `buff_added` görsel üretmez. | eksik | Silah parıltısı (smite, büyülü silah) |
| mind-spike | 2 | Divination | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| mirror-image | 2 | Illusion | dönüşüm | — | Kopya görüntüleri çizilmez. | eksik | Dönüşüm flaşı ve büyüme halkası |
| misty-step | 2 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| moonbeam | 2 | Evocation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Taşınan ışık sütunu: zone yer tutucusu. | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| pass-without-trace | 2 | Abjuration | aura | — | koruma satırı eşleşmiyor | eksik | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| phantasmal-force | 2 | Illusion | durum | — | Yanılsama: alan-psisik hedefte. | eksik | Hasarsız alan büyüsüne alan patlaması |
| prayer-of-healing | 2 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| protection-from-poison | 2 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| ray-of-enfeeblement | 2 | Necromancy | durum | — | düşmana süren etki görsel üretmez | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| rope-trick | 2 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| scorching-ray | 2 | Evocation | ışın | `darbe-buyu`, `hasar:burn` | varsayılan darbe (darbe-buyu) | genel | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| see-invisibility | 2 | Divination | koruma | — | koruma satırı eşleşmiyor | eksik | Görme büyüsü göz parıltısı |
| shatter | 2 | Evocation | küre/alan | `alan-ses` |  | hazır | — |
| shining-smite | 2 | Transmutation | silah | `darbe-<silah türü>` | isabet darbesi silahtan; smite parıltısı yok | genel | Silah parıltısı (smite, büyülü silah) |
| silence | 2 | Illusion | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| spider-climb | 2 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| spike-growth | 2 | Transmutation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| spiritual-weapon | 2 | Evocation | çağırma | `darbe-buyu` | Saldırı türünde (çağrı jetonu yok); isabette darbe-buyu. | genel | Ruhani silah / güç eli çağrısı |
| suggestion | 2 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| warding-bond | 2 | Abjuration | işaret | `koruma-kalkan` | koruma-kalkan (ac) tek seferlik; bağ çizgisi yok. | genel | İşaret simgesi ve bağ çizgisi |
| web | 2 | Conjuration | zemin | `zemin:yuzey-ag`, `durum:restrained` |  | hazır | — |
| zone-of-truth | 2 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animate-dead | 3 | Necromancy | çağırma | `cagir-ruh` |  | hazır | — |
| beacon-of-hope | 3 | Abjuration | koruma | `koruma-kutsama` |  | hazır | — |
| bestow-curse | 3 | Necromancy | işaret | — | Lanet: düşmana etki görselsiz; lanet sigili. | eksik | İşaret simgesi ve bağ çizgisi |
| blink | 3 | Transmutation | ışınlanma | — | Eterik sıçrama: rün çemberi + saydamlık. | eksik | İptal / yansıtma / emme / büyü çemberi |
| call-lightning | 3 | Conjuration | gökten düşen | `alan-yildirim` |  | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| clairvoyance | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| conjure-animals | 3 | Conjuration | çağırma | `cagir-dogal` | eşlik eden alan: renkli yer tutucu | hazır | — |
| counterspell | 3 | Abjuration | iptal | — | Tepki: büyüyü boşa çıkarır (günlük). | eksik | İptal / yansıtma / emme / büyü çemberi |
| create-food-and-water | 3 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| daylight | 3 | Evocation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Işık alanı ışık katmanına yazılır; küre dokusu yok. | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| dispel-magic | 3 | Abjuration | iptal | — |  | eksik | İptal / yansıtma / emme / büyü çemberi |
| fear | 3 | Illusion | koni | `durum:frightened` | koni dokusu yok | genel | Koni dokusu |
| fireball | 3 | Evocation | küre/alan | `alan-ates`, `hasar:burn` |  | hazır | — |
| fly | 3 | Transmutation | dönüşüm | `rozet:🪽` |  | genel | Kanat / havalanma |
| gaseous-form | 3 | Transmutation | dönüşüm | `koruma-ruh`, `rozet:🪽` |  | hazır | — |
| glyph-of-warding | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| haste | 3 | Transmutation | koruma | `koruma-kalkan` | koruma-kalkan (ac) tek seferlik; hız için zaman girdabı + ikon. | genel | Zaman küresi |
| hypnotic-pattern | 3 | Illusion | küre/alan | `durum:charmed`, `durum:incapacitated` |  | hazır | — |
| lightning-bolt | 3 | Evocation | ışın | `alan-yildirim` | çizgi şekilsiz → patlama; isin-sok var ama seçilmiyor | genel | Çizgi alanın ışın olarak çizilmesi |
| magic-circle | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| major-image | 3 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-healing-word | 3 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| meld-into-stone | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| nondetection | 3 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| phantom-steed | 3 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| plant-growth | 3 | Transmutation | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| protection-from-energy | 3 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| remove-curse | 3 | Abjuration | iptal | — |  | eksik | İptal / yansıtma / emme / büyü çemberi |
| revivify | 3 | Necromancy | iyileştirme | — | `life_restored`/durum kaldırma fx üretmez | eksik | Diriltme / durum temizleme |
| sending | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sleet-storm | 3 | Conjuration | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| slow | 3 | Transmutation | durum | — | Düşmana etki: görsel yok. | eksik | Zaman küresi |
| speak-with-dead | 3 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| speak-with-plants | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| spirit-guardians | 3 | Conjuration | aura | `alan-isik` | Alan patlaması yalnız ilk dökümde (alan-isik); yayılım konsantrasyonda, groundFx okumuyor. | genel | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| stinking-cloud | 3 | Conjuration | zemin | `zemin:yuzey-zehir`, `durum:poison` |  | hazır | — |
| tiny-hut | 3 | Evocation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| tongues | 3 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| vampiric-touch | 3 | Necromancy | dokunuş | `darbe-buyu` | varsayılan darbe (darbe-buyu) | genel | Dokunuş büyüsü darbesi (renkli darbe) |
| water-breathing | 3 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| water-walk | 3 | Transmutation | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| wind-wall | 3 | Evocation | duvar | `duvar-kuvvet` |  | hazır | — |
| arcane-eye | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| aura-of-life | 4 | Abjuration | aura | `koruma-ruh` | Süren etki resist → koruma-ruh tek seferlik; 30 ft aura çizilmez. | genel | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| banishment | 4 | Abjuration | ışınlanma | `durum:incapacitated` | Sürgün: rün çemberi (buyu-yardimci). | genel | İptal / yansıtma / emme / büyü çemberi |
| black-tentacles | 4 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `durum:restrained` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| blight | 4 | Necromancy | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| charm-monster | 4 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| compulsion | 4 | Enchantment | küre/alan | `durum:charmed` |  | hazır | — |
| confusion | 4 | Enchantment | küre/alan | — | Hasarsız alan: patlama yok (alan-psisik bağlanabilir). | eksik | Hasarsız alan büyüsüne alan patlaması |
| conjure-minor-elementals | 4 | Conjuration | çağırma | — | Kendine güçlendirme (selfBuff); çağrı jetonu yok. | eksik | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| conjure-woodland-beings | 4 | Conjuration | aura | `alan-kuvvet` | Yayılım alanı: alan-kuvvet patlaması ilk dökümde. | genel | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| control-water | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| death-ward | 4 | Abjuration | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| dimension-door | 4 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| divination | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dominate-beast | 4 | Enchantment | işaret | `durum:charmed` | Charmed döngüsü; taraf değiştirme bağı yok. | genel | İşaret simgesi ve bağ çizgisi |
| fabricate | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| faithful-hound | 4 | Conjuration | çağırma | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Görünmez bekçi alanı: zone yer tutucusu. | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| fire-shield | 4 | Evocation | aura | `koruma-ruh` | resist → koruma-ruh tek seferlik; alev kalkanı çizilmez. | genel | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| freedom-of-movement | 4 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| giant-insect | 4 | Conjuration | çağırma | `cagir-dogal` |  | hazır | — |
| greater-invisibility | 4 | Illusion | koruma | `css:invisible` |  | hazır | — |
| guardian-of-faith | 4 | Conjuration | çağırma | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Bekçi alanı: zone yer tutucusu (cagir listesinde ama summoned olayı yok). | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| hallucinatory-terrain | 4 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| ice-storm | 4 | Evocation | küre/alan | `hasar:freeze` | alan satırı yok (cold) | eksik | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| locate-creature | 4 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| phantasmal-killer | 4 | Illusion | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| polymorph | 4 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu` | `shape_changed` jetonu değiştirir; geçiş flaşı yok | genel | Dönüşüm flaşı ve büyüme halkası |
| private-sanctum | 4 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| resilient-sphere | 4 | Abjuration | koruma | — | Küre: buyu-yardimci kalkan küre satırı. | eksik | İptal / yansıtma / emme / büyü çemberi |
| secret-chest | 4 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| stone-shape | 4 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| stoneskin | 4 | Transmutation | koruma | `koruma-ruh` |  | hazır | — |
| vitriolic-sphere | 4 | Evocation | küre/alan | `hasar:acid` | alan satırı yok (acid) | eksik | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| wall-of-fire | 4 | Evocation | duvar | `duvar-ates`, `hasar:burn` |  | hazır | — |
| animate-objects | 5 | Transmutation | çağırma | `cagir-portal` | varsayılan portal (cagir-portal) | genel | Paket çağrısının renkli portalı |
| antilife-shell | 5 | Abjuration | aura | `aura-altin` | aura varsayılan renk (aura-altin); Yaratığa bağlı alan → aura-altin (varsayılan); kalkan küre daha uygun. | genel | İptal / yansıtma / emme / büyü çemberi |
| arcane-hand | 5 | Evocation | çağırma | `cagir-portal` | varsayılan portal (cagir-portal) | genel | Paket çağrısının renkli portalı |
| awaken | 5 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cloudkill | 5 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `hasar:poison` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| commune | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| commune-with-nature | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| cone-of-cold | 5 | Evocation | koni | `hasar:freeze` | alan satırı yok (cold); koni dokusu yok | eksik | Koni dokusu |
| conjure-elemental | 5 | Conjuration | çağırma | `cagir-portal` | varsayılan portal (cagir-portal); eşlik eden alan: renkli yer tutucu | genel | Paket çağrısının renkli portalı |
| contact-other-plane | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| contagion | 5 | Necromancy | tek hedef | `durum:poison` |  | genel | Tek hedef büyü darbesi (save’li, saldırısız) |
| creation | 5 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dispel-evil-and-good | 5 | Abjuration | koruma | — | `buff_added` görsel üretmez | eksik | İptal / yansıtma / emme / büyü çemberi |
| dominate-person | 5 | Enchantment | işaret | `durum:charmed` | Charmed döngüsü; taraf değiştirme bağı yok. | genel | İşaret simgesi ve bağ çizgisi |
| dream | 5 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flame-strike | 5 | Evocation | gökten düşen | `alan-isik` |  | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| geas | 5 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| greater-restoration | 5 | Abjuration | iyileştirme | — | `life_restored`/durum kaldırma fx üretmez | eksik | Diriltme / durum temizleme |
| hallow | 5 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| hold-monster | 5 | Enchantment | durum | `durum:paralyzed` |  | hazır | — |
| insect-plague | 5 | Conjuration | zemin | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
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
| summon-dragon | 5 | Conjuration | çağırma | `cagir-portal` | varsayılan portal (cagir-portal) | genel | Paket çağrısının renkli portalı |
| telekinesis | 5 | Transmutation | durum | `itme-toz`, `durum:restrained` | Taşıma: itme-toz değil (yer değiştirme olayı); yükselme toz sütunu. | genel | Ters yerçekimi / deprem |
| telepathic-bond | 5 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| teleportation-circle | 5 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| tree-stride | 5 | Conjuration | ışınlanma | `isinlan-cikis → isinlan-giris` |  | hazır | — |
| wall-of-force | 5 | Evocation | duvar | `duvar-kuvvet` |  | hazır | — |
| wall-of-stone | 5 | Evocation | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| blade-barrier | 6 | Evocation | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| chain-lightning | 6 | Evocation | ışın | — | Ek hedefler (`extraTargets`): ışın sıçraması. | eksik | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| circle-of-death | 6 | Necromancy | küre/alan | `alan-nekrotik` |  | hazır | — |
| conjure-fey | 6 | Conjuration | çağırma | `darbe-buyu` | Saldırı türünde (fey jetonu yok); isabette darbe-buyu. | genel | Ruhani silah / güç eli çağrısı |
| contingency | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| create-undead | 6 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| disintegrate | 6 | Transmutation | ışın | — |  | eksik | Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) |
| eyebite | 6 | Necromancy | durum | `css:unconscious`, `durum:frightened` |  | hazır | — |
| find-the-path | 6 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| flesh-to-stone | 6 | Transmutation | durum | `durum:restrained` |  | hazır | — |
| forbiddance | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| freezing-sphere | 6 | Evocation | küre/alan | `hasar:freeze` | alan satırı yok (cold) | eksik | Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) |
| globe-of-invulnerability | 6 | Abjuration | koruma | — | Küre: buyu-yardimci kalkan küre satırı. | eksik | İptal / yansıtma / emme / büyü çemberi |
| guards-and-wards | 6 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| harm | 6 | Necromancy | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| heal | 6 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| heroes-feast | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| instant-summons | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| irresistible-dance | 6 | Enchantment | durum | — | düşmana süren etki görsel üretmez | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| magic-jar | 6 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-suggestion | 6 | Enchantment | durum | `durum:charmed` |  | hazır | — |
| move-earth | 6 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| planar-ally | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| programmed-illusion | 6 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| sunbeam | 6 | Evocation | ışın | `alan-isik`, `css:blinded` | çizgi şekilsiz → patlama; isin-isik var ama seçilmiyor | genel | Çizgi alanın ışın olarak çizilmesi |
| transport-via-plants | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| true-seeing | 6 | Divination | koruma | — | koruma satırı eşleşmiyor | eksik | Görme büyüsü göz parıltısı |
| wall-of-ice | 6 | Evocation | duvar | `duvar-buz`, `hasar:freeze` |  | hazır | — |
| wall-of-thorns | 6 | Conjuration | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Eksik duvar türleri |
| wind-walk | 6 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| word-of-recall | 6 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| arcane-sword | 7 | Evocation | çağırma | `darbe-buyu` | Saldırı türünde; isabette darbe-buyu. | genel | Ruhani silah / güç eli çağrısı |
| conjure-celestial | 7 | Conjuration | gökten düşen | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon); Işık sütunu alanı (zone yer tutucusu). | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| delayed-blast-fireball | 7 | Evocation | küre/alan | `alan-ates`, `hasar:burn` |  | hazır | — |
| divine-word | 7 | Evocation | durum | — | Kademeli durumlar (Blinded/Deafened/Stunned) + ölüm; ışık sütunu. | eksik | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| etherealness | 7 | Conjuration | dönüşüm | — | Eterik geçiş: rün çemberi + CSS saydamlık. | eksik | İptal / yansıtma / emme / büyü çemberi |
| finger-of-death | 7 | Necromancy | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| fire-storm | 7 | Evocation | küre/alan | `alan-ates`, `hasar:burn` |  | hazır | — |
| forcecage | 7 | Evocation | durum | — | düşmana süren etki görsel üretmez | eksik | Duman, közlü duman, ağ, kafes |
| magnificent-mansion | 7 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mirage-arcane | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| plane-shift | 7 | Conjuration | ışınlanma | — | Geri çekilme (`retreated`): rün çemberi. | eksik | İptal / yansıtma / emme / büyü çemberi |
| prismatic-spray | 7 | Evocation | koni | — | Özel yol (`prismaticEvents`): alan patlaması yok. | eksik | Prizma (gökkuşağı) ışını/duvarı |
| project-image | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| regenerate | 7 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| resurrection | 7 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| reverse-gravity | 7 | Transmutation | küre/alan | — |  | eksik | Ters yerçekimi / deprem |
| sequester | 7 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| simulacrum | 7 | Illusion | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| symbol | 7 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| teleport | 7 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| animal-shapes | 8 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu` | `shape_changed` jetonu değiştirir; geçiş flaşı yok | genel | Dönüşüm flaşı ve büyüme halkası |
| antimagic-field | 8 | Abjuration | aura | — | Kendine etki (antimagic); koruma satırı eşleşmez. | eksik | İptal / yansıtma / emme / büyü çemberi |
| antipathy-sympathy | 8 | Enchantment | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| befuddlement | 8 | Enchantment | tek hedef | — |  | eksik | Tek hedef büyü darbesi (save’li, saldırısız) |
| clone | 8 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| control-weather | 8 | Transmutation | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| demiplane | 8 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| dominate-monster | 8 | Enchantment | işaret | `durum:charmed` | Charmed döngüsü; taraf değiştirme bağı yok. | genel | İşaret simgesi ve bağ çizgisi |
| earthquake | 8 | Transmutation | zemin | `yer-tutucu:.spell-zone`, `css:prone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Ters yerçekimi / deprem |
| glibness | 8 | Enchantment | koruma | — | koruma satırı eşleşmiyor | eksik | Güçlendirme/zayıflatma oku (sayı oku ikonları) |
| holy-aura | 8 | Abjuration | aura | `koruma-kutsama` | saveAdv → koruma-kutsama tek seferlik; aura çizilmez. | genel | Aura bağlama (mevcut aura şeritleri, eksik bağ) |
| incendiary-cloud | 8 | Conjuration | zemin | `yer-tutucu:.spell-zone`, `hasar:burn` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Zemin kutuları (kalıcı büyü alanı dokusu) |
| maze | 8 | Conjuration | ışınlanma | `durum:incapacitated` | Sürgün: rün çemberi (buyu-yardimci). | genel | İptal / yansıtma / emme / büyü çemberi |
| mind-blank | 8 | Abjuration | koruma | `koruma-ruh` |  | hazır | — |
| power-word-stun | 8 | Enchantment | durum | `durum:stunned` | Stunned döngüsü (durum). | hazır | — |
| sunburst | 8 | Evocation | küre/alan | `alan-isik`, `css:blinded` |  | hazır | — |
| tsunami | 8 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| astral-projection | 9 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| foresight | 9 | Divination | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| gate | 9 | Conjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| imprisonment | 9 | Abjuration | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| mass-heal | 9 | Abjuration | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| meteor-swarm | 9 | Evocation | gökten düşen | `alan-ates`, `hasar:burn` |  | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| power-word-heal | 9 | Enchantment | iyileştirme | `iyilestir-kucuk / iyilestir-buyuk` |  | hazır | — |
| power-word-kill | 9 | Enchantment | durum | — | Ölüm tozu (olum-toz) hedef ölünce zaten; sözün kendisi görselsiz. | eksik | Öldürme sözü (tek seferlik) |
| prismatic-wall | 9 | Abjuration | duvar | `yer-tutucu:.spell-zone` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Prizma (gökkuşağı) ışını/duvarı |
| shapechange | 9 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu` | `shape_changed` jetonu değiştirir; geçiş flaşı yok | genel | Dönüşüm flaşı ve büyüme halkası |
| storm-of-vengeance | 9 | Conjuration | gökten düşen | `yer-tutucu:.spell-zone`, `ikon:deafened` | renkli altıgen yer tutucusu (spec.color/icon) | genel | Gökten düşen (yıldırım, meteor, ışık sütunu) |
| time-stop | 9 | Transmutation | durum | — | `time_stop` olayı fx üretmez. | eksik | Zaman küresi |
| true-polymorph | 9 | Transmutation | dönüşüm | `jeton:biçimin canavar jetonu` | `shape_changed` jetonu değiştirir; geçiş flaşı yok | genel | Dönüşüm flaşı ve büyüme halkası |
| true-resurrection | 9 | Necromancy | yok | — | günlük/kart Game Master notu | savaş dışı | — |
| weird | 9 | Illusion | küre/alan | `alan-psisik`, `durum:frightened` |  | hazır | — |
| wish | 9 | Conjuration | yok | `kopyalanan büyünün efekti` |  | genel | — |

## 3. Eksik animasyon aileleri

Çözüm: **kod** mevcut sprite + bağlama/CSS/hue; **E2** depoda olup içe aktarılmamış ham sayfa (`assets-ham/efekt/`, aşağıdaki tablo; içe aktarma ve bağlama CC işi); **Gemini** yeni sayfa (4. bölüm).

| Aile | Büyü | Çözüm | Mevcut kaynak / E2 satırları | Büyüler |
|---|---|---|---|---|
| Güçlendirme/zayıflatma oku (sayı oku ikonları) (`ikon-ok`) | 17 | E2 + kod | rozet sistemine (efekt-baglama `rozet`) etki alanı → ikon · sayi-oklari.jpg (macenta, ikon): avantaj/dezavantaj, AC±, hız±, hasar±, direnç, kutsal kalkan, geçici HP, yenilenme, zar±, kanat, yıldırımlı ok | resistance, bane, command, expeditious-retreat, jump, longstrider, protection-from-evil-and-good, sanctuary, shield-of-faith, aid, enhance-ability, ray-of-enfeeblement, spider-climb, water-walk, death-ward, irresistible-dance, glibness |
| Zemin kutuları (kalıcı büyü alanı dokusu) (`zemin-kutu`) | 13 | E2 + Gemini | zemin-kutulari.jpg: lav/kor, spor bulutu, diken/sarmaşık, mor girdap, buz rün halkası, duman halkası, bitki, kara halka | entangle, darkness, silence, spike-growth, daylight, plant-growth, sleet-storm, black-tentacles, faithful-hound, guardian-of-faith, cloudkill, insect-plague, incendiary-cloud |
| İptal / yansıtma / emme / büyü çemberi (`iptal`) | 13 | E2 | buyu-yardimci.jpg: iptal (mühür kırılması), kalkan küre/yansıtma, emme akışı, rün çemberi | blink, counterspell, dispel-magic, remove-curse, banishment, resilient-sphere, antilife-shell, dispel-evil-and-good, globe-of-invulnerability, etherealness, plane-shift, antimagic-field, maze |
| Tek hedef büyü darbesi (save’li, saldırısız) (`tek-hedef`) | 11 | kod | alan-* satırı hedef jetonunda küçük ölçekle (hasar türü → alan tablosu); türsüz/eksik renkte patlama-ek | vicious-mockery, dissonant-whispers, hellish-rebuke, inflict-wounds, mind-spike, blight, phantasmal-killer, contagion, harm, finger-of-death, befuddlement |
| Silah parıltısı (smite, büyülü silah) (`silah`) | 10 | E2 + kod | darbe-* üstüne hasar türü rengi · silah-parilti.jpg: kılıç parıltısı, parıltı halkası, kıvılcım, enerji küre (beyaz; renk hue) | shillelagh, true-strike, divine-favor, divine-smite, ensnaring-strike, searing-smite, flame-blade, heat-metal, magic-weapon, shining-smite |
| Gökten düşen (yıldırım, meteor, ışık sütunu) (`gokten`) | 9 | E2 | gokten-dusen.jpg: yıldırım çarpması, meteor, yıldız kayması, ışık sütunu | sacred-flame, guiding-bolt, moonbeam, call-lightning, flame-strike, conjure-celestial, divine-word, meteor-swarm, storm-of-vengeance |
| Mermi (büyü oku, küre, dart) (`mermi`) | 8 | E2 + kod | isin-* uçlarıyla aynı renk tablosu · mermi.jpg: ok, küre mermi, kıvılcım, iğne (beyaz; renk CSS hue/tint) | fire-bolt, poison-spray, produce-flame, sorcerous-burst, starry-wisp, chromatic-orb, magic-missile, acid-arrow |
| Dönüşüm flaşı ve büyüme halkası (`donusum`) | 8 | E2 | donusum-kanat.jpg: dönüşüm flaşı, büyüme halkası | alter-self, blur, enlarge-reduce, mirror-image, polymorph, animal-shapes, shapechange, true-polymorph |
| İşaret simgesi ve bağ çizgisi (`isaret-bag`) | 7 | E2 + kod | bağ çizgisi SVG (kod) · isaret-simgeleri.jpg (macenta, ikon): nişan, lanet, terazi, rün, pentagram, kum saati, meydan okuma, çapraz kılıç, pençe, yıldız, kırık yıldız, haç, d20, kristal, rünlü kalkan, zincir | hex, hunters-mark, warding-bond, bestow-curse, dominate-beast, dominate-person, dominate-monster |
| Aura bağlama (mevcut aura şeritleri, eksik bağ) (`aura-bagla`) | 7 | kod | aura-altin/kirmizi/buz; konsantrasyon yayılımı ve süren etki aurası groundFx’e | pass-without-trace, spirit-guardians, aura-of-life, conjure-minor-elementals, conjure-woodland-beings, fire-shield, holy-aura |
| Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa) (`patlama-ek`) | 6 | E2 | patlama-ek.jpg: buz, zehir bulutu, asit sıçrama, su, toprak/kaya, rüzgâr girdabı, bitki | acid-splash, ice-knife, gust-of-wind, ice-storm, vitriolic-sphere, freezing-sphere |
| Tek hedef ışını (Ray, Eldritch Blast, Disintegrate) (`isin-tek`) | 6 | kod | isin-ates/isik/sok/buz; nekrotik/zehir/kuvvet için isin-isik + hue-rotate | eldritch-blast, ray-of-frost, ray-of-sickness, scorching-ray, chain-lightning, disintegrate |
| Koni dokusu (`koni`) | 5 | E2 + kod | psişik/nekrotik/gökkuşağı: ışık satırı + hue-rotate · koni-doku.jpg: ateş, buz, yıldırım, yeşil (zehir/asit), ışık | burning-hands, color-spray, dragons-breath, fear, cone-of-cold |
| Paket çağrısının renkli portalı (`cagir-renk`) | 5 | kod | cagir-portal + paket `ton`/`halka` (hue-rotate) | flaming-sphere, animate-objects, arcane-hand, conjure-elemental, summon-dragon |
| Diriltme / durum temizleme (`diriltme`) | 4 | kod | iyilestir-buyuk (life_restored), iyilestir-kucuk (durum kaldırma) bağlaması | spare-the-dying, lesser-restoration, revivify, greater-restoration |
| Ters yerçekimi / deprem (`yercekimi`) | 4 | Gemini |  | levitate, telekinesis, reverse-gravity, earthquake |
| Dokunuş büyüsü darbesi (renkli darbe) (`dokunus`) | 3 | kod | darbe-buyu + hasar türüne göre hue-rotate (efekt-baglama `darbe` tablosuna tür satırları) | chill-touch, shocking-grasp, vampiric-touch |
| Hasarsız alan büyüsüne alan patlaması (`alan-turu`) | 3 | kod | alan-psisik / alan-isik / moral-huzur: büyünün okulundan ya da etiketinden renk (efekt-baglama `alan` yanına `alanBuyu` tablosu) | calm-emotions, phantasmal-force, confusion |
| Görme büyüsü göz parıltısı (`goz`) | 3 | kod | goz-nabiz (Moral satırı) jetonda tek seferlik | darkvision, see-invisibility, true-seeing |
| Ruhani silah / güç eli çağrısı (`cagir-ruhani-silah`) | 3 | E2 | mermi.jpg: hançer, balta (dönen ruhani silah) | spiritual-weapon, conjure-fey, arcane-sword |
| Zaman küresi (`zaman`) | 3 | E2 | zaman.jpg: zaman küresi, girdap küre, saat kadranı, kum saati | haste, slow, time-stop |
| Eksik duvar türleri (`duvar-ek`) | 3 | Gemini |  | wall-of-stone, blade-barrier, wall-of-thorns |
| Tepki parıltısı (Shield, Feather Fall, paket tepkileri) (`tepki-koruma`) | 2 | kod | koruma-kalkan (Shield işareti), koruma-ruh (Feather Fall düşüşü) | feather-fall, shield |
| Çizgi alanın ışın olarak çizilmesi (`cizgi-sekil`) | 2 | kod | `spell_cast.area`a şekil (`shape`) eklenince fxPlan `area()` zaten isin-* seçer | lightning-bolt, sunbeam |
| Prizma (gökkuşağı) ışını/duvarı (`prizma`) | 2 | Gemini |  | prismatic-spray, prismatic-wall |
| Jeton parıltısı / ana hatları (CSS) (`parilti-css`) | 1 | kod | CSS drop-shadow renkli kontur (Faerie Fire, kutsama ışığı) | faerie-fire |
| Geçici HP kazanımı (`gecici-can`) | 1 | kod | `temp_hp` olayına koruma-kutsama (bugün yalnız etkideki `tempHp` alanı bağlı) | false-life |
| Kanat / havalanma (`kanat`) | 1 | E2 | donusum-kanat.jpg: şeytan/ejder, melek, ateş, gölge kanatları | fly |
| Duman, közlü duman, ağ, kafes (`duman-kafes`) | 1 | E2 | duman-ag-kafes.jpg: duman, közlü duman, ağ, kafes | forcecage |
| Öldürme sözü (tek seferlik) (`durum-ek`) | 1 | Gemini |  | power-word-kill |

### İçe aktarılmamış E2 ham sayfaları

`assets-ham/efekt/` içinde `data/efekt-kesim.json`’da kaydı olmayan 12 sayfa (Gemini’den gelmiş, `npm run sprite-ice -- --efekt` ile içe aktarılmamış). Satırlar görsel incelemeyle; hepsi siyah zeminli (ikon sayfaları macenta zeminli). Bu sayfalar efekt sayılmadı (hazır değil).

| Sayfa | Satırlar | Karşıladığı aileler |
|---|---|---|
| buyu-yardimci.jpg | 4×8: iptal (mühür kırılması), kalkan küre/yansıtma, emme akışı, rün çemberi (beyaz) | `iptal` |
| donusum-kanat.jpg | 6×8: dönüşüm flaşı, büyüme halkası, kanatlar (şeytan/ejder kırmızı, melek, ateş, gölge mor) | `donusum`, `kanat` |
| duman-ag-kafes.jpg | 4×4: duman, közlü duman, ağ, kafes | `duman-kafes` |
| gokten-dusen.jpg | 4×8: yıldırım çarpması, meteor, yıldız kayması, ışık sütunu | `gokten` |
| isaret-simgeleri.jpg | 4×4 ikon (macenta): nişan, lanet, terazi, rün, pentagram, kum saati, meydan okuma, çapraz kılıç, pençe, yıldız, kırık yıldız, haç, d20, kristal, rünlü kalkan, zincir | `isaret-bag` |
| koni-doku.jpg | 5×4 (gri ızgara): ateş, buz/kar, yıldırım, yeşil (zehir/asit), ışık koni dokusu | `koni` |
| mermi.jpg | 6×6: ok, küre mermi, ruhani hançer, kıvılcım mermi, iğne/dart, ruhani balta (beyaz) | `mermi`, `cagir-ruhani-silah` |
| patlama-ek.jpg | 7×10: buz, zehir bulutu, asit sıçrama, su sıçrama, toprak/kaya, rüzgâr girdabı, bitki patlaması | `patlama-ek` |
| sayi-oklari.jpg | 4×4 ikon (macenta): avantaj/dezavantaj d20, AC±, hız±, hasar±, direnç, kutsal kalkan, geçici HP, yenilenme, zar±, kanat, yıldırımlı ok | `ikon-ok` |
| silah-parilti.jpg | 4×6: kılıç parıltısı, parıltı halkası, kıvılcım, enerji küre (beyaz) | `silah` |
| zaman.jpg | 4×8: zaman küresi (dişli), girdap küre, saat kadranı halkası, kum saati | `zaman` |
| zemin-kutulari.jpg | 8×4: lav/kor, spor bulutu, diken/sarmaşık, mor girdap, buz rün halkası, duman halkası, bitki, kara halka | `zemin-kutu` |

## 4. Önerilen Gemini sayfaları

Yalnız E2 sayfalarında ve mevcut efektlerde karşılığı olmayan ihtiyaçlar. Aynı hücre birden çok büyüyü karşılıyorsa bir kez sayılır. Biçim mevcut sayfalarla aynı: siyah zemin, satır başına bir animasyon, 8 kare (duvar parçaları yatay şerit, `duvar-parcalar` gibi).

| Sayfa adı | Hücre | Hücreler (büyüler) |
|---|---|---|
| efekt-yercekimi | 2 | ters yerçekimi yükselen toz sütunu (levitate, telekinesis, reverse-gravity); deprem yarığı zemin kutusu (earthquake) |
| efekt-zemin-kutu | 4 | sessizlik küresi (silence); gün ışığı küresi (daylight); sulu sepken / kar fırtınası zemini (sleet-storm); böcek sürüsü bulutu (insect-plague) |
| efekt-duvar-ek | 3 | taş duvar parçası (wall-of-stone); bıçak bariyeri parçası (blade-barrier); diken duvarı parçası (wall-of-thorns) |
| efekt-prizma | 2 | prizma koni 7 renk (prismatic-spray); prizma duvar parçası (prismatic-wall) |
| efekt-durum-ek | 1 | ölüm sözü (kafatası rün, tek seferlik) (power-word-kill) |

Toplam 5 Gemini sayfası, 12 hücre.

## 5. Kodla çözülecekler (CC işi)

14 madde. Hepsi yalnız görsel (fxPlan / efekt-baglama / CSS); kural, sayı ve kural sürümü değişmez.

1. **Çizgi alanı ışın olarak** — `spell_cast.area`’ya `shape` (ve `aim`) ekle; fxPlan `area()` çizgide zaten `isin-*` seçer (Lightning Bolt, Sunbeam, Gust of Wind). Motor olayına yalnız görsel alan (replay etkilenmez). (2: lightning-bolt, sunbeam)
2. **Tek hedef ışınları** — Ray/Eldritch Blast/Disintegrate/Chain Lightning: `attack_resolved` ve tek hedefli `save_resolved` büyüsünde büyücüden hedefe `isin-*` (nekrotik/zehir/kuvvet için `isin-isik` + hue-rotate). (6: eldritch-blast, ray-of-frost, ray-of-sickness, scorching-ray, chain-lightning, disintegrate)
3. **Tek hedef büyü darbesi** — Save’li tek hedef hasarında (`save_resolved` + `damageType`) hedefte küçük ölçekli `alan-*` (Vicious Mockery, Mind Spike, Blight, Harm…). (11: vicious-mockery, dissonant-whispers, hellish-rebuke, inflict-wounds, mind-spike, blight, phantasmal-killer, contagion, harm, finger-of-death, befuddlement)
4. **Dokunuş darbesi rengi** — `darbe-buyu` + hasar türüne göre CSS hue-rotate (efekt-baglama `darbe` tablosuna tür satırı). (3: chill-touch, shocking-grasp, vampiric-touch)
5. **Hasarsız alan büyüsüne patlama** — Confusion, Calm Emotions, Phantasmal Force: okul/etiketten `alan-psisik`/`moral-huzur`. (3: calm-emotions, phantasmal-force, confusion)
6. **Aura bağlama** — `concentration.aura` (Spirit Guardians) ve kendine süren etkideki aura (Aura of Life, Holy Aura, Fire Shield, Pass without Trace, Conjure Woodland Beings, Conjure Minor Elementals) groundFx’e; renk hasar türünden. (7: pass-without-trace, spirit-guardians, aura-of-life, conjure-minor-elementals, conjure-woodland-beings, fire-shield, holy-aura)
7. **Diriltme ve durum temizleme** — `life_restored` → `iyilestir-buyuk`; durum kaldıran `condition_changed present:false` (Lesser/Greater Restoration) → `iyilestir-kucuk`. (4: spare-the-dying, lesser-restoration, revivify, greater-restoration)
8. **Tepki korumaları** — Shield işareti (`marks` shield) → `koruma-kalkan`; Feather Fall → `koruma-ruh`. (2: feather-fall, shield)
9. **`buff_added` ve geçici HP** — `buff_added` (ward ac → kalkan, Protection from Evil and Good → ruh) ve `temp_hp`/`tempHpNow` → `koruma-kutsama`. (3: false-life, shield-of-faith, protection-from-evil-and-good)
10. **Görme göz parıltısı** — See Invisibility, True Seeing, Darkvision: `goz-nabiz` jetonda tek seferlik. (3: darkvision, see-invisibility, true-seeing)
11. **Jeton parıltısı (CSS)** — Faerie Fire `outlined` → renkli drop-shadow kontur. (1: faerie-fire)
12. **Çağırma renk portalı** — Varsayılan `cagir-portal` yerine çağrının türüne (ejderha, element, nesne, el) hue; dokunulamaz Flaming Sphere için ruh yerine ateş tonu. (6: flaming-sphere, animate-objects, arcane-hand, conjure-elemental, summon-dragon, flaming-sphere)
13. **İkon/ok rozetleri** — Süren etki alanı → `sayi-oklari` ikonu (E2 içe aktarıldıktan sonra): rozet önceliği `efekt-baglama.json` `rozet`. (17: resistance, bane, command, expeditious-retreat, jump, longstrider, protection-from-evil-and-good, sanctuary, shield-of-faith, aid, enhance-ability, ray-of-enfeeblement, spider-climb, water-walk, death-ward, irresistible-dance, glibness)
14. **E2 sayfalarının içe aktarılması** — `data/efekt-kesim.json`’a 12 sayfa kaydı (satır/sütun, kesim, tür, boyut) + `npm run sprite-ice -- --efekt`; ardından ailelere bağlama (mermi, koni, gökten düşen, patlama-ek, zemin kutuları, duman/kafes, dönüşüm/kanat, iptal, zaman, silah, işaret/ikon). (12: buyu-yardimci.jpg, donusum-kanat.jpg, duman-ag-kafes.jpg, gokten-dusen.jpg, isaret-simgeleri.jpg, koni-doku.jpg, mermi.jpg, patlama-ek.jpg, sayi-oklari.jpg, silah-parilti.jpg, zaman.jpg, zemin-kutulari.jpg)

## 6. Savaş dışı büyüler (112)

Efekt gerekmez: kartta "savaş dışı", günlükte Game Master notu (`spell_cast` notu) yeter.

- **0–3** (52): druidcraft, elementalism, mage-hand, mending, message, minor-illusion, prestidigitation, thaumaturgy, alarm, comprehend-languages, create-or-destroy-water, detect-evil-and-good, detect-magic, detect-poison-and-disease, disguise-self, floating-disk, goodberry, identify, illusory-script, purify-food-and-drink, silent-image, speak-with-animals, unseen-servant, animal-messenger, arcane-lock, arcanists-magic-aura, augury, detect-thoughts, enthrall, find-traps, gentle-repose, knock, locate-animals-or-plants, locate-object, magic-mouth, prayer-of-healing, rope-trick, zone-of-truth, clairvoyance, create-food-and-water, glyph-of-warding, magic-circle, major-image, meld-into-stone, nondetection, phantom-steed, sending, speak-with-dead, speak-with-plants, tiny-hut, tongues, water-breathing
- **4–5** (27): arcane-eye, control-water, divination, fabricate, hallucinatory-terrain, locate-creature, private-sanctum, secret-chest, stone-shape, awaken, commune, commune-with-nature, contact-other-plane, creation, dream, geas, hallow, legend-lore, modify-memory, passwall, planar-binding, raise-dead, reincarnate, scrying, seeming, telepathic-bond, teleportation-circle
- **6–9** (33): contingency, create-undead, find-the-path, forbiddance, guards-and-wards, heroes-feast, instant-summons, magic-jar, move-earth, planar-ally, programmed-illusion, transport-via-plants, wind-walk, word-of-recall, magnificent-mansion, mirage-arcane, project-image, regenerate, resurrection, sequester, simulacrum, symbol, teleport, antipathy-sympathy, clone, control-weather, demiplane, tsunami, astral-projection, foresight, gate, imprisonment, true-resurrection
