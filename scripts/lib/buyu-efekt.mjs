/**
 * Kuyruk E3: büyü ve alt sınıf özelliği × efekt/görsel denetimi (salt okuma; oyun koduna, veriye, görsele dokunmaz). Saf:
 * dosya okumaz, verileri parametre alır (betik `scripts/buyu-efekt-tablosu.mjs` ve test ortak).
 *
 * Bağlama yolu koddan çıkarıldı (src/ui/fx/fxPlan.ts `fxShots`/`groundFx`, src/ui/damageFloats.ts `spriteFor`,
 * src/ui/statusFx.ts `loopEffectsFor`/`tokenFilters`, src/ui/sprites.ts `zoneSprite`, src/battle/spells.ts olay yolları):
 * - büyü saldırısı / otomatik isabet → `attack_resolved` → darbe[hasar türü] ?? `darbe-buyu` (varsayılan), kritikte `kritik-vurus`;
 *   hedefte hasar türü şeridi (fire→burn, cold→freeze, acid→acid, poison→poison; data/efekt-sprites.json `damage`).
 * - alan büyüsü (`executeAreaCast`) → `spell_cast.area` (ŞEKİLSİZ: koni ve çizgi de patlama olarak) → alan[hasar türü].
 *   `area_used` (şekilli, çizgi → ışın) yalnızca canavar nefesi/alan saldırısı ve Dragonborn nefesi.
 * - `m.zone` alan büyüsü `executeZoneCast`'e gider (alan patlaması yok): data/sprite-esleme.json `zones["spells:<id>"]` ya da
 *   efekt-baglama `duvar[<id>]`; yoksa renkli altıgen yer tutucusu (`.spell-zone`, `spec.color`/`icon`). Yaratığa bağlı alan → aura.
 * - iyileştirme `healed` → iyilestir-kucuk/buyuk; ışınlanma `teleported` → isinlan-cikis/giris; çağırma `summoned` → cagir-ruh/dogal
 *   (veri listesi ya da dokunulamaz), yoksa `cagir-portal` (varsayılan); itme `pushed` → itme-toz.
 * - süren etki `effect_added` (yalnız dost/kendi) → koruma satırı (ac/acMin → kalkan; wardedFrom/resist/immune → ruh;
 *   dice +1/tempHp/saveAdv → kutsama). Düşmana süren etki görsel üretmez. `buff_added` (Shield of Faith, Divine Favor) görsel üretmez.
 * - durum: döngü şeridi (Paralyzed, Stunned, Incapacitated, Frightened, Charmed, Restrained, Grappled; Poisoned `jetonDongu`),
 *   CSS jeton filtresi (Petrified, Blinded, Invisible, Unconscious, Prone, Exhaustion), yoksa yalnız durum ikonu.
 * - Spirit Guardians yayılımı konsantrasyonda (`concentration.aura`), `groundFx` okumaz: yalnız ilk dökümün alan patlaması.
 */

export const CSS_CONDITIONS = ['Petrified', 'Blinded', 'Invisible', 'Unconscious', 'Prone', 'Exhaustion'];
export const DURUMLAR = ['hazır', 'genel', 'eksik'];
export const SEVIYE_GRUPLARI = [['0–3', 0, 3], ['4–5', 4, 5], ['6–9', 6, 9]];
export const SINIFLAR = { Brd: 'Bard', Clr: 'Cleric', Drd: 'Druid', Pal: 'Paladin', Rgr: 'Ranger', Sor: 'Sorcerer', Wlk: 'Warlock', Wiz: 'Wizard' };

/**
 * Eksik animasyon aileleri. cozum: 'kod' (mevcut sprite + bağlama/CSS/hue), 'e2' (depodaki içe aktarılmamış E2 ham sayfası
 * `assets-ham/efekt/<sayfa>.jpg`; içe aktarma + bağlama CC işi), 'gemini' (yeni sayfa). Ailede birden çok çözüm olabilir
 * (`e2` satırları; `kaynak` türetilecek mevcut efekt; Gemini hücreleri `ALAN_HUCRE`).
 */
