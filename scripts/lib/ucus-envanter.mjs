/**
 * Kuyruk U1b, Görev 0: ek paketlerde uçuşla ilgili kayıtların envanteri (saf mantık; dosya okumaz).
 * Yalnız kimlik, ad, seviye ve ilkel parametreleri çıkar; paket metni (açıklama) YAZILMAZ, metinde uçuş sözcüğü
 * geçmesi yalnızca bir işaret (✓) olarak raporlanır.
 */

/** Uçuş sözcükleri (TR/EN); yalnız işaret için. */
export const UCUS_SOZCUK = /uçuş|uçar|uçma|uçabil|uçu[rş]|kanat|süzül|\bfl(?:y|ies|ight|ying)\b|hover|\bwings?\b/i;

/** `ucus` ilkelinin yazılabilen parametreleri (U1a sözleşmesi; ilkelSema.ts `ILKELLER.ucus`). */
export const UCUS_ALANLARI = ['id', 'tetik', 'hizFt', 'hizCarpani', 'sure', 'sureDakika', 'kullanim', 'azamiIrtifaFt', 'yeredegmez',
  'zorunluInis', 'seviyeEsigi', 'esikSonrasi', 'kaynak', 'kosul', 'ad'];

/** Görevdeki "kitaba uygun" tablosu: [sınıf, aranan ad, beklenen kademe]. Eşleşme yalnız kimlik ya da TR ad (tahmin yok). */
export const HEDEFLER = [
  ['cleric', 'Fırtına Alanı', 'Kalıcı (17)'], ['cleric', 'Yakamoz Alanı', 'Kısa süreli (6)'], ['fighter', 'Hissi Kablel', 'Kısa süreli (7)'],
  ['monk', 'Ejderha Disiplini', 'Kısa süreli (6, Step of the Wind)'], ['monk', 'Element Disiplini', 'veri yok (Fly büyü yolu)'],
  ['paladin', 'İntikam Yemini', 'Kalıcı 60 ft (20)'], ['rogue', 'Kamufle', 'Kısa süreli (13) + phase'], ['sorcerer', 'Pulkanat', 'Kalıcı (14)'],
  ['sorcerer', 'İlahi Kan', 'Kalıcı (14)'], ['sorcerer', 'Paratoner', 'Kalıcı 60 ft (18)'], ['warlock', 'Cin', 'bonus, 10 dk, 30 ft (6)'],
  ['warlock', 'Gulyabani', 'Kısa süreli (14) + phase'], ['ranger', 'Ejder Muhafızı', 'ara çözüm (14): binek bekliyor'],
  ['barbarian', 'Şaman Yolu', 'veri yok (biçim sistemi)'],
  ['cleric', 'Aydın Alanı', 'özgün: Kalıcı'], ['warlock', 'Melek', 'özgün: Kalıcı'], ['wizard', 'Anka Öğretisi', 'özgün: Kısa süreli'],
  ['bard', 'Islık Koleji', 'özgün: Süzülme'], ['druid', 'Element Çemberi', 'özgün: Süzülme'], ['sorcerer', 'Alevbaz', 'özgün: Süzülme'],
  ['warlock', 'Ruhsar', 'özgün: Süzülme'],
];

const norm = (s) => String(s ?? '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Özellik metni uçuş sözcüğü içeriyor mu (yalnız bool; metin döndürülmez). */
function metinde(f) {
  const d = f?.description;
  return [d?.tr, d?.en, f?.name?.tr, f?.name?.en].some((x) => typeof x === 'string' && UCUS_SOZCUK.test(x));
}

/** Bir özelliğin ilkel listesinden uçuşla ilgili izler. */
function izler(f) {
  const out = { ucus: [], bicimUcus: [], cagir: false, phase: false, adimIlkeli: [] };
  for (const p of Array.isArray(f?.ilkeller) ? f.ilkeller : []) {
    if (!isObj(p)) continue;
    if (p.tur === 'ucus') out.ucus.push(Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'tur' && UCUS_ALANLARI.includes(k))
      .concat(Object.keys(p).filter((k) => k !== 'tur' && !UCUS_ALANLARI.includes(k)).map((k) => [`?${k}`, p[k]]))));
    else if (p.tur === 'bicim' && p.ucusFt !== undefined) out.bicimUcus.push({ id: p.id, ucusFt: p.ucusFt, sure: p.sure });
    else if (p.tur === 'cagir') out.cagir = true;
    else if (p.tur === 'engeldenGec') out.phase = true;
    else if (p.tur === 'hiz' || p.tur === 'isinlan') out.adimIlkeli.push(p.tur);
  }
  return out;
}

