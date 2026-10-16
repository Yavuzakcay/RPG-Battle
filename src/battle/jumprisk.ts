/**
 * Ada atlaması (harita kuralı `lavJump`, veri güdümlü). Haritada bu kural varsa, üstünden kuraldaki
 * zeminlerden (`over`, Volkan'da lav `~`) en az biri geçilen atlama "ada atlamasıdır": mesafe, hız
 * ve koşu sınırı yok, herhangi bir adanın herhangi bir boş altıgenine; aradaki altıgenler lav ya da
 * kara olabilir (engel olamaz). Hareketin yerine geçer: bu tur hiç yürümemiş olmak gerekir ve tüm
 * hareketi harcar. Hedef adada (bağlı kara parçası) düşman varsa reddedilir.
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
export function jumpPath(from: Offset, to: Offset): Offset[] {
  return line(from, to).slice(1, -1);
}

/** Atlamanın üstünden geçtiği lav (kuralın `over` zeminleri) altıgenleri; kural yoksa boş. */
export function lavaOver(state: BattleState, from: Offset, to: Offset): Offset[] {
  const rule = ruleOf(state, 'lavJump');
  if (!rule) return [];
  const chars = (rule.over as string[] | undefined) ?? ['~'];
  return jumpPath(from, to).filter((h) => chars.includes(terrainAt(state, h).char));
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
  const over = lavaOver(state, from, to);
  if (over.length === 0) return null;
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
