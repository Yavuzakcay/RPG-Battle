/**
 * Kuyruk E3: büyü × efekt tablosu (harita/belgeler/BUYU-EFEKT-TABLOSU.md) ve alt sınıf özelliği × görsel tablosu
 * (harita/belgeler/ALT-SINIF-GORSEL-TABLOSU.md). Salt okuma: oyun koduna, veriye, görsele dokunmaz; yalnız iki belgeyi yazar.
 * Kullanım: `npm run efekt-tablosu` (ek paket klasörü varsayılan `icerik/`; başka klasör: `npm run efekt-tablosu -- <klasör>`).
 * Ek paket yoksa (bulut kopyası) kurgusal fikstürler (`tests/fixtures/paket-*.json`) kullanılır. Paket metni (açıklama) yazılmaz.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { durumRows, mergedOf } from './lib/buyu-durum.mjs';
import {
  AILELER, ALAN_HUCRE, DURUMLAR, ILKEL_GORSEL, KARADUL_ILKEL, OZEL, SEVIYE_GRUPLARI, SINIFLAR,
  featureVisual, imzaIlkeller, makeCtx, spellVisual, srdIlkeller,
} from './lib/buyu-efekt.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const ls = (d) => (fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)) : []);

// ── Girdiler ──
const B = read('data/efekt-baglama.json');
const E = read('data/sprite-esleme.json');
const SPR = read('data/efekt-sprites.json').effects;
const have = new Set([...ls('public/sprites').map((f) => `sprites/${f}`), ...ls('public/efektler').map((f) => `efektler/${f}`)]);
const ctx = makeCtx({ B, sprites: SPR, efektler: E.efektler, zones: E.zones, ikonlar: E.efektIkonlari, have });
const srd = read('data/srd/spells.json').spells;
const game = ['data/spells.json', 'data/spells-45.json', 'data/spells-69.json'].flatMap((f) => read(f).map((s) => ({ ...s, file: f.replace('data/', '') })));
const byRef = new Map(game.map((g) => [g.srd, g]));
const kesim = read('data/efekt-kesim.json');
const imported = new Set([...Object.keys(kesim.sayfalar), ...kesim.mevcut]);
const hamSayfalar = ls('assets-ham/efekt').filter((f) => !imported.has(f.replace(/\.[^.]+$/, '')));

// ── A) Büyüler ──
export function spellRows() {
  return durumRows(srd, game).map((r) => {
    const g = byRef.get(`spells:${r.id}`);
    const v = spellVisual(ctx, g, mergedOf(g), r.durum);
    return { ...r, school: g.school ?? '', classes: g.classes ?? [], ...v };
  });
}

const md = (x) => String(x ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (xs) => (xs.length ? xs.map((x) => `\`${x}\``).join(', ') : '—');
const pct = (n, t) => (t ? `${Math.round((100 * n) / t)}%` : '—');

function spellDoc(rows) {
  const out = [];
  const fight = rows.filter((r) => r.durum !== 'savaş dışı');
  const off = rows.filter((r) => r.durum === 'savaş dışı');
  const need = (r) => r.durum !== 'hazır' && r.durum !== 'savaş dışı' && !!r.aile;
  const cnt = (rs) => ({ t: rs.length, off: rs.filter((r) => r.durum === 'savaş dışı').length, h: rs.filter((r) => r.durum === 'hazır').length,
    g: rs.filter((r) => r.durum === 'genel').length, e: rs.filter((r) => r.durum === 'eksik').length, n: rs.filter(need).length });
  out.push('# Büyü × efekt tablosu (Kuyruk E3)', '',
    '`npm run efekt-tablosu` üretir (`scripts/buyu-efekt-tablosu.mjs`, kurallar `scripts/lib/buyu-efekt.mjs`); elle düzenlenmez. Salt okuma denetimi: oyun kodu, veri ve görseller değişmedi. Büyü durumu (savaşta / savaş dışı) `harita/belgeler/BUYU-DURUM.md` ile aynı ölçüt (`scripts/lib/buyu-durum.mjs`).', '',
    '## Yöntem', '',
    '**Hazır** = büyünün asıl görsel ailesi (alan patlaması, iyileştirme, ışınlanma, duvar, zemin, durum döngüsü, koruma, çağırma) için efekt anahtarı kayıt defterinde var (`data/sprite-esleme.json` `efektler`/`zones`, `data/efekt-sprites.json`) **ve** dosyası depoda (`public/sprites/`, `public/efektler/`) **ve** bağlama kodu bu büyü için o anahtarı gerçekten seçiyor (`src/ui/fx/fxPlan.ts`, `src/ui/damageFloats.ts`, `src/ui/statusFx.ts`, `src/ui/sprites.ts`; olay yolu `src/battle/spells.ts`). **Genel** = yalnız varsayılan/yedek görsel (`darbe-buyu`, `cagir-portal`, `aura-altin`, renkli altıgen yer tutucusu `.spell-zone`, koni/çizginin patlama olarak çizilmesi, yalnız hasar türü şeridi ya da durum ikonu, rozet). **Eksik** = günlük ve sayı dışında görsel yok. Hasar sayıları her büyüde çıkar, sayılmaz.', '',
    'Koddan çıkan bağlama kuralları:', '',
    '- Büyü saldırısı ve otomatik isabet (`attack_resolved`): `efekt-baglama.json` `darbe[hasar türü]`, yoksa varsayılan `darbe-buyu`; kritikte `kritik-vurus`. Hedefte hasar türü şeridi yalnız ateş (`burn`), soğuk (`freeze`), asit (`acid`), zehir (`poison`). **Mermi/ışın çizilmez.**',
    '- Alan büyüsü (`executeAreaCast` → `spell_cast.area`): alan[hasar türü] (ateş, yıldırım, ışık, nekrotik, psişik, kuvvet, gök gürültüsü). `spell_cast.area` **şekil taşımaz**: koni ve çizgi de merkezde patlama olarak çizilir (çizgiyi ışın yapan dal yalnız şekilli `area_used`’da: canavar nefesi, Dragonborn). Soğuk, asit, zehir, ezme/delme alanlarında patlama yok.',
    '- Kalıcı alan (`m.zone` → `executeZoneCast`, alan patlaması yok): `sprite-esleme.json` `zones["spells:<id>"]` (Fog Cloud, Web, Grease, Stinking Cloud) ya da `efekt-baglama.json` `duvar` (Wall of Fire/Force/Ice, Wind Wall); kalanı renkli altıgen yer tutucusu. Yaratığa bağlı alan → aura (renk hasar türünden, yoksa `aura-altin`).',
    '- `healed` → `iyilestir-kucuk/buyuk`; `teleported` → `isinlan-cikis/giris`; `summoned` → `cagir-ruh`/`cagir-dogal` (veri listesi, dokunulamaz çağrı ruh), yoksa varsayılan `cagir-portal`; `pushed` → `itme-toz`.',
    '- Süren etki (`effect_added`) yalnız dost/kendine: `koruma` tablosu (ac/acMin → kalkan; wardedFrom/resist/immune → ruh; +zar/tempHp/saveAdv → kutsama). Düşmana etki ve `buff_added` (Shield of Faith, Divine Favor, Magic Weapon) görsel üretmez.',
    '- Durum: döngü şeridi (Paralyzed, Stunned, Incapacitated, Frightened, Charmed, Restrained, Grappled; Poisoned `jetonDongu`), CSS jeton filtresi (Petrified, Blinded, Invisible, Unconscious, Prone, Exhaustion), yoksa yalnız ikon (Deafened).',
    '- Spirit Guardians yayılımı konsantrasyonda tutulur (`concentration.aura`); `groundFx` yalnız etki `aura`/`auras` ve yaratığa bağlı alanları okur: yayılım çizilmez.', '',
    `Kısmi ya da sığmayan notlu büyü: ${rows.filter((r) => r.durum === 'kısmi' || r.sigmayan).length} (K58 sonrası 0; ayrı efekt ihtiyacı yok).`, '');

  // 1. Özet
  out.push('## 1. Özet', '', 'Seviye grubu × sınıf. Bir büyü birden çok sınıfta sayılır; "Tümü" satırı tekil büyü sayısıdır. **Yeni anim.** = genel ya da eksik olup bir eksik animasyon ailesine bağlanan savaş büyüsü.', '');
  out.push('| Seviye | Sınıf | Toplam | Savaş dışı | Hazır | Genel | Eksik | Yeni anim. |', '|---|---|---|---|---|---|---|---|');
  for (const [label, lo, hi] of SEVIYE_GRUPLARI) {
    const g = rows.filter((r) => r.level >= lo && r.level <= hi);
    for (const [k, name] of Object.entries(SINIFLAR)) {
      const c = cnt(g.filter((r) => r.classes.includes(k)));
      if (c.t) out.push(`| ${label} | ${name} | ${c.t} | ${c.off} | ${c.h} | ${c.g} | ${c.e} | ${c.n} |`);
    }
    const c = cnt(g);
    out.push(`| ${label} | **Tümü** | **${c.t}** | ${c.off} | **${c.h}** | **${c.g}** | **${c.e}** | **${c.n}** |`);
  }
  const all = cnt(rows);
  out.push(`| **0–9** | **Tümü** | **${all.t}** | ${all.off} | **${all.h}** | **${all.g}** | **${all.e}** | **${all.n}** |`, '');
  out.push(`Savaşta kullanılan ${fight.length} büyünün ${all.h}'i hazır (${pct(all.h, fight.length)}), ${all.g}'i genel, ${all.e}'i eksik; ${all.n} büyü yeni animasyon (ya da bağlama) bekliyor.`, '');
  const byTur = {};
  for (const r of fight) (byTur[r.tur] ??= { h: 0, g: 0, e: 0 })[r.durum === 'hazır' ? 'h' : r.durum === 'genel' ? 'g' : 'e']++;
  out.push('Türe göre (savaş büyüleri):', '', '| Tür | Hazır | Genel | Eksik |', '|---|---|---|---|');
  for (const [t, v] of Object.entries(byTur).sort((a, b) => (b[1].h + b[1].g + b[1].e) - (a[1].h + a[1].g + a[1].e))) out.push(`| ${t} | ${v.h} | ${v.g} | ${v.e} |`);
  out.push('');

  // 2. Büyü tablosu
  out.push(`## 2. Büyü tablosu (${rows.length})`, '', 'Tür: mermi, ışın, koni, küre/alan, duvar, zemin, aura, çağırma, dönüşüm, işaret, koruma, ışınlanma, durum, yok; ayrıca tek hedef (save’li darbe), dokunuş, silah, iyileştirme, iptal, gökten düşen. Anahtar önekleri: `hasar:` hedefteki hasar türü şeridi (`public/efektler/`), `durum:` döngü şeridi, `css:` jeton filtresi, `ikon:` durum ikonu, `zemin:` yüzey sprite’ı, `yer-tutucu:` renkli altıgen, `rozet:` emoji rozeti; öneksiz olanlar `public/sprites/efekt-<ad>.webp`.', '');
  out.push('| Kimlik | Sv | Okul | Tür | Efekt anahtarları | Kalite notu | Durum | Eksik aile |', '|---|---|---|---|---|---|---|---|');
  for (const r of rows) out.push(`| ${r.id} | ${r.level} | ${md(r.school)} | ${md(r.tur)} | ${code(r.anahtarlar)} | ${md(r.not)} | ${r.durum} | ${r.aile ? AILELER[r.aile].ad : '—'} |`);
  out.push('');

  // 3. Eksik animasyon aileleri
  const fams = {};
  for (const r of fight) if (need(r)) (fams[r.aile] ??= []).push(r.id);
  out.push('## 3. Eksik animasyon aileleri', '', 'Çözüm: **kod** mevcut sprite + bağlama/CSS/hue; **E2** depoda olup içe aktarılmamış ham sayfa (`assets-ham/efekt/`, aşağıdaki tablo; içe aktarma ve bağlama CC işi); **Gemini** yeni sayfa (4. bölüm).', '');
  out.push('| Aile | Büyü | Çözüm | Mevcut kaynak / E2 satırları | Büyüler |', '|---|---|---|---|---|');
  for (const [k, ids] of Object.entries(fams).sort((a, b) => b[1].length - a[1].length)) {
    const f = AILELER[k];
    const gem = ids.filter((id) => ALAN_HUCRE[id]?.[0] === 'gemini');
    const coz = [...new Set([...f.cozum.filter((c) => c !== 'gemini' || gem.length), ...(gem.length ? ['gemini'] : [])])].map((c) => (c === 'e2' ? 'E2' : c === 'gemini' ? 'Gemini' : 'kod')).join(' + ');
    out.push(`| ${f.ad} (\`${k}\`) | ${ids.length} | ${coz} | ${md([f.kaynak, f.e2].filter(Boolean).join(' · '))} | ${ids.join(', ')} |`);
  }
  out.push('');
  out.push('### İçe aktarılmamış E2 ham sayfaları', '', `\`assets-ham/efekt/\` içinde \`data/efekt-kesim.json\`’da kaydı olmayan ${hamSayfalar.length} sayfa (Gemini’den gelmiş, \`npm run sprite-ice -- --efekt\` ile içe aktarılmamış). Satırlar görsel incelemeyle; hepsi siyah zeminli (ikon sayfaları macenta zeminli). Bu sayfalar efekt sayılmadı (hazır değil).`, '');
  const E2 = {
    'mermi.jpg': '6×6: ok, küre mermi, ruhani hançer, kıvılcım mermi, iğne/dart, ruhani balta (beyaz)',
    'koni-doku.jpg': '5×4 (gri ızgara): ateş, buz/kar, yıldırım, yeşil (zehir/asit), ışık koni dokusu',
    'gokten-dusen.jpg': '4×8: yıldırım çarpması, meteor, yıldız kayması, ışık sütunu',
    'patlama-ek.jpg': '7×10: buz, zehir bulutu, asit sıçrama, su sıçrama, toprak/kaya, rüzgâr girdabı, bitki patlaması',
    'zemin-kutulari.jpg': '8×4: lav/kor, spor bulutu, diken/sarmaşık, mor girdap, buz rün halkası, duman halkası, bitki, kara halka',
    'duman-ag-kafes.jpg': '4×4: duman, közlü duman, ağ, kafes',
    'donusum-kanat.jpg': '6×8: dönüşüm flaşı, büyüme halkası, kanatlar (şeytan/ejder kırmızı, melek, ateş, gölge mor)',
    'buyu-yardimci.jpg': '4×8: iptal (mühür kırılması), kalkan küre/yansıtma, emme akışı, rün çemberi (beyaz)',
    'silah-parilti.jpg': '4×6: kılıç parıltısı, parıltı halkası, kıvılcım, enerji küre (beyaz)',
    'zaman.jpg': '4×8: zaman küresi (dişli), girdap küre, saat kadranı halkası, kum saati',
    'isaret-simgeleri.jpg': '4×4 ikon (macenta): nişan, lanet, terazi, rün, pentagram, kum saati, meydan okuma, çapraz kılıç, pençe, yıldız, kırık yıldız, haç, d20, kristal, rünlü kalkan, zincir',
    'sayi-oklari.jpg': '4×4 ikon (macenta): avantaj/dezavantaj d20, AC±, hız±, hasar±, direnç, kutsal kalkan, geçici HP, yenilenme, zar±, kanat, yıldırımlı ok',
  };
  out.push('| Sayfa | Satırlar | Karşıladığı aileler |', '|---|---|---|');
  for (const f of hamSayfalar) {
    const used = Object.entries(AILELER).filter(([, a]) => (a.e2 ?? '').startsWith(f.replace(/\.jpg$/, ''))).map(([k]) => `\`${k}\``);
    out.push(`| ${f} | ${E2[f] ?? '(incelenmedi)'} | ${used.join(', ') || '—'} |`);
  }
  out.push('');

  // 4. Gemini
  const gemini = {};
  for (const r of fight) if (need(r) && ALAN_HUCRE[r.id]?.[0] === 'gemini') (gemini[r.aile] ??= new Map()).set(ALAN_HUCRE[r.id][1], [...((gemini[r.aile]?.get(ALAN_HUCRE[r.id][1])) ?? []), r.id]);
  out.push('## 4. Önerilen Gemini sayfaları', '', 'Yalnız E2 sayfalarında ve mevcut efektlerde karşılığı olmayan ihtiyaçlar. Aynı hücre birden çok büyüyü karşılıyorsa bir kez sayılır. Biçim mevcut sayfalarla aynı: siyah zemin, satır başına bir animasyon, 8 kare (duvar parçaları yatay şerit, `duvar-parcalar` gibi).', '');
  out.push('| Sayfa adı | Hücre | Hücreler (büyüler) |', '|---|---|---|');
  let gCells = 0;
  for (const [k, m] of Object.entries(gemini)) {
    gCells += m.size;
    out.push(`| efekt-${k} | ${m.size} | ${[...m.entries()].map(([h, ids]) => `${h} (${ids.join(', ')})`).join('; ')} |`);
  }
  out.push('', `Toplam ${Object.keys(gemini).length} Gemini sayfası, ${gCells} hücre.`, '');

  // 5. Kod
  const kod = [
    ['Çizgi alanı ışın olarak', '`spell_cast.area`’ya `shape` (ve `aim`) ekle; fxPlan `area()` çizgide zaten `isin-*` seçer (Lightning Bolt, Sunbeam, Gust of Wind). Motor olayına yalnız görsel alan (replay etkilenmez).', fams['cizgi-sekil']],
    ['Tek hedef ışınları', 'Ray/Eldritch Blast/Disintegrate/Chain Lightning: `attack_resolved` ve tek hedefli `save_resolved` büyüsünde büyücüden hedefe `isin-*` (nekrotik/zehir/kuvvet için `isin-isik` + hue-rotate).', fams['isin-tek']],
    ['Tek hedef büyü darbesi', 'Save’li tek hedef hasarında (`save_resolved` + `damageType`) hedefte küçük ölçekli `alan-*` (Vicious Mockery, Mind Spike, Blight, Harm…).', fams['tek-hedef']],
    ['Dokunuş darbesi rengi', '`darbe-buyu` + hasar türüne göre CSS hue-rotate (efekt-baglama `darbe` tablosuna tür satırı).', fams['dokunus']],
    ['Hasarsız alan büyüsüne patlama', 'Confusion, Calm Emotions, Phantasmal Force: okul/etiketten `alan-psisik`/`moral-huzur`.', fams['alan-turu']],
    ['Aura bağlama', '`concentration.aura` (Spirit Guardians) ve kendine süren etkideki aura (Aura of Life, Holy Aura, Fire Shield, Pass without Trace, Conjure Woodland Beings, Conjure Minor Elementals) groundFx’e; renk hasar türünden.', fams['aura-bagla']],
    ['Diriltme ve durum temizleme', '`life_restored` → `iyilestir-buyuk`; durum kaldıran `condition_changed present:false` (Lesser/Greater Restoration) → `iyilestir-kucuk`.', fams['diriltme']],
    ['Tepki korumaları', 'Shield işareti (`marks` shield) → `koruma-kalkan`; Feather Fall → `koruma-ruh`.', fams['tepki-koruma']],
    ['`buff_added` ve geçici HP', '`buff_added` (ward ac → kalkan, Protection from Evil and Good → ruh) ve `temp_hp`/`tempHpNow` → `koruma-kutsama`.', [...(fams['gecici-can'] ?? []), 'shield-of-faith', 'protection-from-evil-and-good']],
    ['Görme göz parıltısı', 'See Invisibility, True Seeing, Darkvision: `goz-nabiz` jetonda tek seferlik.', fams['goz']],
    ['Jeton parıltısı (CSS)', 'Faerie Fire `outlined` → renkli drop-shadow kontur.', fams['parilti-css']],
    ['Çağırma renk portalı', 'Varsayılan `cagir-portal` yerine çağrının türüne (ejderha, element, nesne, el) hue; dokunulamaz Flaming Sphere için ruh yerine ateş tonu.', [...(fams['cagir-renk'] ?? []), 'flaming-sphere']],
    ['İkon/ok rozetleri', 'Süren etki alanı → `sayi-oklari` ikonu (E2 içe aktarıldıktan sonra): rozet önceliği `efekt-baglama.json` `rozet`.', fams['ikon-ok']],
    ['E2 sayfalarının içe aktarılması', `\`data/efekt-kesim.json\`’a ${hamSayfalar.length} sayfa kaydı (satır/sütun, kesim, tür, boyut) + \`npm run sprite-ice -- --efekt\`; ardından ailelere bağlama (mermi, koni, gökten düşen, patlama-ek, zemin kutuları, duman/kafes, dönüşüm/kanat, iptal, zaman, silah, işaret/ikon).`, hamSayfalar],
  ].filter(([, , ids]) => ids && ids.length);
  out.push('## 5. Kodla çözülecekler (CC işi)', '', `${kod.length} madde. Hepsi yalnız görsel (fxPlan / efekt-baglama / CSS); kural, sayı ve kural sürümü değişmez.`, '');
  kod.forEach(([t, d, ids], i) => out.push(`${i + 1}. **${t}** — ${d} (${ids.length}: ${ids.join(', ')})`));
  out.push('');

  // 6. Savaş dışı
  out.push(`## 6. Savaş dışı büyüler (${off.length})`, '', 'Efekt gerekmez: kartta "savaş dışı", günlükte Game Master notu (`spell_cast` notu) yeter.', '');
  for (const [label, lo, hi] of SEVIYE_GRUPLARI) {
    const ids = off.filter((r) => r.level >= lo && r.level <= hi).map((r) => r.id);
    out.push(`- **${label}** (${ids.length}): ${ids.join(', ')}`);
  }
  out.push('');
  return { text: out.join('\n'), stats: { ...all, fight: fight.length, aileler: fams, gemini: Object.keys(gemini).length, geminiHucre: gCells, kod: kod.length, e2: hamSayfalar.length } };
}

// ── B) Alt sınıf özellikleri ──
export function featureRows(paketDir) {
  const rows = [];
  const subs = read('data/subclasses.json').subclasses;
  const hidden = new Set(read('data/alt-sinif-gorunum.json').kaldirilan.map((x) => x.id));
  for (const s of subs) if (!hidden.has(s.id)) for (const f of s.features) {
    rows.push({ kaynak: 'SRD çekirdek', cls: s.class, sub: s.id, id: f.id, ad: f.name.tr, level: f.level, ...featureVisual(srdIlkeller(f)) });
  }
  const imza = read('data/imza.json');
  const eyl = Object.values(imza.eylemler);
  for (const s of imza.altSiniflar) for (const f of s.features) {
    const E = eyl.filter((e) => e.sinif === s.id && e.ozellik === f.id);
    const P = imza.pasifler.filter((p) => p.sinif === s.id && p.ozellik === f.id);
    const il = f.status === 'planli' ? [] : imzaIlkeller(E, P);
    rows.push({ kaynak: 'imza', cls: s.class, sub: s.id, id: f.id, ad: f.name.tr, level: f.level, planli: f.status === 'planli', ...featureVisual(il) });
  }
  const kd = read('data/karadul.json').subclass;
  for (const f of kd.features) rows.push({ kaynak: 'imza (Karadul)', cls: kd.class ?? 'druid', sub: kd.id, id: f.id, ad: f.name.tr, level: f.level, ...featureVisual(KARADUL_ILKEL[f.id] ?? []) });
  // Ek paket: yerel klasör, yoksa kurgusal fikstürler.
  const dir = path.join(root, paketDir);
  const local = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  const files = local.length ? local.map((f) => path.join(dir, f)) : fs.readdirSync(path.join(root, 'tests/fixtures')).filter((f) => /^paket-.*\.json$/.test(f)).map((f) => path.join(root, 'tests/fixtures', f));
  const src = local.length ? 'ek paket' : 'kurgusal fikstür';
  for (const file of files) {
    const p = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const s of p.subclasses ?? []) for (const f of s.features ?? []) {
      const il = (f.ilkeller ?? []).map((x) => x.tur);
      const hikaye = f.status === 'hikaye' || f.status === 'planli';
      rows.push({ kaynak: src, dosya: path.basename(file), cls: s.class, sub: s.id, id: f.id, ad: f.name?.tr ?? f.id, level: f.level, planli: hikaye, ...featureVisual(hikaye ? [] : il) });
    }
  }
  return { rows, paketYerel: local.length > 0, paketDosya: files.map((f) => path.basename(f)) };
}

function featureDoc({ rows, paketYerel, paketDosya }) {
  const out = [];
  const groups = ['SRD çekirdek', 'imza', 'imza (Karadul)', paketYerel ? 'ek paket' : 'kurgusal fikstür'];
  const subCount = (rs) => new Set(rs.map((r) => r.sub)).size;
  out.push('# Alt sınıf özelliği × görsel tablosu (Kuyruk E3)', '',
    '`npm run efekt-tablosu` üretir (`scripts/buyu-efekt-tablosu.mjs`, kurallar `scripts/lib/buyu-efekt.mjs` `ILKEL_GORSEL`); elle düzenlenmez. Salt okuma. Paket metni (açıklama) yazılmaz: yalnız kimlik, ad, sınıf/alt sınıf, seviye, ilkel türü, aile ve sayı.', '',
    paketYerel
      ? `Ek paket: yerel klasörden okundu (${paketDosya.length} dosya).`
      : `**Ek paket bu kopyada yok** (\`icerik/\` gitignore). Ek paket satırları yerine kurgusal fikstürler (\`tests/fixtures/paket-*.json\`, ${paketDosya.length} dosya) kullanıldı; ilkel → görsel eşlemesi (2. bölüm) gerçek paket için de aynıdır. Gerçek 97 alt sınıf / 395 özellik için yerelde \`npm run efekt-tablosu\` (ya da \`npm run efekt-tablosu -- <klasör>\`) çalıştırın; belge yeniden üretilir. Beklenen dağılım için \`harita/belgeler/PAKET-DURUM.md\` (yerelde üretilir).`, '',
    '**Durum:** hazır (özel bağlı efekt var), genel (yedek/varsayılan görsel), eksik (görsel yok, gerekir), gerekmez (pasif sayı/beceri/kaynak; günlük ve kart yeter), planlı/hikâye (savaşta etkisi yok). Özelliğin durumu ilkellerinin en kötüsü (gerekmez sayılmaz).', '',
    'Kaynaklar: çekirdek 4 = listede görünen SRD alt sınıfları (Circle of the Land, Champion, Hunter, Thief; diğer 8 SRD alt sınıfı `data/alt-sinif-gorunum.json` `kaldirilan`). İmza: `data/imza.json` (11 alt sınıf; özellik → `eylemler`/`pasifler` alanlarından ilkel) + Karadul Çemberi (`data/karadul.json`, `src/battle/karadul.ts`). Olay yolları: paket `src/battle/paket/index.ts`, imza `src/battle/imza*.ts`, aura `auraCore.ts` (etki `auras` → groundFx).', '');

  // 1. Özet
  out.push('## 1. Özet', '', '| Kaynak | Alt sınıf | Özellik | Hazır | Genel | Eksik | Gerekmez | Planlı/hikâye |', '|---|---|---|---|---|---|---|---|');
  for (const g of groups) {
    const rs = rows.filter((r) => r.kaynak === g);
    const c = (d) => rs.filter((r) => !r.planli && r.durum === d).length;
    out.push(`| ${g} | ${subCount(rs)} | ${rs.length} | ${c('hazır')} | ${c('genel')} | ${c('eksik')} | ${c('gerekmez')} | ${rs.filter((r) => r.planli).length} |`);
  }
  out.push('');
  // Aile özeti
  const fam = {};
  for (const r of rows) if (!r.planli) for (const a of r.aileler) { const x = (fam[a] ??= { f: 0, subs: new Set(), ids: [] }); x.f++; x.subs.add(r.sub); x.ids.push(`${r.sub}/${r.id}`); }
  out.push('### Aile özeti (aynı aile tek satır)', '', '| Aile | Özellik | Alt sınıf | Çözüm | Özellikler (alt sınıf/özellik) |', '|---|---|---|---|---|');
  for (const [k, x] of Object.entries(fam).sort((a, b) => b[1].f - a[1].f)) {
    const f = AILELER[k];
    out.push(`| ${f.ad} (\`${k}\`) | ${x.f} | ${x.subs.size} | ${f.cozum.map((c) => (c === 'e2' ? 'E2' : c === 'gemini' ? 'Gemini' : 'kod')).join(' + ')} | ${x.ids.join(', ')} |`);
  }
  out.push('');

  // 2. İlkel → görsel
  out.push('## 2. İlkel → görsel eşlemesi', '', 'Ek paket ilkelleri (`src/content/ilkelSema.ts`) ve imza/SRD verisinden türetilen sözde ilkeller (`hasarAlan`, `kritik`, `duvarCizili`, `zeminAlan`, `pasif`).', '');
  out.push('| İlkel | Durum | Bugünkü anahtar | Eksik aile |', '|---|---|---|---|');
  for (const [k, v] of Object.entries(ILKEL_GORSEL)) out.push(`| ${k} | ${v.durum} | ${md(v.anahtar) || '—'} | ${v.aile ? `\`${v.aile}\`` : '—'} |`);
  out.push('');

  // 3. Satırlar
  out.push('## 3. Özellik tablosu', '');
  for (const g of groups) {
    const rs = rows.filter((r) => r.kaynak === g);
    if (!rs.length) continue;
    out.push(`### ${g} (${subCount(rs)} alt sınıf, ${rs.length} özellik)`, '', '| Sınıf | Alt sınıf | Özellik | Ad | Sv | İlkeller | Durum | Bugünkü anahtar | Eksik aile |', '|---|---|---|---|---|---|---|---|---|');
    for (const r of rs) out.push(`| ${r.cls} | ${r.sub} | ${r.id} | ${md(r.ad)} | ${r.level} | ${r.planli ? '—' : r.ilkeller.join(', ')} | ${r.planli ? 'planlı/hikâye' : r.durum} | ${r.planli ? '—' : code(r.anahtarlar)} | ${r.planli ? '—' : r.aileler.map((a) => `\`${a}\``).join(', ') || '—'} |`);
    out.push('');
  }

  // 4. Jeton görünümü
  const races = read('data/races.json');
  const raceIds = (Array.isArray(races) ? races : races.races).map((r) => r.id);
  const classes = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
  const tokens = new Set(ls('public/characters'));
  const missing = [];
  for (const r of raceIds) for (const g of ['male', 'female']) for (const c of classes) if (!tokens.has(`${r}-${g}-${c}.webp`)) missing.push(`${r}-${g}-${c}`);
  const look = rows.filter((r) => !r.planli && r.gorunum);
  const spiderForms = Object.values(read('data/karadul.json').orumcek?.bicimler ?? {});
  out.push('## 4. Jeton görünümü', '',
    `Karakter jeton atlası \`public/characters/<ırk>-<cinsiyet>-<sınıf>.webp\`: ${raceIds.length} ırk × 2 cinsiyet × 12 sınıf = ${raceIds.length * 24} hücre, depoda eksik ${missing.length}${missing.length ? ` (${missing.join(', ')})` : ''}. Alt sınıf jeton yolunu etkilemez (\`src/battle/avatar.ts\` \`characterTokenFile\`; ayrıntı \`harita/belgeler/ENVANTER-JETON-VE-BUYU.md\` Bölüm 3e).`, '',
    '`claude/karakter-jeton-uretim-plani.md` ve `jeton-alt-sinif-kontrol-listesi.md` bu depoda yok (aranan her yolda bulunamadı); çapraz kontrol `ENVANTER-JETON-VE-BUYU.md` (Bölüm 3–4) ve atlasın kendisiyle yapıldı. İki plan belgesi yerelde varsa bu bölüm onlarla yeniden karşılaştırılmalı.', '',
    `- Biçim değiştiren özellikler canavar jetonunu ödünç alır (\`shape_changed\` → \`monsterAvatar\`): Karadul Örümcek Biçimi ${spiderForms.map((m) => `\`${m}\` (${ls('public/monsters').includes(`${m}.webp`) ? 'var' : 'YOK'})`).join(', ')}. Ayrı alt sınıf jetonu gerekmez; eksik olan geçiş flaşı (\`donusum\`).`,
    '- Boyut büyümesi (Large Form vb.) jeton ölçeğini veriden değiştirir (`tokenScale`); ayrı jeton gerekmez, büyüme halkası eksik (`donusum`).',
    '- Kanat/uçuş: jetonda yalnız 🪽 rozeti; kanat katmanı E2 `donusum-kanat.jpg`’den (kod: jetonun arkasında katman). Ayrı jeton gerekmez.',
    '- Silah/kalkan değişimi (silah bağı, büyülü silah, ruhani silah): jetonda çizilmez; parıltı katmanı (`silah`), ayrı jeton gerekmez.', '');
  out.push(`Görünümü değiştiren ilkeli olan özellikler (${look.length}):`, '', '| Kaynak | Alt sınıf | Özellik | İlkeller | Ayrı jeton | Öneri |', '|---|---|---|---|---|---|');
  for (const r of look) {
    const il = r.ilkeller.filter((x) => ['boyut', 'ucus', 'bicim', 'gorunmezlik', 'engeldenGec'].includes(x));
    out.push(`| ${r.kaynak} | ${r.sub} | ${r.id} | ${il.join(', ')} | ${il.includes('bicim') ? 'canavar jetonu (ödünç)' : 'gerekmez'} | ${il.map((x) => ({ boyut: 'büyüme halkası', ucus: 'kanat katmanı', bicim: 'dönüşüm flaşı', gorunmezlik: 'hazır (CSS)', engeldenGec: 'hayalet CSS' })[x]).join(', ')} |`);
  }
  out.push('', 'Eksik jeton hücresi (alt sınıf için zorunlu): **0**. Gerçek ek pakette `bicim` ilkeli canavar dışı bir biçim (`yaratiklar` jetonu) tanımlıyorsa jeton `JETON_ARKETIP`/`JETON_YEDEK` zincirine düşer (`src/content/ilkelSema.ts`); yerelde üretilen tabloda bu satırlar "canavar jetonu (ödünç)" olarak görünür.', '');
  return { text: out.join('\n'), stats: { features: rows.length, aileler: Object.keys(fam).length } };
}

// ── Çalıştır ──
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rows = spellRows();
  const a = spellDoc(rows);
  fs.writeFileSync(path.join(root, 'harita/belgeler/BUYU-EFEKT-TABLOSU.md'), a.text);
  const fr = featureRows(process.argv[2] ?? 'icerik');
  const b = featureDoc(fr);
  fs.writeFileSync(path.join(root, 'harita/belgeler/ALT-SINIF-GORSEL-TABLOSU.md'), b.text);
  const s = a.stats;
  console.log(`BUYU-EFEKT-TABLOSU.md: ${rows.length} satır; savaşta ${s.fight} = hazır ${s.h}, genel ${s.g}, eksik ${s.e}; savaş dışı ${s.off}; yeni anim. ${s.n}; aile ${Object.keys(s.aileler).length}; E2 sayfası ${s.e2}; Gemini ${s.gemini} sayfa / ${s.geminiHucre} hücre; kod ${s.kod} madde`);
  console.log(`ALT-SINIF-GORSEL-TABLOSU.md: ${b.stats.features} özellik, ${b.stats.aileler} aile${fr.paketYerel ? '' : ' (ek paket yok: kurgusal fikstür)'}`);
}

export { spellDoc, featureDoc };
