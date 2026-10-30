// Canavar saldırı ek etkileri (rider): data/monsters.json metninden data/attack-riders.json üretir.
// Çalıştırma: node scripts/riders-uret.cjs  (monsters.json değişmez; elle yazılan condition-effects.json önceliklidir)
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const monsters = JSON.parse(fs.readFileSync(path.join(root, 'data/monsters.json'), 'utf8'));
const manual = JSON.parse(fs.readFileSync(path.join(root, 'data/condition-effects.json'), 'utf8')).attacks;

const TYPES = ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder'];
const CONDS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Incapacitated', 'Paralyzed', 'Poisoned', 'Restrained', 'Stunned', 'Unconscious'];
const ABIL = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };
const SIZE = { tiny: 'T', small: 'S', medium: 'M', large: 'L', huge: 'H', gargantuan: 'G' };
const DICE = '(\\d+d\\d+(?:\\s*[+-]\\s*\\d+)?)';
const norm = (d) => d.replace(/\s+/g, '');
/** Kavrama sürerken Restrained ("Restrained condition until the grapple ends", "While Grappled, the target has the Restrained condition"). */
const GRAPPLE_RESTRAINED = /Restrained condition until the grapple ends|While Grappled, the target has the Restrained condition|Until the grapple ends, the target has the Restrained condition/i;

/** Metindeki boyut sınırı ("Large or smaller", "hedef Medium veya küçükse"). */
function maxSize(t) {
  const m = /(tiny|small|medium|large|huge|gargantuan)(?: creature)? or smaller/i.exec(t) ?? /hedef (tiny|small|medium|large|huge) veya küçük/i.exec(t);
  return m ? SIZE[m[1].toLowerCase()] : undefined;
}
/** Metindeki kurtarma zarı ("Constitution Saving Throw: DC 12" ya da "DC 10 CON"). */
function saveIn(t) {
  let m = /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw: DC (\d+)/i.exec(t);
  if (m) return { ability: ABIL[m[1].toLowerCase()], dc: Number(m[2]) };
  m = /DC (\d+) (STR|DEX|CON|INT|WIS|CHA)\b/.exec(t);
  return m ? { ability: m[2].toLowerCase(), dc: Number(m[1]) } : undefined;
}

/** Süreli durum(lar): "has the X (and Y) condition(s) until the start/end of its/the Z’s next turn", "for 1 minute", "repeats the save". */
function timed(t, atkSave) {
  const found = CONDS.filter((c) => new RegExp(`\\b${c}\\b`).test(t));
  if (found.length === 0) return null;
  const s = t.toLowerCase();
  if (/second failure|first failure|reduced to 0 hit points|possess|until the song ends|dies or|attaches|swallow|engulf|curse/.test(s)) return null;
  let spec = null;
  const until = /until the (start|end) of (its|the [^’']+[’']s) next turn/i.exec(t);
  if (until) spec = { owner: until[2].toLowerCase() === 'its' ? 'target' : 'source', end: until[1].toLowerCase() === 'start' ? 'turnStart' : 'turnEnd' };
  else if (/bir sonraki turunun (sonuna|başına) dek/i.test(t)) spec = { owner: /wyvern|merrow/.test(s) ? 'source' : 'target', end: /sonuna/.test(s) ? 'turnEnd' : 'turnStart' };
  if (/repeats the save at the end of each of its turns/i.test(t)) {
    const sv = saveIn(t) ?? atkSave;
    if (!sv) return null;
    spec = { saveEnds: sv, maxRounds: 10 };
  } else if (!spec && /for 1 minute/i.test(t)) spec = { rounds: 10 };
  else if (!spec && /for 1 hour/i.test(t)) spec = { rounds: 100 };
  if (!spec) return null;
  return found.map((condition) => ({ condition, ...spec }));
}

