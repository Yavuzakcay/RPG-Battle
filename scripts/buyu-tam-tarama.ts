/**
 * Gece kuyruğu Aşama 3a: SRD 5.2.1'in her büyüsünü (0–9) oyun verisiyle ALAN ALAN karşılaştırır (otomatik fark).
 * Çıktı: `harita/belgeler/BUYU-TAM-TARAMA.md` (otomatik bölüm; elle doğrulama bölümleri `--elle` dosyasından eklenir).
 * Çalıştırma: `npx vite-node scripts/buyu-tam-tarama.ts` (salt okuma; veri değiştirmez).
 *
 * Karşılaştırılan alanlar: seviye, okul, sınıf listesi, döküm süresi, ritüel, konsantrasyon, menzil, alan şekli/boyutu, save
 * yeteneği, saldırı türü (yakın/menzilli büyü saldırısı), ilk hasar zarı ve türü, yukarı slot (SRD "Using a Higher-Level Spell
 * Slot" metni ↔ `mechanics.upcast.applied`), cantrip ölçeklemesi (`scalesWithLevel` / `upgrade`), maliyetli materyal (GP).
 * Mekanik, güncel kural sürümündeki birleşik hâliyle (`mechanicsAt`) okunur.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mechanicsAt } from '../src/battle/spellVersion';
import { CURRENT_RULES } from '../src/battle/ruleVersion';
import type { Spell } from '../src/data/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = <T>(p: string): T => JSON.parse(readFileSync(join(ROOT, p), 'utf8')) as T;

interface SrdSpell { id: string; name: string; level: number; school: string; classes: string[]; castingTime: string; range: string;
  components: string; duration: string; concentration: boolean; ritual: boolean; text: string; higherLevel?: string; cantripUpgrade?: string;
  source: { page: number } }
const srd = read<{ spells: SrdSpell[] }>('data/srd/spells.json').spells;
const game: Array<Spell & { file: string }> = [
  ...read<Spell[]>('data/spells.json').map((s) => ({ ...s, file: 'spells.json' })),
  ...read<Spell[]>('data/spells-45.json').map((s) => ({ ...s, file: 'spells-45.json' })),
  ...read<Spell[]>('data/spells-69.json').map((s) => ({ ...s, file: 'spells-69.json' })),
];
const byRef = new Map(game.map((g) => [g.srd, g]));
const summonsData = read<{ summons: Record<string, { setup?: boolean }> }>('data/summons.json').summons;
const SETUP = new Set(Object.entries(summonsData).filter(([, v]) => v.setup).map(([k]) => k));
const COND_SPELLS = new Set(Object.keys(read<{ spells: Record<string, unknown> }>('data/condition-effects.json').spells));
const state = { kuralSurumu: Math.max(CURRENT_RULES, 102) };

const CLASS = { Bard: 'Brd', Cleric: 'Clr', Druid: 'Drd', Paladin: 'Pal', Ranger: 'Rgr', Sorcerer: 'Sor', Warlock: 'Wlk', Wizard: 'Wiz' } as Record<string, string>;
const ABIL = { Strength: 'str', Dexterity: 'dex', Constitution: 'con', Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha' } as Record<string, string>;

/** SRD menzili ft (Self 0, Touch 5, mil = 5280; "Self (15-foot Cone)" → 0, alan ayrı). */
function rangeFt(r: string): number | null {
  if (/^Self/i.test(r)) return 0;
  if (/^Touch/i.test(r)) return 5;
  const m = /([\d,]+)\s*(feet|foot|mile|miles)/i.exec(r);
  if (!m) return null;
  const n = Number(m[1]!.replace(/,/g, ''));
  return /mile/i.test(m[2]!) ? n * 5280 : n;
}
const castNorm = (c: string): string => {
  const s = c.toLowerCase();
  if (s.startsWith('bonus action')) return 'bonus';
  if (s.startsWith('reaction')) return 'reaction';
  if (s.startsWith('action')) return 'action';
  return 'long';
};
const gameCast = (c: string): string => (c === 'bonus' || c === 'reaction' || c === 'action' ? c : 'long');

