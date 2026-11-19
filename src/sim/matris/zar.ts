/**
 * Mekanik matris: betikli zar. Motorun zar kancasına (`rng.dice`) amaçla (saldırı, save, hasar) ve atan yaratıkla
 * yanıt verir; her isteği kaydeder. Tepki ve seçim istemleri `rng.react` ile karara bağlanır.
 *
 * Hasar zarları: `dieValue(yüz)` (yüze bağlı sabit; kahin aynı işlevle hesaplar).
 */
import type { DiceRequest, Rng } from '../../rules/dice';
import type { ReactionAnswer, ReactionRequest } from '../../rules/reactionChoice';

/**
 * Zar değeri yüze bağlı sabit: ⌊yüz/2⌋ + 1 (d4 3, d6 4, d8 5, d10 6, d12 7); en yüksek yüz değil (Sorcerous Burst patlamaz).
 * Toplam yalnızca zar sayısına bağlıdır, motorun zarları kaç grupta attığına bağlı değildir. Chromatic Orb aynı iki zarda
 * sıçrar: bağlamlarda hedefin 30 ft içinde başka yaratık bulunmaz (gerektiği yerde ayrı bağlam).
 */
export function dieValue(sides: number, _i = 0): number {
  if (sides <= 1) return 1;
  if (sides === 2) return 2;
  return Math.floor(sides / 2) + 1;
}

/** "NdS+B" ifadesinin bu zar planıyla toplamı (kritikte zar sayısı iki kat, sabit değil). */
export function exprTotal(expr: string, critical = false): number {
  const c = /^\s*(-?\d+)\s*$/.exec(expr);
  if (c) return Number(c[1]);
  const m = /^\s*(\d*)d(\d+)\s*(?:([+-])\s*(\d+))?\s*$/.exec(expr);
  if (!m) throw new Error(`zar ifadesi: ${expr}`);
  const n = (m[1] ? Number(m[1]) : 1) * (critical ? 2 : 1);
  const s = Number(m[2]);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += dieValue(s, i);
  return sum + (m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0);
}

/** d20 için tek ve çift (avantaj/dezavantaj) zar yanıtı. */
export interface D20 { one: number; two: [number, number] }
export const D20_NORMAL: D20 = { one: 8, two: [2, 16] };
export const D20_CRIT: D20 = { one: 20, two: [20, 20] };
export const D20_MISS: D20 = { one: 1, two: [1, 1] };
export const SAVE_FAIL: D20 = { one: 1, two: [1, 1] };
export const SAVE_OK: D20 = { one: 20, two: [20, 20] };
/** DC 18'e karşı: tek zarda başarılı (19), dezavantajda başarısız (3), avantajda başarılı. */
export const SAVE_DIS_PROBE: D20 = { one: 19, two: [19, 3] };
/** DC 18'e karşı, değiştirici 0: düz başarısız; +2 siperle başarılı (yarım siper sondası). */
export const SAVE_HALF_COVER: D20 = { one: 16, two: [16, 16] };
/** DC 18'e karşı: düz ve +2 başarısız; +5 siperle başarılı (3/4 siper sondası). */
export const SAVE_TQ_COVER: D20 = { one: 14, two: [14, 14] };

export interface Plan {
  attack: D20;
  /** Yaratık başına sıradaki save zarları (bitince `saveDefault`). */
  saves: Record<string, D20[]>;
  saveDefault: D20;
  /** Tepki kararı: `null` kullanma; yoksa öneriyi (kuralsız: kullanma). */
  react?: (req: ReactionRequest) => ReactionAnswer;
  /**
   * Etiketsiz d20'yi save say (`kind` yok, `by` var): `saveEffect` save zarını `kind: 'save'` olmadan atar (görünüm bulgusu
   * G02). Yalnız bu yoldan save atan büyülerin bağlamlarında açılır (`ozel.ts` `saveEtiketsiz`).
   */
  untaggedSave?: boolean;
}

/** Tepkiyi kullan: verilen yaratığın ilk seçeneği (seçimi varsa ilk seçim: en düşük slot). */
export const kullan = (reactorId: string) => (q: ReactionRequest): ReactionAnswer => {
  if (q.reactorId !== reactorId || !q.options[0]) return null;
  const o = q.options[0];
  return o.choices?.length ? { option: o.id, choice: (o.choices[0] as { id: string }).id } : { option: o.id };
};

export interface Logged extends DiceRequest { values: number[] }

export function plan(p: Partial<Plan> = {}): Plan {
  return { attack: p.attack ?? D20_NORMAL, saves: p.saves ?? {}, saveDefault: p.saveDefault ?? { one: 10, two: [10, 10] }, ...(p.react ? { react: p.react } : {}), ...(p.untaggedSave ? { untaggedSave: true } : {}) };
}

/** Seçim istemlerinde (tetik `choice`) motorun önerisi; tepkilerde plan kararı (yoksa kullanma). */
function answer(p: Plan, req: ReactionRequest): ReactionAnswer {
  if (req.trigger === 'choice') return req.suggested;
  return p.react ? p.react(req) : null;
}

export function makeRng(p: Plan, log: Logged[]): Rng {
  const queues: Record<string, D20[]> = Object.fromEntries(Object.entries(p.saves).map(([k, v]) => [k, [...v]]));
  const f = (() => 0.5) as Rng & { dice?: (r: DiceRequest) => number[]; react?: (r: ReactionRequest) => ReactionAnswer };
  f.dice = (req: DiceRequest) => {
    let values: number[];
    if (req.sides === 20 && (req.kind === 'attack' || req.kind === 'save' || (p.untaggedSave && req.kind === undefined && !!req.by))) {
      let d: D20;
      if (req.kind === 'attack') d = p.attack;
      else {
        const q = req.by ? queues[req.by] : undefined;
        d = q && q.length ? (q.shift() as D20) : p.saveDefault;
      }
      values = req.count >= 2 ? [...d.two] : [d.one];
    } else if (req.sides === 20) {
      values = Array.from({ length: req.count }, () => 10);
    } else if (req.sides === 100) {
      values = Array.from({ length: req.count }, () => 50);
    } else {
      values = Array.from({ length: req.count }, (_, i) => dieValue(req.sides, i));
    }
    log.push({ ...req, values });
    return values;
  };
  f.react = (req: ReactionRequest) => answer(p, req);
  return f;
}