export const AILELER = {
  'mermi': { ad: 'Mermi (büyü oku, küre, dart)', cozum: ['e2', 'kod'], e2: 'mermi.jpg: ok, küre mermi, kıvılcım, iğne (beyaz; renk CSS hue/tint)', kaynak: 'isin-* uçlarıyla aynı renk tablosu' },
  'isin-tek': { ad: 'Tek hedef ışını (Ray, Eldritch Blast, Disintegrate)', cozum: ['kod'], kaynak: 'isin-ates/isik/sok/buz; nekrotik/zehir/kuvvet için isin-isik + hue-rotate' },
  'cizgi-sekil': { ad: 'Çizgi alanın ışın olarak çizilmesi', cozum: ['kod'], kaynak: '`spell_cast.area`a şekil (`shape`) eklenince fxPlan `area()` zaten isin-* seçer' },
  'koni': { ad: 'Koni dokusu', cozum: ['e2', 'kod'], e2: 'koni-doku.jpg: ateş, buz, yıldırım, yeşil (zehir/asit), ışık', kaynak: 'psişik/nekrotik/gökkuşağı: ışık satırı + hue-rotate' },
  'patlama-ek': { ad: 'Eksik patlama renkleri (soğuk, asit, zehir, toprak, rüzgâr, doğa)', cozum: ['e2'], e2: 'patlama-ek.jpg: buz, zehir bulutu, asit sıçrama, su, toprak/kaya, rüzgâr girdabı, bitki' },
  'gokten': { ad: 'Gökten düşen (yıldırım, meteor, ışık sütunu)', cozum: ['e2'], e2: 'gokten-dusen.jpg: yıldırım çarpması, meteor, yıldız kayması, ışık sütunu' },
  'tek-hedef': { ad: 'Tek hedef büyü darbesi (save’li, saldırısız)', cozum: ['kod'], kaynak: 'alan-* satırı hedef jetonunda küçük ölçekle (hasar türü → alan tablosu); türsüz/eksik renkte patlama-ek' },
  'dokunus': { ad: 'Dokunuş büyüsü darbesi (renkli darbe)', cozum: ['kod'], kaynak: 'darbe-buyu + hasar türüne göre hue-rotate (efekt-baglama `darbe` tablosuna tür satırları)' },
  'zemin-kutu': { ad: 'Zemin kutuları (kalıcı büyü alanı dokusu)', cozum: ['e2', 'gemini'], e2: 'zemin-kutulari.jpg: lav/kor, spor bulutu, diken/sarmaşık, mor girdap, buz rün halkası, duman halkası, bitki, kara halka' },
  'duman-kafes': { ad: 'Duman, közlü duman, ağ, kafes', cozum: ['e2'], e2: 'duman-ag-kafes.jpg: duman, közlü duman, ağ, kafes' },
  'duvar-ek': { ad: 'Eksik duvar türleri', cozum: ['gemini'] },
  'aura-bagla': { ad: 'Aura bağlama (mevcut aura şeritleri, eksik bağ)', cozum: ['kod'], kaynak: 'aura-altin/kirmizi/buz; konsantrasyon yayılımı ve süren etki aurası groundFx’e' },
  'donusum': { ad: 'Dönüşüm flaşı ve büyüme halkası', cozum: ['e2'], e2: 'donusum-kanat.jpg: dönüşüm flaşı, büyüme halkası' },
  'kanat': { ad: 'Kanat / havalanma', cozum: ['e2'], e2: 'donusum-kanat.jpg: şeytan/ejder, melek, ateş, gölge kanatları' },
  'isaret-bag': { ad: 'İşaret simgesi ve bağ çizgisi', cozum: ['e2', 'kod'], e2: 'isaret-simgeleri.jpg (macenta, ikon): nişan, lanet, terazi, rün, pentagram, kum saati, meydan okuma, çapraz kılıç, pençe, yıldız, kırık yıldız, haç, d20, kristal, rünlü kalkan, zincir', kaynak: 'bağ çizgisi SVG (kod)' },
  'ikon-ok': { ad: 'Güçlendirme/zayıflatma oku (sayı oku ikonları)', cozum: ['e2', 'kod'], e2: 'sayi-oklari.jpg (macenta, ikon): avantaj/dezavantaj, AC±, hız±, hasar±, direnç, kutsal kalkan, geçici HP, yenilenme, zar±, kanat, yıldırımlı ok', kaynak: 'rozet sistemine (efekt-baglama `rozet`) etki alanı → ikon' },
  'iptal': { ad: 'İptal / yansıtma / emme / büyü çemberi', cozum: ['e2'], e2: 'buyu-yardimci.jpg: iptal (mühür kırılması), kalkan küre/yansıtma, emme akışı, rün çemberi' },
  'zaman': { ad: 'Zaman küresi', cozum: ['e2'], e2: 'zaman.jpg: zaman küresi, girdap küre, saat kadranı, kum saati' },
  'silah': { ad: 'Silah parıltısı (smite, büyülü silah)', cozum: ['e2', 'kod'], e2: 'silah-parilti.jpg: kılıç parıltısı, parıltı halkası, kıvılcım, enerji küre (beyaz; renk hue)', kaynak: 'darbe-* üstüne hasar türü rengi' },
  'cagir-ruhani-silah': { ad: 'Ruhani silah / güç eli çağrısı', cozum: ['e2'], e2: 'mermi.jpg: hançer, balta (dönen ruhani silah)' },
  'diriltme': { ad: 'Diriltme / durum temizleme', cozum: ['kod'], kaynak: 'iyilestir-buyuk (life_restored), iyilestir-kucuk (durum kaldırma) bağlaması' },
  'tepki-koruma': { ad: 'Tepki parıltısı (Shield, Feather Fall, paket tepkileri)', cozum: ['kod'], kaynak: 'koruma-kalkan (Shield işareti), koruma-ruh (Feather Fall düşüşü)' },
  'durum-ek': { ad: 'Öldürme sözü (tek seferlik)', cozum: ['gemini'] },
  'alan-turu': { ad: 'Hasarsız alan büyüsüne alan patlaması', cozum: ['kod'], kaynak: 'alan-psisik / alan-isik / moral-huzur: büyünün okulundan ya da etiketinden renk (efekt-baglama `alan` yanına `alanBuyu` tablosu)' },
  'goz': { ad: 'Görme büyüsü göz parıltısı', cozum: ['kod'], kaynak: 'goz-nabiz (Moral satırı) jetonda tek seferlik' },
  'parilti-css': { ad: 'Jeton parıltısı / ana hatları (CSS)', cozum: ['kod'], kaynak: 'CSS drop-shadow renkli kontur (Faerie Fire, kutsama ışığı)' },
  'prizma': { ad: 'Prizma (gökkuşağı) ışını/duvarı', cozum: ['gemini'] },
  'yercekimi': { ad: 'Ters yerçekimi / deprem', cozum: ['gemini'] },
};

/** Zemin/duvar/çağrı alanı büyüsü → karşılayacak hücre (E2 sayfasında varsa `e2`, yoksa Gemini). */
export const ALAN_HUCRE = {
  'entangle': ['e2', 'zemin-kutulari: diken/sarmaşık'], 'spike-growth': ['e2', 'zemin-kutulari: diken/sarmaşık'],
  'plant-growth': ['e2', 'zemin-kutulari: bitki'], 'black-tentacles': ['e2', 'zemin-kutulari: mor girdap'],
  'cloudkill': ['e2', 'zemin-kutulari: spor bulutu'], 'darkness': ['e2', 'zemin-kutulari: kara halka'],
  'incendiary-cloud': ['e2', 'duman-ag-kafes: közlü duman'], 'faithful-hound': ['e2', 'zemin-kutulari: buz rün halkası'],
  'guardian-of-faith': ['e2', 'zemin-kutulari: duman halkası'], 'moonbeam': ['e2', 'gokten-dusen: ışık sütunu'],
  'conjure-celestial': ['e2', 'gokten-dusen: ışık sütunu'], 'storm-of-vengeance': ['e2', 'gokten-dusen: yıldırım çarpması'],
  'insect-plague': ['gemini', 'böcek sürüsü bulutu'], 'sleet-storm': ['gemini', 'sulu sepken / kar fırtınası zemini'],
  'silence': ['gemini', 'sessizlik küresi'], 'daylight': ['gemini', 'gün ışığı küresi'],
  // Kuyruk E4b: taş, diken, bıçak, prizma duvarı ve reverse-gravity hücreleri geldi (efekt-duvar-ek, efekt-bicak, efekt-prizma, efekt-yercekimi).
  'prismatic-spray': ['gemini', 'prizma koni 7 renk'],
  'earthquake': ['gemini', 'deprem yarığı zemin kutusu'],
  'telekinesis': ['gemini', 'ters yerçekimi yükselen toz sütunu'], 'levitate': ['gemini', 'ters yerçekimi yükselen toz sütunu'],
  'power-word-kill': ['gemini', 'ölüm sözü (kafatası rün, tek seferlik)'],
};


