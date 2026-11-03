/**
 * Kuyruk 19 (görev 7): SRD 5.2.1 Legendary Actions → data/efsanevi.json `monsters` (var olan kayıtlar korunur; yeni
 * kayıtlar `k19: true`, anahtar `srdK19`). Genel kalıplar metinden: "makes one X attack" (strike), "moves up to half its
 * Speed" (Pounce), "uses Spellcasting to cast X (level N version)" / "casts X" (spell), "<Yetenek> Saving Throw: DC N,
 * one creature … within N feet | each creature in a N-foot … " (save: hasar, yarı hasar, durum). Kalıba girmeyen
 * eylemler aşağıdaki ÖZEL tabloda (SRD metninin elle çevirisi; sayfa numarası kayıtta).
 * Çalıştırma: node scripts/k19-efsanevi.mjs
 */
import fs from 'node:fs';
import { readingLines } from './srd/pdf.mjs';

const FILE = new URL('../data/efsanevi.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const monsters = JSON.parse(fs.readFileSync(new URL('../data/monsters.json', import.meta.url), 'utf8'));
const byName = new Map(monsters.map((m) => [m.name, m]));
const lines = await readingLines(254, 400);
const SIZE = /^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/;
const clean = (s) => s.replace(/\s+/g, ' ').replace(/([a-z])- ([a-z])/g, '$1$2').replace(/ ([,.)])/g, '$1').trim();
const ABIL = { Strength: 'str', Dexterity: 'dex', Constitution: 'con', Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha' };
const TR = {
  Pounce: 'Sıçrayış', 'Frightful Presence': 'Korkunç Varlık', 'Cloud of Insects': 'Böcek Bulutu', 'Cloaked Flight': 'Gizli Uçuş', 'Sonic Boom': 'Ses Patlaması',
  'Tail Swipe': 'Kuyruk Savuruşu', 'Blazing Light': 'Kör Eden Işık', 'Scorching Sands': 'Kavuran Kum', 'Guiding Light': 'Yol Gösteren Işık', Thunderclap: 'Gök Gürültüsü',
  'Giggling Magic': 'Kıkırdayan Büyü', 'Mind Jolt': 'Zihin Sarsıntısı', Banish: 'Sürgün', 'Mind Invasion': 'Zihin İstilası', 'Noxious Miasma': 'Zehirli Pus', Chill: 'Ayaz',
  'Cold Gale': 'Soğuk Bora', 'Freezing Burst': 'Donduran Patlama', Lash: 'Kamçı', 'Psychic Drain': 'Zihin Emme', 'Storm Bolt': 'Fırtına Şimşeği', 'Toxic Ink': 'Zehirli Mürekkep',
  'Deathly Teleport': 'Ölümcül Işınlanma', 'Disrupt Life': 'Yaşamı Boz', 'Frightening Gaze': 'Korkutan Bakış', 'Dread Command': 'Korkunç Buyruk', Glare: 'Dik Bakış',
  'Necrotic Strike': 'Nekrotik Vuruş', 'Blinding Gaze': 'Kör Eden Bakış', 'Radiant Teleport': 'Işıltılı Işınlanma', 'Arcane Prowl': 'Gizemli Sinsilik',
  'Weight of Years': 'Yılların Ağırlığı', Onslaught: 'Saldırı Dalgası', 'World-Shaking Movement': 'Dünyayı Sarsan Hareket', 'Charging Horn': 'Boynuz Hücumu',
  'Shimmering Shield': 'Parıldayan Kalkan', Beguile: 'Büyüle', 'Deathless Strike': 'Ölümsüz Vuruş',
};
const COND = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Paralyzed', 'Poisoned', 'Prone', 'Restrained', 'Stunned'];
/** Kalıba girmeyen eylemler (SRD metninden). */
const OZEL = {
  'Psychic Drain': { kind: 'drain', dice: '1d10', needs: ['Charmed', 'Grappled'] },
  'Toxic Ink': { kind: 'save', save: 'con', area: { shape: 'emanation', sizeFt: 15, origin: 'self' }, conditions: ['Blinded', 'Poisoned'], underwater: true, moveAfter: 'full' },
  'Deathly Teleport': { kind: 'teleport', ft: 60, away: true, burst: { radiusFt: 10, dice: '2d10', type: 'necrotic', at: 'origin' } },
  'Disrupt Life': { kind: 'save', save: 'con', area: { shape: 'emanation', sizeFt: 20, origin: 'self' }, damage: '9d6', damageType: 'necrotic', half: true, skipTypes: ['undead'] },
  'Radiant Teleport': { kind: 'teleport', ft: 60, toward: true, burst: { radiusFt: 10, dice: '2d10', type: 'radiant', at: 'dest', save: 'dex', half: true } },
  'Arcane Prowl': { kind: 'strike', attack: 'Claw', teleportFt: 30 },
  'Weight of Years': { kind: 'save', save: 'con', rangeFt: 120, exhaustion: 1 },
  'World-Shaking Movement': { kind: 'quake', radiusFt: 60 },
  'Shimmering Shield': { kind: 'buff', rangeFt: 60, tempHp: '3d6', ac: 2 },
  'Charging Horn': { kind: 'strike', attack: 'Radiant Horn', halfMove: true, noOA: true },
  Banish: { kind: 'save', save: 'cha', rangeFt: 120, damage: '3d6', damageType: 'force', banish: true },
  'Giggling Magic': { kind: 'save', save: 'cha', rangeFt: 90, damage: '7d6', damageType: 'psychic', effect: { dice: { die: '1d6', sign: -1, on: ['attack', 'check'] } } },
  'Scorching Sands': { effect: { speedMult: 0.5 } },
  'Noxious Miasma': { effect: { ac: -2 } },
  'Freezing Burst': { effect: { speedMult: 0 } },
  'Cloud of Insects': { effect: { concDis: true } },
  'Cold Gale': { push: 30 },
  'Blinding Gaze': { conditions: ['Blinded'], minute: true },
  'Cloaked Flight': { kind: 'spell', spell: 'Invisibility', self: true, flyHalf: true },
  'Storm Bolt': { kind: 'strike', attack: 'Lightning Strike' },
  Glare: { kind: 'strike', attack: 'Dreadful Glare' },
};

let owner = null; let page = 0; let buf = null; const texts = {};
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].text.trim();
  if (byName.has(t) && SIZE.test(lines[i + 1]?.text.trim() ?? '')) { if (buf) texts[owner] = { page, text: clean(buf.join(' ')) }; owner = byName.get(t).id; page = lines[i].page; buf = null; continue; }
  if (t.startsWith('Legendary Action Uses')) { buf = [t]; continue; }
  if (buf && /^(Actions|Bonus Actions|Reactions|Traits)$/.test(t)) { texts[owner] = { page, text: clean(buf.join(' ')) }; buf = null; continue; }
  if (buf) buf.push(t);
}
if (buf) texts[owner] = { page, text: clean(buf.join(' ')) };

