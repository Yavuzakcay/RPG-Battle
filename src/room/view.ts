/**
 * Görev ODA-3 (O3): çevrimiçi odada görünüm süzgeci (ODA-TASARIM.md §4.1, §4.2; kullanıcı kararı madde 1: ilk sürümde
 * görünüm süzgeci, sıkı mod sonra). Saf: React/DOM/i18n yok. Ham olaylar herkese gider ve her istemcinin durumu host'unkiyle
 * bire bir aynıdır; bu modül yalnız **çizimde** neyin gösterileceğini söyler (jeton, alan, nesne, tuzak, HP kademesi,
 * günlük/animasyon/zar için olay süzgeci). Tek cihazda izleyici yoktur (null): arayüz bugünkü sıradan türeyen perdeyi
 * (`ui/stealthView.ts` `viewerOf`) aynen kullanır.
 *
 * - `gm`: her şeyi görür (gizlenen düşman, gizli alan, bulunmamış nesne ve tuzak, tam HP, bütün günlük). Partinin
 *   gizlenen jetonu her zaman "hidden-shown".
 * - `oyuncu`: kendi savaşçıları (`ownerIds`; çağrılar sahibinin `ownerId`'sini taşır) ve aynı taraf. Gizlenen düşman,
 *   bulunmamış nesne/tuzak görünmez; gizli alan yalnız kendi savaşçılarından biri biliyorsa (`zoneKnownBy`; Phantasmal
 *   Force yalnız hedefin oyuncusunda); düşman HP'si oda kademesinde.
 * - `izleyici`: oyuncu görünümü, kendi savaşçısı yok (alanlarda parti düzeyi `zoneShownTo`).
 *
 * Olay süzgeci (`olayiSuz`) yalnız gösterim içindir: reducer'a, kayda ve replay'e hiç girmez.
 */
import type { BattleEvent, BattleState, Combatant, DiceRoll, MapObject, SpellZone } from '../battle/types';
import type { Offset } from '../rules/hex';
import { zoneKnownBy, zoneShownTo } from '../battle/hiddenZones';
import { concealed } from '../battle/hiddenObjects';
import { trapHexes, vineHexes } from '../battle/maprules';

export type Izleyici =
  | { tur: 'gm' }
  | { tur: 'oyuncu'; ownerIds: readonly string[] }
  | { tur: 'izleyici' };

export const IZLEYICI_GM: Izleyici = { tur: 'gm' };

/** Düşman HP görünürlüğü kademesi (`src/oda/active.ts` `HpVis` ile aynı değerler). */
export type HpKademe = 'gizli' | 'etiket' | 'yuzde' | 'tam';
/** Jeton görünümü (`ui/stealthView.ts` `TokenView` ile aynı değerler). */
export type JetonGorunumu = 'normal' | 'hidden-own' | 'hidden-shown' | 'invisible';

const gmMi = (iz: Izleyici): boolean => iz.tur === 'gm';

/** İzleyicinin kendi savaşçıları (canlı/ölü fark etmez; kaybolanlar dahil). */
export function kendiSavascilari(state: BattleState, iz: Izleyici): Combatant[] {
  if (iz.tur !== 'oyuncu') return [];
  const owners = new Set(iz.ownerIds);
  return Object.values(state.combatants).filter((c) => !!c.ownerId && owners.has(c.ownerId) && c.side === 'party' && !c.civilian);
}

/** İzleyicinin gördüğü düşman HP kademesi: Game Master her zaman tam, oyuncu/izleyici odanın kademesi. */
export const hpGorunumu = (iz: Izleyici, oda: HpKademe): HpKademe => (gmMi(iz) ? 'tam' : oda);

/** İzleyicinin "kendi tarafı" mı (gizlenen jetonu örtüyle görür). */
function kendiTarafi(c: Combatant, iz: Izleyici): boolean {
  if (gmMi(iz)) return c.side === 'enemies' || !!c.civilian;
  return c.side === 'party' && !c.civilian;
}

/** Bu izleyici bu yaratığı haritada göremiyor mu (gizlenmiş ve karşı taraf). */
export function gorunmez(c: Combatant | undefined, iz: Izleyici): boolean {
  return !!c && !!c.hidden && !gmMi(iz) && !kendiTarafi(c, iz);
}

/**
 * Jetonun bu izleyicide nasıl çizileceği. Game Master'da partinin gizlenen jetonu her zaman görünür ("her şeyi görür");
 * oyuncuda gizlenen düşman görünmez, aynı tarafın gizlenen jetonu örtüyle.
 */
export function jetonGorunumu(c: Combatant, iz: Izleyici): JetonGorunumu {
  if (!c.hidden) return 'normal';
  if (kendiTarafi(c, iz)) return 'hidden-own';
  return gmMi(iz) ? 'hidden-shown' : 'invisible';
}

/** Alan bu izleyicide çizilir mi (Spike Growth kamuflajı, Phantasmal Force yanılsaması). */
export function alanGorunur(state: BattleState, z: SpellZone, iz: Izleyici): boolean {
  if (gmMi(iz)) return true;
  const kendi = kendiSavascilari(state, iz);
  if (!kendi.length) return zoneShownTo(state, z, 'party', false);
  return kendi.some((c) => zoneKnownBy(z, c));
}

/** Haritadaki nesne: bulunmamış gizli nesne Game Master'da soluk, oyuncuda hiç çizilmez. */
export function nesneGorunumu(state: Pick<BattleState, 'map' | 'kuralSurumu'>, o: MapObject, iz: Izleyici): 'shown' | 'faded' | 'none' {
  if (!concealed(state, o)) return 'shown';
  return gmMi(iz) ? 'faded' : 'none';
}

