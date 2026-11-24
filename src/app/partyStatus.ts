/**
 * Savaşlar arası karakter durumu (Görev N): savaş bitince oyuncu karakterlerinin kalan HP'si, kaynakları ve
 * slotları kayıtlı karaktere yazılır; bir sonraki savaş bu durumla başlar (dinlenmezse yaralı). Dinlenme
 * `rules/characterRest.ts`.
 */
import type { BattleState, Combatant } from '../battle';
import type { SavedCharacter } from '../rules/builder';
import { currentStatus, type CharacterStatus } from '../rules/characterRest';
import { resourceDef } from '../rules/classFeatures';
import { isItemResource } from '../rules/itemCharges';

/** Görev TE99: savaşçıda bulunmayınca sıfırlanmayan kaynaklar (eşya yükü, tür kaynağı). */
const keepWhenAbsent = (id: string): boolean => isItemResource(id) || !!resourceDef(id)?.race;

/** Savaşçıyı kayıtlı durumla başlatır (HP, kaynaklar, slotlar); durum yoksa olduğu gibi (dinlenmiş). */
export function withStatus(c: Combatant, ch: Pick<SavedCharacter, 'sheet' | 'status'>): Combatant {
  if (!ch.status) return c;
  const s = currentStatus(ch.sheet, ch.status);
  // Görev TE99: durumda olmayan savaşçı kaynakları (yeni eşya, kayıt öncesi kaynak) korunur; eskiden hepsi siliniyordu
  // (yüklü eşya ikinci savaşta yüksüz kalıyordu: TUR-FEAT-ESYA-DENETIM D33).
  return { ...c, hp: Math.max(1, s.hp), resources: { ...c.resources, ...s.resources }, spellSlots: [...s.slots], ...(s.exhaustion ? { exhaustion: s.exhaustion } : {}),
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
      // Görev TE99: savaşta olmayan eşya/tür kaynağı (ör. anahtar kapalı) kayıtlı değerinde kalır.
      resources: Object.fromEntries(Object.keys(prev.resources).map((id) => [id, c.resources[id] ?? (keepWhenAbsent(id) ? prev.resources[id] ?? 0 : 0)])),
      // Görev WS92: savaşta kazanılan slot (Wild Resurgence, Nature Magician, Font of Magic) karaktere yazılır; üst sınır
      // tablonun en çoğu (`slotMax`). Eskiden savaş başındaki kalan slot üst sınırdı (kazanılan slot savaş sonunda kayboluyordu).
      // Görev B93: Font of Magic ile yaratılan slot (önceden kalan fazla dahil) tablonun üstüne çıkabilir; uzun dinlenmede kaybolur.
      slots: prev.slots.map((n, i) => Math.min((prev.slotMax?.[i] ?? n) + Math.max(0, n - (prev.slotMax?.[i] ?? n)) + (c.createdSlots?.[i] ?? 0), c.spellSlots[i] ?? 0)),
      ...(prev.slotMax ? { slotMax: prev.slotMax } : {}),
      ...(prev.resourceMax ? { resourceMax: prev.resourceMax } : {}),
      ...(prev.hpMax !== undefined ? { hpMax: prev.hpMax } : {}),
      ...(c.life === 'dead' ? { dead: true } : {}),
      ...((c.exhaustion ?? 0) > 0 && c.life !== 'dead' ? { exhaustion: c.exhaustion } : {}),
      // Görev B93: savaşta başlayan bekleme sayacı (`<kaynak>:bekle`; Greater Divine Intervention).
      ...((): Partial<CharacterStatus> => {
        const w = { ...(prev.waits ?? {}) };
        for (const [k, n] of Object.entries(c.resources)) if (k.endsWith(':bekle') && n > 0) w[k.slice(0, -':bekle'.length)] = n;
        return Object.keys(w).length ? { waits: w } : {};
      })(),
      ...moralResult(c, prev),
      // Görev KARAR104 (sürüm 104, A4): savaşta lanetlenen (likantrop) karaktere işaret; önceki işaret kalır.
      ...((): Partial<CharacterStatus> => {
        const kind = c.life !== 'dead' ? c.effects?.find((e) => e.lycanthropy)?.lycanthropy : undefined;
        return kind ? { lanet: { likantrop: kind } } : prev.lanet ? { lanet: { ...prev.lanet } } : {};
      })(),
    };
    return { ...ch, status: next };
  });
}
