/**
 * APK öncesi mekanik doğrulama matrisi: kahin girdisi. Beklenen sonuçlar yalnızca SRD 5.2.1 kaydından
 * (`data/srd/spells.json`, `data/srd/weapons.json`) çıkarılır; motor kodu (src/battle) burada içe aktarılmaz.
 * Ayrıştırılamayan ya da yoruma açık parçalar `notlar`a yazılır (matriste "karar bekliyor").
 */
import srdSpells from '../../../data/srd/spells.json';
import srdWeapons from '../../../data/srd/weapons.json';

export type Ab = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITY_OF: Record<string, Ab> = {
  Strength: 'str', Dexterity: 'dex', Constitution: 'con', Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha',
};
export const DAMAGE_TYPES = ['Acid', 'Bludgeoning', 'Cold', 'Fire', 'Force', 'Lightning', 'Necrotic', 'Piercing', 'Poison', 'Psychic', 'Radiant', 'Slashing', 'Thunder'] as const;
export const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious'] as const;

export interface SrdSpellRaw {
  id: string; name: string; level: number; school: string; classes: string[]; castingTime: string; range: string;
  components: string; duration: string; concentration: boolean; ritual: boolean; text: string; higherLevel?: string; cantripUpgrade?: string;
}

/** Bir hasar ifadesi: zar ("8d6", "1d4+1"), tür (küçük harf), büyü yeteneği değiştiricisi ekleniyor mu. */
export interface DamagePart { dice: string; type: string; addMod: boolean }

export interface SrdArea { shape: 'sphere' | 'cone' | 'cube' | 'line' | 'cylinder' | 'emanation'; sizeFt: number; widthFt?: number; origin: 'self' | 'point' }

export interface SrdUpcast {
  /** Slot seviyesi başına ek hasar zarı (birden çok parça: Flame Strike, Ice Storm). */
  dice?: string[];
  /** Slot başına ek iyileştirme zarı ya da sabit. */
  heal?: string;
  /** Slot başına ek hedef. */
  targets?: number;
  /** Slot başına ek ışın/dart. */
  rays?: number;
  /** Ayrıştırılamayan metin (yalnızca bilgi). */
  other?: string;
}

export interface SrdSpell {
  raw: SrdSpellRaw;
  id: string; name: string; level: number;
  /** Eylem ekonomisi: action, bonus, reaction ya da uzun (1 dakika ve üstü). */
  cast: 'action' | 'bonus' | 'reaction' | 'long';
  ritual: boolean;
  rangeFt: number;
  /** Süre tur cinsinden (0: anlık; Infinity: dağıtılana dek; null: özel). */
  rounds: number | null;
  concentration: boolean;
  attack: 'ranged' | 'melee' | null;
  save: Ab | null;
  halfOnSave: boolean;
  /** İlk hasar cümlesinin parçaları (isabet ya da başarısız save). */
  damage: DamagePart[];
  /** Metindeki bütün hasar ifadeleri (bilgi). */
  allDamage: DamagePart[];
  heal: { dice: string; addMod: boolean } | null;
  /** Başarısız save ya da isabette uygulanan durumlar (ilk etki cümlesi). */
  conditions: string[];
  /** Bütün durum anmaları (bilgi). */
  mentions: string[];
  /** Hedef tur sonunda save'i yineler. */
  repeatSave: boolean;
  area: SrdArea | null;
  /** "creature(s) of your choice": dost ateşi yok. */
  chooseTargets: boolean;
  /** Hedef görülebilir olmalı ("that you can see"). */
  needsSight: boolean;
  /** Siper yarar sağlamaz (Sacred Flame). */
  ignoresCover: boolean;
  /** Işın/dart sayısı (Scorching Ray 3, Magic Missile 3, Eldritch Blast 1). */
  rays: number;
  upcast: SrdUpcast | null;
  /** Kantrip kademesi: seviye 1, 5, 11, 17'deki zar (ya da ışın sayısı). */
  cantrip: { tiers: string[]; kind: 'dice' | 'beams' | 'extra' | 'die' } | null;
  /** Save savaşta avantajlı ("Advantage … if you or your allies are fighting it"). */
  saveAdvFighting: boolean;
  /** Taban slotta en çok hedef ("up to three creatures"); yoksa 1. */
  baseTargets: number;
  /** Hedef yaratık türü ("Choose a Beast", "a Humanoid you can see"). */
  targetType: string | null;
  /** Yorum gerektiren parçalar. */
  notlar: string[];
}