let added = 0;
for (const [id, { page: pg, text }] of Object.entries(texts)) {
  if (data.monsters[id] && !data.monsters[id].k19) continue;
  const m = monsters.find((x) => x.id === id);
  const uses = Number(/Legendary Action Uses: (\d+)/.exec(text)?.[1] ?? 3);
  const body = text.replace(/^Legendary Action Uses[^.]*\.( \([^)]*\))?\s*/, '').replace(/^Immediately after[^.]*\. [^.]*\.\s*/, '');
  const parts = body.split(/(?:^|(?<=\.) )(?=(?:[A-Z][a-z’']+(?:[ -][A-Z][a-z’']+){0,2})\. )/).filter(Boolean);
  const actions = [];
  for (const p of parts) {
    const name = /^([A-Z][A-Za-z’' -]+?)\. /.exec(p)?.[1];
    if (!name || !TR[name]) continue;
    const rest = p.slice(name.length + 2);
    const a = { id: name.toLowerCase().replace(/[^a-z]+/g, '-'), tr: TR[name], en: name, kind: 'strike' };
    if (/can’t take this action again/.test(rest)) a.oncePerTurn = true;
    const sc = /(?:uses Spellcasting to cast|casts) ([A-Z][A-Za-z’' ]+?)(?: \(level (\d) version\))?(?: on itself)?\s*[,.(]/.exec(rest);
    const sv = /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) Saving Throw: DC (\d+), (?:one creature [^.]*?within (\d+) feet|each creature in an? (\d+)-foot(?:-radius|-long)?(?:, \d+-foot-wide)? (Sphere|Emanation|Line|Cone)(?:[^.]*?within (\d+) feet)?)/.exec(rest);
    const hit = /makes one ([A-Z][A-Za-z ]+?) (?:or ([A-Z][A-Za-z ]+?) )?attack/.exec(rest);
    if (sc && !sv) { a.kind = 'spell'; a.spell = sc[1].trim(); if (sc[2]) a.level = Number(sc[2]); const dc = /spell save DC (\d+)/.exec(rest)?.[1]; if (dc) a.dc = Number(dc); }
    else if (sv) {
      a.kind = 'save'; a.save = ABIL[sv[1]]; a.dc = Number(sv[2]);
      if (sv[3]) a.rangeFt = Number(sv[3]);
      else {
        const shape = sv[5].toLowerCase();
        a.area = { shape: shape === 'emanation' ? 'emanation' : shape, sizeFt: Number(sv[4]), origin: shape === 'sphere' ? 'point' : 'self',
          ...(shape === 'line' ? { widthFt: Number(/(\d+)-foot-wide/.exec(rest)?.[1] ?? 5) } : {}), ...(sv[6] ? { rangeFt: Number(sv[6]) } : {}) };
      }
      const dmg = /Failure: \d+ \((\d+d\d+(?: [+−-] \d+)?)\) (\w+) damage/.exec(rest);
      if (dmg) { a.damage = dmg[1].replace(/ /g, '').replace('−', '-'); a.damageType = dmg[2].toLowerCase(); }
      if (/Success: Half damage/.test(rest)) a.half = true;
      const conds = COND.filter((c) => new RegExp(`has the ${c}|${c} condition`).test(rest.split('Failure or Success')[0]));
      if (conds.length) a.conditions = conds;
    } else if (hit) {
      a.attack = hit[1].trim(); if (hit[2]) a.alt = hit[2].trim();
      if (/moves up to half its Speed/.test(rest)) a.halfMove = true;
    }
    Object.assign(a, OZEL[name] ?? {});
    if (OZEL[name]?.kind === 'save' && !a.dc) a.dc = Number(/DC (\d+)/.exec(rest)?.[1] ?? 15);
    actions.push(a);
  }
  if (!actions.length) continue;
  data.monsters[id] = { uses, k19: true, srd: `SRD 5.2.1 s. ${pg} (${m.name}): Legendary Action Uses ${uses}`, actions };
  added++;
}
fs.writeFileSync(FILE, JSON.stringify(data, null, 1) + '\n');
console.log(added, 'canavar eklendi');