/** Büyüye özel tür/aile/not (genel kuralların yetmediği yollar; her biri koddan doğrulandı). */
export const OZEL = {
  'spirit-guardians': { tur: 'aura', aile: 'aura-bagla', not: 'Alan patlaması yalnız ilk dökümde (alan-isik); yayılım konsantrasyonda, groundFx okumuyor.' },
  'spiritual-weapon': { tur: 'çağırma', aile: 'cagir-ruhani-silah', not: 'Saldırı türünde (çağrı jetonu yok); isabette darbe-buyu.' },
  'arcane-sword': { tur: 'çağırma', aile: 'cagir-ruhani-silah', not: 'Saldırı türünde; isabette darbe-buyu.' },
  'flame-blade': { tur: 'silah', aile: 'silah' },
  'true-strike': { tur: 'silah', aile: 'silah', not: 'Silah saldırısı: darbe silahın türünden (hazır darbe), büyü parıltısı yok.' },
  'shillelagh': { tur: 'silah', aile: 'silah' },
  'magic-weapon': { tur: 'silah', aile: 'silah', not: '`buff_added` görsel üretmez.' },
  'divine-favor': { tur: 'silah', aile: 'silah', not: '`buff_added` görsel üretmez.' },
  'shield-of-faith': { tur: 'koruma', aile: 'ikon-ok', not: '`buff_added` (ward) görsel üretmez; koruma-kalkan bağlanabilir (kod).' },
  'protection-from-evil-and-good': { tur: 'koruma', aile: 'ikon-ok', not: '`buff_added` görsel üretmez; koruma-ruh bağlanabilir (kod).' },
  'dispel-evil-and-good': { tur: 'koruma', aile: 'iptal' },
  'conjure-minor-elementals': { tur: 'çağırma', aile: 'aura-bagla', not: 'Kendine güçlendirme (selfBuff); çağrı jetonu yok.' },
  'shield': { tur: 'koruma', aile: 'tepki-koruma', not: 'Tepki: AC işareti (`marks`), effect_added yok.' },
  'feather-fall': { tur: 'koruma', aile: 'tepki-koruma', not: 'Tepki: düşme hasarı iptali; olay görseli yok.' },
  'counterspell': { tur: 'iptal', aile: 'iptal', not: 'Tepki: büyüyü boşa çıkarır (günlük).' },
  'dispel-magic': { tur: 'iptal', aile: 'iptal' },
  'remove-curse': { tur: 'iptal', aile: 'iptal' },
  'antimagic-field': { tur: 'aura', aile: 'iptal', not: 'Kendine etki (antimagic); koruma satırı eşleşmez.' },
  'globe-of-invulnerability': { tur: 'koruma', aile: 'iptal', not: 'Küre: buyu-yardimci kalkan küre satırı.' },
  'resilient-sphere': { tur: 'koruma', aile: 'iptal', not: 'Küre: buyu-yardimci kalkan küre satırı.' },
  'forcecage': { tur: 'durum', aile: 'duman-kafes' },
  'banishment': { tur: 'ışınlanma', aile: 'iptal', not: 'Sürgün: rün çemberi (buyu-yardimci).' },
  'maze': { tur: 'ışınlanma', aile: 'iptal', not: 'Sürgün: rün çemberi (buyu-yardimci).' },
  'etherealness': { tur: 'dönüşüm', aile: 'iptal', not: 'Eterik geçiş: rün çemberi + CSS saydamlık.' },
  'time-stop': { tur: 'durum', aile: 'zaman', not: '`time_stop` olayı fx üretmez.' },
  'haste': { tur: 'koruma', aile: 'zaman', not: 'koruma-kalkan (ac) tek seferlik; hız için zaman girdabı + ikon.' },
  'slow': { tur: 'durum', aile: 'zaman', not: 'Düşmana etki: görsel yok.' },
  'power-word-stun': { tur: 'durum', aile: null, not: 'Stunned döngüsü (durum).' },
  'power-word-kill': { tur: 'durum', aile: 'durum-ek', not: 'Ölüm tozu (olum-toz) hedef ölünce zaten; sözün kendisi görselsiz.' },
  'power-word-heal': { tur: 'iyileştirme', aile: null },
  'mass-heal': { tur: 'iyileştirme', aile: null },
  'divine-word': { tur: 'durum', aile: 'gokten', not: 'Kademeli durumlar (Blinded/Deafened/Stunned) + ölüm; ışık sütunu.' },
  'prismatic-spray': { tur: 'koni', aile: 'prizma', not: 'Özel yol (`prismaticEvents`): alan patlaması yok.' },
  // Kuyruk E4b: prismatic-wall (duvar-prizma) ve reverse-gravity (zemin-ters-yercekimi) bağlandı; ailesi kalmadı.
  'reverse-gravity': { tur: 'küre/alan', aile: null },
  'flesh-to-stone': { tur: 'durum', aile: null, anahtar: 'durum-tas-halka (Petrified halkası)', durum: 'hazır' },
  'earthquake': { tur: 'zemin', aile: 'yercekimi' },
  'wish': { tur: 'yok', aile: null, anahtar: 'kopyalanan büyünün efekti', durum: 'genel' },
  'heat-metal': { tur: 'silah', aile: 'silah', not: 'Otomatik isabet: darbe-buyu + burn şeridi; kızaran metal parıltısı yok.' },
  'magic-missile': { tur: 'mermi', aile: 'mermi', not: 'Otomatik isabet: her dart için darbe-buyu; mermi yok.' },
  'spike-growth': { tur: 'zemin', aile: 'zemin-kutu' },
  'call-lightning': { tur: 'gökten düşen', aile: 'gokten' },
  'sacred-flame': { tur: 'gökten düşen', aile: 'gokten' },
  'flame-strike': { tur: 'gökten düşen', aile: 'gokten' },
  'meteor-swarm': { tur: 'gökten düşen', aile: 'gokten' },
  'storm-of-vengeance': { tur: 'gökten düşen', aile: 'gokten' },
  'moonbeam': { tur: 'zemin', aile: 'gokten', not: 'Taşınan ışık sütunu: zone yer tutucusu.' },
  'sunbeam': { tur: 'ışın', aile: 'cizgi-sekil' },
  'guiding-bolt': { tur: 'mermi', aile: 'gokten', not: 'Yıldız kayması satırı (gokten-dusen).' },
  'ice-knife': { tur: 'mermi', aile: 'patlama-ek', not: 'Mermi isabeti darbe-delme (piercing, hazır darbe); soğuk patlaması cold → alan satırı yok.' },
  'chromatic-orb': { tur: 'mermi', aile: 'mermi' },
  'starry-wisp': { tur: 'mermi', aile: 'mermi' },
  'produce-flame': { tur: 'mermi', aile: 'mermi' },
  'eldritch-blast': { tur: 'ışın', aile: 'isin-tek' },
  'disintegrate': { tur: 'ışın', aile: 'isin-tek' },
  'chain-lightning': { tur: 'ışın', aile: 'isin-tek', not: 'Ek hedefler (`extraTargets`): ışın sıçraması.' },
  'conjure-fey': { tur: 'çağırma', aile: 'cagir-ruhani-silah', not: 'Saldırı türünde (fey jetonu yok); isabette darbe-buyu.' },
  'conjure-celestial': { tur: 'gökten düşen', aile: 'gokten', not: 'Işık sütunu alanı (zone yer tutucusu).' },
  'conjure-woodland-beings': { tur: 'aura', aile: 'aura-bagla', not: 'Yayılım alanı: alan-kuvvet patlaması ilk dökümde.' },
  'faithful-hound': { tur: 'çağırma', aile: 'zemin-kutu', not: 'Görünmez bekçi alanı: zone yer tutucusu.' },
  'guardian-of-faith': { tur: 'çağırma', aile: 'zemin-kutu', not: 'Bekçi alanı: zone yer tutucusu (cagir listesinde ama summoned olayı yok).' },
  'telekinesis': { tur: 'durum', aile: 'yercekimi', not: 'Taşıma: itme-toz değil (yer değiştirme olayı); yükselme toz sütunu.' },
  'gust-of-wind': { tur: 'ışın', aile: 'patlama-ek', not: 'Rüzgâr çizgisi: itme-toz (pushed) hazır; rüzgâr dokusu yok.' },
  'animal-shapes': { tur: 'dönüşüm', aile: 'donusum' },
  'warding-bond': { tur: 'işaret', aile: 'isaret-bag', not: 'koruma-kalkan (ac) tek seferlik; bağ çizgisi yok.' },
  'dominate-beast': { tur: 'işaret', aile: 'isaret-bag', not: 'Charmed döngüsü; taraf değiştirme bağı yok.' },
  'dominate-person': { tur: 'işaret', aile: 'isaret-bag', not: 'Charmed döngüsü; taraf değiştirme bağı yok.' },
  'dominate-monster': { tur: 'işaret', aile: 'isaret-bag', not: 'Charmed döngüsü; taraf değiştirme bağı yok.' },
  'aura-of-life': { tur: 'aura', aile: 'aura-bagla', not: 'Süren etki resist → koruma-ruh tek seferlik; 30 ft aura çizilmez.' },
  'holy-aura': { tur: 'aura', aile: 'aura-bagla', not: 'saveAdv → koruma-kutsama tek seferlik; aura çizilmez.' },
  'fire-shield': { tur: 'aura', aile: 'aura-bagla', not: 'resist → koruma-ruh tek seferlik; alev kalkanı çizilmez.' },
  'pass-without-trace': { tur: 'aura', aile: 'aura-bagla' },
  'dragons-breath': { tur: 'koni', aile: 'koni', not: 'Döküm görselsiz; nefes `area_used` ile (şekilli): koni de patlama (alan-ates) olarak.' },
  'mirror-image': { tur: 'dönüşüm', aile: 'donusum', not: 'Kopya görüntüleri çizilmez.' },
  'blur': { tur: 'dönüşüm', aile: 'donusum', not: 'Bulanıklık CSS filtresi yok.' },
  'blink': { tur: 'ışınlanma', aile: 'iptal', not: 'Eterik sıçrama: rün çemberi + saydamlık.' },
  'light': { tur: 'koruma', aile: null, anahtar: 'isik-katmani (litHexes)', durum: 'hazır' },
  'continual-flame': { tur: 'koruma', aile: null, anahtar: 'isik-katmani (litHexes)', durum: 'hazır' },
  'dancing-lights': { tur: 'zemin', aile: null, anahtar: 'isik-katmani (zone.light)', durum: 'hazır' },
  'daylight': { tur: 'zemin', aile: 'zemin-kutu', not: 'Işık alanı ışık katmanına yazılır; küre dokusu yok.' },
  'darkness': { tur: 'zemin', aile: 'zemin-kutu', not: 'Büyülü karanlık `magicDarkHexes` (karanlık katmanı) + yer tutucu.' },
};

