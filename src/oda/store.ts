/**
 * Görev OD1: oda saklama (`rpg-battle-oda`, ayrı anahtar; karakter, savaş, yolculuk ve Serüven kayıtlarına dokunmaz).
 * Dosya: `{ surum, odalar: Oda[] }`. Ağ yok; çevrimiçi aşamada aynı model eşzamanlanır.
 */
import { ODA_KEY, ODA_SURUM, cleanName, newRoom, normalizeRoom, type CevrimiciGirdi, type Oda, type OdaKurallar, type SonSavas } from './model';
import { MAX_PARTY } from '../app/limits';
import { newId } from '../app/storage';

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const defaultStore = (): Store | null => { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } };

export function loadRooms(s: Store | null = defaultStore()): Oda[] {
  try {
    const raw = s?.getItem(ODA_KEY);
    if (!raw) return [];
    const file = JSON.parse(raw) as { odalar?: unknown };
    return (Array.isArray(file.odalar) ? file.odalar : []).map(normalizeRoom).filter((o): o is Oda => o !== null);
  } catch { return []; }
}

export function saveRooms(list: Oda[], s: Store | null = defaultStore()): void {
  try { s?.setItem(ODA_KEY, JSON.stringify({ surum: ODA_SURUM, odalar: list })); } catch { /* yalnızca bu oturumda */ }
}

const touch = (o: Oda, now: string): Oda => ({ ...o, guncelleme: now });

export function createRoom(list: Oda[], ad: string, kurallar: OdaKurallar, now = new Date().toISOString(), gmAdi = ''): { list: Oda[]; room: Oda } {
  const room = newRoom(newId(), ad, now, kurallar, gmAdi);
  return { list: [room, ...list], room };
}
export const renameRoom = (list: Oda[], id: string, ad: string, now = new Date().toISOString()): Oda[] =>
  list.map((o) => (o.id === id && cleanName(ad) ? touch({ ...o, ad: cleanName(ad) }, now) : o));
export const deleteRoom = (list: Oda[], id: string): Oda[] => list.filter((o) => o.id !== id);
export const updateRoom = (list: Oda[], id: string, fn: (o: Oda) => Oda, now = new Date().toISOString()): Oda[] =>
  list.map((o) => (o.id === id ? touch(fn(o), now) : o));

/** Karakteri odanın partisine ekler (en çok `MAX_PARTY`; zaten varsa aynı). */
export const joinRoom = (o: Oda, characterId: string): Oda => (o.parti.includes(characterId) || o.parti.length >= MAX_PARTY ? o : { ...o, parti: [...o.parti, characterId] });
export const leaveRoom = (o: Oda, characterId: string): Oda => ({ ...o, parti: o.parti.filter((x) => x !== characterId) });

/** Savaş başlarken ayarlar kilitlenir; bitince (ya da kayıtlı savaş kalmayınca) açılır ve son savaş özeti yazılır. */
export const lockRoom = (o: Oda, now = new Date().toISOString()): Oda => ({ ...o, kilit: { baslangic: now } });
export const unlockRoom = (o: Oda, son?: SonSavas): Oda => ({ ...o, kilit: null, ...(son ? { sonSavas: son } : {}) });
/** Kilit yalnız bitmemiş kayıtlı savaş varken geçerli; yoksa kendiliğinden açılır. */
export const isLocked = (o: Oda, savedBattle: boolean): boolean => o.kilit !== null && savedBattle;

/** Görev ODA-1: çevrimiçi karakter kopyası partiye girer (aynı kimlik yenilenir; parti doluysa değişmez). */
export function addOnlineCopy(o: Oda, g: CevrimiciGirdi): Oda {
  const joined = joinRoom(o, g.karakterId);
  if (!joined.parti.includes(g.karakterId)) return o;
  return { ...joined, cevrimici: [...joined.cevrimici.filter((x) => x.karakterId !== g.karakterId), g] };
}
export const removeOnlineCopy = (o: Oda, karakterId: string): Oda =>
  o.cevrimici.some((x) => x.karakterId === karakterId) ? { ...leaveRoom(o, karakterId), cevrimici: o.cevrimici.filter((x) => x.karakterId !== karakterId) } : o;
/** Çevrimiçi oda kapanınca kopyalar partiden çıkar. */
export const clearOnlineCopies = (o: Oda): Oda => o.cevrimici.reduce((r, g) => removeOnlineCopy(r, g.karakterId), o);
