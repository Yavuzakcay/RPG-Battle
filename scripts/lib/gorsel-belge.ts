/**
 * harita/belgeler/GORSEL-ENVANTER.md metni (`npm run dd-gorsel`; sayılar `scripts/lib/gorsel-envanter.ts` satırlarından,
 * elle yazılan yalnız açıklama, sorun ve öneri cümleleri). Salt okuma.
 */
import fs from 'node:fs';
import path from 'node:path';
import { mergedOf } from './buyu-durum.mjs';
import { B, SPELL_FX } from '../../src/ui/fx/fxPlan';
import { spells, classData } from '../../src/data';
import { footprint, type FootprintSize } from '../../src/rules/footprint';
import { hexCenter, VIEW, HEX_W } from '../../src/ui/mapView';
import { MAX_ANIMATED } from '../../src/ui/statusFx';
import { MIN_HEX_PX } from '../../src/ui/camera';
import { ROOT, YEDEKLER, type GRow, type SpellObs } from './gorsel-envanter';

const read = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')) as T;
const ls = (d: string) => (fs.existsSync(path.join(ROOT, d)) ? fs.readdirSync(path.join(ROOT, d)) : []);
const n = (x: number, d = 1) => x.toFixed(d).replace('.', ',');
const md = (s: string) => s.replace(/\|/g, '\\|');
const cnt = (l: GRow[], d: string) => l.filter((r) => r.durum === d).length;
const kay = (l: GRow[]) => ['efekt', 'jeton', 'ikon', 'yedek'].map((k) => `${k} ${l.filter((r) => r.kaynak === k).length}`).filter((x) => !x.endsWith(' 0')).join(', ');
const list = (xs: string[], max = 40) => (xs.length ? `${xs.slice(0, max).map((x) => `\`${x}\``).join(', ')}${xs.length > max ? ` … (+${xs.length - max})` : ''}` : '—');

const CAT_AD: Record<string, string> = { buyu: 'Büyü', esya: 'Eşya', canavar: 'Canavar', tur: 'Tür', altsoy: 'Alt soy', sinif: 'Sınıf (+ Invocation, Metamagic)', altsinif: 'Alt sınıf',
  feat: 'Feat', gecmis: 'Geçmiş', durum: 'Durum', yuzey: 'Yüzey', nesne: 'Harita nesnesi', alan: 'Büyü alanı (savaşta)', zar: 'Zar teması' };

export interface BelgeIn {
  cats: Record<string, GRow[]>; ex: { yuzey: GRow[]; nesne: GRow[]; alan: GRow[]; zar: GRow[]; zarInfo: { tanimli: number; setli: number; hedef: number } };
  sp: { rows: GRow[]; obs: SpellObs[]; combat: Set<string> }; mo: { sameAs: Map<string, string[]>; distinct: number; files: number; uyku: string[] };
  sub: { rows: GRow[]; loaded: number; total: number }; dex: Record<string, Array<{ id: string }>>; icerik: string; csvCount: number; problems: string[];
}

export function belge(x: BelgeIn): string {
  const o: string[] = [];
  const { cats, ex, sp } = x;
  const all: Array<[string, GRow[]]> = [...Object.entries(cats), ['yuzey', ex.yuzey], ['nesne', ex.nesne], ['alan', ex.alan], ['zar', ex.zar]];
  o.push('# Görsel envanter (oyun + Dungeondex vitrini)', '',
    '`npm run dd-gorsel` üretir (`scripts/dungeondex-gorsel-esleme.ts`, kurallar `scripts/lib/gorsel-envanter.ts`, bu metin `scripts/lib/gorsel-belge.ts`); elle düzenlenmez. Aynı çalıştırma `data/dungeondex-gorsel-esleme.json` (vitrin eşlemesi) ve `harita/belgeler/GORSEL-EKSIK.csv` (eksik listesi) yazar. Salt okuma: oyun kodu, veri ve görseller değişmez. Galeri: geliştirme sunucusunda `#galeri` (Ayarlar ▸ Gelişmiş ▸ Geliştirici).', '',
    '**Durum ölçütü (her kategoride aynı):** **var** = kayda özel görsel oyunda gerçekten çiziliyor; **genel** = görsel var ama paylaşılan/aile görseli (başka kayıtlarla aynı efekt, aynı çözülmüş jeton görüntüsü, yalnız durum döngüsü/rozet/ikon); **yedek** = görsel yok, kartta ortak çerçeve + kategori glifi (`yedekler` tablosu). Sayılar betiğin çalıştığı ortamdan; bulutta `icerik/` yok (alt sınıf içeriği fikstürden).', '');
  // Özet
  o.push('## Özet', '', '| Kategori | Kayıt | Var | Genel | Yedek | Kaynak (eşlemede) |', '|---|---|---|---|---|---|');
  for (const [k, l] of all) o.push(`| ${CAT_AD[k] ?? k} | ${l.length} | ${cnt(l, 'var')} | ${cnt(l, 'genel')} | ${cnt(l, 'yedek')} | ${kay(l)} |`);
  const tot = all.flatMap(([, l]) => l);
  o.push(`| **Toplam** | **${tot.length}** | **${cnt(tot, 'var')}** | **${cnt(tot, 'genel')}** | **${cnt(tot, 'yedek')}** | |`, '',
    `Dungeondex denetimi: Dungeondex'in ${Object.values(x.dex).reduce((a, l) => a + l.length, 0)} kaydının hepsi eşlemede, her \`ref\` çözülüyor (public/ dosyası ya da \`yedekler\` anahtarı): sorun ${x.problems.length}. CSV ${x.csvCount} satır.`, '');

  // ── Eksik ve düzeltilecek
  const spCombat = sp.rows.filter((r) => sp.combat.has(r.id));
  const spOff = sp.rows.filter((r) => !sp.combat.has(r.id));
  const offNone = spOff.filter((r) => r.durum === 'yedek');
  const combatNone = spCombat.filter((r) => r.durum === 'yedek');
  const dragons = cats.canavar!.filter((r) => r.durum === 'genel');
  o.push('## Eksik ve düzeltilecek', '',
    'Büyükten küçüğe (kayıt sayısı × oyuncunun gördüğü yer). Görsel eksikleri yalnız listede (üretim Gemini işi); kodla çözülenler en altta.', '',
    '| # | Eksik | Kayıt | Etki | Çözüm |', '|---|---|---|---|---|',
    `| 1 | Eşya ikonu | ${cats.esya!.length}/${cats.esya!.length} yok | Hiçbir ekranda eşya ikonu yok (bkz. h): oluşturucu, karakter kâğıdı, savaş Eşya menüsü, Dungeondex, dükkân yalnız ad | Gemini: \`public/esya/<kimlik>.webp\` (öncelik: 319 sihirli eşya; nadirlik rengi çerçevede). Ara çözüm: tür glifi + nadirlik çerçevesi (eşlemede hazır) |`,
    `| 2 | Büyü kart görseli (savaş dışı) | ${offNone.length} savaş dışı + ${combatNone.length} savaşta görselsiz | Dungeondex büyü kartında görsel yok; savaşta görsel üretmeyen ${combatNone.length} büyü (${combatNone.map((r) => r.id).join(', ')}) | Gemini: \`public/buyu/<kimlik>.webp\` kart ikonu; ara çözüm okul glifi |`,
    `| 3 | Harita nesnesi sprite'ı | ${cnt(ex.nesne, 'yedek')}/${ex.nesne.length} emoji | Haritada nesne emoji (yazı tipine göre değişir, telefonda farklı görünür) | Gemini: \`assets-ham/sprite/nesne-<ad>.png\` → \`npm run sprite-ice\` |`,
    `| 4 | Zar temaları | ${ex.zarInfo.tanimli} tanımlı, ${ex.zarInfo.setli} setli; ${ex.zarInfo.tanimli - ex.zarInfo.setli} Alignment seti yok; ${ex.zarInfo.hedef} hedefine ${ex.zarInfo.hedef - ex.zarInfo.tanimli} tema tanımsız | Alignment zarları klasik görselle (3D renkleri farklı) | Gemini: 9 Alignment seti + ${ex.zarInfo.hedef - ex.zarInfo.tanimli} yeni tema (bkz. e) |`,
    `| 5 | Büyüye özel efekt (genel efektli savaş büyüsü) | ${cnt(spCombat, 'genel')} | Savaşta aile efekti oynuyor (ör. \`darbe-buyu\`, \`alan-psisik\`, durum döngüsü); oyun çalışır, ayırt edicilik düşük | İsteğe bağlı: \`efekt-<kimlik>\` hücreleri (E-serisi sayfa) |`,
    `| 6 | Ejderha yaş görselleri | ${dragons.length} canavar (10 renk × 4 yaş) aynı çözülmüş görüntü | Yaş farkı yalnız boyla görünür | Gemini: 30 yeni çizim (young/adult/ancient), dosya adı aynı kalır |`,
    `| 7 | Kalıcı büyü alanı dokusu | ${cnt(ex.alan, 'yedek')} renkli altıgen + ${cnt(ex.alan, 'genel')} varsayılan aura | ${ex.alan.filter((r) => r.durum !== 'var').map((r) => r.id).join(', ')} | Gemini: zemin hücresi (\`efekt-zemin-<kimlik>\`) |`,
    `| 8 | Mobil okunabilirlik | — | 390×844 dikeyde jeton ≈ 21 px, rozet ≈ 7 px (bkz. f) | Kod/tasarım: dar ekranda yakınlaştırma ya da rozet ölçeği (bu görevde değiştirilmedi) |`,
    `| 9 | Yüzey \`warning\` | 1 | Çığ uyarı yüzeyi renkli altıgen | Gemini: \`yuzey-warning-1\` |`, '',
    '**Kayda özel resim GEREKMEYENLER** (ortak çerçeve + kategori glifi yeterli; CSV\'ye girmez): feat 17, geçmiş 12, Eldritch Invocation 28, Metamagic 10, sınıf özelliği satırı 185 (bkz. g). Bilinçli "orijinal" alt soy görünümleri de eksik sayılmaz.', '',
    '**Bu görevde kodla çözülen:** `data/dungeondex-gorsel-esleme.json` `yedekler` tablosu (eşya türü, büyü okulu, feat kategorisi, geçmiş, Invocation, Metamagic, eylem türü, hasar türü, nesne, alan, zar: tek kaynak, galeri ve vitrin aynı glifi çizer) ve `nadirlikRenkleri` (oluşturucunun kenar şeridiyle aynı). Oyun ekranlarında eşleme/efekt/boyut kodu değişmedi: aşağıda yanlış eşleşmiş efekt bulunmadı (ödünç renkler bilinçli), boyut oranı ve rozet ölçeği tasarım kararı (öneri f).', '');

  // ── (a) Büyüler
  const obsBy = new Map(sp.obs.map((q) => [q.id, q]));
  const genelCombat = spCombat.filter((r) => r.durum === 'genel');
  const kind = (r: GRow) => (r.not?.startsWith('gözlenmedi') ? 'kural tahmini (döküm gözlenemedi)' : r.efekt?.startsWith('dongu:') ? 'yalnız durum döngüsü' : r.kaynak === 'ikon' && r.ref.includes('efekt-ok') ? 'yalnız rozet' : r.kaynak === 'ikon' ? 'yalnız durum ikonu / jeton filtresi' : 'aile/paylaşılan sprite');
  const kinds = new Map<string, string[]>();
  for (const r of genelCombat) kinds.set(kind(r), [...(kinds.get(kind(r)) ?? []), r.id]);
  o.push('## (a) Büyüler (339)', '',
    `Yöntem: her büyü açık bir 21×11 haritada gerçek \`cast_spell\` komutuyla dökülür (E2 doğrulayıcısının hedefleme denemeleri: hedef, altıgen, dost, kendi, çoklu nokta; gerekirse sürdürme/verilen nefes), çıkan olaylar \`fxShots\`, sonraki durum \`groundFx\`, alan dokusu (\`sprite-esleme.json\` \`zones\`), durum döngüsü (\`statusFx\`), rozet (\`effectIcons\`) ve CSS jeton filtresiyle çizime çevrilir (\`src/ui/fx/e2Verify.ts\` \`observeSpell\`). Döküm gözlenemeyen (kurulumda ritüel, hedef ağaç) çağırma/ışınlanma büyülerinde \`fxPlan\` kuralı. Savaş/savaş dışı ayrımı \`scripts/lib/buyu-durum.mjs\` (BUYU-DURUM.md ile aynı).`, '',
    '| | Toplam | Var (büyüye özel) | Genel | Yedek (görsel yok) |', '|---|---|---|---|---|',
    `| Savaşta | ${spCombat.length} | ${cnt(spCombat, 'var')} | ${cnt(spCombat, 'genel')} | ${cnt(spCombat, 'yedek')} |`,
    `| Savaş dışı | ${spOff.length} | ${cnt(spOff, 'var')} | ${cnt(spOff, 'genel')} | ${cnt(spOff, 'yedek')} |`, '',
    `Büyüye özel = çizilen efekt büyünün kendi bağlamasından (\`efekt-baglama.json\` \`buyu\`, \`zemin\`, \`duvar\`, \`auraBuyu\`, \`etkiHalka\`, \`cagirRenk\` ya da \`sprite-esleme.json\` \`zones["spells:<kimlik>"]\`).`, '',
    '**Savaşta genel görselli büyüler (alt türler):**', '');
  for (const [k, ids] of kinds) o.push(`- ${k} (${ids.length}): ${list(ids, 60)}`);
  o.push('', `**Savaşta görselsiz (${combatNone.length}):** ${combatNone.map((r) => `\`${r.id}\` (${r.not})`).join(', ') || '—'}. Light ve Continual Flame yalnız ışık katmanında (gece görüşü) görünür; Wish kopyaladığı büyünün efektini oynatır.`, '',
    `**Savaş dışı ama döküldüğünde efekt oynatan (${cnt(spOff, 'var') + cnt(spOff, 'genel')}):** ${list(spOff.filter((r) => r.durum !== 'yedek').map((r) => r.id))}.`, '');
  // Yalnız rozet
  const rozetOnly = sp.rows.filter((r) => r.kaynak === 'ikon' && r.ref.includes('efekt-ok'));
  const rozetBound = Object.keys((B as unknown as { rozetBuyu?: Record<string, string> }).rozetBuyu ?? {});
  o.push(`**Yalnız rozetli (${rozetOnly.length}):** ${list(rozetOnly.map((r) => r.id))}. \`rozetBuyu\`'ya bağlı ${rozetBound.length} büyüden ${rozetBound.length - rozetOnly.length} tanesi rozetin yanında sprite efekti de oynatıyor (E5 canlandırması ya da koruma satırı).`, '');
  // Paylaşılan efekt
  const share = new Map<string, string[]>();
  for (const q of sp.obs) for (const k of new Set(q.fx)) share.set(k, [...(share.get(k) ?? []), q.id]);
  const shared = [...share.entries()].filter(([, ids]) => ids.length > 1).sort((a, b) => b[1].length - a[1].length);
  o.push(`**Birden çok büyünün paylaştığı efekt** (gözlenen çizimlerde; ${shared.length} efekt ≥ 2 büyüde, ilk 20):`, '', '| Efekt | Büyü | Büyüler |', '|---|---|---|');
  for (const [k, ids] of shared.slice(0, 20)) o.push(`| \`${k}\` | ${ids.length} | ${ids.slice(0, 12).join(', ')}${ids.length > 12 ? ' …' : ''} |`);
  // Ödünç renk
  const EL: Record<string, string> = { ates: 'fire', buz: 'cold', yildirim: 'lightning', sok: 'lightning', isik: 'radiant', nekrotik: 'necrotic', psisik: 'psychic', kuvvet: 'force', ses: 'thunder', asit: 'acid', zehir: 'poison' };
  const borrow: string[] = [];
  for (const q of sp.obs) {
    const s = spells.find((y) => y.id === q.id)!;
    const dt = (mergedOf(s as never) as { damageType?: string }).damageType;
    const f = SPELL_FX[q.id];
    for (const k of q.fx) {
      const m = k.match(/^(?:alan|isin|koni)-([a-z]+)$/);
      if (m && EL[m[1]!] && dt && EL[m[1]!] !== dt && !['piercing', 'slashing', 'bludgeoning'].includes(dt)) borrow.push(`\`${q.id}\` ${dt} → \`${k}\`${f?.hue ? ` (hue ${f.hue}°: renk düzeltilmiş)` : f?.ton ? ` (ton ${f.ton})` : ''}`);
    }
  }
  o.push('', `**Yanlış eşleşme denetimi:** hasar türü ile çizilen element sprite'ı (alan/ışın/koni) karşılaştırıldı. Uyuşmayanlar (${borrow.length}) bağlamada bilinçli ödünç: ${borrow.join('; ') || '—'}. Zehir ışını sprite'ı yok (Poison Spray asit ışınını, Ray of Sickness nekrotik ışını ödünç alır); düzeltme yeni sprite ister (Gemini), kod değil. E3 tablosu (BUYU-EFEKT-TABLOSU.md) aynı sonucu verir: savaştaki 225 büyünün 223'ü "hazır".`, '');

  // ── (b) Eşyalar
  const es = cats.esya!;
  const TIER: Record<string, string> = { siradan: 'sıradan', olagandisi: 'olağandışı', nadir: 'nadir', cokNadir: 'çok nadir', efsanevi: 'efsanevi' };
  const byTur = new Map<string, number>(); for (const r of es) { const k = r.tur.replace(/\((\w+)\)/, (_, t: string) => `(${TIER[t] ?? t})`); byTur.set(k, (byTur.get(k) ?? 0) + 1); }
  const byRef = new Map<string, number>(); for (const r of es) byRef.set(r.ref, (byRef.get(r.ref) ?? 0) + 1);
  o.push('## (b) Eşyalar (449 = 38 silah + 12 zırh + 80 donanım + 319 sihirli eşya)', '',
    'Eşyanın hiçbir görseli yok: `src/ui/icons.tsx` yalnız ana menünün 10 SVG simgesi (oyna, kullanıcı, zar, durum, ayar, güneş, ay, otomatik, kitap, ses); kaynak ikonları (`public/kaynak/`, 8 adet) sınıf kaynakları için (Ki, ilham…), eşya değil; `sprite-esleme.json` yalnız iki harita nesnesi (fıçılar). Savaş haritasındaki eşya nesneleri (iksir 🧪, değnek 🪄, muska 📿, yüzük 💍, kılıç 🗡) emoji.', '',
    '| Tür | Kayıt |', '|---|---|', ...[...byTur.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`), '',
    '| Tür yedeği (eşleme `ref`) | Glif | Kayıt |', '|---|---|---|', ...[...byRef.entries()].map(([k, v]) => `| \`${k}\` | ${YEDEKLER[k.slice(6)]?.glif ?? ''} | ${v} |`), '',
    'Tür `src/rules/itemCategory.ts` (`itemKind`: SRD sihirli eşya türü + ad sözcükleri), nadirlik `itemTier` → `nadirlikRengi` (yalnız sihirli eşyada; renkler oluşturucunun kenar şeridiyle aynı: olağandışı yeşil, nadir mavi, çok nadir mor, efsanevi turuncu).', '');

  // ── (c) Canavarlar
  const mon = cats.canavar!;
  const SC = read<{ scale: Record<string, number> }>('data/token-sizes.json').scale;
  const mons = read<Array<{ id: string; size?: string }>>('data/monsters.json');
  const sizeCount = (s: string) => mons.filter((m) => (m.size ?? 'M') === s).length;
  const groups = new Set([...x.mo.sameAs.entries()].filter(([k]) => !k.endsWith('-uyku')).map(([k, v]) => [k, ...v].filter((y) => !y.endsWith('-uyku')).sort().join(',')));
  o.push('## (c) Canavarlar (330)', '',
    `Jeton: \`public/monsters/<kimlik>.webp\` (256×256; \`monsterAvatar\`). **${cnt(mon, 'var') + cnt(mon, 'genel')}/330 dosyası var, silüet ya da yer tutucu yok** (yer tutucu baş harfli daire yalnız Game Master'ın eklediği özel canavarda). Klasör ${x.mo.files} dosya = 330 ana + ${x.mo.uyku.length} \`-uyku\`; çözülmüş piksel özdeşliğiyle ${x.mo.distinct} farklı görüntü.`, '',
    `**Genel (${cnt(mon, 'genel')}):** ejderhaların dört yaşı (wyrmling, young, adult, ancient) aynı görüntü, ${groups.size} renk: ${[...groups].map((g) => { const ids = g.split(','); const w = ids[0]!.split('-').filter((t) => ids.every((i) => i.split('-').includes(t)) && t !== 'dragon'); return `${w.join('-')} (${ids.length})`; }).join(', ')}. Uyuyan varyant (\`-uyku\`, ${x.mo.uyku.length}): ${list(x.mo.uyku, 30)}.`, '',
    '| Boyut | Kayıt | Görsel ölçek (`token-sizes.json`) | Jeton çapı / altıgen yüksekliği | `multiHex` açıkken altıgen |', '|---|---|---|---|---|',
    ...(['T', 'S', 'M', 'L', 'H', 'G'] as const).map((s) => `| ${s} | ${sizeCount(s)} | ${n(SC[s] ?? 1, 2)} | ${n(0.72 * (SC[s] ?? 1), 2)} | ${footprint({ col: 10, row: 8 }, s as FootprintSize).length} |`), '');

  // ── (d) Tür, alt soy, alt sınıf, sınıf
  const chars = ls('public/characters');
  const generic = chars.filter((f) => /^[a-z]+-(male|female)-[a-z]+\.webp$/.test(f));
  const gr = chars.filter((f) => f.endsWith('-GR.webp'));
  const genelIrk = new Set(generic.map((f) => f.split('-')[0])).size;
  const lin = cats.altsoy!;
  o.push('## (d) Tür (10), alt soy (41), sınıf (12), alt sınıf (120)', '',
    `- **Tür:** 10/10 jeton (\`characters/<tür>-<male|female>-<sınıf>.webp\`, ${generic.length} sınıf-genel jeton = ${genelIrk} tür × 2 cinsiyet × 12 sınıf; Dragonborn'da sınıf-genel jeton yok (\`data/jeton-genel.json\`), temsilci Gariban; Gariban \`-GR\` ${gr.length}). Eşlemede temsilci jeton erkek Fighter; ırk ölçeği \`token-sizes.json\` \`race\` (Halfling/Gnome 0,5 … Goliath 1,4).`,
    `- **Alt soy:** ${lin.length} = 38 tür soyu + 3 Göksel Uyanış; ayrı jeton yok, görünüm ırk jetonuna katman (Kuyruk AS1c: \`lineageLook\`, \`Avatar.look\`). Kayda özel görünüm **${cnt(lin, 'var')}**, ırk tabanıyla aynı **${cnt(lin, 'genel')}** (hepsi \`alt-soy-gorunum.json\` \`orijinal: true\` ya da bilinçli boyasız: ${list(lin.filter((r) => r.durum === 'genel').map((r) => r.id))}).`,
    '  - Human ten tonları (AS1b/AS1c): 3 ton (Orijinal boyasız, Koyu, Altın), kültür eşlemesi Tenhausser → Koyu, Khadyrga → Orijinal, Saf Kent → Altın, Sur Dışı üçü (varsayılan Orijinal) + Sürgün; ten maskesi `public/characters/maske/human-*`.',
    `  - Kanat: \`data/kanat-esleme.json\` 3 slot (Tiefling Winged, Celestial Kırık Kanat 3+, Dragonborn 5+); Dragonborn kanat sürümü KW2: taban \`dragonborn.webp\` + zar + pençe katmanı, soy rengine göre palet; 4 jeton kendi çiziminde kanatlı (\`kanatsiz\`). \`public/kanat/\` ${ls('public/kanat').filter((f) => f.endsWith('.webp')).length} görsel; \`melek-acik.webp\` hiçbir slota bağlı değil (kullanılmayan).`,
    '  - Ayrıntı: aşağıdaki tablo (görünüm parçaları).', '',
    '| Alt soy | Durum | Görünüm |', '|---|---|---|', ...lin.map((r) => `| \`${r.id}\` | ${r.durum} | ${md(r.not ?? '')} |`), '',
    `- **Sınıf:** 12/12 sınıf-genel jeton. Aynı Dungeondex kategorisindeki 28 Invocation ve 10 Metamagic görselsiz (glif; bkz. g).`,
    `- **Alt sınıf:** ${x.sub.total} (jeton tabloları \`data/<sınıf>-jeton.json\`; Barış Alanı kaldırıldı, Birlik Manastırı hücresini paylaşırdı). **Gerçek jeton ${cnt(x.sub.rows, 'var')}/${x.sub.total}, yedek ${cnt(x.sub.rows, 'yedek')}**; her alt sınıfın kendi hücresi ve 10 tür × izinli cinsiyet jetonu var (cinsiyet kısıtı: Karadul yalnız kadın, İmparator yalnız erkek; ikinci form: Pehlivan 10+). **İçerik eksik ${x.sub.total - x.sub.loaded}/${x.sub.total}** bu ortamda (${x.icerik === 'icerik' ? 'yerel `icerik/`' : 'bulut: `icerik/` yok, fikstür 12 SRD + 12 bizim yüklü'}); tarayıcıda \`icerik/\` yoksa yalnız 12 bizim alt sınıf yüklenir (108/120 "içerik eksik"), jeton yine çözülür (jeton tablosu içerikten bağımsız).`, '');

  // ── (e) Durum, yüzey, nesne, alan, zar
  const du = cats.durum!;
  o.push('## (e) Durumlar, yüzeyler, nesneler, alanlar, zar temaları', '',
    `- **Durum (15):** 15/15 ikon (\`sprites/efekt-ikon-*\`); döngü şeridi ${du.filter((r) => r.efekt?.startsWith('dongu:')).length} (${du.filter((r) => r.efekt?.startsWith('dongu:')).map((r) => r.id).join(', ')}); CSS jeton filtresi 6 (petrified, blinded, invisible, unconscious, prone, exhaustion). Savaş rozetinde Blinded, Petrified, Unconscious ikonu bilinçli olarak yok (E1: karartma, taş filtresi, yüzen Z; test \`damageFloats.test.ts\`); bu üç ikon yalnız galeri/vitrinde. Ekranda en çok ${MAX_ANIMATED} döngü animasyonu (\`statusFx\`), efekt bütçesi ekranda ${(B as { butce: { ekran: number; jeton: number } }).butce.ekran}, jeton başına ${(B as { butce: { ekran: number; jeton: number } }).butce.jeton}.`,
    `- **Yüzey (${ex.yuzey.length}):** sprite ${cnt(ex.yuzey, 'var')}; yok: ${list(ex.yuzey.filter((r) => r.durum === 'yedek').map((r) => r.id))}.`,
    `- **Harita nesnesi (${ex.nesne.length}):** sprite ${cnt(ex.nesne, 'var')} (${ex.nesne.filter((r) => r.durum === 'var').map((r) => r.id).join(', ')}), emoji ${cnt(ex.nesne, 'yedek')}: ${ex.nesne.filter((r) => r.durum === 'yedek').map((r) => `${r.glif ?? ''} \`${r.id}\``).join(', ')}.`,
    `- **Büyü alanı (savaştaki ${ex.alan.length} kalıcı alan):** doku ${cnt(ex.alan, 'var')}, varsayılan aura ${cnt(ex.alan, 'genel')} (${ex.alan.filter((r) => r.durum === 'genel').map((r) => r.id).join(', ')}), renkli altıgen yer tutucusu ${cnt(ex.alan, 'yedek')} (${ex.alan.filter((r) => r.durum === 'yedek').map((r) => r.id).join(', ')}).`,
    `- **Zar teması:** \`zar-gorselleri.json\` ${ex.zarInfo.tanimli} tema; görsel seti (d4…d100, 7 görsel) ${ex.zarInfo.setli}; seti olmayan ${ex.zarInfo.tanimli - ex.zarInfo.setli} (${ex.zar.filter((r) => r.durum === 'yedek').map((r) => r.id.replace('hizalanma-', '')).join(', ')}: \`seti\` yazılı, klasör yok → klasik görsel + 3D renkleri). **72 → 100 sorunu:** kullanıcı hedefi 100 tema; veride ${ex.zarInfo.tanimli} tanımlı, yalnız ${ex.zarInfo.setli}'ünün görseli var. 100'e ulaşmak için ${ex.zarInfo.hedef - ex.zarInfo.tanimli} yeni tema kimliği (henüz yok; uydurma kimlik eklenmedi, karar kullanıcıda) + 9 Alignment seti = ${ex.zarInfo.hedef - ex.zarInfo.setli} ham sayfa (\`assets-ham/zarlar/zar-<tema>.jpg\` → \`npm run zarlar\`). Kategori dağılımı: ${(() => { const c = new Map<string, number>(); for (const r of ex.zar) c.set(r.tur, (c.get(r.tur) ?? 0) + 1); return [...c.entries()].map(([k, v]) => `${k.replace('zar teması ', '')} ${v}`).join(', '); })()}.`, '');

  // ── (f) Boyut ve mobil
  const HH = VIEW.h / 7.5;
  const dia = 0.72 * HH;
  const extent = (s: FootprintSize) => { const ps = footprint({ col: 10, row: 8 }, s).map(hexCenter); const ys = ps.map((p) => p.y); return (Math.max(...ys) - Math.min(...ys)) / HH + 1; };
  o.push('## (f) Jeton / altıgen oranı ve mobil okunabilirlik', '',
    `Dünya ölçüsü 15×7 = ${VIEW.w}×${VIEW.h}; altıgen eni ${n(HEX_W)} px, yüksekliği ${n(HH)} px; Medium jeton çapı 0,72 × yükseklik = ${n(dia)} px (\`TOKEN_R\`); rozet 22 px, aralık 20 px, en çok 3 + "+N". Ölçek yalnız görsel (\`tokenScale\`); \`multiHex\` kapalıyken her yaratık tek altıgen, büyük jeton komşu altıgenlere taşar (\`drawOrder\` küçükleri üste alır).`, '',
    '| Boyut | Ölçek | Kapalı: jeton çapı (altıgen yüksekliği) | Açık: gövde altıgeni | Açık: gövde yüksekliği (altıgen) | Açık: jeton/gövde |', '|---|---|---|---|---|---|',
    ...(['M', 'L', 'H', 'G'] as const).map((s) => `| ${s} | ${n(SC[s] ?? 1, 1)} | ${n(0.72 * (SC[s] ?? 1), 2)} | ${footprint({ col: 10, row: 8 }, s).length} | ${n(extent(s), 1)} | %${Math.round((100 * 0.72 * (SC[s] ?? 1)) / extent(s))} |`), '',
    'Kapalıyken (varsayılan) Large 1,08, Huge 1,44, Gargantuan 2,16 altıgen yüksekliğinde çizilir: tek altıgende duran yaratık için okunur, komşuya taşma bilinçli. Açıkken jeton gövdenin yarısı kadar kalır (Huge ≈ %48, Gargantuan ≈ %43): gövde tabanı (`.body-base`) gövdeyi gösterir ama jeton küçük görünür. Öneri: `multiHex` açıkken ölçek = gövde yüksekliği × 0,72 (ayrı görev; bu görevde değiştirilmedi, deneysel anahtar).', '');
  const vp = (w: number, h: number) => { const bw = Math.min(w, h * (VIEW.w / VIEW.h)); return bw / VIEW.w; };
  o.push('| Ekran | Ölçek (zoom 1) | Altıgen eni | Medium jeton | Tiny jeton | Huge jeton | Rozet | Not |', '|---|---|---|---|---|---|---|---|');
  for (const [w, h, note] of [[1280, 800, 'masaüstü'], [844, 390, 'telefon yatay'], [390, 844, 'telefon dikey']] as Array<[number, number, string]>) {
    const k = vp(w, h);
    o.push(`| ${w}×${h} (${note}) | ${n(k, 3)} | ${n(HEX_W * k)} px${HEX_W * k < MIN_HEX_PX ? ` (< ${MIN_HEX_PX} px dokunma sınırı)` : ''} | ${n(dia * k)} px | ${n(dia * 0.3 * k)} px | ${n(dia * 2 * k)} px | ${n(22 * k)} px | ${k < 0.5 ? 'rozet ve Tiny jeton okunmaz' : k < 0.8 ? 'rozet küçük' : '—'} |`);
  }
  o.push('', `Efekt kalabalığı: ekranda en çok 12 animasyonlu efekt + ${MAX_ANIMATED} durum döngüsü, jeton başına 2 katman, rozet 3 + "+N"; 390 px enli dikey ekranda 15 sütun sığdığı için bir altıgene ≈ 26 px düşer ve 3 rozet jetondan geniş olur. Geniş haritalarda kamera yakınlaştırır (en çok 2,5×; alt sınır altıgen ≥ ${MIN_HEX_PX} px); klasik 15×7 haritada yakınlaştırma yok. Öneri: dar dikey ekranda (ölçek < 0,5) rozetleri tek "+N" rozetine indirmek ve klasik haritada da kamerayı açmak (tasarım kararı; bu görevde kod değişmedi).`, '');

  // ── (g) Glifler
  const prog = classData.progression.flatMap((c) => c.rows.flatMap((r) => r.features.map((f) => `${c.id}:${f.id}`)));
  const uniq = new Set(prog);
  const feats = classData.mechanics.features as Record<string, { type?: string }>;
  const types = new Map<string, number>(); for (const k of uniq) { const t = feats[k]?.type ?? '(mekaniksiz/genel satır)'; types.set(t, (types.get(t) ?? 0) + 1); }
  const schools = [...new Set(spells.map((s) => s.school).filter(Boolean))].sort();
  const dmg = Object.keys(YEDEKLER).filter((k) => k.startsWith('hasar-')).map((k) => k.slice(6));
  const featCat = new Map<string, number>(); for (const f of classData.feats) featCat.set(f.category, (featCat.get(f.category) ?? 0) + 1);
  o.push('## (g) Sınıf özellikleri, feat, Invocation, Metamagic, geçmiş, büyü okulu, hasar türü', '',
    '| Grup | Kayıt | Bugün ikon/glif | Gösterildiği ekranlar | Önerilen çözüm | Kayda özel resim gerekir |', '|---|---|---|---|---|---|',
    `| Sınıf özelliği (SRD tablo satırı) | ${uniq.size} benzersiz (${prog.length} satır); mekanik türü: ${[...types.entries()].map(([k, v]) => `${k} ${v}`).join(', ')} | yok (savaş menüsünde yalnız "hızlı" yazı rozeti) | oluşturucu "Sınıf güçlerin", karakter kâğıdı, savaş Özel menüsü, Dungeondex sınıf kartı | ortak çerçeve + eylem türü glifi (\`eylem-action/bonus/reaction/passive/free/resource\`) | 0 |`,
    `| Feat | ${classData.feats.length} (${[...featCat.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}) | yok | oluşturucu (köken/ASI adımı), kâğıt, Dungeondex | çerçeve + kategori glifi (\`feat-origin/general/fighting-style/epic-boon\`) | 0 |`,
    '| Eldritch Invocation | 28 | yok | oluşturucu (Warlock), kâğıt, Dungeondex | çerçeve + `invocation` glifi | 0 |',
    '| Metamagic | 10 | yok | oluşturucu (Sorcerer), savaş büyü seçicisi, Dungeondex | çerçeve + `metamagic` glifi | 0 |',
    `| Geçmiş | ${cats.gecmis!.length} | yok | oluşturucu "Karakter"/hikâye adımı, Dungeondex | çerçeve + \`gecmis\` glifi (vitrin için isteğe bağlı sahne resmi: 12) | 0 (isteğe bağlı 12) |`,
    `| Büyü okulu | ${schools.length} (${schools.join(', ')}) | yok | Dungeondex büyü kartı başlığı ve süzgeci | çerçeve + okul glifi (\`okul-*\`); büyü kartının yedeği de bu | 0 |`,
    `| Hasar türü | ${dmg.length} | 4 emoji yalnız hasar sayısında (ateş 🔥, zehir ☠, soğuk ❄, asit 💧: \`damageFloats.ts\` \`FLOAT_ICON\`) | savaş hasar sayıları, günlük, Dungeondex olgu satırı | çerçeve + hasar glifi (\`hasar-*\`, 13) | 0 |`, '',
    'Bütün glifler eşlemenin `yedekler` tablosunda (tek kaynak); galeri ve vitrin aynı çerçeveyi çizer. Kayda özel resim gerektiren yok: bu grupların ayırt edici bilgisi metin (ad, tür, maliyet), resim değil.', '');

  // ── (h) İkon kullanan ekranlar
  o.push('## (h) İkon kullanan ekranlar ve eşya ikonu', '',
    '| Ekran | Dosya | Görsel/ikon kullanımı | Eşya gösterimi |', '|---|---|---|---|',
    '| Ana menü ve karakter listesi | `src/screens/Screens.tsx` | logo, 10 SVG simge (`ui/icons.tsx`), karakter jetonu (`CharacterFigure`), kaynak ikonları (`ResourceChip`) | — |',
    '| Karakter sihirbazı: donanım | `src/screens/builder/Equipment.tsx` | yok (çağrı yaratığı listesinde canavar jetonu: `builder/Features.tsx`) | **yalnız ad** + etki seviyesi kenar şeridi (CSS) |',
    '| Karakter sihirbazı: önizleme | `src/screens/Builder.tsx` | `CharacterFigure` (jeton + alt soy görünümü) | — |',
    '| Karakter kartı | `src/screens/sheet/SheetView.tsx` | jeton (`AvatarBadge`) | **yalnız ad** |',
    '| Savaş: saldırı menüsü | `src/MapBattle.tsx` | halka menü yazı; durum rozetleri (ikon + emoji), kaynak ikonları, efektler | silah **yalnız ad** |',
    '| Savaş: Eşya menüsü (`item-<kimlik>`) | `src/MapBattle.tsx` | yazı | iksir/eşya **yalnız ad** (+ adet) |',
    '| Savaş haritası nesneleri | `src/MapBattle.tsx` | 2 sprite, 32 emoji (`nesneler.json` `icon`) | yerdeki eşya 🗡, iksir 🧪, değnek 🪄 emoji |',
    '| Game Master kurulumu | `src/screens/GmScreen.tsx` | harita küçük resimleri, özel canavarın yüklenen görseli (canavar listesi metin) | — |',
    '| Dungeondex | `src/screens/Dungeondex.tsx` | yok (kart yalnız metin) | **yalnız ad** |',
    '| Serüven: dükkân | `src/screens/YerlesimHub.tsx` `HubShop` | yok | **yalnız ad** + fiyat |',
    '| Serüven: han | `src/screens/YerlesimHub.tsx` `HubInn` | yok | eşya yok |',
    '| Sefer haritası ve ödül sahnesi | `src/screens/SeferMap.tsx` | harita görseli, düğüm küçük resimleri | iksir 🧪 emoji |',
    '| Zar seçici / tepsi | `src/ui/DiceStep.tsx`, `DiceTray.tsx` | zar görselleri (63 set) | — |', '',
    '**Sonuç:** eşya ikonu hiçbir ekranda gösterilmiyor (6 ekranda yalnız ad, 2 yerde emoji). İkon gelince tek bileşen (çerçeve + `ref` ya da glif + nadirlik rengi) bu altı yere eklenebilir; eşleme JSON\'u hazır.', '');

  // ── Öneri ve yöntem
  o.push('## Öneri (sıra)', '',
    `1. Eşya ikonları (${cats.esya!.length}; önce 319 sihirli eşya ve 38 silah): Gemini, 128 px saydam, \`public/esya/<kimlik>.webp\`; eşleme betiği dosyayı görünce \`kaynak: ikon\` yapar (yeniden \`npm run dd-gorsel\`).`,
    `2. Görselsiz büyülerin kart ikonları (savaş dışı ${offNone.length} + savaşta ${combatNone.length}): \`public/buyu/<kimlik>.webp\` (betik görünce \`kaynak: ikon\`).`,
    `3. Harita nesnesi sprite'ları (${cnt(ex.nesne, 'yedek')} emoji): mevcut \`nesne-<ad>\` hattı (\`npm run sprite-ice\`).`,
    `4. Zar: ${ex.zarInfo.tanimli - ex.zarInfo.setli} Alignment seti, sonra ${ex.zarInfo.hedef} hedefine ${ex.zarInfo.hedef - ex.zarInfo.tanimli} tema (önce kimlik listesi kullanıcıdan).`,
    '5. Mobil: dar dikey ekranda rozet ölçeği ve klasik haritada kamera (kod görevi).',
    '6. İsteğe bağlı: genel efektli savaş büyülerine özel hücreler, ejderha yaşları, 5 alan dokusu, `warning` yüzeyi.', '',
    '## Yöntem ve yeniden üretim', '',
    '- `npm run dd-gorsel` (yazmadan denetim: `npm run dd-gorsel -- --kuru`); test `src/dungeondex/gorselEsleme.test.ts` (her Dungeondex kaydı eşlemede, her `ref` public/ dosyasına ya da `yedekler` anahtarına çözülüyor, efekt kimlikleri kayıtlı).',
    '- Görsel eklenince yeniden çalıştırılır; eşleme ve bu belge kendiliğinden güncellenir. Eşya ve büyü ikonu klasörleri (`public/esya/`, `public/buyu/`) henüz yok; betik varsa okur.', '');
  return `${o.join('\n')}\n`;
}
