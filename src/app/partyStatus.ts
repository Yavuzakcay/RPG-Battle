/**
 * Savaşlar arası karakter durumu (Görev N): savaş bitince oyuncu karakterlerinin kalan HP'si, kaynakları ve
 * slotları kayıtlı karaktere yazılır; bir sonraki savaş bu durumla başlar (dinlenmezse yaralı). Dinlenme
 * `rules/characterRest.ts`.
 */
import type { BattleState, Combatant } from '../battle';
import type { SavedCharacter } from '../rules/builder';
import { currentStatus, type CharacterStatus } from '../rules/characterRest';

/** Savaşçıyı kayıtlı durumla başlatır (HP, kaynaklar, slotlar); durum yoksa olduğu gibi (dinlenmiş). */
export function withStatus(c: Combatant, ch: Pick<SavedCharacter, 'sheet' | 'status'>): Combatant {
  if (!ch.status) return c;
  const s = currentStatus(ch.sheet, ch.status);
  return { ...c, hp: Math.max(1, s.hp), resources: { ...s.resources }, spellSlots: [...s.slots], ...(s.exhaustion ? { exhaustion: s.exhaustion } : {}),
    // Kuyruk K48: kayıtlı Moral (savaş başında kural kapalıysa `withMorale` siler).
    ...(s.moral !== undefined ? { moral: s.moral } : {}),
    // Kuyruk 19: savaşta harcanan HP zarı (Lifedrinker) kayıtlı durumdan.
    ...(c.hitDice ? { hitDice: { ...c.hitDice, left: Math.max(0, ch.sheet.level - s.hitDiceSpent) } } : {}) };
}

/** Savaşa girebilir mi: ölü ya da 0 HP'deki karakter önce dinlenmeli (ölü diriltilmeli). */
export function statusBlock(ch: Pick<SavedCharacter, 'sheet' | 'status'>): 'dead' | 'down' | null {
  if (!ch.status) return null;
  if (ch.status.dead) return 'dead';
  return currentStatus(ch.sheet, ch.status).hp <= 0 ? 'down' : null;
}

/**
 * Kuyruk K48: Moral. Tam modda (savaşçıda `moralMax`) zafer ödülü savaş biterken motorda verilir (`moraleAfterEvents`);
 * burada yalnızca yazılır: 0'da kalan (yenilgi/kaçış) savaş dışı kuralla ölür (Moral ölümü). Tam mod yoksa kayıtlı
 * değer olduğu gibi.
 */
function moralResult(c: Combatant, prev: CharacterStatus): Pick<CharacterStatus, 'moral' | 'moralOlum' | 'dead'> {
  if (c.moralMax === undefined) return prev.moral !== undefined ? { moral: prev.moral, ...(prev.moralOlum ? { moralOlum: true } : {}) } : {};
  const moral = Math.max(0, c.moral ?? 0);
  return { moral, ...(moral <= 0 && c.life !== 'dead' ? { dead: true, moralOlum: true } : {}) };
}

/** Biten savaştan karakterlerin yeni durumu (sahibi karakterin kimliği olan oyuncu savaşçıları). */
export function applyBattleResult(characters: SavedCharacter[], state: BattleState): SavedCharacter[] {
  if (state.status !== 'finished') return characters;
  return characters.map((ch) => {
    const c = Object.values(state.combatants).find((x) => x.side === 'party' && !x.civilian && x.ownerId === ch.id);
    if (!c) return ch;
    const prev = currentStatus(ch.sheet, ch.status);
    const next: CharacterStatus = {
      hp: Math.max(0, c.hp),
      hitDiceSpent: c.hitDice ? Math.max(prev.hitDiceSpent, ch.sheet.level - c.hitDice.left) : prev.hitDiceSpent,
      resources: Object.fromEntries(Object.keys(prev.resources).map((id) => [id, c.resources[id] ?? 0])),
      slots: prev.slots.map((n, i) => Math.min(n, c.spellSlots[i] ?? 0)),
      ...(prev.slotMax ? { slotMax: prev.slotMax } : {}),
      ...(prev.resourceMax ? { resourceMax: prev.resourceMax } : {}),
      ...(prev.hpMax !== undefined ? { hpMax: prev.hpMax } : {}),
      ...(c.life === 'dead' ? { dead: true } : {}),
      ...((c.exhaustion ?? 0) > 0 && c.life !== 'dead' ? { exhaustion: c.exhaustion } : {}),
      ...moralResult(c, prev),
    };
    return { ...ch, status: next };
  });
}