/** Metindeki ilk alan: "20-foot-radius Sphere", "15-foot Cone", "100-foot-long, 5-foot-wide Line", "Cube 20 feet". */
function srdArea(s: SrdSpell): { shape: string; sizeFt: number } | null {
  const t = `${s.range} ${s.text}`;
  const re = /(\d+)-foot(?:-radius|-long)?(?:,\s*\d+-foot-(?:wide|high|tall))?(?:,?\s*\d+-foot-(?:wide|high|tall))?\s+(Sphere|Cone|Cube|Line|Cylinder|Emanation)/i;
  const m = re.exec(t);
  if (!m) return null;
  return { shape: m[2]!.toLowerCase(), sizeFt: Number(m[1]) };
}
function srdSave(s: SrdSpell): string | null {
  const m = /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/.exec(s.text);
  return m ? ABIL[m[1]!] ?? null : null;
}
function srdAttack(s: SrdSpell): 'melee' | 'ranged' | null {
  const m = /(melee|ranged) spell attack/i.exec(s.text);
  return m ? (m[1]!.toLowerCase() as 'melee' | 'ranged') : null;
}
function srdDamage(s: SrdSpell): { dice: string; type: string } | null {
  const m = /(\d+d\d+)(?:\s*\+\s*[^)]*?)?\s+(Acid|Bludgeoning|Cold|Fire|Force|Lightning|Necrotic|Piercing|Poison|Psychic|Radiant|Slashing|Thunder)\s+damage/.exec(s.text);
  return m ? { dice: m[1]!, type: m[2]!.toLowerCase() } : null;
}
function srdCostlyMaterial(s: SrdSpell): number | null {
  const m = /worth\s+([\d,]+)\+?\s*GP/i.exec(s.components);
  return m ? Number(m[1]!.replace(/,/g, '')) : null;
}

/** SRD süresi (tur); anlık/özel null. */
function srdRounds(d: string): number | null {
  const m = /(\d+)\s*(round|minute|hour)/i.exec(d);
  if (!m) return null;
  const n = Number(m[1]);
  return /round/i.test(m[2]!) ? n : /minute/i.test(m[2]!) ? n * 10 : n * 600;
}
/** Mekanikte ilk süre (tur): etki, başarısızlık etkisi, alan, güçlendirme. */
function mechRounds(m: Record<string, unknown>): number | null {
  const pick = (o: unknown): number | null => (o && typeof o === 'object' && typeof (o as { rounds?: unknown }).rounds === 'number' ? (o as { rounds: number }).rounds : null);
  return pick(m.effect) ?? pick(m.failEffect) ?? pick(m.selfBuff) ?? pick(m.zone) ?? null;
}

/** Yukarı slotu `applied` bayrağı olmadan uygulayan kod yolları (elle doğrulandı; gerekçe metni). */
function upcastElsewhere(id: string, m: Record<string, unknown>): string | null {
  const up = (m.upcast ?? {}) as { targets?: number; hp?: number };
  if (m.kind === 'effect' && (up.targets || up.hp)) return 'etki hedef/HP: spells.ts `effectTargets`, `hp_boosted`';
  if ((m.selfBuff as { upcastDice?: string } | undefined)?.upcastDice) return 'güçlendirme zarı: executeBuff `upcastDice`';
  if (m.kind === 'dispel') return 'Dispel Magic: slot seviyesine dek kendiliğinden (executeDispel)';
  if (id === 'animate-dead') return 'çağrı sayısı: data/summons.json `count.perLevel`';
  if (m.kind === 'summon') return 'çağrı stat bloğu slot seviyesiyle (data/summons.json)';
  return null;
}