Object.assign(OZEL, {
  'plane-shift': { tur: 'ışınlanma', aile: 'iptal', not: 'Geri çekilme (`retreated`): rün çemberi.' },
  'bestow-curse': { tur: 'işaret', aile: 'isaret-bag', not: 'Lanet: düşmana etki görselsiz; lanet sigili.' },
  'levitate': { tur: 'dönüşüm', aile: 'yercekimi', not: 'Havalanma rozeti (🪽); yükselme toz sütunu.' },
  'antilife-shell': { tur: 'aura', aile: 'iptal', not: 'Yaratığa bağlı alan → aura-altin (varsayılan); kalkan küre daha uygun.' },
  'faerie-fire': { tur: 'küre/alan', aile: 'parilti-css', not: 'Ana hatlar (`outlined`) görselsiz.' },
  'see-invisibility': { tur: 'koruma', aile: 'goz' },
  'true-seeing': { tur: 'koruma', aile: 'goz' },
  'darkvision': { tur: 'koruma', aile: 'goz' },
  'calm-emotions': { tur: 'küre/alan', aile: 'alan-turu', not: 'Özel yol (`calm`): alan patlaması yok; moral-huzur bağlanabilir.' },
  'confusion': { tur: 'küre/alan', aile: 'alan-turu', not: 'Hasarsız alan: patlama yok (alan-psisik bağlanabilir).' },
  'false-life': { tur: 'koruma', aile: 'gecici-can', not: '`tempHpNow` koruma satırında yok.' },
  'phantasmal-force': { tur: 'durum', aile: 'alan-turu', not: 'Yanılsama: alan-psisik hedefte.' },
});

/** Alan şekli → görsel tür. */
const SHAPE_TUR = { cone: 'koni', line: 'ışın', sphere: 'küre/alan', cube: 'küre/alan', cylinder: 'küre/alan', emanation: 'aura', wall: 'duvar' };

/**
 * Bağlam: B (efekt-baglama.json), sprites (efekt-sprites.json `effects`), efektler (sprite-esleme `efektler`),
 * zones (sprite-esleme `zones`), ikonlar (sprite-esleme `efektIkonlari`), have (Set: depoda var olan sprite yolları,
 * `sprites/efekt-x.webp`, `efektler/x.webp`, `sprites/yuzey-x.webp`).
 */
export function makeCtx({ B, sprites, efektler, zones, ikonlar, have, simgeler = {}, dogrulama = null }) {
  // Kuyruk E2: E2 kayıtları `yol` taşır (public/efekt/); dosya yolu kayıttan.
  const fx = (name) => { const r = efektler[`efekt-${name}`]; return r && have.has(r.yol ? `${r.yol}.webp` : `sprites/efekt-${name}.webp`) ? name : null; };
  const simge = (onek, ad) => { const y = simgeler[onek]?.[ad]; return y && have.has(`${y}.webp`) ? `${onek}-${ad}` : null; };
  const floatOf = (dt) => {
    const e = Object.entries(sprites).find(([, v]) => (v.kind ?? 'damage') === 'damage' && (v.damageTypes ?? []).includes(dt));
    return e && have.has(e[1].file) ? e[0] : null;
  };
  const loops = new Map();
  for (const [id, v] of Object.entries(sprites)) if (v.kind === 'status' && v.loop && have.has(v.file)) for (const c of v.conditions ?? []) loops.set(c, id);
  for (const [id, v] of Object.entries(B.jetonDongu ?? {})) if (sprites[id] && have.has(sprites[id].file)) for (const c of v.durumlar) loops.set(c, id);
  const zoneSprites = (key) => {
    const z = zones[key];
    if (!z) return null;
    const names = (z.sprites ?? []).map((s) => (typeof s === 'string' ? s : s.name));
    return names.filter((n) => have.has(`sprites/${n}.webp`)).length ? names[0].replace(/-\d+$/, '') : null;
  };
  return { B, fx, simge, floatOf, loops, zoneSprites, ikonlar, dogrulama };
}

/** Kuyruk E2: büyünün koni nefesi (döküm görselsiz; nefes `area_used` şekilli: koni dokusu hasar türünden). */
const NEFES = ['dragons-breath'];

