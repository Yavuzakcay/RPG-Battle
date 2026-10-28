/**
 * SRD 5.2.1 ayrıştırıcı (Görev N): docs/SRD_CC_v5.2.1.pdf → data/srd/*.json. Elle yazılmış veri yok; her kayıtta
 * SRD sayfa ve bölüm referansı (`source`). Çalıştırma: `npm run srd`.
 *
 * Üretilenler:
 *   data/srd/classes.json      12 sınıf: temel özellikler, seviye tablosu (1–20, bütün sütunlar), özellik metinleri,
 *                              seçenek listeleri (Metamagic, Eldritch Invocation)
 *   data/srd/subclasses.json   her sınıfın SRD alt sınıfı ve seviyeli özellikleri
 *   data/srd/feats.json        feat'ler (kategori, ön koşul, faydalar, tekrarlanabilir)
 *   data/srd/species.json      türler (Görev R4): yaratık türü, boy, hız, özellikler (Breath Weapon, Darkvision…)
 *   data/srd/spells.json       büyüler (seviye, okul, sınıflar, süre, menzil, bileşenler, süre, metin, yukarı slot)
 *   data/srd/magic-items.json  sihirli eşyalar (tür, nadirlik, ayarlanma, metin)
 *   data/srd/weapons.json      silah tablosu (zar, tür, özellikler, mastery, ağırlık, fiyat)
 *   data/srd/armor.json        zırh tablosu (AC, Güç, Gizlilik, ağırlık, fiyat)
 * Ayrıştırılamayan ya da şüpheli kayıtlar `data/srd/rapor.json`'a yazılır ve konsola basılır.
 */
import fs from 'node:fs';
import { paragraphs, readingLines, tableRows } from './srd/pdf.mjs';

const OUT = new URL('../data/srd/', import.meta.url);
const problems = [];
/** Bilerek atlanan (kayıt olmayan) bölümler: büyü ve eşya içindeki yaratık stat blokları. */
const skipped = [];
const warn = (where, what) => problems.push({ where, what });

const slug = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = (s) => (/^[+-]?\d+$/.test(s) ? Number(s) : s === '—' ? null : s);
const isBody = (l) => l.kind.startsWith('body');
/** Virgülle ayrılmış adlar (parantez içindeki virgüller bölünmez). */
function splitNames(s) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter((x) => x && x !== '—');
}
const textOf = (ps) => ps.map((p) => p.text).join('\n');

