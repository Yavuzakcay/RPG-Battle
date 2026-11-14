/**
 * Anka kanadı vb. animasyonlu kanat sayfaları (yalnız görünüm). Animasyon yalnız efekt animasyonu açıksa, "hareketi azalt"
 * kapalıysa ve ekranda en çok `MAX_ANIMATED` animasyon varsa oynar; aksi halde ilk kare sabit.
 */
import { useEffect, useState } from 'react';
import { reducedMotion } from './effectsSetting';
import { MAX_ANIMATED } from './statusFx';

const SPRITE_ANIM_KEY = 'rpg-battle-sprite-anim';
let live = 0;

/** Efekt animasyonu tercihi (kayıt: `useSpriteAnimSetting` ile aynı anahtar) ve hareketi azalt: animasyon izni. */
export function wingAnimAllowed(): boolean {
  if (reducedMotion()) return false;
  try { return localStorage.getItem(SPRITE_ANIM_KEY) !== 'off'; } catch { return true; }
}

/** Bu kanat animasyon hakkı alabildi mi (en çok 8 eşzamanlı; bileşen kalkınca hak döner). */
export function useWingAnim(sprite: boolean): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!sprite || !wingAnimAllowed() || live >= MAX_ANIMATED) { setOn(false); return; }
    live += 1; setOn(true);
    return () => { live -= 1; };
  }, [sprite]);
  return on;
}