const DT = DAMAGE_TYPES.join('|');
const COND = CONDITIONS.join('|');

export function durationRounds(d: string): number | null {
  const s = d.replace(/^Concentration,?\s*/i, '').replace(/^up to\s*/i, '').trim().toLowerCase();
  if (s === 'instantaneous') return 0;
  if (s.startsWith('until dispelled')) return Infinity;
  const m = /^(\d+)\s+(round|minute|hour|day)s?$/.exec(s);
  if (!m) return null;
  const n = Number(m[1]);
  return n * ({ round: 1, minute: 10, hour: 600, day: 14400 } as Record<string, number>)[m[2] as string]!;
}

export function rangeFt(r: string): number {
  if (r === 'Self') return 0;
  if (r === 'Touch') return 5;
  const m = /^(\d+)\s+feet$/.exec(r);
  if (m) return Number(m[1]);
  const mi = /^(\d+)\s+miles?$/.exec(r);
  if (mi) return Number(mi[1]) * 5280;
  return Infinity;
}

const castOf = (c: string): SrdSpell['cast'] =>
  /^Action/.test(c) ? 'action' : /^Bonus Action/.test(c) ? 'bonus' : /^Reaction/.test(c) ? 'reaction' : 'long';

/** "1d4 + 1" → "1d4+1". */
const normDice = (x: string) => x.replace(/\s+/g, '');

function damageParts(text: string): Array<DamagePart & { at: number }> {
  const out: Array<DamagePart & { at: number }> = [];
  const re1 = new RegExp(`(\\d+d\\d+(?:\\s*[+]\\s*\\d+)?)(\\s+plus your spellcasting ability modifier)?\\s+(${DT}) damage`, 'g');
  for (const m of text.matchAll(re1)) out.push({ dice: normDice(m[1] as string), type: (m[3] as string).toLowerCase(), addMod: !!m[2], at: m.index ?? 0 });
  const re2 = new RegExp(`(${DT}) damage equal to (\\d+d\\d+(?:\\s*[+]\\s*\\d+)?)( plus your spellcasting ability modifier)?`, 'g');
  for (const m of text.matchAll(re2)) out.push({ dice: normDice(m[2] as string), type: (m[1] as string).toLowerCase(), addMod: !!m[3], at: m.index ?? 0 });
  return out.sort((a, b) => a.at - b.at);
}

/** Metni cümlelere böler (nokta + boşluk + büyük harf; satır sonu). */
function sentences(text: string): Array<{ s: string; at: number }> {
  const out: Array<{ s: string; at: number }> = [];
  let start = 0;
  const re = /(?<=[.!?])\s+(?=[A-Z])|\n+/g;
  for (const m of text.matchAll(re)) {
    out.push({ s: text.slice(start, m.index), at: start });
    start = (m.index ?? 0) + m[0].length;
  }
  out.push({ s: text.slice(start), at: start });
  return out.filter((x) => x.s.trim().length > 0);
}

