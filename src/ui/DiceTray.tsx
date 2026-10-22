/**
 * Zar tepsisi (Görev J): sıradaki zar grubunu ekranın üst ortasında gösterir. Zar türüne uygun şekil (d4 üçgen,
 * d6 kare, d8 eşkenar dörtgen, d10/d100 uçurtma, d12 beşgen, d20 altıgen) döner, sonucu gösterir, altında toplam.
 * Avantaj/dezavantajda iki d20; sayılmayan soluk. Doğal 20 altın, doğal 1 kırmızı. Kuyruktaki gruplar sırayla oynar.
 * Tepsi tıklamaları engellemez (pointer-events: none); ekrana herhangi bir dokunuş kuyruğu atlar (oyun tıklaması
 * da olağan biçimde işler). Haritalı savaş parçasından da ayrı, tembel yüklenen parça.
 */
import { useEffect, useState } from 'react';
import type { DiceRoll } from '../battle';
import { diceCaption, keptIndex } from './diceAnim';
import { t } from '../i18n';

export interface TrayItem { id: number; roll: DiceRoll; title: string }

const SHAPES: Record<number, string> = {
  4: '50,8 94,88 6,88',
  6: '12,12 88,12 88,88 12,88',
  8: '50,3 95,50 50,97 5,50',
  10: '50,3 93,40 50,97 7,40',
  12: '50,4 96,37 79,94 21,94 4,37',
  20: '50,3 93,27 93,73 50,97 7,73 7,27',
  100: '50,3 93,40 50,97 7,40',
};

function Die(props: { sides: number; value: number | null; faded?: boolean; spinning: boolean; crit?: boolean; fumble?: boolean }) {
  const pts = SHAPES[props.sides] ?? SHAPES[6];
  const cls = ['die', props.spinning ? 'spin' : '', props.faded ? 'faded' : '', props.crit ? 'crit' : '', props.fumble ? 'fumble' : ''].filter(Boolean).join(' ');
  return (
    <svg className={cls} viewBox="0 0 100 100" width="58" height="58" aria-hidden="true">
      <polygon points={pts} />
      {props.sides === 20 && <polygon className="facet" points="50,22 76,66 24,66" />}
      <text x="50" y={props.sides === 4 ? 70 : 60}>{props.value ?? '?'}{props.sides === 100 ? '%' : ''}</text>
    </svg>
  );
}

export default function DiceTray(props: {
  items: TrayItem[]; timings: { spin: number; show: number }; onDone: (id: number) => void; onSkip: () => void;
}) {
  const { items, timings } = props;
  const cur = items[0];
  const [phase, setPhase] = useState<'spin' | 'show'>('spin');
  const [flicker, setFlicker] = useState<number[]>([]);
  // Sıradaki grup: önce dönme (sayılar hızla değişir), sonra sonuç; süre dolunca kuyruktan düşer.
  useEffect(() => {
    if (!cur) return;
    setPhase(timings.spin > 0 ? 'spin' : 'show');
    const roll = cur.roll;
    const tick = timings.spin > 0
      ? window.setInterval(() => setFlicker(roll.values.map(() => 1 + Math.floor(Math.random() * roll.sides))), 70) : null;
    const toShow = window.setTimeout(() => { if (tick) window.clearInterval(tick); setPhase('show'); }, timings.spin);
    const done = window.setTimeout(() => props.onDone(cur.id), timings.spin + timings.show);
    return () => { if (tick) window.clearInterval(tick); window.clearTimeout(toShow); window.clearTimeout(done); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id, timings.spin, timings.show]);
  // Dokununca atla: tıklamayı yutmaz, yalnızca kuyruğu boşaltır.
  useEffect(() => {
    if (!cur) return;
    const skip = () => props.onSkip();
    document.addEventListener('pointerdown', skip, { capture: true, passive: true });
    return () => document.removeEventListener('pointerdown', skip, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.id]);
  if (!cur) return null;
  const r = cur.roll;
  const spinning = phase === 'spin';
  const cap = diceCaption(r);
  const kept = keptIndex(r);
  const twoD20 = r.sides === 20 && r.values.length === 2;
  return (
    <div className={`dice-tray${cap.crit && !spinning ? ' crit' : ''}${cap.fumble && !spinning ? ' fumble' : ''}`} aria-live="polite">
      <small>{cur.title}</small>
      <div className="dice-row">
        {r.values.map((v, i) => (
          <Die key={i} sides={r.sides} spinning={spinning} value={spinning ? (flicker[i] ?? null) : v}
            faded={!spinning && twoD20 && i !== kept}
            crit={!spinning && r.sides === 20 && v === 20 && (!twoD20 || i === kept)}
            fumble={!spinning && r.sides === 20 && v === 1 && (!twoD20 || i === kept)} />
        ))}
      </div>
      {!spinning && (
        <b className="dice-total">
          {cap.text}
          {cap.crit && <span className="mark"> {t().dice.critMark}</span>}
          {cap.fumble && <span className="mark"> {t().dice.fumbleMark}</span>}
        </b>
      )}
    </div>
  );
}