type Row = { id: string; name: string; level: number; file: string; durum: string; farklar: string[]; notlar: string[] };
const rows: Row[] = [];
for (const s of srd.slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))) {
  const g = byRef.get(`spells:${s.id}`);
  if (!g) { rows.push({ id: s.id, name: s.name, level: s.level, file: '', durum: 'eksik', farklar: ['oyunda kayıt yok'], notlar: [] }); continue; }
  // `upgrade` (Kuyruk 19, `spellsK19` varsayılan açık) yapımda birleşir (`castSpell`).
  const m0 = mechanicsAt(state, g) as Record<string, unknown> & Spell['mechanics'];
  const m = (m0.upgrade ? { ...m0, ...(m0.upgrade as object), upgrade: undefined } : m0) as typeof m0;
  const f: string[] = [];
  const n: string[] = [];
  const off = !!m.offCombat;
  if (g.level !== s.level) f.push(`seviye ${g.level} ≠ SRD ${s.level}`);
  if ((g.school ?? '').toLowerCase() !== s.school.toLowerCase()) f.push(`okul ${g.school} ≠ SRD ${s.school}`);
  const want = s.classes.map((c) => CLASS[c] ?? c).sort().join(',');
  const have = [...g.classes].sort().join(',');
  if (want !== have) f.push(`sınıflar ${have} ≠ SRD ${want}`);
  // Kurulumda ritüel/uzun döküm (çağrı verisinde `setup`; Phantom Steed MB7) döküm farkı değil.
  const setupCast = SETUP.has(g.id);
  if (setupCast && castNorm(s.castingTime) === 'long') n.push('döküm kurulumda (ritüel/uzun döküm; data/summons.json `setup`)');
  else if (gameCast(g.castingTime) !== castNorm(s.castingTime) && !(g.castingTime === 'ritual' && s.ritual)) f.push(`döküm ${g.castingTime} ≠ SRD ${s.castingTime}`);
  if (!!g.concentration !== s.concentration) f.push(`konsantrasyon ${!!g.concentration} ≠ SRD ${s.concentration}`);
  const rf = rangeFt(s.range);
  // "Self (15-foot Cone)" ve Self kökenli smite/dokunma: oyunda `rangeFt` alan boyu ya da dokunma erişimi (gösterim farkı).
  if (rf !== null && rf !== g.rangeFt && !(rf >= 5280 && g.rangeFt >= 5280)) (/^Self/i.test(s.range) ? n : f).push(`menzil ${g.rangeFt} ft ≠ SRD ${s.range}${/^Self/i.test(s.range) ? ' (gösterim: Self kökenli alan/dokunma)' : ''}`);
  if (!off) {
    const a = srdArea(s);
    const ga = (m.area83 as Spell['area']) ?? g.area;
    const gz = m.zone as { radius?: number; sizeFt?: number; shape?: string } | undefined;
    if (a && !ga && !gz && !m.freeShape && !m.wallPath) n.push(`SRD alanı ${a.shape} ${a.sizeFt} ft; oyunda alan tanımı yok (tek hedef ya da elle)`);
    if (a && ga && !m.freeShape) {
      const shape = ga.shape === 'radius' || ga.shape === 'sphere' || ga.shape === 'emanation' ? 'sphere' : ga.shape;
      const sShape = a.shape === 'emanation' ? 'sphere' : a.shape === 'cylinder' ? 'sphere' : a.shape;
      if (shape !== sShape && !(sShape === 'sphere' && shape === 'cube')) f.push(`alan şekli ${ga.shape} ≠ SRD ${a.shape}`);
      if (ga.sizeFt !== a.sizeFt) f.push(`alan boyu ${ga.sizeFt} ft ≠ SRD ${a.sizeFt} ft (${a.shape})`);
    }
    const sv = srdSave(s);
    if (sv && m.save && m.save !== sv) f.push(`save ${m.save} ≠ SRD ${sv}`);
    if (sv && !m.save && ['save', 'attack', 'heal'].includes(m.kind as string)) n.push(`SRD ${sv} save; mekanikte \`save\` yok (tür ${m.kind})`);
    const at = srdAttack(s);
    if (at && m.kind !== 'attack' && !m.weaponStrike && !m.rays && !m.smite) n.push(`SRD ${at} büyü saldırısı; mekanik türü ${m.kind}`);
    const d = srdDamage(s);
    if (d && m.damage && !String(m.damage).startsWith(d.dice) && !(m.split as unknown[] | undefined)?.length) f.push(`hasar ${m.damage} ≠ SRD ${d.dice}`);
    if (d && m.damageType && m.damageType !== d.type && !m.damageChoices && !(m.split as unknown[] | undefined)?.length) f.push(`hasar türü ${m.damageType} ≠ SRD ${d.type}`);
    if (d && !m.damage && !m.split && !m.zone && !m.summon && !m.effect) n.push(`SRD ${d.dice} ${d.type} hasarı; mekanikte \`damage\` yok`);
    // Süre (tur): SRD "1 minute" = 10, "10 minutes" = 100, "1 hour" = 600, "1 round" = 1; mekanikte ilk bulunan süre alanı.
    const dur = srdRounds(s.duration);
    const mr = mechRounds(m);
    // Tekrar edilen etkinin süresi (Telekinesis: her eylemde sonraki tura dek) büyü süresi değil.
    if (dur !== null && mr !== null && mr !== dur && !(dur >= 600 && mr >= 100) && !(m.repeat && mr <= 1)) f.push(`süre ${mr} tur ≠ SRD ${s.duration}`);
    // Tekrar save: SRD "repeats the save at the end of each of its turns" ↔ mekanikte `repeatSave` ya da tur sonu tekrar.
    // "Each time the target takes damage, it repeats the save" (Dominate) = `damageSave`; büyü durum süreleri data/condition-effects.json.
    const endRepeat = /end of each of its turns[^.]*repeats the save|repeats the save at the end/i.test(s.text);
    if (endRepeat && !JSON.stringify(m).includes('repeatSave') && !COND_SPELLS.has(s.name) && !m.zone) n.push('SRD tur sonu tekrar save; mekanikte `repeatSave` görülmedi (elle doğrula)');
    const up = m.upcast as { applied?: boolean } | undefined;
    // Yalnız süre uzatan yukarı slot (Concentration/duration): savaş ≤ 1 dakika; not.
    const durOnly = !!s.higherLevel && /^(Your Concentration can last longer|The duration is longer|You can alter the target’s memories)/.test(s.higherLevel);
    if (s.level > 0 && s.higherLevel && !up?.applied && durOnly) n.push('yukarı slot yalnız süre uzatır (savaş ≤ 1 dakika: etkisiz)');
    else if (s.level > 0 && s.higherLevel && !up?.applied && upcastElsewhere(g.id, m)) n.push(`yukarı slot ayrı kod yolunda (${upcastElsewhere(g.id, m)})`);
    else if (s.level > 0 && s.higherLevel && !up?.applied) f.push(`yukarı slot uygulanmıyor (SRD: "${s.higherLevel.slice(0, 90)}${s.higherLevel.length > 90 ? '…' : ''}")`);
    // Cantrip ölçeklemesi: zar (`scalesWithLevel`), ışın sayısı (`raysByLevel`), silah zarı/ek zar kademesi, menzil kademesi.
    // Spare the Dying: menzil kademesi GENEL96'da (`executeRestore` `spare96`).
    const tiered = m.scalesWithLevel || m.upgrade || m.raysByLevel || m.revive === 'stabilize'
      || ((m.effect as { weaponOverride?: { dice?: unknown[] } } | undefined)?.weaponOverride?.dice?.length ?? 0) > 1
      || ((m.weaponStrike as { extra?: unknown[] } | undefined)?.extra?.length ?? 0) > 1;
    if (s.level === 0 && (s.cantripUpgrade || /Cantrip Upgrade/i.test(s.text)) && !tiered) f.push('cantrip ölçeklemesi yok');
  }
  const gp = srdCostlyMaterial(s);
  if (gp) n.push(`maliyetli materyal ${gp}+ GP (oyunda bileşen modeli yok)`);
  if (m.approx) n.push(`yaklaşık: ${String(m.approx).slice(0, 140)}`);
  if (m.kapsamDisi) n.push(`kapsam dışı: ${String(m.kapsamDisi).slice(0, 140)}`);
  if (m.sigmayan) n.push(`sığmayan: ${String(m.sigmayan).slice(0, 140)}`);
  const durum = off ? 'savaş dışı' : f.length ? 'şüpheli' : n.some((x) => x.startsWith('yaklaşık') || x.startsWith('SRD')) ? 'kısmi (otomatik)' : 'tam (otomatik)';
  rows.push({ id: s.id, name: s.name, level: s.level, file: g.file, durum, farklar: f, notlar: n });
}

