/**
 * Çılgın Yol (Berserker, Frenzy) öfkesi: başın üstünden yükselen üç alev dili (yalnız görünüm). Renkler `data/efekt-baglama.json`
 * `jeton.ofke.alevler` (koyu kırmızı-turuncu; pembe/magenta yok); animasyon CSS (`.rage-flames`), "efekt animasyonu" kapalı ya da hareketi
 * azalt açıkken `.rage-still` tek sabit kare. Savaş ekranı (tembel parça) çizer; `x,y` jetonun üst orta noktası, `r` jeton yarıçapı.
 */
import baglama from '../../data/efekt-baglama.json';

const O = baglama.jeton.ofke;
const FLAME = 'M0,0 C-0.34,-0.22 -0.2,-0.56 -0.02,-1 C0.06,-0.62 0.36,-0.5 0.3,-0.2 C0.26,-0.06 0.12,0 0,0 Z';
const TONGUES = [{ dx: -0.34, k: 0.34, c: 0 }, { dx: 0, k: 0.5, c: 1 }, { dx: 0.34, k: 0.38, c: 2 }];

export function RageFlames({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g className="rage-flames" transform={`translate(${x} ${y + r * 0.2 - O.yukselme})`} aria-hidden="true" pointerEvents="none">
      {TONGUES.map((f, i) => (
        <g key={i} transform={`translate(${f.dx * r} 0) scale(${f.k * r})`}>
          <path className={`rf rf-${'abc'[i]}`} d={FLAME} fill={O.alevler[f.c]} stroke={O.alevler[0]} strokeWidth={0.05} />
        </g>
      ))}
    </g>
  );
}
