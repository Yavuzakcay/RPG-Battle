/**
 * Görev SD3: oluşturucu adımlarının ortak küçük parçaları (yalnızca Builder parçasında).
 */
import { useState, type ReactNode } from 'react';

export function toggle<T>(list: T[], x: T, on: boolean): T[] {
  return on ? (list.includes(x) ? list : [...list, x]) : list.filter((y) => y !== x);
}

/** Küçük bilgi simgesi (fare ipucu; dokunmatikte açılmaz: önemli bilgi için `InfoPop`). */
export function InfoTip(props: { text: string }) {
  return <span className="info-tip" title={props.text} aria-label={props.text}>ⓘ</span>;
}

/** Dokununca açılan ⓘ (SD3): İngilizce kural adı ve ayrıntı yalnızca burada görünür; dokunmatikte de çalışır. */
export function InfoPop(props: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!props.text) return null;
  return (
    <span className="info-pop-wrap">
      <button type="button" className={`info-tip info-pop-btn${open ? ' on' : ''}`} aria-expanded={open} aria-label={props.label ?? props.text} title={props.text}
        onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); setOpen((o) => !o); }}>ⓘ</button>
      {open && <span className="term-pop" role="tooltip">{props.text}</span>}
    </span>
  );
}

/**
 * Görev K18: dokununca (ya da basılı tutunca) kısa açıklama açılan terim (Weapon Mastery, silah özelliği). Seçim
 * yapmaz; farede `title` ile de görünür.
 */
export function TermTip(props: { name: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="term-tip">
      <button type="button" className={`term-btn${open ? ' on' : ''}`} aria-expanded={open} title={props.text}
        onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); setOpen((o) => !o); }}>{props.name}</button>
      {open && <span className="term-pop" role="tooltip">{props.text}</span>}
    </span>
  );
}

/**
 * Gelişmiş bölümü (SD3): varsayılan kapalı katlanan alan. `open` verilirse (ör. eksik seçim varken) açık başlar. Başlık
 * satırında kısa özet (şu anki seçim) görünür; iç liste her zaman DOM'da (yerel katlama).
 */
export function Fold(props: { title: ReactNode; summary?: ReactNode; open?: boolean; className?: string; onOpenChange?: (open: boolean) => void; children: ReactNode }) {
  const [open, setOpen] = useState(!!props.open);
  return (
    <details className={`wiz-fold${props.className ? ` ${props.className}` : ''}`} open={open}
      onToggle={(e: { currentTarget: { open: boolean } }) => { setOpen(e.currentTarget.open); props.onOpenChange?.(e.currentTarget.open); }}>
      <summary><span className="fold-title">{props.title}</span>{props.summary ? <small className="mute fold-sum"> {props.summary}</small> : null}</summary>
      <div className="fold-body">{props.children}</div>
    </details>
  );
}