/**
 * Paketlerden uçuş envanteri. `packs`: ayrıştırılmış paket nesneleri (`{ dosya, data }`). Dönüş:
 * `satirlar` (uçuşla ilgili özellikler), `yaratiklar` (uçan paket yaratıkları), `hedefler` (tablo satırı → bulundu/bulunamadı).
 */
export function ucusEnvanteri(packs) {
  const satirlar = [];
  const yaratiklar = [];
  const alt = [];
  for (const { dosya, data } of packs) {
    for (const y of data?.yaratiklar ?? []) {
      const ucma = y?.hiz?.ucma;
      if (ucma !== undefined || y?.hiz?.ucus !== undefined) yaratiklar.push({ dosya, id: y.id, ucma: ucma ?? null, yanlisAnahtar: y?.hiz?.ucus !== undefined });
    }
    for (const s of data?.subclasses ?? []) {
      alt.push({ dosya, sinif: s.class, id: s.id, ad: s.name?.tr });
      for (const f of s.features ?? []) {
        const iz = izler(f);
        const m = metinde(f);
        if (!iz.ucus.length && !iz.bicimUcus.length && !m) continue;
        satirlar.push({ dosya, sinif: s.class, alt: s.id, altAd: s.name?.tr, ozellik: f.id, ozellikAd: f.name?.tr, seviye: f.level, durum: f.status, metinde: m, ...iz });
      }
    }
  }
  const hedefler = HEDEFLER.map(([sinif, ad, beklenen]) => {
    const hit = alt.find((a) => a.sinif === sinif && (norm(a.ad) === norm(ad)));
    return { sinif, ad, beklenen, bulundu: !!hit, id: hit?.id ?? null, dosya: hit?.dosya ?? null };
  });
  return { satirlar, yaratiklar, hedefler };
}

const kisa = (o) => (o.length ? o.map((x) => '`' + JSON.stringify(x) + '`').join('<br>') : '—');

/** Markdown tablo (kimlik/ad/seviye/parametre; metin yok). */
export function envanterMarkdown(e) {
  const L = [];
  L.push('### Uçuşla ilgili özellikler (paketlerden)', '');
  if (!e.satirlar.length) L.push('_Hiç kayıt yok._', '');
  else {
    L.push('| Sınıf | Alt sınıf | Özellik (kimlik · ad) | Sev. | Durum | `ucus` ilkeli | `bicim.ucusFt` | `cagir` | phase | metinde uçuş sözcüğü |', '|---|---|---|---|---|---|---|---|---|---|');
    for (const r of e.satirlar) {
      L.push(`| ${r.sinif} | ${r.alt} | ${r.ozellik} · ${r.ozellikAd ?? ''} | ${r.seviye ?? ''} | ${r.durum ?? ''} | ${kisa(r.ucus)} | ${kisa(r.bicimUcus)} | ${r.cagir ? '✓' : ''} | ${r.phase ? '✓' : ''} | ${r.metinde ? '✓' : ''} |`);
    }
    L.push('');
  }
  L.push('### Uçan paket yaratıkları (`hiz.ucma`)', '');
  if (!e.yaratiklar.length) L.push('_Yok._', '');
  else { L.push('| Paket | Yaratık | `ucma` | Not |', '|---|---|---|---|'); for (const y of e.yaratiklar) L.push(`| ${y.dosya} | ${y.id} | ${y.ucma ?? ''} | ${y.yanlisAnahtar ? '`hiz.ucus` yazılmış: doğru anahtar `ucma`' : ''} |`); L.push(''); }
  L.push('### "Kitaba uygun" tablosu → paket eşleşmesi', '', '| Sınıf | Aranan alt sınıf | Beklenen | Sonuç |', '|---|---|---|---|');
  for (const h of e.hedefler) L.push(`| ${h.sinif} | ${h.ad} | ${h.beklenen} | ${h.bulundu ? `bulundu: \`${h.id}\` (${h.dosya})` : '**bulunamadı**'} |`);
  L.push('');
  return L.join('\n');
}