/**
 * Game Master tuzak katmanı: henüz bulunmamış ve tetiklenmemiş tuzak/sarmaşık kapanı altıgenleri (bulunanları harita
 * zaten herkese çizer). Oyuncu izleyicide boş.
 */
export function gmTuzaklari(state: BattleState, iz: Izleyici): Offset[] {
  if (!gmMi(iz) || !state.map) return [];
  const bilinen = new Set([...(state.map.trapsFound ?? []), ...(state.map.trapsSprung ?? [])]);
  const out: Offset[] = [];
  const goruldu = new Set<string>();
  for (const h of [...trapHexes(state), ...vineHexes(state)]) {
    const k = `${h.col},${h.row}`;
    if (bilinen.has(k) || goruldu.has(k)) continue;
    goruldu.add(k);
    out.push(h);
  }
  return out;
}

/** Yalnız Game Master'ın gördüğü olay türleri (gizli zarlar ve GM bilgisi). */
const GM_OLAYLARI: ReadonlySet<string> = new Set(['dragon_perception', 'rouse_roll', 'patrol_moved']);
/** Konum ele veren hareket olayları (gizlenen düşmanınki oyuncuda çizilmez). */
const HAREKET: ReadonlySet<string> = new Set(['moved', 'jumped', 'teleported', 'altitude_changed', 'climbed']);

const savasci = (s: BattleState | null, id: string | undefined): Combatant | undefined => (id && s ? s.combatants[id] : undefined);

/** Zar bu izleyiciden gizli mi: gizlenen karşı taraf yaratığın zarı ya da karşı tarafın/ortamın gizli kontrolü (Stealth, Algı). */
function gizliZar(r: DiceRoll, once: BattleState | null, sonra: BattleState, iz: Izleyici): boolean {
  if (gmMi(iz)) return false;
  const c = savasci(sonra, r.by) ?? savasci(once, r.by);
  if (!c) return r.kind === 'check';
  if (kendiTarafi(c, iz)) return false;
  if (r.kind === 'check') return true;
  return gorunmez(savasci(sonra, r.by), iz) && gorunmez(savasci(once, r.by), iz);
}

export interface SuzgecSecenek {
  /** Oda HP kademesi (oyuncu/izleyici); `tam` değilse düşman can havuzu olayları gizlenir. */
  hp?: HpKademe;
}

/**
 * Tek olayı izleyiciye göre süzer: olduğu gibi, daraltılmış (zar olayında gizli zarlar çıkar) ya da `null` (çizilmez).
 * `once`: olaydan önceki durum (bilinmiyorsa null), `sonra`: grubun sonundaki durum.
 */
export function olayiSuz(e: BattleEvent, once: BattleState | null, sonra: BattleState, iz: Izleyici, sec: SuzgecSecenek = {}): BattleEvent | null {
  if (gmMi(iz)) return e;
  if (GM_OLAYLARI.has(e.type)) return null;
  if (e.type === 'dice_rolled') {
    const rolls = e.rolls.filter((r) => !gizliZar(r, once, sonra, iz));
    return rolls.length === e.rolls.length ? e : rolls.length ? { ...e, rolls } : null;
  }
  const aktor = 'actorId' in e && typeof e.actorId === 'string' ? e.actorId : 'targetId' in e && typeof e.targetId === 'string' ? e.targetId : undefined;
  if (HAREKET.has(e.type) && aktor) {
    // Önce de sonra da gizli kalan karşı taraf yaratığın hareketi (açığa çıkan ise görünür).
    if (gorunmez(savasci(sonra, aktor), iz) && (!once || gorunmez(savasci(once, aktor), iz))) return null;
    return e;
  }
  if ((e.type === 'hide_attempted' || e.type === 'skill_checked') && aktor) {
    const c = savasci(sonra, aktor) ?? savasci(once, aktor);
    return c && kendiTarafi(c, iz) ? e : null;
  }
  if (e.type === 'zone_created') return alanGorunur(sonra, e.zone, iz) ? e : null;
  if (e.type === 'zone_triggered' || e.type === 'zone_moved') {
    const z = (sonra.map?.zones ?? []).find((x) => x.id === e.zoneId) ?? (once?.map?.zones ?? []).find((x) => x.id === e.zoneId);
    if (z && !alanGorunur(sonra, z, iz)) {
      // Tetiklenen kendi savaşçısıysa (alan ona zarar verdi) görür; yoksa çizilmez.
      if (e.type === 'zone_triggered' && kendiSavascilari(sonra, iz).some((c) => c.id === e.targetId)) return e;
      return null;
    }
    return e;
  }
  if ((e.type === 'hp_pool_created' || e.type === 'hp_pool_synced') && sec.hp && sec.hp !== 'tam') {
    const ids = e.type === 'hp_pool_created' ? e.memberIds : Object.values(sonra.combatants).filter((c) => c.poolId === e.poolId).map((c) => c.id);
    if (ids.some((id) => sonra.combatants[id]?.side === 'enemies')) return null;
  }
  return e;
}

/**
 * Olay grubunu süzer. `once` grubun başındaki durum: hareket olayının gizliliği hem önce hem sonra gizli olmasına
 * bakılarak verilir (grupta açığa çıkan yaratığın hareketi görünür).
 */
export function olaylariSuz(events: readonly BattleEvent[], once: BattleState | null, sonra: BattleState, iz: Izleyici, sec: SuzgecSecenek = {}): BattleEvent[] {
  if (gmMi(iz)) return [...events];
  const out: BattleEvent[] = [];
  for (const e of events) { const x = olayiSuz(e, once, sonra, iz, sec); if (x) out.push(x); }
  return out;
}
