/**
 * Ada atlaması (harita kuralı `lavJump`, veri güdümlü). Haritada bu kural varsa, üstünden kuraldaki
 * zeminlerden (`over`, Volkan'da lav `~`) en az biri geçilen atlama "ada atlamasıdır": mesafe, hız
 * ve koşu sınırı yok; başka bir adaya, arası yalnızca lav olan düz bir hatla ulaşılabiliyorsa o
 * adanın herhangi bir boş altıgenine (bir adanın üstünden öbürüne atlanmaz; `lavaLine`).
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
import { occupantAt, terrainAt } from './movement';
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

const isLand = (state: BattleState, h: Offset) => {
  const t = terrainAt(state, h);
  return t.movement !== 'deadly' && t.movement !== 'blocked';
};

/**
 * Ada atlamasının hattı (tek kural): hedef karadır ve atlayanın adasından farklı bir adadadır.
 * Kalkıştan hedefe düz hex hattında (kalkış ve iniş hariç):
 * - lav altıgenleri sayılır (DC bunlardan);
 * - atlayanın adasına ya da hedef adaya ait kara altıgenleri sayılmaz ve engel olmaz (adanın
 *   içinden atlanabilir, hedef adanın içine inilebilir);
 * - üçüncü bir adaya ait kara ya da engel (kaya) altıgeni hattı keser: o hedef geçersiz.
 * Hat yalnızca zemine bakar; altıgendeki yaratık hattı etkilemez. Geçerliyse lav altıgenleri (en az
 * bir), değilse null. Çizgi iki altıgenin tam sınırından geçiyorsa iki yol da denenir, az lavlı seçilir.
 */
export function lavaLine(state: BattleState, from: Offset, to: Offset): Offset[] | null {
  const chars = overChars(state);
  if (!chars || !isLand(state, to)) return null;
  const home = islandOf(state, from);
  const target = islandOf(state, to);
  if (target.has(hexKey(from))) return null;
  let best: Offset[] | null = null;
  for (const nudge of [1, -1] as const) {
    const lava: Offset[] = [];
    let clear = true;
    for (const h of jumpPath(from, to, nudge)) {
      if (chars.includes(terrainAt(state, h).char)) { lava.push(h); continue; }
      const k = hexKey(h);
      if (isLand(state, h) && (home.has(k) || target.has(k))) continue;
      clear = false;
      break;
    }
    if (clear && lava.length > 0 && (!best || lava.length < best.length)) best = lava;
  }
  return best;
}

/** Atlama hedefi: altıgen, aşılan lav, DC ve doğal 1 (lava düşme) olasılığı (uçan için null). */
export interface JumpTarget { to: Offset; lava: number; dc: number | null; pFall: number; risk: JumpRisk | null }

/**
 * Tek kaynak: bir savaşçının bütün geçerli ada atlaması hedefleri (boş kara altıgenleri; dolu altıgene
 * inilmez, düşmanlı adaya atlanır). Arayüz (Atla kipi) ve yapay zekâ bunu kullanır; komut da aynı
 * `lavaLine` kuralıyla doğrular. Hareket koşulu (bu tur yürümemiş olmak) burada değil, komutta.
 */
export function jumpTargets(state: BattleState, unit: Combatant): JumpTarget[] {
  if (!unit.pos || !overChars(state)) return [];
  const from = unit.pos;
  const rows = state.map?.tiles.length ?? 0;
  const cols = state.map?.tiles[0]?.length ?? 0;
  const out: JumpTarget[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const to = { col, row };
      if (occupantAt(state, to, unit.id)) continue;
      const over = lavaLine(state, from, to);
      if (!over) continue;
      const risk = jumpRisk(state, unit, from, to);
      out.push({ to, lava: over.length, dc: risk?.dc ?? null, pFall: risk?.pFall ?? 0, risk });
    }
  }
  return out;
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
