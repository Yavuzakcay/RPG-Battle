/**
 * Görev HEROIC-INSPIRATION-TAM (SRD 5.2.1 s. 7 "Heroic Inspiration", s. 182 Sözlük): karakter kâğıdındaki kalıcı hak.
 * Tek kaynak: kayıtlı durumda `resources.heroicInspiration` (0 ya da 1; Human Resourceful'ın uzun dinlenme kaynağıyla
 * aynı anahtar, `data/class-features.json`). Hakkı olan her oyuncu karakteri onu savaşta kullanır (kural sürümü 111+).
 * "Only One at a Time": en çok 1; hakkı varken yeni hak gelirse partide hakkı olmayan bir oyuncu karakterine verilebilir,
 * verilmezse kaybolur. Saf; savaş dışı (kural sürümü gerektirmez).
 */
import type { CharacterStatus } from './characterRest';

export const HEROIC_RESOURCE = 'heroicInspiration';

/** Durumda hak var mı. */
export const hasHeroic = (status: Pick<CharacterStatus, 'resources'> | undefined): boolean => (status?.resources[HEROIC_RESOURCE] ?? 0) > 0;

/** Durumun hakkı verilmiş kopyası (en çok 1). */
export const withHeroic = <T extends Pick<CharacterStatus, 'resources'>>(status: T): T =>
  ({ ...status, resources: { ...status.resources, [HEROIC_RESOURCE]: 1 } });

/** Hakkın sonucu: verildi, hakkı olmayan bir dosta aktarıldı ya da (aktarılmadı) kayboldu. */
export type HeroicOutcome = { kind: 'verildi'; to: string } | { kind: 'aktarildi'; from: string; to: string } | { kind: 'kayboldu'; from: string };

/** Hakkı alabilecek dostlar (hakkı olmayan, ölü olmayan, kendisi hariç). */
export function heroicPassTargets<M extends { id: string; status?: CharacterStatus }>(members: readonly M[], fromId: string): M[] {
  return members.filter((m) => m.id !== fromId && !m.status?.dead && !hasHeroic(m.status));
}

/**
 * `targetId`'ye hak verir. Hakkı yoksa alır; varsa `passTo` (hakkı olmayan bir dost) alır, `passTo` yoksa yeni hak kaybolur.
 * Ölüye hak verilmez. Döner: değişen durumlar (yalnız değişenler) ve sonuç, ya da hata.
 */
export function grantHeroic<M extends { id: string; status?: CharacterStatus }>(members: readonly M[], targetId: string, passTo?: string,
  /** Durumu olmayan üyenin (dinlenmiş) durumu. */ statusOf: (m: M) => CharacterStatus = (m) => m.status as CharacterStatus):
  { ok: true; statuses: Record<string, CharacterStatus>; outcome: HeroicOutcome } | { ok: false; error: string } {
  const target = members.find((m) => m.id === targetId);
  if (!target) return { ok: false, error: 'Karakter bulunamadı.' };
  if (target.status?.dead) return { ok: false, error: 'Ölü karaktere Heroic Inspiration verilmez.' };
  if (!hasHeroic(target.status)) return { ok: true, statuses: { [target.id]: withHeroic(statusOf(target)) }, outcome: { kind: 'verildi', to: target.id } };
  if (passTo === undefined) return { ok: true, statuses: {}, outcome: { kind: 'kayboldu', from: target.id } };
  const to = heroicPassTargets(members, target.id).find((m) => m.id === passTo);
  if (!to) return { ok: false, error: 'Hak yalnız partide Heroic Inspiration\'ı olmayan bir karaktere aktarılır.' };
  return { ok: true, statuses: { [to.id]: withHeroic(statusOf(to)) }, outcome: { kind: 'aktarildi', from: target.id, to: to.id } };
}