const count = (d: string) => rows.filter((r) => r.durum === d).length;
const levels = [[0, 0], [1, 3], [4, 5], [6, 9]] as const;
const lines: string[] = [];
lines.push('<!-- otomatik:başla (npx vite-node scripts/buyu-tam-tarama.ts) -->');
lines.push(`## 1. Otomatik fark (kural sürümü ${CURRENT_RULES}, ${rows.length} SRD büyüsü)`, '');
lines.push('| Seviye | tam (otomatik) | kısmi (otomatik) | şüpheli | savaş dışı | eksik | Toplam |', '|---|---:|---:|---:|---:|---:|---:|');
for (const [a, b] of levels) {
  const r = rows.filter((x) => x.level >= a && x.level <= b);
  const c = (d: string) => r.filter((x) => x.durum === d).length;
  lines.push(`| ${a === b ? a : `${a}–${b}`} | ${c('tam (otomatik)')} | ${c('kısmi (otomatik)')} | ${c('şüpheli')} | ${c('savaş dışı')} | ${c('eksik')} | ${r.length} |`);
}
lines.push(`| **Toplam** | ${count('tam (otomatik)')} | ${count('kısmi (otomatik)')} | ${count('şüpheli')} | ${count('savaş dışı')} | ${count('eksik')} | ${rows.length} |`, '');
const kinds = new Map<string, number>();
for (const r of rows.filter((x) => x.durum === 'şüpheli')) for (const x of r.farklar) { const k = x.replace(/\s.*$/, '').replace(/[^a-zçğıöşü]/gi, ''); kinds.set(k, (kinds.get(k) ?? 0) + 1); }
lines.push('Fark türleri (şüpheli satırlarda): ' + [...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') + '.', '');
lines.push('### Şüpheli ve kısmi satırlar', '', '| Büyü | Sv | Durum | Fark (otomatik) | Not |', '|---|---:|---|---|---|');
for (const r of rows.filter((x) => x.durum !== 'tam (otomatik)' && x.durum !== 'savaş dışı')) {
  lines.push(`| ${r.name} (\`${r.id}\`) | ${r.level} | ${r.durum} | ${r.farklar.join('; ').replace(/\|/g, '/')} | ${r.notlar.join('; ').replace(/\|/g, '/')} |`);
}
lines.push('', '### Savaş dışı (gerekçe veride `gmNote`)', '', rows.filter((x) => x.durum === 'savaş dışı').map((r) => `\`${r.id}\``).join(', '), '');
lines.push('<!-- otomatik:bitir -->');

const out = join(ROOT, 'harita/belgeler/BUYU-TAM-TARAMA.md');
let prev = '';
try { prev = readFileSync(out, 'utf8'); } catch { /* yeni */ }
const head = prev.includes('<!-- otomatik:başla') ? prev.slice(0, prev.indexOf('<!-- otomatik:başla')) : '# Büyü tam taraması (gece kuyruğu Aşama 3a)\n\n';
const tail = prev.includes('<!-- otomatik:bitir -->') ? prev.slice(prev.indexOf('<!-- otomatik:bitir -->') + '<!-- otomatik:bitir -->'.length) : '\n';
writeFileSync(out, head + lines.join('\n') + tail);
console.log(`BUYU-TAM-TARAMA: ${rows.length} büyü; tam ${count('tam (otomatik)')}, kısmi ${count('kısmi (otomatik)')}, şüpheli ${count('şüpheli')}, savaş dışı ${count('savaş dışı')}, eksik ${count('eksik')}`);
