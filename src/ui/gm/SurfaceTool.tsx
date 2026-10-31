/**
 * Görev K13B: Game Master "Yüzey yerleştir" aracı (savaş ekranı). Tür seçilir, haritada dokunulan altıgene
 * `place_surface` komutu gider (olay tabanlı, replay uyumlu; zar gerekmez). "Kaldır" o altıgendeki yüzeyleri siler.
 * Ayrı bileşen: GM Atölyesi aynı paleti kullanacak.
 */
import { SURFACES } from '../../battle/surfaces';
import type { SurfaceKind } from '../../battle/types';
import { getLang, t } from '../../i18n';

export const TOOL_SURFACES: SurfaceKind[] = ['oil', 'water', 'ice', 'fire', 'steam', 'poison', 'slick'];
export type SurfacePick = SurfaceKind | 'remove';

export function SurfaceTool(props: { pick: SurfacePick; onPick: (p: SurfacePick) => void; onClose: () => void }) {
  const S = t().battle.gm.surfaceTool;
  const en = getLang() === 'en';
  return (
    <div className="gm-tool" role="toolbar" aria-label={S.title}>
      <strong className="gm-tool-title">{S.title}</strong>
      {TOOL_SURFACES.map((k) => (
        <button key={k} className={props.pick === k ? 'on' : ''} aria-pressed={props.pick === k} onClick={() => props.onPick(k)}>
          {SURFACES[k].zone.icon ?? ''} {en ? SURFACES[k].en : SURFACES[k].tr}
        </button>
      ))}
      <button className={props.pick === 'remove' ? 'on' : ''} aria-pressed={props.pick === 'remove'} onClick={() => props.onPick('remove')}>✕ {S.remove}</button>
      <button onClick={props.onClose}>{S.close}</button>
    </div>
  );
}
