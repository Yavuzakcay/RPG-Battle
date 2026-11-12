/**
 * Kuyruk MB6 (yalnız arayüz): havada inme irtifası seçici. Baloncuğun (`.bubble`) kendi seçici biçimi (`slot-picker`: yatay,
 * sarılan, ≥ 44 px dokunma hedefi); 5 ft adımlı irtifa düğmeleri yukarıdan aşağı. Seçim `onPick` ile üst bileşene gider;
 * komut orada `dismount.toFt` ile gönderilir. Uçamayan binici için yalnız kısa düşme uyarısı (seçici yok).
 */
import { t } from '../i18n';
import type { DismountOptions } from './dismountOptions';

export default function DismountPicker({ options, value, onPick }: { options: DismountOptions; value: number; onPick: (ft: number) => void }) {
  const M = t().battle.mb6;
  if (!options.picker) return options.fallWarning ? <small className="dismount-hint">{M.fallWarning}</small> : null;
  return (
    <div className="slot-picker dismount-picker" role="listbox" aria-label={M.levels}>
      <small>{M.title}</small>
      {options.levels.map((ft) => (
        <button key={ft} type="button" role="option" aria-selected={ft === value} className={ft === value ? 'on' : 'ghost'}
          onClick={() => onPick(ft)}>{M.level(ft, ft === options.defaultFt)}</button>
      ))}
    </div>
  );
}
