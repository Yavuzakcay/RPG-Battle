// Kuyruk K55 G2: büyü ve yüzey etiketleri (data/buyu-etiketleri.json). Büyü etiketleri büyü verisinden üretilir
// (hasar türü → element, alan/duvar/gaz/çağrı → tür); elle düzeltmeler `ELLE` tablosunda. Yüzey ve alan katmanları elle.
// Çalıştır: node scripts/k55-buyu-etiketleri.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const spells = [...read('data/spells.json'), ...read('data/spells-45.json'), ...read('data/spells-69.json')];
const ELEMENT = { fire: 'fire', cold: 'cold', lightning: 'lightning', acid: 'acid', poison: 'poison', force: 'force', thunder: 'thunder',
  radiant: 'radiant', necrotic: 'necrotic', psychic: 'psychic' };
const GAS = new Set(['fog-cloud', 'stinking-cloud', 'cloudkill', 'incendiary-cloud', 'gaseous-form']);
// Elle: su üreten/söndüren büyüler ve özel durumlar.
const ELLE = {
  'create-or-destroy-water': { element: ['water'], tur: ['yuzey'] },
  'sleet-storm': { element: ['cold', 'water'], tur: ['alan', 'yuzey'] },
  'tidal-wave': { element: ['water'], tur: ['alan'] },
  'control-water': { element: ['water'], tur: ['alan'] },
  'grease': { tur: ['alan', 'yuzey'] },
  'web': { tur: ['alan', 'yuzey'] },
  'gust-of-wind': { tur: ['isin', 'ruzgar'] },
  'wind-wall': { tur: ['duvar', 'ruzgar'] },
};

const buyuler = {};
for (const s of spells) {
  const m = s.mechanics ?? {};
  const el = new Set();
  for (const t of [m.damageType, ...(m.damageChoices ?? []), m.zone?.damageType].filter(Boolean)) if (ELEMENT[t]) el.add(ELEMENT[t]);
  const tur = new Set();
  if (s.area || m.kind === 'zone') tur.add('alan');
  if (s.area?.shape === 'line') tur.add('isin');
  if (/wall/.test(s.id) || s.area?.shape === 'wall') tur.add('duvar');
  if (GAS.has(s.id)) tur.add('gaz');
  if (m.kind === 'summon') tur.add('cagri');
  const e = ELLE[s.id];
  for (const x of e?.element ?? []) el.add(x);
  for (const x of e?.tur ?? []) tur.add(x);
  if (!el.size && !tur.size) continue;
  buyuler[s.id] = { ...(el.size ? { element: [...el].sort() } : {}), ...(tur.size ? { tur: [...tur].sort() } : {}) };
}

const out = {
  note: 'Kuyruk K55 G2: büyü ve yüzey etiketleri (scripts/k55-buyu-etiketleri.mjs üretir; elle düzenleme betiğin ELLE tablosunda). element: fire, cold, lightning, acid, poison, force, thunder, radiant (ışık), necrotic, psychic, water. tur: alan, isin, duvar, gaz, yuzey, cagri, ruzgar. katman (yüzey ve alanlar): zemin, gaz, nesne — aynı altıgende katman başına en çok bir yüzey (K55 çözücüsü, kural sürümü 26). Etiketsiz büyü etkileşimsiz sayılır.',
  elementler: ['fire', 'cold', 'lightning', 'acid', 'poison', 'force', 'thunder', 'radiant', 'necrotic', 'psychic', 'water'],
  yuzeyler: {
    oil: { katman: 'zemin', etiket: ['yanici'] },
    water: { katman: 'zemin', etiket: ['water'] },
    ice: { katman: 'zemin', etiket: ['cold'] },
    fire: { katman: 'zemin', etiket: ['fire'] },
    slick: { katman: 'zemin', etiket: [] },
    warning: { katman: 'isaret', etiket: [] },
    burningWeb: { katman: 'nesne', etiket: ['fire'] },
    steam: { katman: 'gaz', etiket: ['water'] },
    poison: { katman: 'gaz', etiket: ['poison'] },
  },
  alanlar: {
    'grease': { katman: 'zemin', etiket: ['yanici'] },
    'web': { katman: 'nesne', etiket: ['yanici'] },
    'fog-cloud': { katman: 'gaz', etiket: ['water'] },
    'stinking-cloud': { katman: 'gaz', etiket: ['poison'] },
    'cloudkill': { katman: 'gaz', etiket: ['poison'] },
    'sleet-storm': { katman: 'zemin', etiket: ['cold', 'water'] },
  },
  buyuler,
};
writeFileSync(new URL('../data/buyu-etiketleri.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`${Object.keys(buyuler).length} büyü etiketlendi (${spells.length} büyüden)`);
