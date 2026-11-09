/**
 * Kuyruk K73d: K73c kurallarının (kazma, su altı, fırtına devralma) denge ölçümü için üç karşılaşma. Veri dosyasına
 * (`data/sim-senaryolar.json`) girmez: o dosyadaki senaryo sayıları testlerce sayılıyor, ölçüm ayrı tutulur.
 * - kazan: açık kum zemininde kazma hızı olan canavarlar (Ankheg, Bulette, Earth Elemental, Young Blue Dragon).
 * - sualti: Mielikki Gölü (derin su); parti ve düşman derin su altıgenlerinde. 64'te hepsi batık (irtifa −5 ft: yeni kural);
 *   63'te batıklık yok, aynı altıgenlerde yüzeyde (kıyas: kuralın etkisi). ⚠ Kimse kendiliğinden dalmaz (YZ dalış kararı yok).
 * - firtina: Deniz — Ada (fırtına varyantı), Druid partisi (Call Lightning); 63'te bulut kurulur, 64'te fırtına devralınır.
 * - kiyi (Kuyruk K73e): Mielikki Gölü, parti batı kıyısında (karada), deniz yaratıkları gölde yüzeyde: YZ dalışının (65)
 *   gerçek akışta ölçümü (menzilli tehditten kaçınma).
 * Ayar yok; ölçüm `src/sim/k73dOlcum.test.ts` (`K73D_TOHUM`).
 */
import type { Scenario } from './balance';
import type { BattleState, Combatant } from '../battle/types';

export const K73D_SCENARIOS: Scenario[] = [
  { id: 'k73d-kazan', name: 'Kazan düşman (Çöl)', map: { mapId: 'col', variantId: 'gunduz' },
    enemies: { ankheg: 3, bulette: 2 }, byLevel: { 5: { ankheg: 3, bulette: 2 }, 9: { bulette: 3, 'earth-elemental': 2, 'young-blue-dragon': 1 } } },
  { id: 'k73d-sualti', name: 'Su altı karşılaşma (Mielikki Gölü)', map: { mapId: 'orman-heykel-golu', variantId: 'gunduz' },
    enemies: { 'giant-shark': 3, 'killer-whale': 2, 'water-elemental': 1, 'giant-octopus': 2 }, byLevel: { 5: { 'giant-shark': 3, 'killer-whale': 2, 'water-elemental': 1, 'giant-octopus': 2 } } },
  { id: 'k73d-kiyi', name: 'Kıyı karşılaşması (Mielikki Gölü)', map: { mapId: 'orman-heykel-golu', variantId: 'gunduz' },
    enemies: { 'giant-shark': 3, 'killer-whale': 2, 'water-elemental': 1, 'giant-octopus': 2 }, byLevel: { 5: { 'giant-shark': 3, 'killer-whale': 2, 'water-elemental': 1, 'giant-octopus': 2 } } },
  { id: 'k73d-firtina', name: 'Fırtınalı karşılaşma (Deniz — Ada)', map: { mapId: 'ada', variantId: 'firtina' },
    enemies: { pirate: 8, 'bandit-captain': 2 }, byLevel: { 5: { pirate: 8, 'bandit-captain': 2 }, 9: { pirate: 7, 'bandit-captain': 2, mage: 1 } } },
];

/** Derin su altıgenlerini `w` harfinden (haritanın zemin satırları) toplar. */
function deepHexes(state: BattleState): Array<{ col: number; row: number }> {
  const out: Array<{ col: number; row: number }> = [];
  state.map?.tiles.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'w') out.push({ col: c, row: r }); }));
  return out;
}

/**
 * Su altı karşılaşması başlangıcı: bütün savaşçılar derin su altıgenlerinde (parti solda, düşman sağda). `submerge` açıksa
 * (64) irtifa −5 ft (batık); kapalıysa (63) aynı altıgenlerde yüzeyde. Çağrılmış/ölü olmayan herkes yerleştirilir.
 */
export function submergeStart(state: BattleState, submerge: boolean): BattleState {
  const water = deepHexes(state).sort((a, b) => a.col - b.col || a.row - b.row);
  const party = Object.values(state.combatants).filter((c) => c.side === 'party');
  const foes = Object.values(state.combatants).filter((c) => c.side !== 'party');
  const left = water.filter((h) => h.col <= 16);
  const right = water.filter((h) => h.col >= 20).reverse();
  const combatants: Record<string, Combatant> = { ...state.combatants };
  const place = (cs: Combatant[], cells: Array<{ col: number; row: number }>) => {
    // Çeşitli sıralarda (tek sıraya yığılmasın): her `k`. hücreyi al.
    const step = Math.max(1, Math.floor(cells.length / Math.max(1, cs.length)));
    cs.forEach((c, i) => {
      const h = cells[Math.min(cells.length - 1, i * step)];
      if (h) combatants[c.id] = { ...(combatants[c.id] as Combatant), pos: h, ...(submerge ? { altitudeFt: -5 } : {}) };
    });
  };
  place(party, left);
  place(foes, right);
  return { ...state, combatants };
}

/**
 * Kuyruk K73e: kıyı başlangıcı: parti gölün batı kıyısında, suya bitişik kara altıgenlerinde; düşmanlar kıyıya en yakın derin
 * su altıgenlerinde, yüzeyde (irtifa 0). Sürümden bağımsız.
 */
export function shoreStart(state: BattleState): BattleState {
  const tiles = state.map?.tiles ?? [];
  const at = (c: number, r: number) => tiles[r]?.[c];
  const water = deepHexes(state);
  const isWater = new Set(water.map((h) => `${h.col},${h.row}`));
  const near = (c: number, r: number) => [[c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1], [c - 1, r - 1], [c + 1, r - 1], [c - 1, r + 1], [c + 1, r + 1]].some(([x, y]) => isWater.has(`${x},${y}`));
  const shore: Array<{ col: number; row: number }> = [];
  tiles.forEach((row, r) => [...row].forEach((ch, c) => { if (c <= 12 && (ch === '.' || ch === 'n') && !isWater.has(`${c},${r}`) && near(c, r) && at(c, r)) shore.push({ col: c, row: r }); }));
  shore.sort((a, b) => a.col - b.col || a.row - b.row);
  const sea = water.filter((h) => h.col >= 11 && h.col <= 18).sort((a, b) => a.col - b.col || a.row - b.row);
  const combatants: Record<string, Combatant> = { ...state.combatants };
  const put = (cs: Combatant[], cells: Array<{ col: number; row: number }>) => cs.forEach((c, i) => {
    const h = cells[i % Math.max(1, cells.length)];
    if (h) combatants[c.id] = { ...(combatants[c.id] as Combatant), pos: h, altitudeFt: 0 };
  });
  put(Object.values(state.combatants).filter((c) => c.side === 'party'), shore);
  put(Object.values(state.combatants).filter((c) => c.side !== 'party'), sea.filter((_, i) => i % 2 === 0));
  return { ...state, combatants };
}
