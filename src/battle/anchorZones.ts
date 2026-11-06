/**
 * Kuyruk S1 (sürüm 40, Gust of Wind `anchorSelf`): büyücüye bağlı süren alan (rüzgâr çizgisi). Büyücü yer değiştirince
 * (yürüme, ışınlanma, itilme) komutun sonunda alan aynı kayma ile taşınır (`zone_moved`; harita dışına düşen altıgenler
 * kalkar). Yürüyüş sırasında alan eski yerindedir (komut sonunda kayar). Saf; komut sonu kancası.
 */
import { axialToOffset, offsetToAxial } from '../rules/hex';
import { ruleVersion } from './ruleVersion';
import { registerCommandEnd } from './turnHooks';
import type { BattleEvent } from './types';

registerCommandEnd((_before, next) => {
  if (ruleVersion(next) < 40 || !next.map?.zones?.length) return [];
  const out: BattleEvent[] = [];
  const rows = next.map.tiles.length; const cols = next.map.tiles[0]?.length ?? 0;
  for (const z of next.map.zones) {
    if (!z.spec?.followCaster || !z.center) continue;
    const pos = next.combatants[z.casterId]?.pos;
    if (!pos || (pos.col === z.center.col && pos.row === z.center.row)) continue;
    const a = offsetToAxial(z.center); const b = offsetToAxial(pos);
    const hexes = z.hexes.map((h) => { const x = offsetToAxial(h); return axialToOffset({ q: x.q + b.q - a.q, r: x.r + b.r - a.r }); })
      .filter((h) => h.col >= 0 && h.row >= 0 && h.col < cols && h.row < rows);
    out.push({ type: 'zone_moved', zoneId: z.id, hexes, center: pos });
  }
  return out;
});
