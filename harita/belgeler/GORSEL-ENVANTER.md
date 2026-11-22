# Görsel envanter (oyun + Dungeondex vitrini)

`npm run dd-gorsel` üretir (`scripts/dungeondex-gorsel-esleme.ts`, kurallar `scripts/lib/gorsel-envanter.ts`, bu metin `scripts/lib/gorsel-belge.ts`); elle düzenlenmez. Aynı çalıştırma `data/dungeondex-gorsel-esleme.json` (vitrin eşlemesi) ve `harita/belgeler/GORSEL-EKSIK.csv` (eksik listesi) yazar. Salt okuma: oyun kodu, veri ve görseller değişmez. Galeri: geliştirme sunucusunda `#galeri` (Ayarlar ▸ Gelişmiş ▸ Geliştirici).

**Durum ölçütü (her kategoride aynı):** **var** = kayda özel görsel oyunda gerçekten çiziliyor; **genel** = görsel var ama paylaşılan/aile görseli (başka kayıtlarla aynı efekt, aynı çözülmüş jeton görüntüsü, yalnız durum döngüsü/rozet/ikon); **yedek** = görsel yok, kartta ortak çerçeve + kategori glifi (`yedekler` tablosu). Sayılar betiğin çalıştığı ortamdan; bulutta `icerik/` yok (alt sınıf içeriği fikstürden).

## Özet

| Kategori | Kayıt | Var | Genel | Yedek | Kaynak (eşlemede) |
|---|---|---|---|---|---|
| Büyü | 339 | 161 | 66 | 112 | efekt 221, ikon 6, yedek 112 |
| Eşya | 449 | 449 | 0 | 0 | ikon 449 |
| Canavar | 330 | 290 | 40 | 0 | jeton 330 |
| Tür | 10 | 10 | 0 | 0 | jeton 10 |
| Alt soy | 41 | 34 | 7 | 0 | jeton 41 |
| Sınıf (+ Invocation, Metamagic) | 50 | 12 | 0 | 38 | jeton 12, yedek 38 |
| Alt sınıf | 120 | 120 | 0 | 0 | jeton 120 |
| Feat | 17 | 0 | 0 | 17 | yedek 17 |
| Geçmiş | 12 | 0 | 0 | 12 | yedek 12 |
| Durum | 15 | 15 | 0 | 0 | efekt 8, ikon 7 |
| Yüzey | 9 | 8 | 0 | 1 | efekt 8, yedek 1 |
| Harita nesnesi | 34 | 2 | 0 | 32 | efekt 2, yedek 32 |
| Büyü alanı (savaşta) | 36 | 30 | 1 | 5 | efekt 31, yedek 5 |
| Zar teması | 72 | 63 | 0 | 9 | ikon 63, yedek 9 |
| **Toplam** | **1534** | **1194** | **114** | **226** | |

Dungeondex denetimi: Dungeondex'in 1383 kaydının hepsi eşlemede, her `ref` çözülüyor (public/ dosyası ya da `yedekler` anahtarı): sorun 0. CSV 266 satır.

## Eksik ve düzeltilecek

Büyükten küçüğe (kayıt sayısı × oyuncunun gördüğü yer). Görsel eksikleri yalnız listede (üretim Gemini işi); kodla çözülenler en altta.

| # | Eksik | Kayıt | Etki | Çözüm |
|---|---|---|---|---|
| 1 | Eşya ikonu | 449/449 yok | Hiçbir ekranda eşya ikonu yok (bkz. h): oluşturucu, karakter kâğıdı, savaş Eşya menüsü, Dungeondex, dükkân yalnız ad | Gemini: `public/esya/<kimlik>.webp` (öncelik: 319 sihirli eşya; nadirlik rengi çerçevede). Ara çözüm: tür glifi + nadirlik çerçevesi (eşlemede hazır) |
| 2 | Büyü kart görseli (savaş dışı) | 108 savaş dışı + 4 savaşta görselsiz | Dungeondex büyü kartında görsel yok; savaşta görsel üretmeyen 4 büyü (continual-flame, dancing-lights, light, wish) | Gemini: `public/buyu/<kimlik>.webp` kart ikonu; ara çözüm okul glifi |
| 3 | Harita nesnesi sprite'ı | 32/34 emoji | Haritada nesne emoji (yazı tipine göre değişir, telefonda farklı görünür) | Gemini: `assets-ham/sprite/nesne-<ad>.png` → `npm run sprite-ice` |
| 4 | Zar temaları | 72 tanımlı, 63 setli; 9 Alignment seti yok; 100 hedefine 28 tema tanımsız | Alignment zarları klasik görselle (3D renkleri farklı) | Gemini: 9 Alignment seti + 28 yeni tema (bkz. e) |
| 5 | Büyüye özel efekt (genel efektli savaş büyüsü) | 62 | Savaşta aile efekti oynuyor (ör. `darbe-buyu`, `alan-psisik`, durum döngüsü); oyun çalışır, ayırt edicilik düşük | İsteğe bağlı: `efekt-<kimlik>` hücreleri (E-serisi sayfa) |
| 6 | Ejderha yaş görselleri | 40 canavar (10 renk × 4 yaş) aynı çözülmüş görüntü | Yaş farkı yalnız boyla görünür | Gemini: 30 yeni çizim (young/adult/ancient), dosya adı aynı kalır |
| 7 | Kalıcı büyü alanı dokusu | 5 renkli altıgen + 1 varsayılan aura | antilife-shell, conjure-animals, conjure-elemental, dancing-lights, flaming-sphere, forcecage | Gemini: zemin hücresi (`efekt-zemin-<kimlik>`) |
| 8 | Mobil okunabilirlik | — | 390×844 dikeyde jeton ≈ 21 px, rozet ≈ 7 px (bkz. f) | Kod/tasarım: dar ekranda yakınlaştırma ya da rozet ölçeği (bu görevde değiştirilmedi) |
| 9 | Yüzey `warning` | 1 | Çığ uyarı yüzeyi renkli altıgen | Gemini: `yuzey-warning-1` |