function parseArea(text: string, range: string): SrdArea | null {
  const self = range === 'Self' || /originating from you|emanating from you|from you in a|centered on you/i.test(text);
  let m = /(\d+)-foot-radius,\s*(\d+)-foot-?high Cylinder/i.exec(text);
  if (m) return { shape: 'cylinder', sizeFt: Number(m[1]), origin: self ? 'self' : 'point' };
  m = /(\d+)-foot-radius Sphere/i.exec(text);
  if (m) return { shape: 'sphere', sizeFt: Number(m[1]), origin: self && !/point/i.test(text.slice(0, 200)) ? 'self' : 'point' };
  m = /(\d+)-foot Cone/i.exec(text);
  if (m) return { shape: 'cone', sizeFt: Number(m[1]), origin: 'self' };
  m = /(\d+)-foot Cube/i.exec(text);
  if (m) return { shape: 'cube', sizeFt: Number(m[1]), origin: self ? 'self' : 'point' };
  m = /Line\s+(?:that is\s+)?(\d+)\s+feet\s+long\s+and\s+(\d+)\s+feet\s+wide/i.exec(text);
  if (m) return { shape: 'line', sizeFt: Number(m[1]), widthFt: Number(m[2]), origin: 'self' };
  m = /(\d+)-foot-long,\s*(\d+)-foot-wide Line/i.exec(text);
  if (m) return { shape: 'line', sizeFt: Number(m[1]), widthFt: Number(m[2]), origin: 'self' };
  m = /(\d+)-foot Emanation/i.exec(text);
  if (m) return { shape: 'emanation', sizeFt: Number(m[1]), origin: 'self' };
  return null;
}

function parseUpcast(hl: string | undefined): SrdUpcast | null {
  if (!hl) return null;
  const u: SrdUpcast = {};
  const dmg = [...hl.matchAll(/damage(?:\s+and the \w+ damage)?\s+increases?\s+by\s+(\d+d\d+)/gi)].map((m) => m[1] as string);
  // "The Fire damage and the Radiant damage increase by 1d6": iki parça aynı zarla.
  const both = /The (\w+) damage and the (\w+) damage increase by (\d+d\d+)/i.exec(hl);
  if (both) u.dice = [both[3] as string, both[3] as string];
  else if (dmg.length) u.dice = dmg;
  const heal = /healing increases by (\d+d\d+|\d+)/i.exec(hl) ?? /Hit Points? (?:increases?|regained increases?) by (\d+d\d+|\d+)/i.exec(hl);
  if (heal) u.heal = heal[1] as string;
  const tgt = /(?:target|choose|affect) one additional (?:creature|Humanoid|Beast|target|willing creature|Undead|Celestial)/i.exec(hl);
  if (tgt) u.targets = 1;
  const ray = /(?:one (?:more|additional) (?:dart|ray|beam|bolt))/i.exec(hl);
  if (ray) u.rays = 1;
  if (!u.dice && !u.heal && !u.targets && !u.rays) u.other = hl;
  return u;
}

function parseCantrip(cu: string | undefined): SrdSpell['cantrip'] {
  if (!cu) return null;
  const tiers = [...cu.matchAll(/levels? 5 \(([^)]+)\), 11 \(([^)]+)\), and 17 \(([^)]+)\)/gi)][0];
  if (tiers) {
    const kind = /extra Radiant damage/i.test(cu) ? 'extra' : /damage die changes/i.test(cu) ? 'die' : 'dice';
    return { tiers: ['', tiers[1] as string, tiers[2] as string, tiers[3] as string], kind };
  }
  if (/two beams at level 5, three beams at level 11, and four beams at level 17/i.test(cu)) return { tiers: ['1', '2', '3', '4'], kind: 'beams' };
  return null;
}

