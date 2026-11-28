/**
 * Görev ODA-2 (O2): uzak komutun yetki denetimi (ODA-TASARIM.md §4.3; saf). Host'un bağlamı istemcinin söylediğinden
 * değil, gönderenin oda üyeliğinden kurulur: oyuncu yalnız kendi karakterinin (ve onun `ownerId`'sini taşıyan
 * çağrılarının) komutunu gönderebilir. Motorun kendi denetimleri (`canControl`, sıra, eylem ekonomisi) ikinci kattır.
 */
import type { BattleState, Command, CommandContext } from '../battle/types';
import type { Rol } from './transport';

export type YetkiRed = 'yetki' | 'gecersiz' | 'bekle' | 'izleyici';
export type Yetki = { ok: true; ctx: CommandContext; ownerId: string } | { ok: false; neden: YetkiRed; hata: string };

/** `actorId` taşısa da yalnız Game Master'ın gönderebileceği komutlar (kurulum ve GM araçları). */
const GM_KOMUTLARI: ReadonlySet<string> = new Set(['skill_check', 'place', 'choose_civilian_art', 'set_exhaustion', 'set_ai_role', 'place_object', 'place_surface', 'reveal_object', 'grant_inspiration']);

export function komutYetkisi(state: BattleState | null, cmd: Command, uye: { rol: Rol; karakterler: ReadonlySet<string> }, yz: ReadonlySet<string> = new Set()): Yetki {
  if (uye.rol !== 'oyuncu') return { ok: false, neden: 'izleyici', hata: 'izleyici' };
  if (!state || state.status !== 'active') return { ok: false, neden: 'bekle', hata: 'savaş sürmüyor' };
  if (!cmd || typeof cmd !== 'object' || typeof cmd.type !== 'string') return { ok: false, neden: 'gecersiz', hata: 'komut' };
  if (GM_KOMUTLARI.has(cmd.type) || !('actorId' in cmd) || typeof cmd.actorId !== 'string' || (cmd as { gm?: unknown }).gm === true) {
    return { ok: false, neden: 'yetki', hata: 'Game Master komutu' };
  }
  const actor = state.combatants[cmd.actorId];
  if (!actor) return { ok: false, neden: 'gecersiz', hata: 'savaşçı yok' };
  const owner = actor.ownerId;
  if (!owner || actor.side === 'enemies' || actor.civilian || !uye.karakterler.has(owner)) return { ok: false, neden: 'yetki', hata: 'başkasının savaşçısı' };
  if (yz.has(owner)) return { ok: false, neden: 'bekle', hata: 'yapay zekâda' };
  return { ok: true, ctx: { playerId: owner, isGm: false }, ownerId: owner };
}
