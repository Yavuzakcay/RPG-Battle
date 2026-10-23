/**
 * Savaşı kaydet/yükle (tek kayıt yuvası). Yalnızca olay günlüğü saklanır; yüklerken olaylar
 * baştan oynatılır (`replay`) ve aynı durum üretilir. Kayıt sürümlüdür: bilinmeyen sürüm, bozuk
 * JSON ya da oynatılamayan günlük hata fırlatmaz, "yüklenemedi" sonucu döner.
 */
import { replay, type BattleEvent } from '../battle';
import { createSession, type Session } from '../ui/session';

import { SAVE_KEY, hasSavedBattle } from './saveKey';

export { SAVE_KEY, hasSavedBattle };
/**
 * Kayıt biçimi sürümü. 12: Monk (`bonus_strike`, `focus_action`, `stunning_strike` komutları; `action_used.flurryLeft`/`stunUsed`,
 * `attack_resolved.martialArts`/`deflected`; savaşçıda Monk alanları; Görev P-Monk). 11: Paladin (`use_feature` komutu, `buff_added` olayı, `attack_resolved.melee`, ekonomide `meleeHit`,
 * savaşçıda `buffs`/`features`/`creatureType`; Görev P-Paladin). 10: yan el (Light ek saldırısı; `action_used.light`/`offhand`, ekonomide `lightAttack`/`offhandUsed`,
 * savaşçıda `offHandOption`/`nickOffhand`; Görev P1). 9: Barbarian (`rage_started`, `rage_extended`, `rage_ended`, `reckless_started` olayları; savaşçıda
 * `rage`, `rageDamage`, `saveAdvantage`, `frenzyTurn`…; Görev P-Barbarian). 8: silah ustalığı (`mastery_applied`, `mastery_mark_used` olayları; savaşçıda `marks`, `cleaveTurn`;
 * Görev P0). 7: sınıf kaynakları kimlik → sayı kaydı (`resources`: yalnızca sahip olunan kaynaklar,
 * `feature_used.feature` kaynak kimliği; Görev N) ve savaşa yaralı başlayan karakterler (başlangıç HP/kaynak/slot). 6: gizlenme olayında gözcü (`hide_attempted.watcherId`), bitişikteki düşmanın fark etmesi (`revealed`). 5: zar kaydı (`dice_rolled` olayı: atılan ve elle girilen zarlar) ve `state.diceMode`. 4: masum görünümü (`civilian_art` olayı, `gorselId`). 3: yakalama, ayağa kalkma, süreli hasar (`grappled`, `grapple_ended`, `grapple_escape`, `stood_up`). 2: süreli durumlar (`conditionTimers`, `condition_timer/save/ended` olayları),
 * Kaçın ve Yardım. Eski sürümler oynatılmaz: "yüklenemedi".
 */
export const SAVE_VERSION = 12;
/**
 * Yüklenebilen sürümler: her sürümün olayları bir sonrakinin alt kümesi. 3: görünümü olmayan masumlar tohumlu
 * varsayılana düşer. 3–4: zar modu yok (otomatik), zar kaydı yok. 3–6: kaynaklar üç alanlı nesne (sıfırlar dahil);
 * yeni kayıt biçimiyle aynı okunur (olmayan kaynak 0). 3–7: ustalık olayı yok (savaşçılarda işaret yok). 3–8: Rage olayları yok
 * (Barbarian savaşçısında Rage alanları yok: Rage düğmesi görünmez). 3–9: yan el yok. 3–10: Paladin alanları yok (özellik düğmeleri görünmez). 3–11: Monk alanları yok.
 */
export const LOADABLE_VERSIONS: readonly number[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface SaveFile { version: number; savedAt: string; events: BattleEvent[] }
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const store = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function serializeSession(session: Session, now = new Date()): string {
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now.toISOString(), events: session.events };
  return JSON.stringify(file);
}

export type Restored = { ok: true; session: Session; savedAt: string } | { ok: false; error: string };

export function restoreSession(text: string | null): Restored {
  if (!text) return { ok: false, error: 'Kayıt yok.' };
  try {
    const file = JSON.parse(text) as Partial<SaveFile>;
    if (!LOADABLE_VERSIONS.includes(file.version as number)) return { ok: false, error: `Kayıt yüklenemedi: sürüm ${String(file.version)} desteklenmiyor.` };
    if (!Array.isArray(file.events) || file.events.length === 0) return { ok: false, error: 'Kayıt yüklenemedi: olay günlüğü boş.' };
    const state = replay(file.events);
    return { ok: true, session: createSession(state, file.events), savedAt: file.savedAt ?? '' };
  } catch {
    return { ok: false, error: 'Kayıt yüklenemedi: dosya bozuk.' };
  }
}

/** Kaydeder; depolama yoksa ya da doluysa false. */
export function saveBattle(session: Session, s: Store | null = store()): boolean {
  if (!s) return false;
  try { s.setItem(SAVE_KEY, serializeSession(session)); return true; } catch { return false; }
}

export function loadBattle(s: Store | null = store()): Restored {
  if (!s) return { ok: false, error: 'Kayıt yüklenemedi: depolama kullanılamıyor.' };
  try { return restoreSession(s.getItem(SAVE_KEY)); } catch { return { ok: false, error: 'Kayıt yüklenemedi.' }; }
}