const CLASS_NAMES = ['Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];

// ------------------------------------------------------------------ sınıf tablosu

/**
 * "<Sınıf> Features" tablosu: başlık satırları (sansB) sütun adlarını, veri satırları (sans) seviye, yeterlilik,
 * özellik adları ve sütun değerlerini verir. Değer sütunları veri hücrelerinin x merkezlerinden kümelenir;
 * başlık sözcükleri en yakın sütuna atanır. Alt satıra taşan özellik adları önceki satıra eklenir.
 */
async function classTable(page, capY, className) {
  const rows = (await tableRows(page, (it) => (it.kind === 'sans' || it.kind === 'sansB') && it.y < capY - 1 && it.y > capY - 460));
  // Tablonun sonu: satırlar arası büyük boşluk.
  const kept = [];
  for (const r of rows) {
    if (kept.length > 0 && kept[kept.length - 1].y - r.y > 22) break;
    kept.push(r);
  }
  const header = kept.filter((r) => r.cells.every((c) => c.kind === 'sansB'));
  const data = kept.filter((r) => !r.cells.every((c) => c.kind === 'sansB'));
  const featHead = header.flatMap((r) => r.cells).find((c) => c.text.includes('Class Features'));
  if (!featHead) { warn(`${className} tablosu`, 'Class Features sütunu bulunamadı'); return null; }
  const labels = header.flatMap((r) => r.cells.map((c) => ({ ...c, y: r.y })))
    .filter((c) => c.x > featHead.x + featHead.w + 5 && !/Spell Slots/.test(c.text));
  const valueStart = Math.min(...labels.map((c) => c.x)) - 18;
  // Satırlar
  const out = [];
  for (const r of data) {
    const first = r.cells[0];
    const isRow = /^\d{1,2}$/.test(first.text) && first.x < featHead.x - 20;
    const feats = r.cells.filter((c) => c.x >= featHead.x - 5 && c.x < valueStart && !(isRow && (c === first || /^\+\d$/.test(c.text))));
    const values = r.cells.filter((c) => c.x >= valueStart);
    if (isRow) {
      const prof = r.cells.find((c) => /^\+\d$/.test(c.text));
      out.push({ level: Number(first.text), proficiency: prof ? Number(prof.text) : null, featureText: feats.map((c) => c.text).join(' '), values: [...values] });
    } else if (out.length > 0) {
      const last = out[out.length - 1];
      last.featureText = `${last.featureText} ${feats.map((c) => c.text).join(' ')}`.trim();
      last.values.push(...values);
    }
  }
  // Değer sütunları: x merkezlerinin kümeleri.
  const centers = out.flatMap((r) => r.values.map((c) => c.x + c.w / 2)).sort((a, b) => a - b);
  const clusters = [];
  for (const x of centers) {
    const last = clusters[clusters.length - 1];
    if (last && x - last.max < 9) { last.max = x; last.xs.push(x); } else clusters.push({ min: x, max: x, xs: [x] });
  }
  const colX = clusters.map((c) => c.xs.reduce((a, b) => a + b, 0) / c.xs.length);
  const nearest = (x) => colX.reduce((best, cx, i) => (Math.abs(cx - x) < Math.abs(colX[best] - x) ? i : best), 0);
  const names = colX.map(() => []);
  const slotHeader = header.some((r) => r.cells.some((c) => /Spell Slots/.test(c.text)));
  for (const l of [...labels].sort((a, b) => b.y - a.y)) names[nearest(l.x + l.w / 2)].push(l.text);
  const columns = names.map((n) => {
    const t = n.join(' ');
    return slotHeader && /^\d$/.test(t) ? `slot${t}` : t;
  });
  if (columns.some((c) => c === '')) warn(`${className} tablosu`, `adsız sütun: ${JSON.stringify(columns)}`);
  const table = out.map((r) => {
    const vals = {};
    for (const c of r.values) {
      const i = nearest(c.x + c.w / 2);
      const key = columns[i];
      vals[key] = vals[key] === undefined ? num(c.text) : `${vals[key]} ${c.text}`;
    }
    for (const k of columns) if (!(k in vals)) warn(`${className} ${r.level}. seviye`, `"${k}" sütunu boş`);
    return { level: r.level, proficiency: r.proficiency, features: splitNames(r.featureText), values: vals };
  });
  if (table.length !== 20 || table.some((r, i) => r.level !== i + 1)) warn(`${className} tablosu`, `seviye satırları eksik: ${table.map((r) => r.level).join(',')}`);
  return { page, columns, rows: table };
}

// ------------------------------------------------------------------ bölümleri gezme

/** Satırları başlıklara göre bölümler: her h12 bir kayıt; kaydın meta satırları (italik) ve gövdesi. */
function entriesOf(lines, { stopKinds = ['h12', 'h14', 'h18', 'h26'] } = {}) {
  const out = [];
  let cur = null;
  for (const l of lines) {
    if (l.kind === 'h12') {
      // Ad iki satıra taşabilir (ardışık h12, gövde gelmeden).
      if (cur && cur.body.length === 0 && cur.meta.length === 0 && l.page === cur.page && l.col === cur.col && cur.y - l.y < 20) { cur.name += ` ${l.text}`; cur.y = l.y; continue; }
      cur = { name: l.text, page: l.page, col: l.col, y: l.y, meta: [], fields: [], body: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    if (stopKinds.includes(l.kind)) { cur = null; continue; }
    if (l.kind === 'bodyI' && cur.body.length === 0 && cur.fields.length === 0) { cur.meta.push(l); continue; }
    const field = /^(Casting Time|Range|Components?|Duration):/.test(l.text);
    if (cur.body.length === 0 && (field || ((l.kind === 'sansB' || l.kind === 'sans') && cur.fields.length > 0) || l.kind === 'sansB')) { cur.fields.push(l); continue; }
    if (isBody(l)) cur.body.push(l);
  }
  return out;
}

const unwrap = (t) => t.replace(/(\w)- ([a-z])/g, '$1$2').replace(/\s+/g, ' ').trim();
const metaText = (e) => unwrap(e.meta.map((l) => l.text).join(' '));

async function parseClasses(lines) {
  const classes = [];
  const subclasses = [];
  const idx = [];
  lines.forEach((l, i) => { if (l.kind === 'h18' && CLASS_NAMES.includes(l.text)) idx.push(i); });
  const endAll = lines.findIndex((l) => l.kind === 'h26' && l.text.startsWith('Character Origins'));
  for (let k = 0; k < idx.length; k++) {
    const sec = lines.slice(idx[k], k + 1 < idx.length ? idx[k + 1] : endAll);
    const name = sec[0].text;
    const id = slug(name);
    // Temel özellikler tablosu: anahtar (sansB) ve değer (sans) satırları, "Becoming a" başlığına dek.
    const core = {};
    let key = null;
    for (const l of sec.slice(1)) {
      if (l.kind === 'h14') break;
      if (l.kind === 'cap') continue;
      const keySpans = l.spans.filter((s) => s.kind === 'sansB');
      const valSpans = l.spans.filter((s) => s.kind === 'sans' || s.kind === 'sansI');
      if (keySpans.length > 0 && valSpans.length > 0) { key = keySpans.map((s) => s.text).join(' '); core[key] = valSpans.map((s) => s.text).join(' '); }
      else if (keySpans.length > 0 && key) { const v = core[key]; delete core[key]; key = `${key} ${keySpans.map((s) => s.text).join(' ')}`; core[key] = v; }
      else if (valSpans.length > 0 && key) core[key] = unwrap(`${core[key]} ${valSpans.map((s) => s.text).join(' ')}`);
    }
    // Seviye tablosu
    const cap = sec.find((l) => l.kind === 'cap' && l.text === `${name} Features`);
    const table = cap ? await classTable(cap.page, cap.y, name) : null;
    if (!cap) warn(name, 'özellik tablosu başlığı bulunamadı');
    // Özellikler, alt sınıf ve seçenek listeleri
    const features = [];
    const options = [];
    let sub = null;
    let mode = 'none';
    let group = null;
    const entries = [];
    for (let i = 1; i < sec.length; i++) {
      const l = sec[i];
      if (l.kind === 'h14') {
        const t = l.text;
        if (t === `${name} Class Features`) { mode = 'class'; continue; }
        if (t.startsWith(`${name} Subclass:`)) {
          let subName = t.slice(`${name} Subclass:`.length).trim();
          // Ad sonraki başlık satırlarına taşabilir ("Warrior of the" + "Open Hand").
          while (sec[i + 1]?.kind === 'h14' && sec[i + 1].page === l.page && sec[i + 1].col === l.col && l.y - sec[i + 1].y < 40) {
            subName = `${subName} ${sec[i + 1].text}`.trim();
            i++;
          }
          sub = { id: slug(subName), name: subName, classId: id, page: l.page, flavor: '', intro: '', features: [] };
          subclasses.push(sub);
          mode = 'subclass';
          continue;
        }
        if (/Options$/.test(t)) { mode = 'options'; group = t; continue; }
        mode = 'other';
        continue;
      }
      if (mode === 'subclass' && !sub.features.length && l.kind === 'bodyI' && !sub.flavor) { sub.flavor = l.text; continue; }
      entries.push({ l, mode, group, sub });
    }
    // Kayıtlar: aynı moddaki ardışık satırları gruplayarak h12'den h12'ye.
    const runs = [];
    for (const e of entries) {
      const last = runs[runs.length - 1];
      if (last && last.mode === e.mode && last.group === e.group && last.sub === e.sub) last.lines.push(e.l);
      else runs.push({ mode: e.mode, group: e.group, sub: e.sub, lines: [e.l] });
    }
    for (const run of runs) {
      if (run.mode === 'subclass') {
        const firstH = run.lines.findIndex((l) => l.kind === 'h12');
        run.sub.intro = textOf(paragraphs(run.lines.slice(0, firstH < 0 ? undefined : firstH).filter(isBody)));
      }
      for (const e of entriesOf(run.lines)) {
        const m = /^Level (\d+): (.+)$/.exec(e.name);
        const ps = paragraphs(e.body);
        const source = { page: e.page, section: `${name}${run.sub ? ` > ${run.sub.name}` : ''} > ${e.name}` };
        if ((run.mode === 'class' || run.mode === 'subclass') && m) {
          const f = { id: slug(m[2]), name: m[2], level: Number(m[1]), text: textOf(ps), parts: ps.filter((p) => p.label).map((p) => p.label), source };
          if (run.mode === 'class') features.push(f); else run.sub.features.push(f);
        } else if (run.mode === 'options') {
          const meta = metaText(e);
          options.push({ group: run.group, id: slug(e.name), name: e.name, ...(meta ? { meta } : {}), text: textOf(ps), source: { page: e.page, section: `${name} > ${run.group} > ${e.name}` } });
        } else if (run.mode === 'class' || run.mode === 'subclass') {
          if (!/^As a (Level 1|Multiclass)/.test(e.name)) skipped.push(`${name} > ${e.name}: yan kutu (seviye özelliği değil)`);
        }
      }
    }
    // Tablo ile metin tutarlılığı: tablodaki her özelliğin metni olmalı.
    if (table) {
      for (const r of table.rows) {
        for (const fname of r.features) {
          const base = fname.replace(/\s*\(.*\)$/, '');
          if (/^(Subclass feature|Ability Score Improvement|Epic Boon)$/.test(base) || base === `${name} Subclass`) continue;
          if (!features.some((f) => f.name.replace(/\s*\(.*\)$/, '') === base || slug(f.name) === slug(base))) {
            // Aynı adlı özellik daha düşük seviyede tanımlanmış olabilir (Expertise, Metamagic, Improved Brutal Strike).
            if (!features.some((f) => slug(f.name) === slug(base.replace(/^(Two|Three) Extra Attacks$/, 'Extra Attack')))) warn(`${name} ${r.level}. seviye`, `tablodaki "${fname}" için metin yok`);
          }
        }
      }
    }
    classes.push({
      id, name, source: { page: sec[0].page, section: name }, core,
      ...(table ? { table: { columns: table.columns, rows: table.rows, source: { page: table.page, section: `${name} > ${name} Features` } } } : {}),
      features, ...(options.length ? { options } : {}),
      subclass: sub?.id ?? null,
    });
  }
  return { classes, subclasses };
}

// ------------------------------------------------------------------ feat'ler

function parseFeats(lines) {
  const start = lines.findIndex((l) => l.kind === 'h18' && l.text === 'Feat Descriptions');
  const end = lines.findIndex((l, i) => i > start && l.kind === 'h26');
  const sec = lines.slice(start, end);
  const feats = [];
  let category = null;
  const groups = [];
  for (const l of sec) {
    if (l.kind === 'h14') { category = l.text.replace(/ Feats$/, ''); groups.push({ category, lines: [] }); continue; }
    groups[groups.length - 1]?.lines.push(l);
  }
  for (const g of groups) {
    if (g.category === 'Parts of a Feat') continue;
    for (const e of entriesOf(g.lines)) {
      const meta = metaText(e);
      const m = /^(.+?) Feat(?: \(Prerequisite: (.+)\))?$/.exec(meta);
      if (!m) warn(`Feat ${e.name}`, `kategori satırı okunamadı: "${meta}"`);
      const ps = paragraphs(e.body);
      feats.push({
        id: slug(e.name), name: e.name, category: m?.[1] ?? g.category,
        ...(m?.[2] ? { prerequisite: m[2] } : {}),
        repeatable: ps.some((p) => p.label === 'Repeatable'),
        benefits: ps.filter((p) => p.label && p.label !== 'Repeatable').map((p) => ({ name: p.label, text: p.text.slice(p.label.length + 1).trim() })),
        text: textOf(ps),
        source: { page: e.page, section: `Feats > ${g.category} Feats > ${e.name}` },
      });
    }
  }
  return feats;
}

// ------------------------------------------------------------------ türler

/** "Species Descriptions": her tür (h12), Creature Type / Size / Speed satırları ve özellikleri (kalın italik başlıklı paragraflar). */
function parseSpecies(lines) {
  const start = lines.findIndex((l) => l.kind === 'h14' && l.text === 'Species Descriptions');
  const end = lines.findIndex((l, i) => i > start && (l.kind === 'h26' || l.kind === 'h18' || (l.kind === 'h14' && i > start)));
  const out = [];
  for (const e of entriesOf(lines.slice(start, end))) {
    const field = (k) => unwrap(e.fields.map((l) => l.text).find((t) => t.startsWith(`${k}:`))?.slice(k.length + 1) ?? '');
    const ps = paragraphs(e.body).filter((p) => p.label);
    if (ps.length === 0) { warn(`Tür ${e.name}`, 'özellik bulunamadı'); continue; }
    out.push({
      id: slug(e.name), name: e.name, creatureType: field('Creature Type'), size: field('Size'), speed: field('Speed'),
      traits: ps.map((p) => ({ id: slug(p.label), name: p.label, text: p.text.slice(p.label.length + 1).trim() })),
      source: { page: e.page, section: `Character Origins > Species Descriptions > ${e.name}` },
    });
  }
  return out;
}

// ------------------------------------------------------------------ büyüler

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];

function parseSpells(lines) {
  const start = lines.findIndex((l) => l.kind === 'h18' && l.text === 'Spell Descriptions');
  const end = lines.findIndex((l, i) => i > start && l.kind === 'h26');
  const out = [];
  for (const e of entriesOf(lines.slice(start, end))) {
    const meta = metaText(e);
    let m = /^Level (\d) (\w+) \((.+)\)$/.exec(meta);
    let level, school, classes;
    if (m) { level = Number(m[1]); school = m[2]; classes = m[3]; }
    else if ((m = /^(\w+) Cantrip \((.+)\)$/.exec(meta))) { level = 0; school = m[1]; classes = m[2]; }
    else if (!meta) { skipped.push(`Büyü bölümünde stat blok: ${e.name.slice(0, 40)}`); continue; }
    else { warn(`Büyü ${e.name}`, `seviye/okul satırı okunamadı: "${meta}"`); continue; }
    if (!SCHOOLS.includes(school)) warn(`Büyü ${e.name}`, `bilinmeyen okul: ${school}`);
    const fields = {};
    let key = null;
    for (const l of e.fields) {
      const f = /^(Casting Time|Range|Components?|Duration):\s*(.*)$/.exec(l.text);
      if (f) {
        // SRD'de Barkskin'de "Component:" yazım hatası var; anahtar tekilleştirilir.
        key = f[1] === 'Component' ? 'Components' : f[1];
        fields[key] = f[2];
      } else if (key) fields[key] = `${fields[key]} ${l.text}`.trim();
    }
    for (const k of ['Casting Time', 'Range', 'Components', 'Duration']) if (!fields[k]) warn(`Büyü ${e.name}`, `${k} yok`);
    const ps = paragraphs(e.body);
    const higher = ps.find((p) => p.label === 'Using a Higher-Level Spell Slot');
    const upgrade = ps.find((p) => p.label === 'Cantrip Upgrade');
    const body = ps.filter((p) => p !== higher && p !== upgrade);
    const fix = (s) => s?.replace(/(\w)- (\w)/g, '$1$2');
    out.push({
      id: slug(e.name), name: e.name, level, school, classes: classes.split(',').map((c) => c.trim()),
      castingTime: fix(fields['Casting Time']), range: fix(fields.Range), components: fix(fields.Components), duration: fix(fields.Duration),
      concentration: /^Concentration/.test(fields.Duration ?? ''), ritual: /Ritual/.test(fields['Casting Time'] ?? ''),
      text: textOf(body),
      ...(higher ? { higherLevel: higher.text.slice(higher.label.length + 1).trim() } : {}),
      ...(upgrade ? { cantripUpgrade: upgrade.text.slice(upgrade.label.length + 1).trim() } : {}),
      source: { page: e.page, section: `Spells > Spell Descriptions > ${e.name}` },
    });
  }
  return out;
}

// ------------------------------------------------------------------ sihirli eşyalar

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];

function parseItems(lines) {
  const start = lines.findIndex((l) => l.kind === 'h18' && /^Magic Items A/.test(l.text));
  const sec = lines.slice(start);
  const out = [];
  for (const e of entriesOf(sec)) {
    const meta = metaText(e);
    if (!meta) { skipped.push(`Eşya bölümünde stat blok: ${e.name.slice(0, 40)}`); continue; }
    const m = /^(.+?), (.+)$/.exec(meta);
    const type = m?.[1] ?? meta;
    const rest = m?.[2] ?? '';
    const rarity = RARITIES.filter((r) => rest.includes(r) && !(r === 'Rare' && /Very Rare/.test(rest) && !/(^|[^y] )Rare/.test(rest.replace(/Very Rare/g, ''))));
    const att = /\(Requires Attunement(?: by (.+?))?\)/.exec(rest);
    if (rarity.length === 0 && /Rarity Varies/.test(rest)) rarity.push('Varies');
    if (rarity.length === 0) warn(`Eşya ${e.name}`, `nadirlik okunamadı: "${meta}"`);
    out.push({
      id: slug(e.name), name: e.name, type, rarity: rarity.length === 1 ? rarity[0] : rarity.length ? 'Varies' : null,
      ...(rarity.length > 1 ? { rarityText: rest.replace(/\s*\(Requires Attunement.*?\)/, '') } : {}),
      attunement: !!att, ...(att?.[1] ? { attunementBy: att[1] } : {}),
      text: textOf(paragraphs(e.body)),
      source: { page: e.page, section: `Magic Items > Magic Items A–Z > ${e.name}` },
    });
  }
  return out;
}

// ------------------------------------------------------------------ silah ve zırh

async function parseWeapons(lines) {
  const cap = lines.find((l) => l.kind === 'cap' && l.text === 'Weapons');
  const rows = await tableRows(cap.page, (it) => (it.kind === 'sans' || it.kind === 'sansI' || it.kind === 'sansB') && it.y < cap.y);
  const head = rows.find((r) => r.cells.some((c) => c.text === 'Mastery'));
  const masteryX = head.cells.find((c) => c.text === 'Mastery').x;
  const propX = head.cells.find((c) => c.text === 'Properties').x;
  const out = [];
  let category = null;
  for (const r of rows) {
    if (r === head) continue;
    if (r.cells.length === 1 && r.cells[0].kind === 'sansI') { category = r.cells[0].text; continue; }
    const c = r.cells;
    if (c[0].x > propX - 10) { // taşan özellik satırı
      const last = out[out.length - 1];
      if (last) last.properties = `${last.properties} ${c.map((x) => x.text).join(' ')}`.replace(/,\s*$/, ',').trim();
      continue;
    }
    const left = c.filter((x) => x.x < masteryX - 5).flatMap((x) => {
      const d = /^(\d+(?:d\d+)?) (\w+)$/.exec(x.text);
      return d ? [{ ...x, text: d[1] }, { ...x, text: d[2] }] : [x];
    });
    const right = c.filter((x) => x.x >= masteryX - 5);
    if (left.length < 4 || right.length < 3) { warn('Silah tablosu', `satır okunamadı: ${c.map((x) => x.text).join(' | ')}`); continue; }
    out.push({
      id: slug(left[0].text), name: left[0].text, category, damage: left[1].text, damageType: left[2].text,
      properties: left.slice(3).map((x) => x.text).join(' '), mastery: right[0].text, weight: right[1].text, cost: right[2].text,
      source: { page: cap.page, section: 'Equipment > Weapons > Weapons table' },
    });
  }
  for (const w of out) w.properties = w.properties === '—' ? [] : splitNames(w.properties);
  // Mastery özelliklerinin açıklamaları
  const ms = lines.findIndex((l) => l.kind === 'h14' && l.text === 'Mastery Properties');
  const masteries = entriesOf(lines.slice(ms + 1, lines.findIndex((l, i) => i > ms && (l.kind === 'h18' || l.kind === 'cap'))))
    .filter((e) => e.page <= cap.page && e.body.length > 0)
    .map((e) => ({ id: slug(e.name), name: e.name, text: textOf(paragraphs(e.body)), source: { page: e.page, section: `Equipment > Weapons > Mastery Properties > ${e.name}` } }));
  return { weapons: out, masteries };
}

async function parseArmor(lines) {
  const cap = lines.find((l) => l.kind === 'cap' && l.text === 'Armor' && l.page > 90);
  const rows = await tableRows(cap.page, (it) => (it.kind === 'sans' || it.kind === 'sansI' || it.kind === 'sansB') && it.y < cap.y && it.x < 297);
  const out = [];
  let category = null;
  const rightRows = await tableRows(cap.page, (it) => (it.kind === 'sans' || it.kind === 'sansI' || it.kind === 'sansB') && it.y < cap.y && it.x >= 297);
  for (const r of rows) {
    if (r.cells.every((c) => c.kind === 'sansB')) continue;
    if (r.cells.length === 1 && r.cells[0].kind === 'sansI') { category = r.cells[0].text; continue; }
    // Sağ sütundaki aynı satır (Güç, Gizlilik, ağırlık, fiyat)
    const right = rightRows.find((x) => Math.abs(x.y - r.y) < 2.5);
    out.push({
      id: slug(r.cells[0].text), name: r.cells[0].text, category, ac: r.cells.slice(1).map((c) => c.text).join(' '),
      ...(right ? { extra: right.cells.map((c) => c.text) } : {}),
      source: { page: cap.page, section: 'Equipment > Armor > Armor table' },
    });
  }
  const head = rightRows.find((r) => r.cells.every((c) => c.kind === 'sansB'));
  const cols = head ? head.cells.map((c) => c.text) : [];
  for (const a of out) {
    if (!a.extra) { warn(`Zırh ${a.name}`, 'sağ sütun bulunamadı'); continue; }
    if (a.extra.length !== cols.length) warn(`Zırh ${a.name}`, `sütun sayısı ${a.extra.length}, başlık ${cols.join('/')}`);
    a.columns = Object.fromEntries(cols.map((c, i) => [c, a.extra[i] ?? null]));
    delete a.extra;
  }
  return out;
}

// ------------------------------------------------------------------ donanım (Adventuring Gear)

/** "Adventuring Gear" bölümünün kayıtları: ad (fiyat parantezi ayrılır), fiyat, metin. */
function parseGear(lines) {
  const start = lines.findIndex((l) => l.kind === 'h18' && l.text === 'Adventuring Gear');
  const end = lines.findIndex((l, i) => i > start && l.kind === 'h18');
  return entriesOf(lines.slice(start, end)).map((e) => {
    const m = /^(.+?) \((.+)\)$/.exec(e.name);
    const name = m ? m[1] : e.name;
    return {
      id: slug(name), name, ...(m ? { cost: m[2] } : {}), text: textOf(paragraphs(e.body)),
      source: { page: e.page, section: `Equipment > Adventuring Gear > ${name}` },
    };
  });
}

// ------------------------------------------------------------------ ana akış

const lines = await readingLines(28, 253);
const { classes, subclasses } = await parseClasses(lines);
const feats = parseFeats(lines);
const species = parseSpecies(lines);
const spells = parseSpells(lines);
const items = parseItems(lines);
const { weapons, masteries } = await parseWeapons(lines);
const armor = await parseArmor(lines);
const gear = parseGear(lines);

/**
 * Motorun kullandığı özet (metinsiz): sınıf başına seviye satırları (özellik kimlikleri ve sütun değerleri),
 * alt sınıf ve özellikleri, ASI/Epic Boon seviyeleri. Oyun bunu tembel yükler (`loadClassData`).
 */
function progressionOf(cls, subs) {
  const fid = (n) => slug(n.replace(/\s*\(.*\)$/, ''));
  const rows = cls.table.rows.map((r) => ({
    level: r.level,
    features: r.features.map((n) => ({ id: fid(n), name: n })),
    values: r.values,
  }));
  const levelsOf = (id) => rows.filter((r) => r.features.some((f) => f.id === id)).map((r) => r.level);
  const sub = subs.find((x) => x.classId === cls.id);
  const hd = /^D(\d+)/.exec(cls.core['Hit Point Die'] ?? '');
  if (!hd) warn(cls.name, 'Hit Point Die okunamadı');
  return {
    id: cls.id, name: cls.name, hitDie: hd ? Number(hd[1]) : null,
    subclassLevel: levelsOf(`${cls.id}-subclass`)[0] ?? null,
    asiLevels: levelsOf('ability-score-improvement'),
    epicBoonLevels: levelsOf('epic-boon'),
    subclassFeatureLevels: levelsOf('subclass-feature'),
    columns: cls.table.columns,
    rows,
    subclasses: sub ? [{ id: sub.id, name: sub.name, features: sub.features.map((f) => ({ id: f.id, name: f.name, level: f.level })), source: { page: sub.page } }] : [],
    source: cls.table.source,
  };
}
const progression = classes.map((c) => progressionOf(c, subclasses));
for (const p of progression) {
  const subLevels = [...new Set(p.subclasses[0]?.features.map((f) => f.level) ?? [])].sort((a, b) => a - b);
  const expected = [p.subclassLevel, ...p.subclassFeatureLevels].filter((x) => x !== null);
  if (JSON.stringify(subLevels) !== JSON.stringify(expected)) warn(`${p.name} alt sınıfı`, `özellik seviyeleri ${subLevels.join(',')}, tabloda ${expected.join(',')}`);
}

fs.mkdirSync(OUT, { recursive: true });
const write = (name, data) => {
  fs.writeFileSync(new URL(name, OUT), `${JSON.stringify(data, null, 1)}\n`);
  console.log(`${name}: ${Array.isArray(data) ? data.length : Object.keys(data).length} kayıt`);
};
const meta = { source: 'docs/SRD_CC_v5.2.1.pdf', license: 'CC-BY-4.0', generatedBy: 'scripts/srd-ayristir.mjs' };
write('classes.json', { ...meta, classes });
write('subclasses.json', { ...meta, subclasses });
write('feats.json', { ...meta, feats });
write('species.json', { ...meta, species });
write('spells.json', { ...meta, spells });
write('magic-items.json', { ...meta, items });
write('weapons.json', { ...meta, weapons, masteries });
write('armor.json', { ...meta, armor });
write('gear.json', { ...meta, gear });
write('progression.json', { ...meta, classes: progression });
write('rapor.json', { ...meta, problems, skipped });
console.log(`Sınıf ${classes.length}, alt sınıf ${subclasses.length}, feat ${feats.length}, büyü ${spells.length}, eşya ${items.length}, silah ${weapons.length}, mastery ${masteries.length}, zırh ${armor.length}, donanım ${gear.length}`);
console.log(`Sorun: ${problems.length}`);
for (const p of problems) console.log(`  - ${p.where}: ${p.what}`);
