/**
 * Oyunun büyü verisini (data/spells.json) SRD 5.2.1 ayrıştırmasıyla (data/srd/spells.json) eşitler (Görev N).
 * Önce `npm run srd` çalışmış olmalı. Çalıştırma: `npm run srd:buyu` (yalnızca rapor: `-- --kontrol`).
 *
 * Kendiliğinden düzeltilen (SRD'den kopyalanan) alanlar: seviye, sınıf listesi, büyü süresi (eylem/bonus/tepki),
 * konsantrasyon, okul ve SRD sayfası (bileşen ve süre metni data/srd/spells.json'da kalır); yukarı slot etkisinin tanımı (`mechanics.upcast`,
 * "Using a Higher-Level Spell Slot" metninden).
 * Mekanik (zar, save, alan, durum) elle tutulur; betik SRD metniyle karşılaştırıp uyuşmazlıkları raporlar:
 * docs/BUYU-ESITLEME.md.
 */
import fs from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const read = (p) => JSON.parse(fs.readFileSync(new URL(p, ROOT), 'utf8'));
const check = process.argv.includes('--kontrol');

const ours = read('data/spells.json');
const srd = read('data/srd/spells.json').spells;
const CODE = { Bard: 'Brd', Cleric: 'Clr', Druid: 'Drd', Paladin: 'Pal', Ranger: 'Rgr', Sorcerer: 'Sor', Warlock: 'Wlk', Wizard: 'Wiz' };
const norm = (s) => s.toLowerCase().replace(/’/g, "'");
const ABIL = { Strength: 'str', Dexterity: 'dex', Constitution: 'con', Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha' };

/** "Using a Higher-Level Spell Slot" metninden yapılandırılmış yukarı slot etkisi. */
export function upcastOf(text) {
  if (!text) return null;
  let m;
  if ((m = /(?:damage|healing)[^.]*?increases by (\d+d\d+) for (?:each|every) (?:spell )?slot level above/i.exec(text))) return { dice: m[1] };
  if (/one more dart|one additional (?:ray|beam)/i.test(text)) return { rays: 1 };
  if ((m = /(?:target|affect) one additional (\w+)/i.exec(text))) return { targets: 1 };
  if ((m = /Hit Points increase by (\d+) for each/i.exec(text))) return { hp: Number(m[1]) };
  if (/Concentration can last longer|duration becomes|doesn’t require Concentration/i.test(text)) return { duration: true };
  return { other: true };
}

// Ritüel (savaşta yapılamaz; Find Familiar kurulumda, Görev R3) "1 hour or Ritual" gibi uzun sürelerden önce.
const castTime = (s) => (s.startsWith('Bonus Action') ? 'bonus' : s.startsWith('Reaction') ? 'reaction' : s.startsWith('Action') ? 'action'
  : /Ritual/.test(s) ? 'ritual' : s);
/** Oyunun menzil kuralına göre beklenen menzil (ft): dokunma 5, kendi 0 (kendinden çıkan alanda alan boyu). */
function expectedRange(o, s) {
  const m = /^(\d+) feet/.exec(s.range);
  if (m) return Number(m[1]);
  if (s.range === 'Touch') return 5;
  if (s.range.startsWith('Self')) {
    if (o.area?.origin === 'self') return o.area.sizeFt;
    if (/melee spell attack/i.test(s.text)) return 5;
    return 0;
  }
  return null;
}

const changes = [];
const issues = [];
const approx = [];
const next = ours.map((o) => {
  const s = srd.find((x) => norm(x.name) === norm(o.name));
  if (!s) { issues.push(`**${o.name}**: SRD 5.2.1'de yok`); return o; }
  const out = { ...o };
  const set = (k, v) => {
    if (JSON.stringify(out[k]) !== JSON.stringify(v)) {
      if (out[k] !== undefined) changes.push(`**${o.name}** \`${k}\`: ${JSON.stringify(out[k])} → ${JSON.stringify(v)}`);
      out[k] = v;
    }
  };
  set('level', s.level);
  set('castingTime', castTime(s.castingTime));
  set('classes', s.classes.map((c) => CODE[c] ?? c));
  if (s.concentration) set('concentration', true); else if (out.concentration !== undefined) { changes.push(`**${o.name}** \`concentration\`: true → yok`); delete out.concentration; }
  set('school', s.school);
  set('srdPage', s.source.page);
  // Bileşen ve süre metni ana parçaya girmesin diye kopyalanmaz (data/srd/spells.json'da; oyun kullanmıyor).
  delete out.components;
  delete out.duration;
  const exp = expectedRange(o, s);
  if (exp !== null && exp !== o.rangeFt && !o.mechanics.approx) issues.push(`**${o.name}** menzil: veride ${o.rangeFt} ft, SRD "${s.range}" (beklenen ${exp} ft)`);
  // Yukarı slot etkisi: SRD metninden; motorun uyguladıkları (applied) korunur.
  const m = { ...out.mechanics };
  const up = upcastOf(s.higherLevel);
  const applied = m.upcast?.applied === true || m.upcastDice === true;
  delete m.upcastDice;
  if (up) m.upcast = { ...up, ...(applied ? { applied: true } : {}) };
  else delete m.upcast;
  out.mechanics = m;
  // Mekanik denetimi: zar, save, saldırı türü (metinle).
  const text = `${s.text} ${s.cantripUpgrade ?? ''}`;
  const dice = [...new Set(text.match(/\b\d+d\d+\b/g) ?? [])];
  if (m.damage) {
    const base = m.damage.replace(/\s/g, '').replace(/[+-]\d+$/, '');
    if (!dice.includes(base)) issues.push(`**${o.name}** zar: veride ${m.damage}, SRD metninde ${dice.join(', ') || 'zar yok'}`);
  }
  const saveM = /(?:a|an) (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/.exec(s.text);
  const attack = /(?:ranged|melee) spell attack/i.test(s.text);
  if ((m.kind === 'save') && saveM && ABIL[saveM[1]] !== m.save) issues.push(`**${o.name}** save: veride ${m.save}, SRD ${saveM[1]}`);
  if (m.kind === 'save' && !saveM) issues.push(`**${o.name}** türü save ama SRD metninde kurtarma zarı yok`);
  if (m.kind === 'attack' && !attack) issues.push(`**${o.name}** türü saldırı ama SRD metninde büyü saldırısı yok`);
  if (m.kind !== 'attack' && m.kind !== 'utility' && m.kind !== 'mark' && attack) issues.push(`**${o.name}** SRD'de büyü saldırısı, veride ${m.kind}`);
  if (m.kind === 'utility') issues.push(`**${o.name}**: mekanik yok (utility) — oyunda etki elle uygulanır`);
  if (m.kind === 'heal' && !/regains?/.test(s.text)) issues.push(`**${o.name}** türü iyileştirme ama SRD metni iyileştirmiyor`);
  if (m.kind === 'auto' && /regain/.test(s.text)) issues.push(`**${o.name}** iyileştirme büyüsü ama veride hasar (auto)`);
  if (up?.other) issues.push(`**${o.name}** yukarı slot etkisi yapılandırılamadı: "${s.higherLevel}"`);
  if (m.approx) approx.push(`**${o.name}**: ${m.approx}`);
  return out;
});

const body = [
  '# Büyü verisi ↔ SRD 5.2.1 eşitleme raporu',
  '',
  '`scripts/srd-buyu-esitle.mjs` üretir (elle düzenleme). Kaynak: `data/srd/spells.json` (`npm run srd`, PDF\'ten).',
  '',
  `Oyundaki büyü: ${ours.length}. SRD 5.2.1'deki büyü: ${srd.length}.`,
  '',
  '## Kendiliğinden düzeltilenler',
  '',
  ...(changes.length ? changes.map((c) => `- ${c}`) : ['- Yok (veri SRD ile eşit).']),
  '',
  '## Denetim notları',
  '',
  'Menzil kuralı: dokunma 5 ft, kendi 0 ft; kendinden çıkan alanda alanın boyu (`rangeFt`).',
  '',
  ...(issues.length ? issues.map((c) => `- ${c}`) : ['- Yok.']),
  '',
  '## Bilinen yaklaşıklıklar (veride `mechanics.approx`)',
  '',
  ...(approx.length ? approx.map((c) => `- ${c}`) : ['- Yok.']),
  '',
  '## Yukarı slot (upcast)',
  '',
  '`mechanics.upcast` SRD metninden üretilir: `dice` (slot başına ek zar), `rays` (ek ışın/dart), `targets` (ek hedef), `hp` (ek HP), `duration` (yalnızca süre). Motor yalnızca `applied: true` olanları uygular (şimdilik Spiritual Weapon ve Spirit Guardians); diğerleri Aşama 1\'de.',
  '',
  ...next.filter((x) => x.mechanics.upcast).map((x) => `- ${x.name}: ${JSON.stringify(x.mechanics.upcast)}`),
  '',
];
if (!check) {
  fs.writeFileSync(new URL('data/spells.json', ROOT), `${JSON.stringify(next, null, 2)}\n`);
  fs.writeFileSync(new URL('docs/BUYU-ESITLEME.md', ROOT), body.join('\n'));
}
console.log(`Değişiklik: ${changes.length}, denetim notu: ${issues.length}${check ? ' (yalnızca kontrol)' : ''}`);
for (const i of issues.filter((x) => !x.includes('utility'))) console.log(`  - ${i}`);
