/**
 * Görev OD1B: düşman HP görünürlüğünün tek çözücüsü (yalnız görünüm; olaylar, kayıt ve replay aynı). Oda ayarı Gizli /
 * Etiket / Yüzde iken düşmanın canını ele veren sayı (günlük, jeton, bilgi kartı, önizleme) buradan geçer. Oyuncu
 * karakterleri, dostlar ve masumlar her zaman Tam. Mod `oda/active` örtüsünden (`enemyHpVis`) ya da açıkça verilir.
 */
import { enemyHpVis, type HpVis } from '../oda/active';
import { hpBand, hpBarFraction, hpPercent } from '../oda/hp';
import { t } from '../i18n';

interface Who { side: string; civilian?: boolean; hp: number; maxHp: number }

/** Bu yaratığın HP'si gizli mi: gizliyse kullanılan mod, değilse null (Tam). */
export function hpModeFor(c: { side: string; civilian?: boolean } | undefined, mode: HpVis = enemyHpVis()): Exclude<HpVis, 'tam'> | null {
  if (!c || c.side !== 'enemies' || c.civilian || mode === 'tam') return null;
  return mode;
}

/** Çubuk doluluğu: gizli yaratıkta moda göre (gizli: null), değilse gerçek oran. */
export function hpFraction(c: Who, mode: HpVis = enemyHpVis()): number | null {
  const m = hpModeFor(c, mode);
  return m ? hpBarFraction(c.hp, c.maxHp, m) : Math.max(0, c.hp / c.maxHp);
}

/** Hasar/iyileşme satırında sayı yerine geçen kısa ifade. `hpAfter`: olaydan sonraki can. */
export function hpPhrase(mode: Exclude<HpVis, 'tam'>, hpAfter: number, maxHp: number, kind: 'damage' | 'heal'): string {
  const H = t().oda.hpLog;
  if (mode === 'gizli') return kind === 'heal' ? H.healed : hpAfter <= 0 ? H.down : H.hurt;
  if (mode === 'etiket') return H.status(t().oda.band[hpBand(hpAfter, maxHp)] ?? '');
  return H.percent(hpPercent(hpAfter, maxHp));
}

/** "HP 12/38" geçen bir metindeki sayıyı moda göre gizler/etikete/yüzdeye çevirir (jeton ve altıgen bilgisi). */
export function maskHpText(text: string, c: Who): string {
  const m = hpModeFor(c);
  if (!m) return text;
  const O = t().oda;
  const repl = m === 'gizli' ? O.hpHidden : m === 'etiket' ? (O.band[hpBand(c.hp, c.maxHp)] ?? '') : `HP ${hpPercent(c.hp, c.maxHp)}%`;
  return text.replace(/HP \d+\/\d+/, repl);
}