export function parseSpell(raw: SrdSpellRaw): SrdSpell {
  const text = raw.text;
  const notlar: string[] = [];
  const attackM = /make (?:a|one) (ranged|melee) spell attack/i.exec(text) ?? /(ranged|melee) spell attack/i.exec(text);
  // Save yalnızca hedefin attığı kalıptan ("makes a … saving throw", "must succeed on a …"); "Advantage on Dexterity saving
  // throws" gibi anmalar save değildir.
  const saveM = /(?:makes?|make|must succeed on|succeeds? on|must make|repeats?)\s+an?\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/.exec(text)
    ?? /(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw(?:s)? (?:against|or)/.exec(text);
  const parts = damageParts(text);
  // İlk hasar cümlesi: o cümledeki bütün parçalar ("5d6 Fire damage and 5d6 Radiant damage").
  const sents = sentences(text);
  const firstDmg = parts[0];
  const sentOf = (at: number) => sents.find((x) => at >= x.at && at < x.at + x.s.length);
  const s0 = firstDmg ? sentOf(firstDmg.at) : undefined;
  const damage = s0 ? parts.filter((p) => p.at >= s0.at && p.at < s0.at + s0.s.length).map(({ at: _a, ...p }) => p) : [];
  const healM = /regains? (?:a number of )?Hit Points equal to (\d+d\d+|\d+)( plus your spellcasting ability modifier)?/i.exec(text)
    ?? /regains? (\d+d\d+|\d+) Hit Points/i.exec(text);
  // Durumlar: olumlu kalıp ("has/have/gains the X (and Y) condition(s)", "falls Prone", "or be X"); olumsuz anmalar
  // (can't, immune, doesn't, ends, suppress) dışarıda. İlk böyle cümle (save ya da isabet sonucu, ya da doğrudan etki).
  const mentions = [...text.matchAll(new RegExp(`\\b(${COND})\\b(?:\\s+(?:or|and)\\s+(${COND}))?\\s+condition`, 'g'))]
    .flatMap((m) => [m[1], m[2]].filter((x): x is string => !!x));
  const affirm = new RegExp(`\\b(?:has|have|gains?|gets?|is|be)\\s+(?:the\\s+)?(${COND})(?:,?\\s+(?:and|or)\\s+(?:the\\s+)?(${COND}))?\\s+conditions?|\\b(?:falls?|knocked)\\s+(Prone)`, 'g');
  const negWords = /(?:can't|can’t|cannot|doesn't|doesn’t|don't|don’t|immune|no longer|isn't|isn’t|without|ends|ending|suppress|unless|benefit from|Advantage on saving throws against|\bif\b|that have|as if|unaffected|see creatures|neither|\bnor\b)[^.]{0,60}$/;
  let conditions: string[] = [];
  for (const x of sents) {
    const found: string[] = [];
    for (const m of x.s.matchAll(affirm)) {
      const before = x.s.slice(0, m.index ?? 0);
      if (negWords.test(before)) continue;
      found.push(...[m[1], m[2], m[3]].filter((y): y is string => !!y));
    }
    if (found.length) { conditions = [...new Set(found)]; break; }
  }
  const area = parseArea(text, raw.range);
  const rays = /three (?:glowing )?darts/i.test(text) ? 3 : /three (?:fiery )?rays/i.test(text) ? 3 : 1;
  return {
    raw, id: raw.id, name: raw.name, level: raw.level, cast: castOf(raw.castingTime), ritual: raw.ritual,
    rangeFt: rangeFt(raw.range), rounds: durationRounds(raw.duration), concentration: raw.concentration,
    attack: attackM ? (attackM[1]!.toLowerCase() as 'ranged' | 'melee') : null,
    save: saveM ? ABILITY_OF[saveM[1] as string] ?? null : null,
    halfOnSave: /half as much damage/i.test(text),
    damage, allDamage: parts.map(({ at: _a, ...p }) => p),
    heal: healM ? { dice: normDice(healM[1] as string), addMod: !!healM[2] } : null,
    conditions, mentions: [...new Set(mentions)],
    repeatSave: /repeats? the sav/i.test(text),
    area,
    chooseTargets: /(?:creatures?|targets?) of your choice/i.test(text),
    // Hedef (yaratık ya da onun taşıdığı nesne) görülmeli; "space/point that you can see" yer seçimidir, sayılmaz.
    needsSight: /\b(?:creature|creatures|Humanoid|Beast|target|Undead|Fiend|Celestial|Construct|ally|object)\b(?:(?!space|point|location)[^.]){0,60}?(?:that )?you can see/i.test(sents.slice(0, 2).map((x) => x.s).join(' ')),
    ignoresCover: /no benefit from Half Cover or Three-Quarters Cover/i.test(text),
    rays,
    upcast: parseUpcast(raw.higherLevel),
    cantrip: parseCantrip(raw.cantripUpgrade),
    saveAdvFighting: /Advantage on (?:the|this) (?:save|saving throw) if you or your allies are fighting it|does so with Advantage if you or your allies are fighting it/i.test(text),
    baseTargets: (() => {
      const n: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
      const m = /up to (two|three|four|five|six|seven|eight|nine|ten|twelve|\d+) (?:willing )?(?:creatures|targets|allies|Humanoids)/i.exec(text);
      return m ? (n[(m[1] as string).toLowerCase()] ?? Number(m[1])) : 1;
    })(),
    // Hedef türü yalnız hedefleme cümlesinden ("Choose a Humanoid", "One Beast you can see", "a Beast that you can see").
    targetType: /(?:^|[.!?]\s+)(?:Choose|Target|One)\s+(?:a\s+|one\s+)?(Beast|Humanoid|Undead|Fiend|Celestial|Elemental|Fey|Construct|Plant)\b/.exec(text)?.[1]
      ?? /\b(?:a|one)\s+(Beast|Humanoid|Undead|Fiend|Celestial|Elemental|Fey|Construct|Plant)\s+(?:that\s+)?you can see/.exec(sentences(text)[0]?.s ?? '')?.[1] ?? null,
    notlar,
  };
}

/**
 * K01 (kullanıcı kararı; SRD 5.2.1 Charmed: "You can't attack the charmer or target the charmer with damaging abilities or
 * magical effects."): büyü metni hedefe hasar veriyor mu (metindeki hasar ifadeleri). Saldırı zarlı büyü ayrıca hep yasak;
 * zarar vermeyen büyü (Hold Person, Bane, Command…) büyüleyene yapılabilir.
 */
export const zararVerir = (s: SrdSpell): boolean => s.allDamage.length > 0;

export const SRD_SPELLS: SrdSpell[] = (srdSpells as { spells: SrdSpellRaw[] }).spells.map(parseSpell);
export const srdSpell = (id: string): SrdSpell | undefined => SRD_SPELLS.find((s) => s.id === id);

/** SRD silah kaydı (Weapons tablosu). */
export interface SrdWeaponRaw { id: string; name: string; category: string; damage: string; damageType: string; properties: string[]; mastery: string }
export interface SrdWeapon {
  id: string; name: string; die: string; versatileDie: string | null; type: string; ranged: boolean; finesse: boolean;
  thrown: boolean; light: boolean; heavy: boolean; twoHanded: boolean; reach: boolean; range: [number, number] | null; mastery: string;
}
export const SRD_WEAPONS: SrdWeapon[] = (srdWeapons as { weapons: SrdWeaponRaw[] }).weapons.map((w) => {
  const p = w.properties.join(', ');
  const vers = /Versatile \((\d*d\d+)\)/.exec(p);
  const rng = /(?:Range|Thrown \(Range|Ammunition \(Range) (\d+)\/(\d+)/.exec(p);
  return {
    id: w.id, name: w.name, die: w.damage, versatileDie: vers ? (vers[1] as string) : null, type: w.damageType.toLowerCase(),
    ranged: /Ranged/i.test(w.category), finesse: /Finesse/.test(p), thrown: /Thrown/.test(p), light: /\bLight\b/.test(p), heavy: /Heavy/.test(p),
    twoHanded: /Two-Handed/.test(p), reach: /Reach/.test(p), range: rng ? [Number(rng[1]), Number(rng[2])] : null, mastery: w.mastery,
  };
});