/**
 * Kuyruk E2 bağlamaları (src/ui/fx/fxPlan.ts ile aynı kurallar; her biri src/ui/fx/fxPlan.e2.test.ts'te olaydan efekte sınanır):
 * `buyu[id]` (yol + sprite/simge; koni yolu yalnız koni alanlı büyüde), `zemin[id]` (kalıcı alan), `auraBuyu[id]`, `cagirRenk[id]`
 * (çağırma), şekilli alan (koni → `koni[tür]`, çizgi → `isin[tür]`), ek patlama türleri (`alanEk`), dokunuş darbesi tonu (`darbeTon`).
 * `rozet`: `rozetBuyu` sayı oku simgesi (yalnız rozet: genel).
 */
export function e2Visual(ctx, s, m) {
  const { B } = ctx;
  const id = s.id;
  const keys = [];
  const f = B.buyu?.[id];
  if (f) {
    const ok = f.yol === 'isaret' ? ctx.simge('isaret', f.simge) : ctx.fx(f.sprite);
    if (ok && (f.yol !== 'koni' || s.area?.shape === 'cone')) keys.push(`${f.yol}:${ok}${f.ek && ctx.fx(f.ek) ? `+${f.ek}` : ''}`);
  }
  const z = B.zemin?.[id];
  if (z && m.zone && ctx.fx(z)) keys.push(`zemin:${z}`);
  const a = B.auraBuyu?.[id];
  if (a && ctx.fx(a.sprite)) keys.push(`aura:${a.sprite}`);
  const c = B.cagirRenk?.[id];
  if (c && m.kind === 'summon' && ctx.fx(c.sprite)) keys.push(`cagir:${c.sprite}+ton`);
  const dt = m.damageType;
  const shape = s.area?.shape;
  if (!keys.length && s.area && (m.kind === 'save' || m.kind === 'sleep') && !m.zone && dt) {
    const k = B.koni?.[dt]?.sprite;
    if (shape === 'cone' && k && ctx.fx(k)) keys.push(`koni:${k}`);
    else if (shape === 'line' && B.isin[dt] && ctx.fx(B.isin[dt])) keys.push(`isin:${B.isin[dt]}`);
    else if (shape !== 'cone' && shape !== 'line' && !B.alan[dt] && B.alanEk?.[dt] && ctx.fx(B.alanEk[dt])) keys.push(`alan:${B.alanEk[dt]}`);
  }
  if (!keys.length && NEFES.includes(id) && ctx.fx(B.koni?.varsayilan?.sprite)) keys.push('koni:koni-<nefes türü>');
  if (!keys.length && (m.kind === 'attack' || m.kind === 'auto') && (s.rangeFt ?? 0) <= 5 && dt && !B.darbe[dt] && B.darbeTon?.[dt] && ctx.fx(B.darbe.varsayilan)) keys.push(`darbe-buyu+ton(${dt})`);
  const r = B.rozetBuyu?.[id];
  // Yalnız gerçek motordan doğrulananlar (data/efekt-e2-dogrulama.json; `npx vite-node scripts/e2-dogrula.ts`).
  const D = ctx.dogrulama;
  const unverified = !!D && keys.length > 0 && !D.efekt?.[id];
  return { keys: unverified ? [] : keys, rozet: r && ctx.simge('ok', r) && (!D || D.rozet?.[id]) ? `rozet:ok-${r}` : null, unverified };
}

/** Koruma satırı (fxPlan `protectionSprite` ile aynı sıra). */
export function korumaOf(B, e) {
  for (const r of B.koruma) {
    const v = e?.[r.alan];
    if (v === undefined || v === null || v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'number' && v <= 0) continue;
    if (r.isaret !== undefined && v?.sign !== r.isaret) continue;
    return r.sprite;
  }
  return null;
}

/** Durum görseli: döngü şeridi (hazır), CSS filtresi (hazır), ikon (genel). */
function condVisuals(ctx, conds) {
  const out = [];
  for (const c of conds) {
    if (ctx.loops.has(c)) out.push({ k: `durum:${ctx.loops.get(c)}`, q: 'hazır', c });
    else if (CSS_CONDITIONS.includes(c)) out.push({ k: `css:${c.toLowerCase()}`, q: 'hazır', c });
    else if (ctx.ikonlar[c.toLowerCase()]) out.push({ k: `ikon:${c.toLowerCase()}`, q: 'genel', c });
  }
  return out;
}

const condsOf = (m) => [...new Set([...(m.conditions ?? []), ...(m.effect?.grants ?? []), ...(m.failEffect?.grants ?? []), ...Object.keys(m.choiceEffects ?? {}),
  ...(m.effect?.charm ? ['Charmed'] : []), ...(m.powerWord === 'stun' ? ['Stunned'] : [])])].filter((c) => /^[A-Z]/.test(c));

/** Hasar türü için eksik alan satırının ailesi. */
const missingAreaFamily = (dt) => (['cold', 'acid', 'poison', 'bludgeoning', 'piercing', 'slashing'].includes(dt) ? 'patlama-ek' : 'tek-hedef');

/**
 * Tek büyünün satırı. `s` oyun kaydı, `m` birleşik mekanik (`mergedOf`), `durum` buyu-durum sınıfı.
 * Döner: { tur, anahtarlar: string[], durum: 'hazır'|'genel'|'eksik'|'savaş dışı', aile, not }.
 */
