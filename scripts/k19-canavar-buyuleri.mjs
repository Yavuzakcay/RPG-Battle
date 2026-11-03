/**
 * Kuyruk 19 (görev 7): SRD 5.2.1 canavar büyüleri → data/canavar-buyuleri.json (elle düzenlenmez).
 * Her canavarın "Spellcasting" eylemi (yetenek, DC, saldırı bonusu, At Will / N/Day listeleri, "level N version")
 * ile bonus eylem ya da tepki olarak tek büyü yapan girdiler ("Misty Step (3/Day). The mage casts Misty Step").
 * Çalıştırma: node scripts/k19-canavar-buyuleri.mjs
 */
import fs from 'node:fs';
import { readingLines } from './srd/pdf.mjs';

const monsters = JSON.parse(fs.readFileSync(new URL('../data/monsters.json', import.meta.url), 'utf8'));
const names = new Map(monsters.map((m) => [m.name, m.id]));
const lines = await readingLines(254, 400);
const SIZE = /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/;
const SECTION = /^(Actions|Bonus Actions|Reactions|Legendary Actions|Traits)$/;
const ENTRY = /^[A-Z][A-Za-z’'\- ]{1,40}( \([^)]*\))?\. /;

let owner = null; let page = 0;
const out = {};
const clean = (s) => s.replace(/\s+/g, ' ').replace(/([a-z])- ([a-z])/g, '$1$2').replace(/ ,/g, ',').replace(/ \)/g, ')').trim();
/** Virgülle ayır (parantez içi korunur). */
function splitList(s) {
  const parts = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => {
    const t = clean(p);
    const name = t.replace(/\s*\(.*$/, '').trim();
    const lv = /level (\d) version/.exec(t);
    const note = /\(([^)]*)\)/.exec(t)?.[1];
    return { name, ...(lv ? { level: Number(lv[1]) } : {}), ...(note && !lv ? { note } : {}) };
  }).filter((x) => x.name);
}
function body(i) {
  const acc = [lines[i].text];
  for (let j = i + 1; j < lines.length; j++) {
    const t = lines[j].text.trim();
    if (SECTION.test(t) || ENTRY.test(t) || names.has(t)) break;
    acc.push(t);
  }
  return clean(acc.join(' '));
}
let section = '';
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].text.trim();
  if (names.has(t) && SIZE.test(lines[i + 1]?.text.trim() ?? '')) { owner = names.get(t); page = lines[i].page; section = ''; continue; }
  if (SECTION.test(t)) { section = t; continue; }
  if (!owner) continue;
  if (/^(Hellfire )?Spellcasting( \([^)]*\))?\. The /.test(t)) {
    const b = body(i);
    const ability = /using (\w+) as the spellcasting ability/.exec(b)?.[1]?.toLowerCase().slice(0, 3);
    const dc = Number(/spell save DC (\d+)/.exec(b)?.[1] ?? 0);
    const attack = /\+(\d+) to hit with spell attacks/.exec(b)?.[1];
    const rec = { ability, dc, ...(attack ? { attack: Number(attack) } : {}), atWill: [], daily: [], page, srdId: owner };
    const parts = b.split(/(?=At Will:|\d\/Day(?: Each)?:)/).slice(1);
    for (const p of parts) {
      const m = /^(At Will|(\d)\/Day(?: Each)?):\s*(.*)$/.exec(p.trim());
      if (!m) continue;
      const list = splitList(m[3].replace(/\.$/, ''));
      if (m[1] === 'At Will') rec.atWill.push(...list);
      else rec.daily.push({ uses: Number(m[2]), spells: list });
    }
    if (/^Hellfire/.test(t)) rec.hellfire = clean(b);
    const prev = out[owner]?.spellcasting;
    if (!prev) out[owner] = { ...(out[owner] ?? {}), spellcasting: rec };
    continue;
  }
  // Tek büyülük bonus eylem / tepki: "Misty Step (3/Day). The mage casts Misty Step, …"
  const one = /^([A-Z][A-Za-z’' ]+?)(?: \((\d)\/Day\))?\. The [a-z ]+ casts ([A-Z][a-z’']+(?: (?:of |the )?[A-Z][a-z’']+)*)(?: \(level (\d) version\))?(?: or ([A-Z][a-z’']+(?: [A-Z][a-z’']+)*))?/.exec(body(i));
  if (one && (section === 'Bonus Actions' || section === 'Reactions' || section === 'Actions')) {
    const list = [{ name: one[3].trim(), ...(one[4] ? { level: Number(one[4]) } : {}) }, ...(one[5] ? [{ name: one[5].trim() }] : [])];
    const key = section === 'Bonus Actions' ? 'bonus' : section === 'Reactions' ? 'reaction' : 'action';
    out[owner] = { ...(out[owner] ?? {}) };
    (out[owner][key] ??= []).push({ entry: one[1].trim(), ...(one[2] ? { uses: Number(one[2]) } : {}), spells: list });
  }
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(new URL('../data/canavar-buyuleri.json', import.meta.url), JSON.stringify({ _not: 'SRD 5.2.1 canavar büyüleri; scripts/k19-canavar-buyuleri.mjs üretir, elle düzenlenmez.', ...sorted }, null, 1) + '\n');
console.log(Object.keys(sorted).length, 'canavar');
