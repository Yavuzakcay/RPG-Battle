/**
 * Kuyruk KQ4 CK1: karakter kâğıdı penceresi (tembel parça). Yazdır / PDF (yalnız kâğıt alanı: `@media print`), PNG indir (sayfa başına),
 * JSON dışa aktar; Web Share varsa Paylaş (mobil/APK), yoksa indirme. Kâğıt dili arayüz diliyle aynı.
 */
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { SavedCharacter } from '../../rules/builder';
import { getLang, t } from '../../i18n';
import { SheetView } from './SheetView';
import { canShareFiles, downloadBlob, exportCharacter, shareOrDownload } from './io';
import { pageToPng } from './png';

export default function SheetOverlay(props: { c: SavedCharacter; onClose: () => void }) {
  const S = t().sheet;
  const root = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const base = (props.c.sheet.name || 'karakter').replace(/[^\p{L}\p{N}_-]+/gu, '_');
  const pages = () => [...(root.current?.querySelectorAll<HTMLElement>('.sheet-page') ?? [])];
  const png = async (share: boolean) => {
    setBusy(true); setErr(null);
    try {
      const ps = pages();
      for (let i = 0; i < ps.length; i++) {
        const blob = await pageToPng(ps[i] as HTMLElement);
        const name = `${base}-${i + 1}.png`;
        if (share) await shareOrDownload(blob, name, props.c.sheet.name); else downloadBlob(blob, name);
      }
    } catch { setErr('PNG'); } finally { setBusy(false); }
  };
  const json = async (share: boolean) => {
    const blob = new Blob([exportCharacter(props.c)], { type: 'application/json' });
    if (share) await shareOrDownload(blob, S.fileName(base), props.c.sheet.name); else downloadBlob(blob, S.fileName(base));
  };
  return createPortal(
    <div className="sheet-overlay" role="dialog" aria-label={S.title} lang={getLang()}>
      <div className="sheet-toolbar">
        <button type="button" className="cta" onClick={() => window.print()}>{S.print}</button>
        <button type="button" disabled={busy} onClick={() => void png(false)}>{S.png}</button>
        <button type="button" onClick={() => void json(false)}>{S.json}</button>
        {canShareFiles() && <button type="button" disabled={busy} onClick={() => void png(true)}>{S.share}</button>}
        <button type="button" className="ghost" onClick={props.onClose}>{S.close}</button>
        {err && <span className="error" role="alert">{err}</span>}
      </div>
      <div ref={root}><SheetView c={props.c} /></div>
    </div>,
    document.body,
  );
}