export function spellVisual(ctx, s, m, durum) {
  const { B } = ctx;
  if (durum === 'savaş dışı') return { tur: 'yok', anahtarlar: [], durum: 'savaş dışı', aile: null, not: 'günlük/kart Game Master notu' };
  const o = OZEL[s.id] ?? {};
  const keys = []; // { k, q } q: hazır | genel
  const notes = [];
  const dt = m.damageType;
  const conds = condsOf(m);
  let tur = null; let aile = null; let primary = null; // primary: ailenin ana görseli var mı (hazır/genel/eksik)
  const addFloat = () => { const f = dt && ctx.floatOf(dt); if (f) keys.push({ k: `hasar:${f}`, q: 'genel' }); };
  const shape = s.area?.shape;

  if (m.kind === 'heal' || m.massHeal || m.powerWord === 'heal') {
    tur = 'iyileştirme';
    keys.push({ k: `${ctx.fx('iyilestir-kucuk') ?? '?'} / ${ctx.fx('iyilestir-buyuk') ?? '?'}`, q: 'hazır' }); primary = 'hazır';
  } else if (m.kind === 'revive' || m.kind === 'cure') {
    tur = 'iyileştirme'; aile = 'diriltme'; primary = 'eksik'; notes.push('`life_restored`/durum kaldırma fx üretmez');
  } else if (m.kind === 'teleport') {
    tur = 'ışınlanma'; keys.push({ k: `${ctx.fx(B.isinlan.cikis)} → ${ctx.fx(B.isinlan.giris)}`, q: 'hazır' }); primary = 'hazır';
  } else if (m.kind === 'summon') {
    tur = 'çağırma';
    const C = B.cagir;
    const name = C.ruhBuyuler.includes(s.id) ? C.ruh : C.dogalBuyuler.includes(s.id) ? C.dogal : null;
    if (m.zone && s.id === 'flaming-sphere') { keys.push({ k: ctx.fx(C.ruh), q: 'genel' }); primary = 'genel'; aile = 'cagir-renk'; notes.push('dokunulamaz çağrı → cagir-ruh (ateş küresi için yanlış renk); küre jetonu yok'); } else if (name) { keys.push({ k: ctx.fx(name), q: 'hazır' }); primary = 'hazır'; } else { keys.push({ k: ctx.fx(C.varsayilan), q: 'genel' }); primary = 'genel'; aile = 'cagir-renk'; notes.push('varsayılan portal (cagir-portal)'); }
    if (m.zone) notes.push('eşlik eden alan: renkli yer tutucu');
  } else if (m.zone) {
    const key = `spells:${s.id}`;
    const D = B.duvar;
    const zs = ctx.zoneSprites(key);
    const anchored = !!(m.zone.anchorSelf || shape === 'emanation');
    tur = shape === 'wall' || m.zone.wall || m.zone.windWall ? 'duvar' : anchored ? 'aura' : 'zemin';
    if (D[s.id] && ctx.fx(D[s.id])) { keys.push({ k: ctx.fx(D[s.id]), q: 'hazır' }); primary = 'hazır'; } else if (zs) { keys.push({ k: `zemin:${zs}`, q: 'hazır' }); primary = 'hazır'; } else if (anchored) {
      const a = (dt && B.aura[dt]) || B.aura.varsayilan; keys.push({ k: ctx.fx(a), q: B.aura[dt] ? 'hazır' : 'genel' }); primary = B.aura[dt] ? 'hazır' : 'genel'; if (!B.aura[dt]) notes.push('aura varsayılan renk (aura-altin)');
    } else { keys.push({ k: 'yer-tutucu:.spell-zone', q: 'genel' }); primary = 'genel'; aile = tur === 'duvar' ? 'duvar-ek' : 'zemin-kutu'; notes.push('renkli altıgen yer tutucusu (spec.color/icon)'); }
    addFloat();
  } else if (s.area && (m.kind === 'save' || m.kind === 'sleep')) {
    tur = SHAPE_TUR[shape] ?? 'küre/alan';
    const a = dt && B.alan[dt] ? ctx.fx(B.alan[dt]) : null;
    if (a) {
      if (shape === 'cone') { keys.push({ k: a, q: 'genel' }); primary = 'genel'; aile = 'koni'; notes.push('koni şekilsiz `spell_cast.area` → patlama olarak çizilir'); } else if (shape === 'line') { keys.push({ k: a, q: 'genel' }); primary = 'genel'; aile = 'cizgi-sekil'; notes.push(`çizgi şekilsiz → patlama; ${B.isin[dt] ? `${B.isin[dt]} var ama seçilmiyor` : 'bu türde ışın şeridi yok'}`); } else { keys.push({ k: a, q: 'hazır' }); primary = 'hazır'; }
    } else {
      primary = 'eksik';
      aile = shape === 'cone' ? 'koni' : shape === 'line' ? 'cizgi-sekil' : missingAreaFamily(dt);
      if (dt) notes.push(`alan satırı yok (${dt})`);
    }
    addFloat();
  } else if (m.kind === 'attack' || m.kind === 'auto') {
    const touch = (s.rangeFt ?? 0) <= 5;
    tur = touch ? 'dokunuş' : /^ray-|scorching-ray/.test(s.id) ? 'ışın' : 'mermi';
    const d = B.darbe[dt];
    keys.push({ k: d ?? B.darbe.varsayilan, q: d ? 'hazır' : 'genel' }); primary = d ? 'hazır' : 'genel';
    if (!d) notes.push('varsayılan darbe (darbe-buyu)');
    aile = touch ? 'dokunus' : tur === 'ışın' ? 'isin-tek' : 'mermi';
    addFloat();
  } else if (m.kind === 'smite') {
    tur = 'silah'; keys.push({ k: 'darbe-<silah türü>', q: 'genel' }); primary = 'genel'; aile = 'silah'; addFloat(); notes.push('isabet darbesi silahtan; smite parıltısı yok');
  } else if (m.kind === 'mark') {
    tur = 'işaret'; primary = 'eksik'; aile = 'isaret-bag'; notes.push('işaret görselsiz (yalnız günlük)');
  } else if (m.kind === 'dispel') {
    tur = 'iptal'; primary = 'eksik'; aile = 'iptal';
  } else if (m.kind === 'buff') {
    tur = 'koruma'; primary = 'eksik'; aile = 'ikon-ok'; notes.push('`buff_added` görsel üretmez');
  } else if (m.kind === 'save') {
    tur = conds.length && !m.damage ? 'durum' : 'tek hedef';
    if (m.damage) {
      const f = dt && ctx.floatOf(dt);
      if (f) { keys.push({ k: `hasar:${f}`, q: 'genel' }); primary = 'genel'; } else primary = 'eksik';
      aile = missingAreaFamily(dt);
    }
  } else if (m.kind === 'effect') {
    const e = m.effect ?? {};
    const ally = e.side === 'ally' || e.self;
    tur = e.polymorph || ['enlarge-reduce', 'alter-self'].includes(s.id) ? 'dönüşüm' : e.fly || e.airborne ? 'dönüşüm' : ally ? 'koruma' : conds.length || e.side === 'enemy' ? 'durum' : 'koruma';
    const k = (ally || e.side === 'any') ? korumaOf(B, e) : null;
    if (k && ctx.fx(k)) { keys.push({ k, q: 'hazır' }); primary = 'hazır'; }
    if (e.polymorph) { keys.push({ k: 'jeton:biçimin canavar jetonu', q: 'genel' }); primary = 'genel'; aile = 'donusum'; notes.push('`shape_changed` jetonu değiştirir; geçiş flaşı yok'); }
    if ((e.fly || e.airborne) && !e.polymorph) { keys.push({ k: 'rozet:🪽', q: 'genel' }); primary = primary ?? 'genel'; aile = 'kanat'; }
    if (['enlarge-reduce', 'alter-self'].includes(s.id)) { primary = primary ?? 'eksik'; aile = 'donusum'; notes.push('boyut değişimi: jeton ölçeği yalnız görsel tablodan'); }
    if (!primary && !conds.length) { primary = 'eksik'; aile = 'ikon-ok'; notes.push(ally ? 'koruma satırı eşleşmiyor' : 'düşmana süren etki görsel üretmez'); }
  } else if (m.kind === 'utility') {
    tur = 'yok'; primary = 'eksik';
  }
  // İtme (Thunderwave, Gust of Wind): `pushed` → itme-toz.
  if (m.pushFt && ctx.fx(B.itme)) { keys.push({ k: B.itme, q: 'genel' }); if (!primary || primary === 'eksik') primary = 'genel'; }
  // Durum görselleri (hasarsız durum büyüsünde ana görsel).
  const cv = condVisuals(ctx, conds);
  keys.push(...cv);
  if (!primary || primary === 'eksik') {
    if (cv.some((x) => x.q === 'hazır') && (!m.damage || tur === 'durum')) primary = 'hazır';
    else if (cv.length) primary = 'genel';
  }
  if (cv.length && cv.every((x) => x.q === 'genel') && !aile && primary !== 'hazır') aile = 'durum-ek';
  if ((shape === 'cone' || shape === 'line') && !keys.some((x) => /^alan-|^isin-/.test(x.k))) { aile = shape === 'cone' ? 'koni' : 'cizgi-sekil'; if (primary === 'hazır') primary = 'genel'; notes.push(shape === 'cone' ? 'koni dokusu yok' : 'çizgi dokusu yok'); }
  if (o.tur) tur = o.tur;
  if (o.not || o.durum) for (let i = notes.length - 1; i >= 0; i--) if (/eşleşmiyor|görsel üretmez$|varsayılan darbe/.test(notes[i])) notes.splice(i, 1);
  if (o.not) notes.push(o.not);
  if (o.anahtar) keys.push({ k: o.anahtar, q: o.durum ?? 'hazır' });
  if (o.durum) primary = o.durum;
  // OZEL ailesi: büyünün asıl görseli (mermi, aura, sütun…) yok demektir; ana görsel hazır sayılsa bile genel.
  if (o.aile) { aile = o.aile; if (primary === 'hazır' && !o.durum) primary = 'genel'; }
  if (o.aile === null) aile = null;
  // Kuyruk E2: bağlı büyü ailesinin görseli artık var (hazır); yalnız rozet alan genel kalır, ikon-ok ailesi karşılanmış sayılır.
  const x = e2Visual(ctx, s, m);
  let note = notes.join('; ');
  if (x.keys.length) { keys.push(...x.keys.map((k) => ({ k, q: 'hazır' }))); primary = 'hazır'; note = `E2: ${x.keys.join(', ')}`; }
  if (x.unverified) note = `${note ? `${note}; ` : ''}E2 bağlaması doğrulanmadı`;
  if (x.rozet) { keys.push({ k: x.rozet, q: 'genel' }); if (primary !== 'hazır') { primary = 'genel'; if (aile === 'ikon-ok') aile = null; note = note.replace(/koruma satırı eşleşmiyor|düşmana süren etki görsel üretmez/, `E2 rozet: ${x.rozet.slice(6)}`); } }
  const d = primary ?? 'eksik';
  return { tur, anahtarlar: [...new Set(keys.map((x) => x.k).filter(Boolean))], durum: d, aile: d === 'hazır' ? null : aile, not: note, e2: x.keys.length > 0 };
}

