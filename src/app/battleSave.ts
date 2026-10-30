/**
 * Savaşı kaydet/yükle (tek kayıt yuvası). Yalnızca olay günlüğü saklanır; yüklerken olaylar
 * baştan oynatılır (`replay`) ve aynı durum üretilir. Kayıt sürümlüdür: bilinmeyen sürüm, bozuk
 * JSON ya da oynatılamayan günlük hata fırlatmaz, "yüklenemedi" sonucu döner.
 */
import { replay, type BattleEvent } from '../battle';
import { createSession, type Session } from '../ui/session';
import { externalSubclasses } from '../rules/subclasses';

import { SAVE_KEY, hasSavedBattle } from './saveKey';

export { SAVE_KEY, hasSavedBattle };
/**
 * Kayıt biçimi sürümü. 18: Fighter/Rogue/Ranger (Görev F): `mark_added`, `steady_aim_used`, `extra_damage` olayları; `attack.cunning`,
 * `steady_aim`, `horde_breaker` komutları; `attack_resolved.traitTurns/steadyAim/cunning`; savaşçıda `traits`, `critOn`, `traitTurns`,
 * `steadyAim`; ikinci şans zarları (`bonusDice.resource`). 17: kayıtta o an açık dış içerik paketlerinin kimlikleri (`content`; Görev E1; olaylar aynı,
 * savaşçılar alt sınıf özellikleriyle olaylarda olduğu için paket silinse de kayıt oynar). 16: alan şekilleri (`area_used` olayı; `monster_attack.targetHex`, `breath_weapon` komutu; savaşçıda
 * `breath`, saldırıda `area`; Görev R4). 15: çağırma (`summoned`, `summon_vanished` olayları; savaşçıda `summon`; `cast_spell.form`; Görev R3). 14: süren etkiler (`effect_added`, `effect_ended`, `temp_hp`, `hp_boosted`, `effect_tick`, `turn_lost`
 * olayları; `bonusDice` alanları; savaşçıda `effects`/`tempHp`; `cast_spell.targetIds`/`choice`; Görev R2). 13: tepki sistemi (`reaction_used`, `reaction_recharged`, `swapped` olayları; `attack_resolved.reacted`;
 * savaşçıda `reactions`/`reactionUses`/`reactionSpent`, `shield` işareti; Görev R1). 12: Monk (`bonus_strike`, `focus_action`, `stunning_strike` komutları; `action_used.flurryLeft`/`stunUsed`,
 * `attack_resolved.martialArts`/`deflected`; savaşçıda Monk alanları; Görev P-Monk). 11: Paladin (`use_feature` komutu, `buff_added` olayı, `attack_resolved.melee`, ekonomide `meleeHit`,
 * savaşçıda `buffs`/`features`/`creatureType`; Görev P-Paladin). 10: yan el (Light ek saldırısı; `action_used.light`/`offhand`, ekonomide `lightAttack`/`offhandUsed`,
 * savaşçıda `offHandOption`/`nickOffhand`; Görev P1). 9: Barbarian (`rage_started`, `rage_extended`, `rage_ended`, `reckless_started` olayları; savaşçıda
 * `rage`, `rageDamage`, `saveAdvantage`, `frenzyTurn`…; Görev P-Barbarian). 8: silah ustalığı (`mastery_applied`, `mastery_mark_used` olayları; savaşçıda `marks`, `cleaveTurn`;
 * Görev P0). 7: sınıf kaynakları kimlik → sayı kaydı (`resources`: yalnızca sahip olunan kaynaklar,
 * `feature_used.feature` kaynak kimliği; Görev N) ve savaşa yaralı başlayan karakterler (başlangıç HP/kaynak/slot). 6: gizlenme olayında gözcü (`hide_attempted.watcherId`), bitişikteki düşmanın fark etmesi (`revealed`). 5: zar kaydı (`dice_rolled` olayı: atılan ve elle girilen zarlar) ve `state.diceMode`. 4: masum görünümü (`civilian_art` olayı, `gorselId`). 3: yakalama, ayağa kalkma, süreli hasar (`grappled`, `grapple_ended`, `grapple_escape`, `stood_up`). 2: süreli durumlar (`conditionTimers`, `condition_timer/save/ended` olayları),
 * Kaçın ve Yardım. 20: geçmiş (savaşçıda `backgroundId`, Magic Initiate büyüleri `spellNames`'te; Görev G1). 19: büyü alanları (`zone_created`, `zone_moved`, `zone_triggered`, `zone_ended` olayları; haritada `zones`; Görev B2).
 * Eski sürümler oynatılmaz: "yüklenemedi".
 */
