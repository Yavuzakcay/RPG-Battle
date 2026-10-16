/**
 * Ada atlaması (harita kuralı `lavJump`, veri güdümlü). Haritada bu kural varsa, üstünden kuraldaki
 * zeminlerden (`over`, Volkan'da lav `~`) en az biri geçilen atlama "ada atlamasıdır": mesafe, hız
 * ve koşu sınırı yok ama yalnızca en yakın karaya: düz hattın içi baştan sona lav olmalı, iniş lav
 * bittikten sonraki ilk kara (bir adanın üstünden öbürüne atlanmaz, her ada kendi atlamasıyla).
 * Hareketin yerine geçer: bu tur hiç yürümemiş olmak gerekir ve tüm hareketi harcar.
 * `foeIsland: "reject"` ise hedef adada (bağlı kara parçası) düşman varken reddedilir.
 * Atlayan uçmuyorsa beceri zarı: d20 + beceri (Athletics; yetkinlik `skillBonus`tan). DC = dcBase +
 * dcPerExtraHex × (lav altıgeni − 1); üst sınır yok, uzak atlama kendiliğinden riskli. Doğal 20
 * (`natural20`) güvenli; doğal 1 (`natural1`) düşer: `fall` "deadly" ise lava (anında ölüm),
 * "fall" ise düşme hasarı (uçurum); toplam DC'ye yetmezse hedefe iner ama `onFail` (Volkan: 2d6
 * ateş + Burning). Lav üstünden geçmeyen atlama eskisi gibi 5e uzun atlama (menzil, koşu).
 */
import { rollD20, type Rng } from '../rules/dice';
import { hexKey, line, neighbors, type Offset } from '../rules/hex';
import { skillBonus, type Skill } from '../rules/skills';
import { ruleOf } from './maprules';
import { terrainAt } from './movement';
import type { BattleState, Combatant } from './types';

export interface JumpRisk {
  /** Üstünden geçilen riskli altıgenler. */
  over: Offset[];
  skill: Skill;
  dc: number;
  bonus: number;
  /** Olasılıklar (0–1): güvenli iniş, yanarak iniş, düşme. */
  pSafe: number;
  pBurn: number;
  pFall: number;
  onFail: { damage: string; damageType: string; condition?: string };
  /** Düşmenin sonucu: `deadly` (lav) ya da `fall` (ileride uçurum). */
  fall: 'deadly' | 'fall';
}

const num = (o: Record<string, unknown> | undefined, k: string, d: number) => (typeof o?.[k] === 'number' ? (o[k] as number) : d);

/** Atlamanın üstünden geçtiği altıgenler (kalkış ve iniş hariç): iki altıgen arasındaki düz çizgi. */
export function jumpPath(from: Offset, to: Offset, nudge: 1 | -1 = 1): Offset[] {
  return line(from, to, nudge).slice(1, -1);
}

const overChars = (state: BattleState): string[] | null => {
  const rule = ruleOf(state, 'lavJump');
  return rule ? ((rule.over as string[] | undefined) ?? ['~']) : null;
};

/**
 * Geçerli ada atlamasının hattı: kalkıştan inişe düz çizginin içi baştan sona lavsa (en az bir) o
 * lav altıgenleri, değilse null. Yani iniş, hatta lav bittikten sonraki ilk kara; arada kara (başka
 * ya da aynı ada) varsa atlama o karada biter, ötesine atlanmaz. Çizgi iki altıgenin tam sınırından
 * geçiyorsa iki yolu da dener (`line` nudge).
 */
export function lavaLine(state: BattleState, from: Offset, to: Offset): Offset[] | null {
  const chars = overChars(state);
  if (!chars) return null;
  for (const nudge of [1, -1] as const) {
    const path = jumpPath(from, to, nudge);
    if (path.length > 0 && path.every((h) => chars.includes(terrainAt(state, h).char))) return path;
  }
  return null;
}

/**
 * Atlamanın üstünden geçtiği lav (kuralın `over` zeminleri) altıgenleri; kural yoksa ya da hat
 * lavsızsa boş. Geçerli hat varsa onun lavı; yoksa çizgideki lav (ada atlaması sayılır ama reddedilir).
 */
export function lavaOver(state: BattleState, from: Offset, to: Offset): Offset[] {
  const chars = overChars(state);
  if (!chars) return [];
  const valid = lavaLine(state, from, to);
  if (valid) return valid;
  for (const nudge of [1, -1] as const) {
    const lava = jumpPath(from, to, nudge).filter((h) => chars.includes(terrainAt(state, h).char));
    if (lava.length > 0) return lava;
  }
  return [];
}

/** Altıgenin bulunduğu ada: lav ve engel olmayan, birbirine bağlı kara altıgenleri (anahtarlar). */
export function islandOf(state: BattleState, start: Offset): Set<string> {
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  const land = (h: Offset) => { const t = terrainAt(state, h); return t.movement !== 'deadly' && t.movement !== 'blocked'; };
  const out = new Set<string>();
  if (!land(start)) return out;
  const todo = [start];
  out.add(hexKey(start));
  while (todo.length) {
    for (const n of neighbors(todo.pop() as Offset, size)) {
      if (!out.has(hexKey(n)) && land(n)) { out.add(hexKey(n)); todo.push(n); }
    }
  }
  return out;
}

/** Atlama riskli mi; öyleyse DC ve olasılıklar. */
export function jumpRisk(state: BattleState, actor: Combatant, from: Offset, to: Offset): JumpRisk | null {
  const rule = ruleOf(state, 'lavJump');
  if (!rule || actor.fly > 0) return null;
  const over = lavaLine(state, from, to);
  if (!over) return null;
  const check = rule.check as Record<string, unknown> | undefined;
  const skill = ((check?.skill as string | undefined) ?? 'athletics') as Skill;
  const dc = num(check, 'dcBase', 10) + num(check, 'dcPerExtraHex', 2) * (over.length - 1);
  const bonus = skillBonus(actor, skill);
  // d20: 20 her zaman güvenli, 1 her zaman düşer; 2..19 toplam DC'ye yetiyorsa güvenli.
  const nat20 = rule.natural20 === 'safe' ? 1 : 0;
  const nat1 = rule.natural1 === 'fall' ? 1 : 0;
  let safe = nat20;
  for (let d = 2; d <= 19; d++) if (d + bonus >= dc) safe++;
  if (!nat20 && 20 + bonus >= dc) safe++;
  if (!nat1 && 1 + bonus >= dc) safe++;
  const onFail = (rule.onFail as JumpRisk['onFail'] | undefined) ?? { damage: '2d6', damageType: 'fire', condition: 'Burning' };
  return {
    over, skill, dc, bonus, pSafe: safe / 20, pFall: nat1 / 20, pBurn: (20 - safe - nat1) / 20, onFail,
    fall: rule.fall === 'fall' ? 'fall' : 'deadly',
  };
}

/** Zar: doğal 20/1 ve toplam; sonuç güvenli, yanarak ya da düşerek. */
export function rollJump(risk: JumpRisk, state: BattleState, rng: Rng): { d20: number[]; natural: number; total: number; outcome: 'safe' | 'burned' | 'fell' } {
  const rule = ruleOf(state, 'lavJump');
  const r = rollD20('normal', rng);
  const total = r.kept + risk.bonus;
  const outcome = r.kept === 20 && rule?.natural20 === 'safe' ? 'safe'
    : r.kept === 1 && rule?.natural1 === 'fall' ? 'fell'
      : total >= risk.dc ? 'safe' : 'burned';
  return { d20: r.rolls, natural: r.kept, total, outcome };
}