const out = {};
const counts = { 'uygulandı': 0, 'kısmen': 0, 'süreli etki': 0, 'yok': 0 };
const reasons = {};
let withRider = 0;
const mons = new Set();
for (const x of monsters) for (const a of x.attacks) {
  const r = (a.rider ?? '').trim();
  if (!r) continue;
  withRider++; mons.add(x.id);
  const key = `${x.id}:${a.name}`;
  const e = {};
  const handled = [];
  let mt;
  // 1) Ek hasar (Görev C).
  if ((mt = new RegExp(`^\\+\\s*${DICE}\\s+([a-z]+)\\b`, 'i').exec(r)) && TYPES.includes(mt[2].toLowerCase())) {
    const part = { dice: norm(mt[1]), type: mt[2].toLowerCase() };
    if (/if the attack roll had advantage/i.test(r)) e.conditional = [{ when: 'advantage', ...part }]; else e.extra = [part];
    handled.push('damage');
  } else if ((mt = new RegExp(`^\\(advantage ile isabette \\+${DICE} ([a-z]+)\\)$`, 'i').exec(r))) {
    e.conditional = [{ when: 'advantage', dice: norm(mt[1]), type: mt[2].toLowerCase() }]; handled.push('damage');
  } else if ((mt = new RegExp(`^, or \\d+ \\(${DICE}\\) ([A-Za-z]+) damage if the (target|[a-z]+) (is Bloodied|had Advantage on the attack roll|moved (\\d+)\\+ feet straight toward the target)`, 'i').exec(r))) {
    const when = /advantage/i.test(mt[4]) ? 'advantage' : mt[5] ? 'charge' : mt[3].toLowerCase() === 'target' ? 'targetBloodied' : 'selfBloodied';
    e.replace = { when, dice: norm(mt[1]), type: mt[2].toLowerCase(), ...(mt[5] ? { feet: Number(mt[5]) } : {}) };
    handled.push('damage');
  }
  // 2) Hücum: "moved 20+ feet straight toward it immediately before the hit" / "10+ ft düz koştuysa".
  const ch = /moved (\d+)\+ feet straight toward/i.exec(r) ?? /(\d+)\+ ft düz koştuysa/i.exec(r);
  if (ch && !e.replace) {
    const charge = { feet: Number(ch[1]) };
    const size = maxSize(r); if (size) charge.maxSize = size;
    const dmg = new RegExp(`extra \\d+ \\(${DICE}\\) ([A-Za-z]+) damage`, 'i').exec(r) ?? new RegExp(`\\+${DICE} ([a-z]+)`, 'i').exec(r);
    if (dmg) charge.extra = [{ dice: norm(dmg[1]), type: dmg[2].toLowerCase() }];
    if (/prone/i.test(r)) { charge.prone = true; const sv = saveIn(r); if (sv) charge.save = sv; }
    e.charge = charge; handled.push('charge');
  }
  // 3) Yakalama (Grappled, escape DC); kavrama sürerken Restrained.
  const gr = /Grappled condition \(escape DC (\d+)\)/i.exec(r);
  if (gr) {
    e.grapple = { escapeDc: Number(gr[1]), restrained: GRAPPLE_RESTRAINED.test(r) };
    const size = maxSize(r); if (size) e.grapple.maxSize = size;
    handled.push('grapple');
  }
  // 4) Yere düşürme (hücumsuz).
  if (!ch && /\bprone\b/i.test(r) && !/swallow|engulf/i.test(r)) {
    e.prone = {};
    const size = maxSize(r); if (size) e.prone.maxSize = size;
    if (!a.save) { const sv = saveIn(r); if (sv) e.prone.save = sv; }
    handled.push('prone');
  }
  // 5) Süreli durumlar (elle tanımlı condition-effects.json önceliklidir).
  if (manual[key]) { e.condition = 'condition-effects.json'; handled.push('condition'); }
  else {
    const conds = timed(r.replace(GRAPPLE_RESTRAINED, ''), a.save ? { ability: a.save.ability, dc: a.save.dc } : undefined);
    if (conds) {
      e.conditions = conds;
      if (!a.save) { const sv = saveIn(r); if (sv && !conds[0].saveEnds) e.conditionSave = sv; }
      handled.push('condition');
    }
  }
  // Uygulanmayan kısımlar.
  const s = r.toLowerCase();
  const missing = [];
  if (/pull|pushed|push /.test(s)) missing.push('itme/çekme uygulanmıyor');
  if (/swallow|engulf/.test(s)) missing.push('yutma/içine alma uygulanmıyor');
  if (/curse|lycanthrop|hit point maximum|infernal wound/.test(s) && !manual[key]?.dot && !/otyugh/.test(key)) missing.push('lanet/kalıcı etki uygulanmıyor');
  if (/attaches|attached|possess/.test(s)) missing.push('yapışma/ele geçirme uygulanmıyor');
  if (/second failure|first failure/.test(s) && !manual[key]?.escalate) missing.push('ikinci aşama (second failure) uygulanmıyor');
  if (/speed (decreases|is halved)|can’t take reactions|bonus action on/.test(s)) missing.push('hız/eylem kısıtı uygulanmıyor');
  if (/hit points or fewer|dies\b/.test(s)) missing.push('HP eşiğiyle öldürme uygulanmıyor');
  if (/start of each of its turns|at the start of each/.test(s) && !manual[key]?.dot) missing.push('sürekli hasar (her tur) uygulanmıyor');
  if (/reduced to 0 hit points|becomes stable/.test(s)) missing.push('0 HP\'de tetiklenen etki uygulanmıyor');
  const anyCond = CONDS.some((c) => new RegExp(`\\b${c}\\b`).test(r));
  if (anyCond && !handled.includes('condition') && !(e.grapple?.restrained && !CONDS.filter((c) => c !== 'Restrained').some((c) => new RegExp(`\\b${c}\\b`).test(r)))) missing.push('durum etkisi uygulanmıyor (süresi ayrıştırılamadı)');
  const hasDice = /\d+d\d+/.test(r) && !/escape dc/i.test(r);
  if (hasDice && !handled.includes('damage') && !handled.includes('charge') && !manual[key]?.dot && !missing.length) missing.push('özel hasar metni uygulanmıyor');
  if (handled.length === 0 && missing.length === 0) missing.push('özel metin etkisi uygulanmıyor');
  let status;
  if (missing.length === 0) status = handled.length === 1 && handled[0] === 'condition' && e.condition ? 'süreli etki' : 'uygulandı';
  else status = handled.length > 0 ? 'kısmen' : 'yok';
  if (missing.length) { e.unsupported = missing.join('; '); e.text = r.slice(0, 200); for (const m of missing) reasons[m] = (reasons[m] ?? 0) + 1; }
  e.status = status; counts[status]++;
  out[key] = e;
}
const file = {
  note: 'Canavar saldırı ek etkileri (rider); scripts/riders-uret.cjs ile monsters.json metninden üretilir. extra: her isabette ek hasar (kritikte zarlar ikiye katlanır). conditional: koşullu ek hasar (when: advantage). replace: koşul tutarsa hasar ifadesi değişir (advantage | targetBloodied | selfBloodied | charge). charge: hücum (feet+ ft düz koşup bitişik hedefe vurursa): ek hasar ve/veya Prone (maxSize, save). grapple: Grappled (escapeDc, maxSize, restrained: kavrama sürerken Restrained). prone: Prone (maxSize, save). conditions: süreli durumlar (owner/end, rounds, saveEnds); conditionSave: durumdan önce hedefin kurtarma zarı. condition: elle tanımlı süreli etki condition-effects.json\'da. unsupported/text: uygulanmayan kısım. status: uygulandı | kısmen | süreli etki | yok.',
  attacks: out,
};
fs.writeFileSync(path.join(root, 'data/attack-riders.json'), JSON.stringify(file, null, 1) + '\n');
console.log(JSON.stringify({ canavar: mons.size, saldırı: withRider, ...counts, nedenler: reasons }, null, 1));