// ───────────────────────────── B) Alt sınıf özellikleri ─────────────────────────────

/** Ek aileler (yalnız alt sınıf özelliklerinde). */
Object.assign(AILELER, {
  'gecici-can': { ad: 'Geçici HP kazanımı', cozum: ['kod'], kaynak: '`temp_hp` olayına koruma-kutsama (bugün yalnız etkideki `tempHp` alanı bağlı)' },
  'cagir-renk': { ad: 'Paket çağrısının renkli portalı', cozum: ['kod'], kaynak: 'cagir-portal + paket `ton`/`halka` (hue-rotate)' },
});

/**
 * Görsel ilkel → bugünkü görsel. durum: hazır | genel | eksik | gerekmez (pasif sayı/beceri/kaynak: günlük ve kart yeter).
 * Olay yolları: paket `src/battle/paket/index.ts` (healed, temp_hp, effect_added, moral_changed, zone_created, `forcedMove` →
 * pushed, `teleportEvent` → teleported, `summonEvents` → summoned), imza `src/battle/imza*.ts` (healed, temp_hp, effect_added,
 * moral_changed, save_resolved; aura `auraCore.ts` etki `auras` → groundFx aura).
 */
export const ILKEL_GORSEL = {
  ekHasar: { durum: 'genel', aile: 'silah', anahtar: 'darbe-<silah> + hasar şeridi' },
  direnc: { durum: 'gerekmez', aile: null, anahtar: '' },
  aura: { durum: 'genel', aile: 'aura-bagla', anahtar: 'aura-altin (varsayılan; yalnız etkide aura alanı varsa)' },
  tepki: { durum: 'eksik', aile: 'tepki-koruma', anahtar: '' },
  gecicCan: { durum: 'hazır', aile: null, anahtar: 'koruma-kutsama (temp_hp; Kuyruk E2)' },
  iyilestirme: { durum: 'hazır', aile: null, anahtar: 'iyilestir-kucuk/buyuk' },
  hasar: { durum: 'genel', aile: 'tek-hedef', anahtar: 'hasar şeridi (ateş/soğuk/asit/zehir)' },
  hasarAlan: { durum: 'eksik', aile: 'alan-turu', anahtar: '' },
  durumUygula: { durum: 'hazır', aile: null, anahtar: 'durum döngüsü/CSS (durumun türüne göre)' },
  isaret: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  cagir: { durum: 'genel', aile: 'cagir-renk', anahtar: 'cagir-portal (varsayılan)' },
  boyut: { durum: 'eksik', aile: 'donusum', anahtar: '' },
  ucus: { durum: 'genel', aile: 'kanat', anahtar: 'rozet 🪽' },
  isinlan: { durum: 'hazır', aile: null, anahtar: 'isinlan-cikis → isinlan-giris' },
  zorlaHareket: { durum: 'hazır', aile: null, anahtar: 'itme-toz' },
  olumdenDon: { durum: 'eksik', aile: 'diriltme', anahtar: '' },
  ekSaldiri: { durum: 'hazır', aile: null, anahtar: 'darbe-<silah>' },
  zarEtkisi: { durum: 'genel', aile: 'ikon-ok', anahtar: 'koruma-kutsama (yalnız dosta +zar)' },
  kaynak: { durum: 'gerekmez', aile: null, anahtar: '' },
  bicim: { durum: 'genel', aile: 'donusum', anahtar: 'jeton biçime döner (geçiş yok)' },
  yuzeyOlustur: { durum: 'hazır', aile: null, anahtar: 'yuzey-* (8 yüzey türünün hepsi eşlemede)' },
  buyuVer: { durum: 'gerekmez', aile: null, anahtar: 'verilen büyünün efekti' },
  buyuDegisimi: { durum: 'gerekmez', aile: null, anahtar: 'büyünün efekti' },
  gorunmezlik: { durum: 'hazır', aile: null, anahtar: 'css:invisible' },
  moralEtkisi: { durum: 'hazır', aile: null, anahtar: 'moral-yeniyol' },
  zarMuhru: { durum: 'eksik', aile: 'ikon-ok', anahtar: '' },
  engeldenGec: { durum: 'eksik', aile: 'parilti-css', anahtar: '' },
  hiz: { durum: 'eksik', aile: 'ikon-ok', anahtar: '' },
  buyuluVurus: { durum: 'genel', aile: 'silah', anahtar: 'darbe-buyu' },
  zarDegistir: { durum: 'gerekmez', aile: null, anahtar: '' },
  koruma: { durum: 'genel', aile: 'ikon-ok', anahtar: 'koruma-* (etki alanı eşleşirse)' },
  algi: { durum: 'eksik', aile: 'goz', anahtar: '' },
  cagirGuclendir: { durum: 'eksik', aile: 'aura-bagla', anahtar: '' },
  ortakCan: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  yuvaGeriKazan: { durum: 'gerekmez', aile: null, anahtar: '' },
  meydanOkuma: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  saldirmadanSave: { durum: 'genel', aile: 'tek-hedef', anahtar: 'hasar şeridi' },
  kaynakYenile: { durum: 'gerekmez', aile: null, anahtar: '' },
  tepkiHakki: { durum: 'gerekmez', aile: null, anahtar: '' },
  zarYenile: { durum: 'gerekmez', aile: null, anahtar: '' },
  buyuPaylas: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  kontrolEt: { durum: 'genel', aile: 'isaret-bag', anahtar: 'durum:charmed (varsa)' },
  zamanDurdur: { durum: 'eksik', aile: 'zaman', anahtar: '' },
  flurryEk: { durum: 'hazır', aile: null, anahtar: 'darbe-ezme' },
  olumZari: { durum: 'gerekmez', aile: null, anahtar: '' },
  canArtisi: { durum: 'eksik', aile: 'gecici-can', anahtar: '' },
  yetkinlik: { durum: 'gerekmez', aile: null, anahtar: '' },
  ilham: { durum: 'eksik', aile: 'ikon-ok', anahtar: '' },
  buyuSakla: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  gucDeposu: { durum: 'eksik', aile: 'isaret-bag', anahtar: '' },
  zarYarisi: { durum: 'gerekmez', aile: null, anahtar: '' },
  zarHavuzu: { durum: 'eksik', aile: 'ikon-ok', anahtar: '' },
  silahFirlat: { durum: 'eksik', aile: 'cagir-ruhani-silah', anahtar: '' },
  silahBagi: { durum: 'eksik', aile: 'silah', anahtar: '' },
  // Kuyruk P12 (K73c tabanında): vertigo satırı patlama/ışık/ışınlanma mevcut alan ve ışınlanma efektini kullanır; kontrol ilkeli görünümsüz.
  vertigo: { durum: 'genel', aile: null, anahtar: 'alan-kuvvet / isinlan (satıra göre)' },
  vertigoKontrol: { durum: 'gerekmez', aile: null, anahtar: '' },
  kritik: { durum: 'hazır', aile: null, anahtar: 'kritik-vurus' },
  duvarCizili: { durum: 'hazır', aile: null, anahtar: 'duvar-cizili' },
  zeminAlan: { durum: 'genel', aile: 'zemin-kutu', anahtar: 'yer-tutucu (.spell-zone)' },
  pasif: { durum: 'gerekmez', aile: null, anahtar: '' },
};

