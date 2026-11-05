/**
 * Kuyruk K51: hizalanma 3×3 ızgarası (sütunlar Düzenli · Tarafsız · Kaotik, satırlar İyi · Tarafsız · Kötü). İbre
 * değerin yeri (Düzen +50 solda, İyilik +50 üstte), isteğe bağlı başlangıç işareti; etkin kutu vurgulu. İki eksen
 * çubuğu ve etiket isteğe bağlı. Oluşturucu, Game Master paneli ve karakter kartı ortak kullanır.
 */
import { bucketOf, labelOf, type Alignment, type Bucket } from '../rules/alignment';
import { getLang, t } from '../i18n';
import './alignment.css';

const pct = (v: number) => `${((50 - v) / 100) * 100}%`;
const idx: Record<Bucket, number> = { pos: 0, neu: 1, neg: 2 };

export function AlignmentGrid(props: { value: { duzen: number; iyilik: number }; start?: { duzen: number; iyilik: number }; bars?: boolean; label?: Alignment; small?: boolean }) {
  const H = t().view.hizalanma;
  const d = bucketOf(props.value.duzen, props.label?.kova?.duzen), g = bucketOf(props.value.iyilik, props.label?.kova?.iyilik);
  return (
    <div className={`align-wrap${props.small ? ' small' : ''}`}>
      <div className="align-grid" role="img" aria-label={`${H.law} ${props.value.duzen}, ${H.good} ${props.value.iyilik}`}>
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
          <span key={`${r}${c}`} className={`align-cell${r === idx[g] && c === idx[d] ? ' on' : ''}`}>
            {!props.small && <small>{r === 1 && c === 1 ? '' : `${H.cols[c]} ${H.rows[r]}`}</small>}
          </span>
        )))}
        {props.start && <i className="align-start" style={{ left: pct(props.start.duzen), top: pct(props.start.iyilik) }} title={H.start} />}
        <i className="align-needle" style={{ left: pct(props.value.duzen), top: pct(props.value.iyilik) }} title={H.now} />
      </div>
      {props.label && <b className="align-label">{labelOf(props.label, getLang())}</b>}
      {props.bars && (
        <div className="align-bars">
          {(['duzen', 'iyilik'] as const).map((k) => (
            <label key={k}><span>{k === 'duzen' ? H.law : H.good} {props.value[k]}</span>
              <span className="align-bar"><i style={{ left: pct(props.value[k]) }} /></span></label>
          ))}
        </div>
      )}
    </div>
  );
}
