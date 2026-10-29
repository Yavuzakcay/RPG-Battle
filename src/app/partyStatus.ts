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
  return { ...c, hp: Math.max(1, s.hp), resources: { ...s.resources }, spellSlots: [...s.slots], ...(s.exhaustion ? { exhaustion: s.exhaustion } : {}) };
}

/** Savaşa girebilir mi: ölü ya da 0 HP'deki karakter önce dinlenmeli (ölü diriltilmeli). */
export function statusBlock(ch: Pick<SavedCharacter, 'sheet' | 'status'>): 'dead' | 'down' | null {
  if (!ch.status) return null;
  if (ch.status.dead) return 'dead';
  return currentStatus(ch.sheet, ch.status).hp <= 0 ? 'down' : null;
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
      hitDiceSpent: prev.hitDiceSpent,
      resources: Object.fromEntries(Object.keys(prev.resources).map((id) => [id, c.resources[id] ?? 0])),
      slots: prev.slots.map((n, i) => Math.min(n, c.spellSlots[i] ?? 0)),
      ...(c.life === 'dead' ? { dead: true } : {}),
      ...((c.exhaustion ?? 0) > 0 && c.life !== 'dead' ? { exhaustion: c.exhaustion } : {}),
    };
    return { ...ch, status: next };
  });
}