export const SAVE_VERSION = 20;
/**
 * Yüklenebilen sürümler: her sürümün olayları bir sonrakinin alt kümesi. 3: görünümü olmayan masumlar tohumlu
 * varsayılana düşer. 3–4: zar modu yok (otomatik), zar kaydı yok. 3–6: kaynaklar üç alanlı nesne (sıfırlar dahil);
 * yeni kayıt biçimiyle aynı okunur (olmayan kaynak 0). 3–7: ustalık olayı yok (savaşçılarda işaret yok). 3–8: Rage olayları yok
 * (Barbarian savaşçısında Rage alanları yok: Rage düğmesi görünmez). 3–9: yan el yok. 3–10: Paladin alanları yok (özellik düğmeleri görünmez). 3–11: Monk alanları yok.
 * 3–19: geçmiş yok (savaşçılarda `backgroundId` yok; eski karakterler geçmişsiz oynar). 3–18: büyü alanı yok (haritada `zones` yok). 3–17: Görev F alanları yok (savaşçılarda işaret yok: özellikler çalışmaz, eski davranış). 3–16: `content` yok (dış içerik yoktu). 3–15: alan olayı yok (nefesler tek hedefli `save_resolved`; reducer aynı okur). 3–14: çağrılmış yaratık yok. 3–13: etki alanları yok (Bless vb. çalışmıyordu; savaşçılarda `effects` yok). 3–12: tepki alanları yok (fırsat saldırısı ve Deflect Attacks `action_used`/`deflected` ile harcanmış; reducer ikisini de okur).
 */
export const LOADABLE_VERSIONS: readonly number[] = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

interface SaveFile { version: number; savedAt: string; events: BattleEvent[]; content?: string[] }
type Store = Pick<Storage, 'getItem' | 'setItem'>;

const store = (): Store | null => {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
};

export function serializeSession(session: Session, now = new Date()): string {
  const content = [...new Set(externalSubclasses().map((s) => s.pack).filter((x): x is string => !!x))];
  const file: SaveFile = { version: SAVE_VERSION, savedAt: now.toISOString(), events: session.events, ...(content.length ? { content } : {}) };
  return JSON.stringify(file);
}

/** `missingContent`: kayıttaki dış içerik paketlerinden şu an yüklü olmayanlar (bilgi; savaş yine oynar). */
export type Restored = { ok: true; session: Session; savedAt: string; missingContent?: string[] } | { ok: false; error: string };

export function restoreSession(text: string | null): Restored {
  if (!text) return { ok: false, error: 'Kayıt yok.' };
  try {
    const file = JSON.parse(text) as Partial<SaveFile>;
    if (!LOADABLE_VERSIONS.includes(file.version as number)) return { ok: false, error: `Kayıt yüklenemedi: sürüm ${String(file.version)} desteklenmiyor.` };
    if (!Array.isArray(file.events) || file.events.length === 0) return { ok: false, error: 'Kayıt yüklenemedi: olay günlüğü boş.' };
    const state = replay(file.events);
    const loaded = new Set(externalSubclasses().map((s) => s.pack));
    const missing = (Array.isArray(file.content) ? file.content : []).filter((id) => !loaded.has(id));
    return { ok: true, session: createSession(state, file.events), savedAt: file.savedAt ?? '', ...(missing.length ? { missingContent: missing } : {}) };
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

