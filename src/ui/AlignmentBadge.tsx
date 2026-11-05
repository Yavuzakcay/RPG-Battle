/**
 * Kuyruk K51: karakter kartında küçük hizalanma etiketi (tembel parça; ana parçaya girmez). Dokununca ibreli ızgara
 * açılır. Game Master "gizli" yaptıysa görünmez.
 */
import { useState } from 'react';
import { alignmentOf, labelOf, type Alignment } from '../rules/alignment';
import { AlignmentGrid } from './AlignmentGrid';
import { getLang, t } from '../i18n';

export default function AlignmentBadge(props: { value: Alignment | undefined }) {
  const [open, setOpen] = useState(false);
  const a = alignmentOf(props.value);
  if (a.gizli) return null;
  return (
    <span className="align-badge">
      <button type="button" className="align-chip" aria-expanded={open} title={t().view.hizalanma.title} onClick={() => setOpen((o) => !o)}>
        ⚖ {labelOf(a, getLang())}
      </button>
      {open && <span className="align-pop"><AlignmentGrid value={a} start={a.baslangic} small /></span>}
    </span>
  );
}
