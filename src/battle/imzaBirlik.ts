/**
 * Kuyruk K54b G3: Birlik Manastırı (Cleric imza alt sınıfı; ev kuralı değil, her zaman; kural sürümü 27):
 * - Omuz Ver (3): Bağlı dostun başarısız kurtulmasına 30 ft içindeki başka bir Bağlı dost tepkisiyle WIS (en az 1)
 *   ekler; yalnız başarıya çevirecekse kullanılır (tepki harcanmaz yoksa). `syncAuras` → `shoulderBy`, `saveDice` ikinci
 *   şans (`plus`; Burst of Ingenuity ile aynı yol).
 * - Ortak Şifa (8): rahip büyüyle bir Bağlı dostu iyileştirince diğer Bağlı dostlar WIS (en az 1) can kazanır; turda bir
 *   (havuz açıksa can havuza gider: `trackPools`).
 * - Yıkılmaz Birlik (17): havuz kurulurken `guard` (2 × seviye); havuz 0'a düşecekken bir kez ayakta (reducer
 *   `trackPools`; kaynak + tepki). Bağ sayısının 6'ya çıkması yok (açık).
 * Saf.
 */
import { gap64 } from './adjacency';
import { imzaOn, imzaPasifler } from './imzaCore';
import { ruleVersion } from './ruleVersion';
import { registerCommandEnd } from './turnHooks';
import { isIncapacitated } from '../rules/conditions';
import type { BattleEvent, BattleState, Combatant } from './types';

export const BIRLIK_VERSION = 27;
const BOND = 'imza:imza_birlik/forge-bond:';
const modOf = (c: Combatant, a: string) => (c.modifiers as Record<string, number>)[a] ?? 0;
/** Savaşçının bağı (bağı kuran rahibin kimliği); yoksa null. */
export const bondOwner = (c: Combatant): string | null => c.effects?.find((e) => e.id.startsWith(BOND))?.id.slice(BOND.length) ?? null;
function pasif(state: BattleState, cleric: Combatant | undefined, ozellik: string): Record<string, unknown> | null {
  if (!cleric || cleric.imza !== 'imza_birlik' || ruleVersion(state) < BIRLIK_VERSION || !imzaOn(state, cleric.imza)) return null;
  return imzaPasifler(cleric).find((p) => p.ozellik === ozellik)?.etki ?? null;
}

/** Omuz Ver: bu Bağlı dostun başarısız kurtulmasına destek verebilecek başka Bağlı dost (tepkisi hazır, 30 ft). */
export function shoulderOf(state: BattleState, c: Combatant): Combatant['shoulderBy'] {
  const owner = bondOwner(c);
  if (!owner || c.hp <= 0 || !c.pos) return undefined;
  const prm = pasif(state, state.combatants[owner], 'lend-shoulder')?.omuz as { menzilFt: number } | undefined;
  if (!prm) return undefined;
  for (const b of Object.values(state.combatants)) {
    if (b.id === c.id || bondOwner(b) !== owner || b.hp <= 0 || !b.pos || b.economy.reaction || isIncapacitated(b.conditions)) continue;
    if (gap64(state, b, c) * 5 > prm.menzilFt) continue;
    return { id: b.id, bonus: Math.max(1, modOf(b, 'wis')) };
  }
  return undefined;
}
/** Hesap gerekir mi (savaşta Birlik rahibi var). */
export const anyBirlik = (state: BattleState): boolean => ruleVersion(state) >= BIRLIK_VERSION && Object.values(state.combatants).some((c) => c.imza === 'imza_birlik');

/** Yıkılmaz Birlik koruması (havuz kurulurken; 17. seviye, kaynak duruyorsa). */
export function unbrokenGuard(state: BattleState, cleric: Combatant): { ownerId: string; hp: number; resource: string } | undefined {
  const prm = pasif(state, cleric, 'unbroken-union')?.yikilmaz as { carpan: number; kaynak: string } | undefined;
  if (!prm || (cleric.resources[prm.kaynak] ?? 0) < 1) return undefined;
  return { ownerId: cleric.id, hp: prm.carpan * cleric.level, resource: prm.kaynak };
}

// Ortak Şifa: komut sonu (rahibin büyüsüyle Bağlı dost iyileşti).
registerCommandEnd((_before, next, events, cmd) => {
  if (cmd.type !== 'cast_spell') return [];
  const cleric = next.combatants[cmd.actorId];
  const prm = pasif(next, cleric, 'common-cure')?.ortakSifa as { enAz: number } | undefined;
  if (!prm || !cleric) return [];
  const healed = events.filter((e): e is Extract<BattleEvent, { type: 'healed' }> => e.type === 'healed' && e.actorId === cleric.id && e.amount > 0);
  const touched = healed.map((e) => next.combatants[e.targetId]).filter((c): c is Combatant => !!c && bondOwner(c) === cleric.id);
  if (!touched.length || cleric.traitTurns?.['imza:ortak-sifa'] === String(next.round)) return [];
  const amount = Math.max(prm.enAz, modOf(cleric, 'wis'));
  const skip = new Set(touched.map((c) => c.id));
  const out: BattleEvent[] = [{ type: 'trait_turn', actorId: cleric.id, trait: 'imza:ortak-sifa', key: String(next.round) }];
  for (const c of Object.values(next.combatants)) {
    if (skip.has(c.id) || bondOwner(c) !== cleric.id || c.life === 'dead' || c.hp >= c.maxHp) continue;
    // Havuzdaki üyenin payı havuza eklenir (`trackPools`).
    const gain = Math.min(amount, c.maxHp - c.hp);
    out.push({ type: 'healed', actorId: cleric.id, targetId: c.id, label: 'Ortak Şifa', amount: gain, targetHpAfter: c.hp + gain });
  }
  return out.length > 1 ? out : [];
});