**Kayda özel resim GEREKMEYENLER** (ortak çerçeve + kategori glifi yeterli; CSV'ye girmez): feat 17, geçmiş 12, Eldritch Invocation 28, Metamagic 10, sınıf özelliği satırı 185 (bkz. g). Bilinçli "orijinal" alt soy görünümleri de eksik sayılmaz.

**Bu görevde kodla çözülen:** `data/dungeondex-gorsel-esleme.json` `yedekler` tablosu (eşya türü, büyü okulu, feat kategorisi, geçmiş, Invocation, Metamagic, eylem türü, hasar türü, nesne, alan, zar: tek kaynak, galeri ve vitrin aynı glifi çizer) ve `nadirlikRenkleri` (oluşturucunun kenar şeridiyle aynı). Oyun ekranlarında eşleme/efekt/boyut kodu değişmedi: aşağıda yanlış eşleşmiş efekt bulunmadı (ödünç renkler bilinçli), boyut oranı ve rozet ölçeği tasarım kararı (öneri f).

## (a) Büyüler (339)

Yöntem: her büyü açık bir 21×11 haritada gerçek `cast_spell` komutuyla dökülür (E2 doğrulayıcısının hedefleme denemeleri: hedef, altıgen, dost, kendi, çoklu nokta; gerekirse sürdürme/verilen nefes), çıkan olaylar `fxShots`, sonraki durum `groundFx`, alan dokusu (`sprite-esleme.json` `zones`), durum döngüsü (`statusFx`), rozet (`effectIcons`) ve CSS jeton filtresiyle çizime çevrilir (`src/ui/fx/e2Verify.ts` `observeSpell`). Döküm gözlenemeyen (kurulumda ritüel, hedef ağaç) çağırma/ışınlanma büyülerinde `fxPlan` kuralı. Savaş/savaş dışı ayrımı `scripts/lib/buyu-durum.mjs` (BUYU-DURUM.md ile aynı).

| | Toplam | Var (büyüye özel) | Genel | Yedek (görsel yok) |
|---|---|---|---|---|
| Savaşta | 225 | 159 | 62 | 4 |
| Savaş dışı | 114 | 2 | 4 | 108 |

Büyüye özel = çizilen efekt büyünün kendi bağlamasından (`efekt-baglama.json` `buyu`, `zemin`, `duvar`, `auraBuyu`, `etkiHalka`, `cagirRenk` ya da `sprite-esleme.json` `zones["spells:<kimlik>"]`).

**Savaşta genel görselli büyüler (alt türler):**

- aile/paylaşılan sprite (41): `acid-splash`, `barkskin`, `beacon-of-hope`, `bless`, `burning-hands`, `chill-touch`, `circle-of-death`, `cone-of-cold`, `conjure-animals`, `cure-wounds`, `dimension-door`, `dragons-breath`, `find-steed`, `fire-storm`, `fireball`, `freedom-of-movement`, `freezing-sphere`, `gaseous-form`, `giant-insect`, `guidance`, `heal`, `healing-word`, `heroism`, `mage-armor`, `mass-cure-wounds`, `mass-heal`, `mass-healing-word`, `mind-blank`, `misty-step`, `power-word-heal`, `protection-from-energy`, `protection-from-poison`, `shatter`, `shocking-grasp`, `stinking-cloud`, `stoneskin`, `sunburst`, `thunderwave`, `vampiric-touch`, `vitriolic-sphere`, `weird`
- yalnız durum döngüsü (13): `animal-friendship`, `charm-monster`, `charm-person`, `compulsion`, `flesh-to-stone`, `hideous-laughter`, `hold-monster`, `hold-person`, `hypnotic-pattern`, `mass-suggestion`, `power-word-stun`, `sleep`, `suggestion`
- kural tahmini (döküm gözlenemedi) (3): `animate-dead`, `find-familiar`, `tree-stride`
- yalnız durum ikonu / jeton filtresi (5): `blindness-deafness`, `eyebite`, `greater-invisibility`, `invisibility`, `mislead`

**Savaşta görselsiz (4):** `continual-flame` (döküm görsel üretmiyor), `dancing-lights` (yalnız renkli altıgen yer tutucusu), `light` (döküm görsel üretmiyor), `wish` (döküm gözlenemedi). Light ve Continual Flame yalnız ışık katmanında (gece görüşü) görünür; Wish kopyaladığı büyünün efektini oynatır.

**Savaş dışı ama döküldüğünde efekt oynatan (6):** `animal-shapes`, `control-water`, `enhance-ability`, `modify-memory`, `resurrection`, `true-resurrection`.

**Yalnız rozetli (1):** `enhance-ability`. `rozetBuyu`'ya bağlı 17 büyüden 16 tanesi rozetin yanında sprite efekti de oynatıyor (E5 canlandırması ya da koruma satırı).

**Birden çok büyünün paylaştığı efekt** (gözlenen çizimlerde; 43 efekt ≥ 2 büyüde, ilk 20):

| Efekt | Büyü | Büyüler |
|---|---|---|
| `darbe-buyu` | 22 | acid-arrow, arcane-sword, chill-touch, chromatic-orb, conjure-fey, divine-smite, eldritch-blast, fire-bolt, guiding-bolt, magic-missile, poison-spray, produce-flame … |
| `iyilestir-buyuk` | 13 | conjure-celestial, cure-wounds, greater-restoration, heal, healing-word, mass-cure-wounds, mass-heal, mass-healing-word, power-word-heal, resurrection, revivify, spare-the-dying … |
| `koruma-ruh` | 12 | calm-emotions, feather-fall, fire-shield, freedom-of-movement, gaseous-form, heroism, mind-blank, protection-from-energy, protection-from-evil-and-good, protection-from-poison, stoneskin, summon-dragon |
| `koruma-kutsama` | 9 | aid, animal-shapes, beacon-of-hope, bless, false-life, guidance, polymorph, shapechange, true-polymorph |
| `aura:aura-altin` | 8 | antilife-shell, aura-of-life, conjure-animals, conjure-elemental, conjure-minor-elementals, conjure-woodland-beings, holy-aura, spirit-guardians |
| `alan-psisik` | 8 | befuddlement, confusion, dissonant-whispers, mind-spike, phantasmal-force, phantasmal-killer, vicious-mockery, weird |
| `donusum-flas` | 7 | alter-self, animal-shapes, blur, mirror-image, polymorph, shapechange, true-polymorph |
| `itme-toz` | 7 | gust-of-wind, prismatic-wall, telekinesis, thunderwave, wall-of-force, wall-of-ice, wall-of-stone |
| `koruma-kalkan` | 6 | barkskin, haste, mage-armor, shield, shield-of-faith, warding-bond |
| `run-cember` | 5 | banishment, blink, etherealness, maze, plane-shift |
| `gokten-sutun` | 5 | conjure-celestial, divine-word, flame-strike, moonbeam, sacred-flame |
| `silah-kivilcim` | 5 | divine-smite, ensnaring-strike, searing-smite, shining-smite, true-strike |
| `cagir-portal` | 4 | animate-objects, arcane-hand, conjure-elemental, summon-dragon |
| `kalkan-kure` | 4 | antilife-shell, antimagic-field, globe-of-invulnerability, resilient-sphere |
| `alan-nekrotik` | 4 | blight, circle-of-death, harm, inflict-wounds |
| `iptal-muhur` | 4 | counterspell, dispel-evil-and-good, dispel-magic, remove-curse |
| `mermi-kure` | 3 | chromatic-orb, fire-bolt, produce-flame |
| `aura:aura-kirmizi` | 3 | conjure-minor-elementals, fire-shield, flaming-sphere |
| `goz-nabiz` | 3 | darkvision, see-invisibility, true-seeing |
| `silah-kilic` | 3 | divine-favor, flame-blade, magic-weapon |

**Yanlış eşleşme denetimi:** hasar türü ile çizilen element sprite'ı (alan/ışın/koni) karşılaştırıldı. Uyuşmayanlar (4) bağlamada bilinçli ödünç: `contagion` necrotic → `alan-zehir`; `eldritch-blast` force → `isin-isik` (hue 230°: renk düzeltilmiş); `poison-spray` poison → `isin-asit`; `ray-of-sickness` poison → `isin-nekrotik`. Zehir ışını sprite'ı yok (Poison Spray asit ışınını, Ray of Sickness nekrotik ışını ödünç alır); düzeltme yeni sprite ister (Gemini), kod değil. E3 tablosu (BUYU-EFEKT-TABLOSU.md) aynı sonucu verir: savaştaki 225 büyünün 223'ü "hazır".

## (b) Eşyalar (449 = 38 silah + 12 zırh + 80 donanım + 319 sihirli eşya)

Eşyanın hiçbir görseli yok: `src/ui/icons.tsx` yalnız ana menünün 10 SVG simgesi (oyna, kullanıcı, zar, durum, ayar, güneş, ay, otomatik, kitap, ses); kaynak ikonları (`public/kaynak/`, 8 adet) sınıf kaynakları için (Ki, ilham…), eşya değil; `sprite-esleme.json` yalnız iki harita nesnesi (fıçılar). Savaş haritasındaki eşya nesneleri (iksir 🧪, değnek 🪄, muska 📿, yüzük 💍, kılıç 🗡) emoji.

| Tür | Kayıt |
|---|---|
| sihirli eşya (olağandışı) | 121 |
| sihirli eşya (nadir) | 108 |
| donanım | 80 |
| sihirli eşya (çok nadir) | 55 |
| silah | 38 |
| sihirli eşya (efsanevi) | 33 |
| zırh | 12 |
| sihirli eşya (sıradan) | 2 |

| Tür yedeği (eşleme `ref`) | Glif | Kayıt |
|---|---|---|
| `esya/potion-of-greater-healing.webp` |  | 1 |
| `esya/potion-of-healing.webp` |  | 1 |
| `esya/potion-of-superior-healing.webp` |  | 1 |
| `esya/potion-of-supreme-healing.webp` |  | 1 |
| `esya/acid.webp` |  | 1 |
| `esya/alchemists-fire.webp` |  | 1 |
| `esya/antitoxin.webp` |  | 1 |
| `esya/healers-kit.webp` |  | 1 |
| `esya/holy-water.webp` |  | 1 |
| `esya/amulet-of-health.webp` |  | 1 |
| `esya/bag-of-holding.webp` |  | 1 |
| `esya/belt-of-hill-giant-strength.webp` |  | 1 |
| `esya/boots-of-speed.webp` |  | 1 |
| `esya/bracers-of-defense.webp` |  | 1 |
| `esya/cloak-of-displacement.webp` |  | 1 |
| `esya/cloak-of-protection.webp` |  | 1 |
| `esya/gauntlets-of-ogre-power.webp` |  | 1 |
| `esya/headband-of-intellect.webp` |  | 1 |
| `esya/poisoners-kit.webp` |  | 1 |
| `esya/ring-of-protection.webp` |  | 1 |
| `esya/staff-of-healing.webp` |  | 1 |
| `esya/wand-of-fireballs.webp` |  | 1 |
| `esya/wand-of-magic-missiles.webp` |  | 1 |
| `esya/ammunition.webp` |  | 1 |
| `esya/arcane-focus.webp` |  | 1 |
| `esya/backpack.webp` |  | 1 |
| `esya/ball-bearings.webp` |  | 1 |
| `esya/barrel.webp` |  | 1 |
| `esya/poison-basic.webp` |  | 1 |
| `esya/basket.webp` |  | 1 |
| `esya/bedroll.webp` |  | 1 |
| `esya/bell.webp` |  | 1 |
| `esya/blanket.webp` |  | 1 |
| `esya/block-and-tackle.webp` |  | 1 |
| `esya/book.webp` |  | 1 |
| `esya/bottle-glass.webp` |  | 1 |
| `esya/bucket.webp` |  | 1 |
| `esya/lantern-bullseye.webp` |  | 1 |
| `esya/burglars-pack.webp` |  | 1 |
| `esya/caltrops.webp` |  | 1 |
| `esya/candle.webp` |  | 1 |
| `esya/case-crossbow-bolt.webp` |  | 1 |
| `esya/case-map-or-scroll.webp` |  | 1 |
| `esya/chain.webp` |  | 1 |
| `esya/chest.webp` |  | 1 |
| `esya/climbers-kit.webp` |  | 1 |
| `esya/clothes-fine.webp` |  | 1 |
| `esya/clothes-travelers.webp` |  | 1 |
| `esya/component-pouch.webp` |  | 1 |
| `esya/costume.webp` |  | 1 |
| `esya/crowbar.webp` |  | 1 |
| `esya/diplomats-pack.webp` |  | 1 |
| `esya/druidic-focus.webp` |  | 1 |
| `esya/dungeoneers-pack.webp` |  | 1 |
| `esya/entertainers-pack.webp` |  | 1 |
| `esya/explorers-pack.webp` |  | 1 |
| `esya/flask.webp` |  | 1 |
| `esya/grappling-hook.webp` |  | 1 |
| `esya/holy-symbol.webp` |  | 1 |
| `esya/lantern-hooded.webp` |  | 1 |
| `esya/hunting-trap.webp` |  | 1 |
| `esya/ink.webp` |  | 1 |
| `esya/ink-pen.webp` |  | 1 |
| `esya/jug.webp` |  | 1 |
| `esya/ladder.webp` |  | 1 |
| `esya/lamp.webp` |  | 1 |
| `esya/lock.webp` |  | 1 |
| `esya/magnifying-glass.webp` |  | 1 |
| `esya/manacles.webp` |  | 1 |
| `esya/map.webp` |  | 1 |
| `esya/mirror.webp` |  | 1 |
| `esya/net.webp` |  | 1 |
| `esya/oil.webp` |  | 1 |
| `esya/paper.webp` |  | 1 |
| `esya/parchment.webp` |  | 1 |
| `esya/perfume.webp` |  | 1 |
| `esya/pole.webp` |  | 1 |
| `esya/pot-iron.webp` |  | 1 |
| `esya/pouch.webp` |  | 1 |
| `esya/priests-pack.webp` |  | 1 |
| `esya/quiver.webp` |  | 1 |
| `esya/ram-portable.webp` |  | 1 |
| `esya/rations.webp` |  | 1 |
| `esya/robe.webp` |  | 1 |
| `esya/rope.webp` |  | 1 |
| `esya/sack.webp` |  | 1 |
| `esya/scholars-pack.webp` |  | 1 |
| `esya/shovel.webp` |  | 1 |
| `esya/signal-whistle.webp` |  | 1 |
| `esya/spikes-iron.webp` |  | 1 |
| `esya/spyglass.webp` |  | 1 |
| `esya/string.webp` |  | 1 |
| `esya/tent.webp` |  | 1 |
| `esya/tinderbox.webp` |  | 1 |
| `esya/torch.webp` |  | 1 |
| `esya/vial.webp` |  | 1 |
| `esya/waterskin.webp` |  | 1 |
| `esya/adamantine-armor.webp` |  | 1 |
| `esya/ammunition-of-slaying.webp` |  | 1 |
| `esya/ammunition-1.webp` |  | 1 |
| `esya/ammunition-2.webp` |  | 1 |
| `esya/ammunition-3.webp` |  | 1 |
| `esya/amulet-of-proof-against-detection-and-location.webp` |  | 1 |
| `esya/amulet-of-the-planes.webp` |  | 1 |
| `esya/animated-shield.webp` |  | 1 |
| `esya/apparatus-of-the-crab.webp` |  | 1 |
| `esya/armor-of-invulnerability.webp` |  | 1 |
| `esya/armor-of-resistance-acid.webp` |  | 1 |
| `esya/armor-of-resistance-bludgeoning.webp` |  | 1 |
| `esya/armor-of-resistance-cold.webp` |  | 1 |
| `esya/armor-of-resistance-fire.webp` |  | 1 |
| `esya/armor-of-resistance-force.webp` |  | 1 |
| `esya/armor-of-resistance-lightning.webp` |  | 1 |
| `esya/armor-of-resistance-necrotic.webp` |  | 1 |
| `esya/armor-of-resistance-piercing.webp` |  | 1 |
| `esya/armor-of-resistance-poison.webp` |  | 1 |
| `esya/armor-of-resistance-psychic.webp` |  | 1 |
| `esya/armor-of-resistance-radiant.webp` |  | 1 |
| `esya/armor-of-resistance-slashing.webp` |  | 1 |
| `esya/armor-of-resistance-thunder.webp` |  | 1 |
| `esya/armor-of-vulnerability-bludgeoning.webp` |  | 1 |
| `esya/armor-of-vulnerability-piercing.webp` |  | 1 |
| `esya/armor-of-vulnerability-slashing.webp` |  | 1 |
| `esya/armor-1.webp` |  | 1 |
| `esya/armor-2.webp` |  | 1 |
| `esya/armor-3.webp` |  | 1 |
| `esya/arrow-catching-shield.webp` |  | 1 |
| `esya/bag-of-beans.webp` |  | 1 |
| `esya/bag-of-devouring.webp` |  | 1 |
| `esya/bag-of-tricks.webp` |  | 1 |
| `esya/bead-of-force.webp` |  | 1 |
| `esya/bead-of-nourishment.webp` |  | 1 |
| `esya/belt-of-cloud-giant-strength.webp` |  | 1 |
| `esya/belt-of-dwarvenkind.webp` |  | 1 |
| `esya/belt-of-fire-giant-strength.webp` |  | 1 |
| `esya/belt-of-frost-giant-strength.webp` |  | 1 |
| `esya/belt-of-stone-giant-strength.webp` |  | 1 |
| `esya/belt-of-storm-giant-strength.webp` |  | 1 |
| `esya/berserker-axe.webp` |  | 1 |
| `esya/boots-of-elvenkind.webp` |  | 1 |
| `esya/boots-of-levitation.webp` |  | 1 |
| `esya/boots-of-striding-and-springing.webp` |  | 1 |
| `esya/boots-of-the-winterlands.webp` |  | 1 |
| `esya/bowl-of-commanding-water-elementals.webp` |  | 1 |
| `esya/bracers-of-archery.webp` |  | 1 |
| `esya/brazier-of-commanding-fire-elementals.webp` |  | 1 |
| `esya/brooch-of-shielding.webp` |  | 1 |
| `esya/broom-of-flying.webp` |  | 1 |
| `esya/candle-of-invocation.webp` |  | 1 |
| `esya/cape-of-the-mountebank.webp` |  | 1 |
| `esya/carpet-of-flying.webp` |  | 1 |
| `esya/censer-of-controlling-air-elementals.webp` |  | 1 |
| `esya/chime-of-opening.webp` |  | 1 |
| `esya/circlet-of-blasting.webp` |  | 1 |
| `esya/cloak-of-arachnida.webp` |  | 1 |
| `esya/cloak-of-elvenkind.webp` |  | 1 |
| `esya/cloak-of-invisibility.webp` |  | 1 |
| `esya/cloak-of-the-bat.webp` |  | 1 |
| `esya/cloak-of-the-manta-ray.webp` |  | 1 |
| `esya/crystal-ball.webp` |  | 1 |
| `esya/crystal-ball-of-mind-reading.webp` |  | 1 |
| `esya/crystal-ball-of-telepathy.webp` |  | 1 |
| `esya/crystal-ball-of-true-seeing.webp` |  | 1 |
| `esya/cube-of-force.webp` |  | 1 |
| `esya/cubic-gate.webp` |  | 1 |
| `esya/dagger-of-venom.webp` |  | 1 |
| `esya/dancing-sword.webp` |  | 1 |
| `esya/decanter-of-endless-water.webp` |  | 1 |
| `esya/deck-of-illusions.webp` |  | 1 |
| `esya/defender.webp` |  | 1 |
| `esya/demon-armor.webp` |  | 1 |
| `esya/dimensional-shackles.webp` |  | 1 |
| `esya/dragon-orb.webp` |  | 1 |
| `esya/dragon-scale-mail.webp` |  | 1 |
| `esya/dragon-slayer.webp` |  | 1 |
| `esya/dust-of-disappearance.webp` |  | 1 |
| `esya/dust-of-dryness.webp` |  | 1 |
| `esya/dust-of-sneezing-and-choking.webp` |  | 1 |
| `esya/dwarven-plate.webp` |  | 1 |
| `esya/dwarven-thrower.webp` |  | 1 |
| `esya/efficient-quiver.webp` |  | 1 |
| `esya/efreeti-bottle.webp` |  | 1 |
| `esya/elemental-gem.webp` |  | 1 |
| `esya/elixir-of-health.webp` |  | 1 |
| `esya/elven-chain.webp` |  | 1 |
| `esya/energy-bow.webp` |  | 1 |
| `esya/eversmoking-bottle.webp` |  | 1 |
| `esya/eyes-of-charming.webp` |  | 1 |
| `esya/eyes-of-minute-seeing.webp` |  | 1 |
| `esya/eyes-of-the-eagle.webp` |  | 1 |
| `esya/feather-token.webp` |  | 1 |
| `esya/figurine-of-wondrous-power.webp` |  | 1 |
| `esya/flame-tongue.webp` |  | 1 |
| `esya/folding-boat.webp` |  | 1 |
| `esya/frost-brand.webp` |  | 1 |
| `esya/gem-of-brightness.webp` |  | 1 |
| `esya/gem-of-seeing.webp` |  | 1 |
| `esya/giant-slayer.webp` |  | 1 |
| `esya/glamoured-studded-leather.webp` |  | 1 |
| `esya/gloves-of-missile-snaring.webp` |  | 1 |
| `esya/gloves-of-swimming-and-climbing.webp` |  | 1 |
| `esya/gloves-of-thievery.webp` |  | 1 |
| `esya/goggles-of-night.webp` |  | 1 |
| `esya/hammer-of-thunderbolts.webp` |  | 1 |
| `esya/handy-haversack.webp` |  | 1 |
| `esya/hat-of-disguise.webp` |  | 1 |
| `esya/hat-of-many-spells.webp` |  | 1 |
| `esya/helm-of-brilliance.webp` |  | 1 |
| `esya/helm-of-comprehending-languages.webp` |  | 1 |
| `esya/helm-of-telepathy.webp` |  | 1 |
| `esya/helm-of-teleportation.webp` |  | 1 |
| `esya/holy-avenger.webp` |  | 1 |
| `esya/horn-of-blasting.webp` |  | 1 |
| `esya/horn-of-valhalla.webp` |  | 1 |
| `esya/horseshoes-of-speed.webp` |  | 1 |
| `esya/horseshoes-of-a-zephyr.webp` |  | 1 |
| `esya/immovable-rod.webp` |  | 1 |
| `esya/instant-fortress.webp` |  | 1 |
| `esya/ioun-stone.webp` |  | 1 |
| `esya/iron-bands.webp` |  | 1 |
| `esya/iron-flask.webp` |  | 1 |
| `esya/javelin-of-lightning.webp` |  | 1 |
| `esya/lantern-of-revealing.webp` |  | 1 |
| `esya/luck-blade.webp` |  | 1 |
| `esya/mace-of-disruption.webp` |  | 1 |
| `esya/mace-of-smiting.webp` |  | 1 |
| `esya/mace-of-terror.webp` |  | 1 |
| `esya/mantle-of-spell-resistance.webp` |  | 1 |
| `esya/manual-of-bodily-health.webp` |  | 1 |
| `esya/manual-of-gainful-exercise.webp` |  | 1 |
| `esya/manual-of-golems.webp` |  | 1 |
| `esya/manual-of-quickness-of-action.webp` |  | 1 |
| `esya/marvelous-pigments.webp` |  | 1 |
| `esya/medallion-of-thoughts.webp` |  | 1 |
| `esya/mirror-of-life-trapping.webp` |  | 1 |
| `esya/mithral-armor.webp` |  | 1 |
| `esya/mysterious-deck.webp` |  | 1 |
| `esya/necklace-of-adaptation.webp` |  | 1 |
| `esya/necklace-of-fireballs.webp` |  | 1 |
| `esya/necklace-of-prayer-beads.webp` |  | 1 |
| `esya/nine-lives-stealer.webp` |  | 1 |
| `esya/oathbow.webp` |  | 1 |
| `esya/oil-of-etherealness.webp` |  | 1 |
| `esya/oil-of-sharpness.webp` |  | 1 |
| `esya/oil-of-slipperiness.webp` |  | 1 |
| `esya/pearl-of-power.webp` |  | 1 |
| `esya/periapt-of-health.webp` |  | 1 |
| `esya/periapt-of-proof-against-poison.webp` |  | 1 |
| `esya/periapt-of-wound-closure.webp` |  | 1 |
| `esya/philter-of-love.webp` |  | 1 |
| `esya/pipes-of-haunting.webp` |  | 1 |
| `esya/pipes-of-the-sewers.webp` |  | 1 |
| `esya/plate-armor-of-etherealness.webp` |  | 1 |
| `esya/portable-hole.webp` |  | 1 |
| `esya/potion-of-animal-friendship.webp` |  | 1 |
| `esya/potion-of-clairvoyance.webp` |  | 1 |
| `esya/potion-of-climbing.webp` |  | 1 |
| `esya/potion-of-cloud-giant-strength.webp` |  | 1 |
| `esya/potion-of-diminution.webp` |  | 1 |
| `esya/potion-of-fire-giant-strength.webp` |  | 1 |
| `esya/potion-of-flying.webp` |  | 1 |
| `esya/potion-of-frost-giant-strength.webp` |  | 1 |
| `esya/potion-of-gaseous-form.webp` |  | 1 |
| `esya/potion-of-growth.webp` |  | 1 |
| `esya/potion-of-heroism.webp` |  | 1 |
| `esya/potion-of-hill-giant-strength.webp` |  | 1 |
| `esya/potion-of-invisibility.webp` |  | 1 |
| `esya/potion-of-invulnerability.webp` |  | 1 |
| `esya/potion-of-longevity.webp` |  | 1 |
| `esya/potion-of-mind-reading.webp` |  | 1 |
| `esya/potion-of-poison.webp` |  | 1 |
| `esya/potion-of-resistance-acid.webp` |  | 1 |
| `esya/potion-of-resistance-bludgeoning.webp` |  | 1 |
| `esya/potion-of-resistance-cold.webp` |  | 1 |
| `esya/potion-of-resistance-fire.webp` |  | 1 |
| `esya/potion-of-resistance-force.webp` |  | 1 |
| `esya/potion-of-resistance-lightning.webp` |  | 1 |
| `esya/potion-of-resistance-necrotic.webp` |  | 1 |
| `esya/potion-of-resistance-piercing.webp` |  | 1 |
| `esya/potion-of-resistance-poison.webp` |  | 1 |
| `esya/potion-of-resistance-psychic.webp` |  | 1 |
| `esya/potion-of-resistance-radiant.webp` |  | 1 |
| `esya/potion-of-resistance-slashing.webp` |  | 1 |
| `esya/potion-of-resistance-thunder.webp` |  | 1 |
| `esya/potion-of-speed.webp` |  | 1 |
| `esya/potion-of-stone-giant-strength.webp` |  | 1 |
| `esya/potion-of-storm-giant-strength.webp` |  | 1 |
| `esya/potion-of-vitality.webp` |  | 1 |
| `esya/potion-of-water-breathing.webp` |  | 1 |
| `esya/quarterstaff-of-the-acrobat.webp` |  | 1 |
| `esya/ring-of-animal-influence.webp` |  | 1 |
| `esya/ring-of-djinni-summoning.webp` |  | 1 |
| `esya/ring-of-elemental-command.webp` |  | 1 |
| `esya/ring-of-evasion.webp` |  | 1 |
| `esya/ring-of-feather-falling.webp` |  | 1 |
| `esya/ring-of-free-action.webp` |  | 1 |
| `esya/ring-of-invisibility.webp` |  | 1 |
| `esya/ring-of-jumping.webp` |  | 1 |
| `esya/ring-of-mind-shielding.webp` |  | 1 |
| `esya/ring-of-regeneration.webp` |  | 1 |
| `esya/ring-of-resistance-acid.webp` |  | 1 |
| `esya/ring-of-resistance-bludgeoning.webp` |  | 1 |
| `esya/ring-of-resistance-cold.webp` |  | 1 |
| `esya/ring-of-resistance-fire.webp` |  | 1 |
| `esya/ring-of-resistance-force.webp` |  | 1 |
| `esya/ring-of-resistance-lightning.webp` |  | 1 |
| `esya/ring-of-resistance-necrotic.webp` |  | 1 |
| `esya/ring-of-resistance-piercing.webp` |  | 1 |
| `esya/ring-of-resistance-poison.webp` |  | 1 |
| `esya/ring-of-resistance-psychic.webp` |  | 1 |
| `esya/ring-of-resistance-radiant.webp` |  | 1 |
| `esya/ring-of-resistance-slashing.webp` |  | 1 |
| `esya/ring-of-resistance-thunder.webp` |  | 1 |
| `esya/ring-of-shooting-stars.webp` |  | 1 |
| `esya/ring-of-spell-storing.webp` |  | 1 |
| `esya/ring-of-spell-turning.webp` |  | 1 |
| `esya/ring-of-swimming.webp` |  | 1 |
| `esya/ring-of-telekinesis.webp` |  | 1 |
| `esya/ring-of-three-wishes.webp` |  | 1 |
| `esya/ring-of-warmth.webp` |  | 1 |
| `esya/ring-of-water-walking.webp` |  | 1 |
| `esya/ring-of-x-ray-vision.webp` |  | 1 |
| `esya/ring-of-the-ram.webp` |  | 1 |
| `esya/robe-of-eyes.webp` |  | 1 |
| `esya/robe-of-scintillating-colors.webp` |  | 1 |
| `esya/robe-of-stars.webp` |  | 1 |
| `esya/robe-of-useful-items.webp` |  | 1 |
| `esya/robe-of-the-archmagi.webp` |  | 1 |
| `esya/rod-of-absorption.webp` |  | 1 |
| `esya/rod-of-alertness.webp` |  | 1 |
| `esya/rod-of-lordly-might.webp` |  | 1 |
| `esya/rod-of-resurrection.webp` |  | 1 |
| `esya/rod-of-rulership.webp` |  | 1 |
| `esya/rod-of-security.webp` |  | 1 |
| `esya/rope-of-climbing.webp` |  | 1 |
| `esya/rope-of-entanglement.webp` |  | 1 |
| `esya/scarab-of-protection.webp` |  | 1 |
| `esya/scimitar-of-speed.webp` |  | 1 |
| `esya/sending-stones.webp` |  | 1 |
| `esya/sentinel-shield.webp` |  | 1 |
| `esya/shield-of-missile-attraction.webp` |  | 1 |
| `esya/shield-of-the-cavalier.webp` |  | 1 |
| `esya/shield-1.webp` |  | 1 |
| `esya/shield-2.webp` |  | 1 |
| `esya/shield-3.webp` |  | 1 |
| `esya/slippers-of-spider-climbing.webp` |  | 1 |
| `esya/sovereign-glue.webp` |  | 1 |
| `esya/spell-scroll.webp` |  | 1 |
| `esya/spellguard-shield.webp` |  | 1 |
| `esya/sphere-of-annihilation.webp` |  | 1 |
| `esya/staff-of-charming.webp` |  | 1 |
| `esya/staff-of-fire.webp` |  | 1 |
| `esya/staff-of-frost.webp` |  | 1 |
| `esya/staff-of-power.webp` |  | 1 |
| `esya/staff-of-striking.webp` |  | 1 |
| `esya/staff-of-swarming-insects.webp` |  | 1 |
| `esya/staff-of-thunder-and-lightning.webp` |  | 1 |
| `esya/staff-of-withering.webp` |  | 1 |
| `esya/staff-of-the-magi.webp` |  | 1 |
| `esya/staff-of-the-python.webp` |  | 1 |
| `esya/staff-of-the-woodlands.webp` |  | 1 |
| `esya/stone-of-controlling-earth-elementals.webp` |  | 1 |
| `esya/stone-of-good-luck.webp` |  | 1 |
| `esya/sun-blade.webp` |  | 1 |
| `esya/sword-of-life-stealing.webp` |  | 1 |
| `esya/sword-of-sharpness.webp` |  | 1 |
| `esya/sword-of-wounding.webp` |  | 1 |
| `esya/talisman-of-pure-good.webp` |  | 1 |
| `esya/talisman-of-ultimate-evil.webp` |  | 1 |
| `esya/talisman-of-the-sphere.webp` |  | 1 |
| `esya/thunderous-greatclub.webp` |  | 1 |
| `esya/tome-of-clear-thought.webp` |  | 1 |
| `esya/tome-of-leadership-and-influence.webp` |  | 1 |
| `esya/tome-of-understanding.webp` |  | 1 |
| `esya/trident-of-fish-command.webp` |  | 1 |
| `esya/universal-solvent.webp` |  | 1 |
| `esya/vicious-weapon.webp` |  | 1 |
| `esya/vorpal-sword.webp` |  | 1 |
| `esya/wand-of-binding.webp` |  | 1 |
| `esya/wand-of-enemy-detection.webp` |  | 1 |
| `esya/wand-of-fear.webp` |  | 1 |
| `esya/wand-of-lightning-bolts.webp` |  | 1 |
| `esya/wand-of-magic-detection.webp` |  | 1 |
| `esya/wand-of-paralysis.webp` |  | 1 |
| `esya/wand-of-polymorph.webp` |  | 1 |
| `esya/wand-of-secrets.webp` |  | 1 |
| `esya/wand-of-web.webp` |  | 1 |
| `esya/wand-of-wonder.webp` |  | 1 |
| `esya/wand-of-the-war-mage-1.webp` |  | 1 |
| `esya/wand-of-the-war-mage-2.webp` |  | 1 |
| `esya/wand-of-the-war-mage-3.webp` |  | 1 |
| `esya/weapon-of-warning.webp` |  | 1 |
| `esya/weapon-1.webp` |  | 1 |
| `esya/weapon-2.webp` |  | 1 |
| `esya/weapon-3.webp` |  | 1 |
| `esya/well-of-many-worlds.webp` |  | 1 |
| `esya/wind-fan.webp` |  | 1 |
| `esya/winged-boots.webp` |  | 1 |
| `esya/wings-of-flying.webp` |  | 1 |
| `esya/dagger.webp` |  | 1 |
| `esya/handaxe.webp` |  | 1 |
| `esya/javelin.webp` |  | 1 |
| `esya/mace.webp` |  | 1 |
| `esya/quarterstaff.webp` |  | 1 |
| `esya/spear.webp` |  | 1 |
| `esya/greatclub.webp` |  | 1 |
| `esya/light-hammer.webp` |  | 1 |
| `esya/sickle.webp` |  | 1 |
| `esya/light-crossbow.webp` |  | 1 |
| `esya/shortbow.webp` |  | 1 |
| `esya/battleaxe.webp` |  | 1 |
| `esya/flail.webp` |  | 1 |
| `esya/glaive.webp` |  | 1 |
| `esya/greataxe.webp` |  | 1 |
| `esya/greatsword.webp` |  | 1 |
| `esya/halberd.webp` |  | 1 |
| `esya/longsword.webp` |  | 1 |
| `esya/maul.webp` |  | 1 |
| `esya/morningstar.webp` |  | 1 |
| `esya/rapier.webp` |  | 1 |
| `esya/scimitar.webp` |  | 1 |
| `esya/shortsword.webp` |  | 1 |
| `esya/trident.webp` |  | 1 |
| `esya/warhammer.webp` |  | 1 |
| `esya/whip.webp` |  | 1 |
| `esya/hand-crossbow.webp` |  | 1 |
| `esya/heavy-crossbow.webp` |  | 1 |
| `esya/longbow.webp` |  | 1 |
| `esya/club.webp` |  | 1 |
| `esya/dart.webp` |  | 1 |
| `esya/sling.webp` |  | 1 |
| `esya/lance.webp` |  | 1 |
| `esya/pike.webp` |  | 1 |
| `esya/war-pick.webp` |  | 1 |
| `esya/blowgun.webp` |  | 1 |
| `esya/musket.webp` |  | 1 |
| `esya/pistol.webp` |  | 1 |
| `esya/padded-armor.webp` |  | 1 |
| `esya/leather-armor.webp` |  | 1 |
| `esya/studded-leather-armor.webp` |  | 1 |
| `esya/hide-armor.webp` |  | 1 |
| `esya/chain-shirt.webp` |  | 1 |
| `esya/scale-mail.webp` |  | 1 |
| `esya/breastplate.webp` |  | 1 |
| `esya/half-plate-armor.webp` |  | 1 |
| `esya/ring-mail.webp` |  | 1 |
| `esya/chain-mail.webp` |  | 1 |
| `esya/splint-armor.webp` |  | 1 |
| `esya/plate-armor.webp` |  | 1 |

Tür `src/rules/itemCategory.ts` (`itemKind`: SRD sihirli eşya türü + ad sözcükleri), nadirlik `itemTier` → `nadirlikRengi` (yalnız sihirli eşyada; renkler oluşturucunun kenar şeridiyle aynı: olağandışı yeşil, nadir mavi, çok nadir mor, efsanevi turuncu).

## (c) Canavarlar (330)

Jeton: `public/monsters/<kimlik>.webp` (256×256; `monsterAvatar`). **330/330 dosyası var, silüet ya da yer tutucu yok** (yer tutucu baş harfli daire yalnız Game Master'ın eklediği özel canavarda). Klasör 352 dosya = 330 ana + 22 `-uyku`; çözülmüş piksel özdeşliğiyle 316 farklı görüntü.

**Genel (40):** ejderhaların dört yaşı (wyrmling, young, adult, ancient) aynı görüntü, 10 renk: black (4), blue (4), brass (4), bronze (4), copper (4), gold (4), green (4), red (4), silver (4), white (4). Uyuyan varyant (`-uyku`, 22): `adult-gold-dragon`, `adult-red-dragon`, `ancient-gold-dragon`, `ancient-red-dragon`, `bandit-captain`, `bandit`, `brown-bear`, `dire-wolf`, `goblin-warrior`, `gold-dragon-wyrmling`, `hell-hound`, `hill-giant`, `hobgoblin-warrior`, `minotaur-of-baphomet`, `ogre`, `owlbear`, `red-dragon-wyrmling`, `troll`, `wolf`, `wyvern`, `young-gold-dragon`, `young-red-dragon`.

| Boyut | Kayıt | Görsel ölçek (`token-sizes.json`) | Jeton çapı / altıgen yüksekliği | `multiHex` açıkken altıgen |
|---|---|---|---|---|
| T | 25 | 0,30 | 0,22 | 1 |
| S | 23 | 0,50 | 0,36 | 1 |
| M | 126 | 1,00 | 0,72 | 1 |
| L | 107 | 1,50 | 1,08 | 3 |
| H | 34 | 2,00 | 1,44 | 7 |
| G | 15 | 3,00 | 2,16 | 19 |

## (d) Tür (10), alt soy (41), sınıf (12), alt sınıf (120)

- **Tür:** 10/10 jeton (`characters/<tür>-<male|female>-<sınıf>.webp`, 216 sınıf-genel jeton = 9 tür × 2 cinsiyet × 12 sınıf; Dragonborn'da sınıf-genel jeton yok (`data/jeton-genel.json`), temsilci Gariban; Gariban `-GR` 240). Eşlemede temsilci jeton erkek Fighter; ırk ölçeği `token-sizes.json` `race` (Halfling/Gnome 0,5 … Goliath 1,4).
- **Alt soy:** 41 = 38 tür soyu + 3 Göksel Uyanış; ayrı jeton yok, görünüm ırk jetonuna katman (Kuyruk AS1c: `lineageLook`, `Avatar.look`). Kayda özel görünüm **34**, ırk tabanıyla aynı **7** (hepsi `alt-soy-gorunum.json` `orijinal: true` ya da bilinçli boyasız: `elf/wood-elf`, `gnome/forest-gnome`, `gnome/rock-gnome`, `halfling/slender`, `human/khadyrga`, `orc/wildwood`, `tiefling/infernal`).
  - Human ten tonları (AS1b/AS1c): 3 ton (Orijinal boyasız, Koyu, Altın), kültür eşlemesi Tenhausser → Koyu, Khadyrga → Orijinal, Saf Kent → Altın, Sur Dışı üçü (varsayılan Orijinal) + Sürgün; ten maskesi `public/characters/maske/human-*`.
  - Kanat: `data/kanat-esleme.json` 3 slot (Tiefling Winged, Celestial Kırık Kanat 3+, Dragonborn 5+); Dragonborn kanat sürümü KW2: taban `dragonborn.webp` + zar + pençe katmanı, soy rengine göre palet; 4 jeton kendi çiziminde kanatlı (`kanatsiz`). `public/kanat/` 6 görsel; `melek-acik.webp` hiçbir slota bağlı değil (kullanılmayan).
  - Ayrıntı: aşağıdaki tablo (görünüm parçaları).

| Alt soy | Durum | Görünüm |
|---|---|---|
| `dragonborn/black` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/blue` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/brass` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/bronze` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/copper` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/gold` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/green` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/red` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/silver` | var | soy rengi, kanat 5+. seviye |
| `dragonborn/white` | var | soy rengi, kanat 5+. seviye |
| `dwarf/crag` | var | CSS filtresi |
| `dwarf/knoll` | var | oran 1.04×1 |
| `dwarf/undervault` | var | CSS filtresi |
| `elf/drow` | var | soy rengi |
| `elf/high-elf` | var | soy rengi |
| `elf/wood-elf` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `gnome/forest-gnome` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `gnome/rock-gnome` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `gnome/subterranean` | var | soy rengi |
| `goliath/cloud` | var | soy rengi |
| `goliath/fire` | var | soy rengi |
| `goliath/frost` | var | soy rengi |
| `goliath/hill` | var | soy rengi |
| `goliath/stone` | var | soy rengi |
| `goliath/storm` | var | soy rengi |
| `halfling/slender` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `halfling/sturdy` | var | oran 1.07×0.93 |
| `human/tenhausser` | var | ten tonu Koyu |
| `human/khadyrga` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `human/pure-city` | var | ten tonu Altın |
| `human/outwall` | var | ten tonu seçilebilir (Orijinal, Koyu, Altın) |
| `orc/glacier` | var | CSS filtresi |
| `orc/wildwood` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `orc/fen` | var | CSS filtresi |
| `tiefling/abyssal` | var | soy rengi |
| `tiefling/chthonic` | var | soy rengi |
| `tiefling/infernal` | genel | orijinal görünüm (ırk tabanı; kullanıcı kararı) |
| `tiefling/winged` | var | soy rengi, kanat (tiefling-kanatli) |
| `celestial/parlayan-ruh` | var | hale |
| `celestial/gece-gozyasi` | var | CSS filtresi |
| `celestial/kirik-kanat` | var | kanat (celestial-kirik-kanat) |

- **Sınıf:** 12/12 sınıf-genel jeton. Aynı Dungeondex kategorisindeki 28 Invocation ve 10 Metamagic görselsiz (glif; bkz. g).
- **Alt sınıf:** 120 (jeton tabloları `data/<sınıf>-jeton.json`; Barış Alanı kaldırıldı, Birlik Manastırı hücresini paylaşırdı). **Gerçek jeton 120/120, yedek 0**; her alt sınıfın kendi hücresi ve 10 tür × izinli cinsiyet jetonu var (cinsiyet kısıtı: Karadul yalnız kadın, İmparator yalnız erkek; ikinci form: Pehlivan 10+). **İçerik eksik 0/119** bu ortamda (bulut: `icerik/` yok, fikstür 12 SRD + 12 bizim yüklü); tarayıcıda `icerik/` yoksa yalnız 12 bizim alt sınıf yüklenir (108/120 "içerik eksik"), jeton yine çözülür (jeton tablosu içerikten bağımsız).

## (e) Durumlar, yüzeyler, nesneler, alanlar, zar temaları

- **Durum (15):** 15/15 ikon (`sprites/efekt-ikon-*`); döngü şeridi 8 (charmed, frightened, grappled, incapacitated, paralyzed, poisoned, restrained, stunned); CSS jeton filtresi 6 (petrified, blinded, invisible, unconscious, prone, exhaustion). Savaş rozetinde Blinded, Petrified, Unconscious ikonu bilinçli olarak yok (E1: karartma, taş filtresi, yüzen Z; test `damageFloats.test.ts`); bu üç ikon yalnız galeri/vitrinde. Ekranda en çok 8 döngü animasyonu (`statusFx`), efekt bütçesi ekranda 12, jeton başına 2.
- **Yüzey (9):** sprite 8; yok: `warning`.
- **Harita nesnesi (34):** sprite 2 (oilBarrel, powderKeg), emoji 32: 🧰 `chest`, 🪑 `table`, 🚪 `door`, ⛩ `gate`, 🔥 `brazier`, 🕹 `lever`, 👁 `statueEye`, ⛺ `tent`, 🌲 `tree`, 🌉 `bridge`, 💀 `bonePile`, 📜 `plaque`, 🪨 `boulderPile`, 🫕 `cauldron`, ❄ `iceSeal`, 🧱 `crackedWall`, 🗝 `key`, 🪵 `benchLeg`, ⛓ `chain`, 🪣 `bucket`, 🏏 `cudgel`, 🏹 `ballista`, 🧊 `frozenFall`, 🪨 `rock`, 🗡 `droppedItem`, 📖 `spellbook`, 🗡 `sword`, 🗿 `statue`, 🧪 `potion`, 🪄 `wand`, 📿 `amulet`, 💍 `ring`.
- **Büyü alanı (savaştaki 36 kalıcı alan):** doku 30, varsayılan aura 1 (antilife-shell), renkli altıgen yer tutucusu 5 (conjure-animals, conjure-elemental, dancing-lights, flaming-sphere, forcecage).
- **Zar teması:** `zar-gorselleri.json` 72 tema; görsel seti (d4…d100, 7 görsel) 63; seti olmayan 9 (lawful-good, neutral-good, chaotic-good, lawful-neutral, true-neutral, chaotic-neutral, lawful-evil, neutral-evil, chaotic-evil: `seti` yazılı, klasör yok → klasik görsel + 3D renkleri). **72 → 100 sorunu:** kullanıcı hedefi 100 tema; veride 72 tanımlı, yalnız 63'ünün görseli var. 100'e ulaşmak için 28 yeni tema kimliği (henüz yok; uydurma kimlik eklenmedi, karar kullanıcıda) + 9 Alignment seti = 37 ham sayfa (`assets-ham/zarlar/zar-<tema>.jpg` → `npm run zarlar`). Kategori dağılımı: (malzeme) 12, (sinif) 12, (irk) 10, (harita) 15, (dusman) 12, (esya) 2, (hizalanma) 9.

## (f) Jeton / altıgen oranı ve mobil okunabilirlik

Dünya ölçüsü 15×7 = 1280×715; altıgen eni 111,3 px, yüksekliği 95,3 px; Medium jeton çapı 0,72 × yükseklik = 68,6 px (`TOKEN_R`); rozet 22 px, aralık 20 px, en çok 3 + "+N". Ölçek yalnız görsel (`tokenScale`); `multiHex` kapalıyken her yaratık tek altıgen, büyük jeton komşu altıgenlere taşar (`drawOrder` küçükleri üste alır).

| Boyut | Ölçek | Kapalı: jeton çapı (altıgen yüksekliği) | Açık: gövde altıgeni | Açık: gövde yüksekliği (altıgen) | Açık: jeton/gövde |
|---|---|---|---|---|---|
| M | 1,0 | 0,72 | 1 | 1,0 | %72 |
| L | 1,5 | 1,08 | 3 | 2,0 | %54 |
| H | 2,0 | 1,44 | 7 | 3,0 | %48 |
| G | 3,0 | 2,16 | 19 | 5,0 | %43 |

Kapalıyken (varsayılan) Large 1,08, Huge 1,44, Gargantuan 2,16 altıgen yüksekliğinde çizilir: tek altıgende duran yaratık için okunur, komşuya taşma bilinçli. Açıkken jeton gövdenin yarısı kadar kalır (Huge ≈ %48, Gargantuan ≈ %43): gövde tabanı (`.body-base`) gövdeyi gösterir ama jeton küçük görünür. Öneri: `multiHex` açıkken ölçek = gövde yüksekliği × 0,72 (ayrı görev; bu görevde değiştirilmedi, deneysel anahtar).

| Ekran | Ölçek (zoom 1) | Altıgen eni | Medium jeton | Tiny jeton | Huge jeton | Rozet | Not |
|---|---|---|---|---|---|---|---|
| 1280×800 (masaüstü) | 1,000 | 111,3 px | 68,6 px | 20,6 px | 137,3 px | 22,0 px | — |
| 844×390 (telefon yatay) | 0,545 | 60,7 px | 37,4 px | 11,2 px | 74,9 px | 12,0 px | rozet küçük |
| 390×844 (telefon dikey) | 0,305 | 33,9 px (< 44 px dokunma sınırı) | 20,9 px | 6,3 px | 41,8 px | 6,7 px | rozet ve Tiny jeton okunmaz |

Efekt kalabalığı: ekranda en çok 12 animasyonlu efekt + 8 durum döngüsü, jeton başına 2 katman, rozet 3 + "+N"; 390 px enli dikey ekranda 15 sütun sığdığı için bir altıgene ≈ 26 px düşer ve 3 rozet jetondan geniş olur. Geniş haritalarda kamera yakınlaştırır (en çok 2,5×; alt sınır altıgen ≥ 44 px); klasik 15×7 haritada yakınlaştırma yok. Öneri: dar dikey ekranda (ölçek < 0,5) rozetleri tek "+N" rozetine indirmek ve klasik haritada da kamerayı açmak (tasarım kararı; bu görevde kod değişmedi).

## (g) Sınıf özellikleri, feat, Invocation, Metamagic, geçmiş, büyü okulu, hasar türü

| Grup | Kayıt | Bugün ikon/glif | Gösterildiği ekranlar | Önerilen çözüm | Kayda özel resim gerekir |
|---|---|---|---|---|---|
| Sınıf özelliği (SRD tablo satırı) | 185 benzersiz (258 satır); mekanik türü: bonus 12, passive 107, free 9, (mekaniksiz/genel satır) 48, reaction 4, action 4, resource 1 | yok (savaş menüsünde yalnız "hızlı" yazı rozeti) | oluşturucu "Sınıf güçlerin", karakter kâğıdı, savaş Özel menüsü, Dungeondex sınıf kartı | ortak çerçeve + eylem türü glifi (`eylem-action/bonus/reaction/passive/free/resource`) | 0 |
| Feat | 17 (Origin 4, General 2, Fighting Style 4, Epic Boon 7) | yok | oluşturucu (köken/ASI adımı), kâğıt, Dungeondex | çerçeve + kategori glifi (`feat-origin/general/fighting-style/epic-boon`) | 0 |
| Eldritch Invocation | 28 | yok | oluşturucu (Warlock), kâğıt, Dungeondex | çerçeve + `invocation` glifi | 0 |
| Metamagic | 10 | yok | oluşturucu (Sorcerer), savaş büyü seçicisi, Dungeondex | çerçeve + `metamagic` glifi | 0 |
| Geçmiş | 12 | yok | oluşturucu "Karakter"/hikâye adımı, Dungeondex | çerçeve + `gecmis` glifi (vitrin için isteğe bağlı sahne resmi: 12) | 0 (isteğe bağlı 12) |
| Büyü okulu | 8 (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation) | yok | Dungeondex büyü kartı başlığı ve süzgeci | çerçeve + okul glifi (`okul-*`); büyü kartının yedeği de bu | 0 |
| Hasar türü | 13 | 4 emoji yalnız hasar sayısında (ateş 🔥, zehir ☠, soğuk ❄, asit 💧: `damageFloats.ts` `FLOAT_ICON`) | savaş hasar sayıları, günlük, Dungeondex olgu satırı | çerçeve + hasar glifi (`hasar-*`, 13) | 0 |

Bütün glifler eşlemenin `yedekler` tablosunda (tek kaynak); galeri ve vitrin aynı çerçeveyi çizer. Kayda özel resim gerektiren yok: bu grupların ayırt edici bilgisi metin (ad, tür, maliyet), resim değil.

## (h) İkon kullanan ekranlar ve eşya ikonu

| Ekran | Dosya | Görsel/ikon kullanımı | Eşya gösterimi |
|---|---|---|---|
| Ana menü ve karakter listesi | `src/screens/Screens.tsx` | logo, 10 SVG simge (`ui/icons.tsx`), karakter jetonu (`CharacterFigure`), kaynak ikonları (`ResourceChip`) | — |
| Karakter sihirbazı: donanım | `src/screens/builder/Equipment.tsx` | yok (çağrı yaratığı listesinde canavar jetonu: `builder/Features.tsx`) | **yalnız ad** + etki seviyesi kenar şeridi (CSS) |
| Karakter sihirbazı: önizleme | `src/screens/Builder.tsx` | `CharacterFigure` (jeton + alt soy görünümü) | — |
| Karakter kartı | `src/screens/sheet/SheetView.tsx` | jeton (`AvatarBadge`) | **yalnız ad** |
| Savaş: saldırı menüsü | `src/MapBattle.tsx` | halka menü yazı; durum rozetleri (ikon + emoji), kaynak ikonları, efektler | silah **yalnız ad** |
| Savaş: Eşya menüsü (`item-<kimlik>`) | `src/MapBattle.tsx` | yazı | iksir/eşya **yalnız ad** (+ adet) |
| Savaş haritası nesneleri | `src/MapBattle.tsx` | 2 sprite, 32 emoji (`nesneler.json` `icon`) | yerdeki eşya 🗡, iksir 🧪, değnek 🪄 emoji |
| Game Master kurulumu | `src/screens/GmScreen.tsx` | harita küçük resimleri, özel canavarın yüklenen görseli (canavar listesi metin) | — |
| Dungeondex | `src/screens/Dungeondex.tsx` | yok (kart yalnız metin) | **yalnız ad** |
| Serüven: dükkân | `src/screens/YerlesimHub.tsx` `HubShop` | yok | **yalnız ad** + fiyat |
| Serüven: han | `src/screens/YerlesimHub.tsx` `HubInn` | yok | eşya yok |
| Sefer haritası ve ödül sahnesi | `src/screens/SeferMap.tsx` | harita görseli, düğüm küçük resimleri | iksir 🧪 emoji |
| Zar seçici / tepsi | `src/ui/DiceStep.tsx`, `DiceTray.tsx` | zar görselleri (63 set) | — |

**Sonuç:** eşya ikonu hiçbir ekranda gösterilmiyor (6 ekranda yalnız ad, 2 yerde emoji). İkon gelince tek bileşen (çerçeve + `ref` ya da glif + nadirlik rengi) bu altı yere eklenebilir; eşleme JSON'u hazır.

## Öneri (sıra)

1. Eşya ikonları (449; önce 319 sihirli eşya ve 38 silah): Gemini, 128 px saydam, `public/esya/<kimlik>.webp`; eşleme betiği dosyayı görünce `kaynak: ikon` yapar (yeniden `npm run dd-gorsel`).
2. Görselsiz büyülerin kart ikonları (savaş dışı 108 + savaşta 4): `public/buyu/<kimlik>.webp` (betik görünce `kaynak: ikon`).
3. Harita nesnesi sprite'ları (32 emoji): mevcut `nesne-<ad>` hattı (`npm run sprite-ice`).
4. Zar: 9 Alignment seti, sonra 100 hedefine 28 tema (önce kimlik listesi kullanıcıdan).
5. Mobil: dar dikey ekranda rozet ölçeği ve klasik haritada kamera (kod görevi).
6. İsteğe bağlı: genel efektli savaş büyülerine özel hücreler, ejderha yaşları, 5 alan dokusu, `warning` yüzeyi.

## Yöntem ve yeniden üretim

- `npm run dd-gorsel` (yazmadan denetim: `npm run dd-gorsel -- --kuru`); test `src/dungeondex/gorselEsleme.test.ts` (her Dungeondex kaydı eşlemede, her `ref` public/ dosyasına ya da `yedekler` anahtarına çözülüyor, efekt kimlikleri kayıtlı).
- Görsel eklenince yeniden çalıştırılır; eşleme ve bu belge kendiliğinden güncellenir. Eşya ve büyü ikonu klasörleri (`public/esya/`, `public/buyu/`) henüz yok; betik varsa okur.