/** Görünümü değiştiren ilkeller (jeton denetimi). */
export const GORUNUM_ILKEL = ['boyut', 'ucus', 'bicim', 'gorunmezlik', 'engeldenGec'];

const ORDER = { eksik: 0, genel: 1, hazır: 2, gerekmez: 3 };

/** İlkel listesinden özellik satırı: en kötü durum (gerekmez sayılmaz), aileler birleşik. */
export function featureVisual(ilkeller) {
  const list = (ilkeller.length ? ilkeller : ['pasif']).map((t) => ({ t, ...(ILKEL_GORSEL[t] ?? { durum: 'eksik', aile: null, anahtar: `bilinmeyen ilkel ${t}` }) }));
  const needs = list.filter((x) => x.durum !== 'gerekmez');
  const durum = needs.length ? needs.reduce((a, b) => (ORDER[b.durum] < ORDER[a.durum] ? b : a)).durum : 'gerekmez';
  const aileler = [...new Set(needs.filter((x) => x.durum !== 'hazır').map((x) => x.aile).filter(Boolean))];
  return { durum, aileler, anahtarlar: [...new Set(list.map((x) => x.anahtar).filter(Boolean))], ilkeller: [...new Set(list.map((x) => x.t))], gorunum: list.some((x) => GORUNUM_ILKEL.includes(x.t)) };
}

/** İmza eylemi/pasifi → görsel ilkeller (veri alanlarından). */
export function imzaIlkeller(eylemler, pasifler) {
  const out = [];
  for (const e of eylemler) {
    if (e.iyilestir) out.push('iyilestirme');
    if (e.tempHp) out.push('gecicCan');
    if (e.moral) out.push('moralEtkisi');
    if (e.itme || e.ozel === 'firlat') out.push('zorlaHareket');
    if (e.ozel === 'duvar') out.push('duvarCizili');
    if (e.ozel === 'zemin') out.push('zeminAlan');
    if (e.ozel === 'isaret' || e.ozel === 'plan') out.push('isaret');
    if (e.ozel === 'havuz' || e.bag) out.push('ortakCan');
    if (e.ozel === 'buyruk') out.push('ekSaldiri');
    if (e.ozel === 'buyrukYer' || e.ozel === 'yolAdimi') out.push('isinlan');
    if (e.ozel === 'zihin') out.push('zorlaHareket');
    if (e.ozel === 'zihinNesne') out.push('zorlaHareket');
    if (e.hasar) out.push(e.yaricapFt ? 'hasarAlan' : 'hasar');
    const et = e.etki;
    if (et) {
      if (et.grants?.length) out.push('durumUygula');
      else if (/ally|allies|self/i.test(e.hedef) && (et.dice?.sign === 1 || et.resist || et.ac || et.tempHp || et.saveAdv)) out.push('zarEtkisi');
      else if (/enemy|Enemies/i.test(e.hedef)) out.push('isaret');
      else out.push('koruma');
    }
  }
  for (const p of pasifler) {
    const et = p.etki ?? {};
    if (et.aura || et.auras) out.push('aura');
    else if (et.deathWard) out.push('olumdenDon');
    else if (et.speedFt) out.push('hiz');
    else out.push('pasif');
  }
  return out;
}

/** SRD çekirdek alt sınıf özelliği → ilkeller (`effect` verisinden; olay yolu fxPlan ile aynı). */
export function srdIlkeller(f) {
  const e = f.effect ?? {};
  if (e.stat === 'critOn') return ['kritik'];
  if (e.reaction) return ['tepki'];
  const k = e.effect?.kind;
  if (k === 'landsAid') return ['hasarAlan', 'iyilestirme'];
  if (k === 'sanctuary') return ['zeminAlan'];
  return ['pasif'];
}

/** Karadul Çemberi (ev kuralı) özellikleri: src/battle/karadul.ts yolları. */
export const KARADUL_ILKEL = {
  'bewitching-gaze': ['durumUygula'], 'spider-shape': ['bicim'], 'widow-venom': ['ekHasar'],
  'sweet-snare': ['durumUygula'], 'web-sense': ['algi'], 'final-kiss': ['hasar'],
};
