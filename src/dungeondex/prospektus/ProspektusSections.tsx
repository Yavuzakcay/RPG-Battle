/**
 * Prospektüs bölümleri (kabuktan bağımsız bileşen; kabuk görevi sağ sayfaya bağlar). Satırsız bölüm gizlenir;
 * "Oyundaki durum" rozetle her zaman görünür. Mobilde tek sütun, yazı ≥ 14 px (`prospektus.css`).
 */
import { t } from '../../i18n';
import type { ProSection } from './types';
import { GlyphText } from '../../ui/glyph/Glyph';
import './prospektus.css';

export function ProspektusSections(props: { sections: ProSection[] }) {
  const shown = props.sections.filter((s) => s.rows.length > 0 || s.badge);
  if (!shown.length) return null;
  return (
    <div className="pro">
      {shown.map((s) => (
        <section key={s.key} className={`pro-sec pro-${s.key}`} data-key={s.key}>
          <h3 className="pro-title">
            {s.title}
            {s.badge && <span className={`pro-badge pro-badge-${s.badge.tone}`}>{s.badge.text}</span>}
          </h3>
          {s.rows.length > 0 && (
            <ul className="pro-rows">
              {s.rows.map((r, i) => (
                <li key={i} className={r.label ? 'pro-row pro-kv' : 'pro-row pro-par'}>
                  {r.label && <span className="pro-label">{r.label}</span>}
                  <span className="pro-text">
                    {/* Ortak simgeler (glif) açıklama paragraflarında; "Oyundaki durum" (ham SRD/oyun farkı notu) aynen. */}
                    {s.key === 'durum' ? r.text : <GlyphText text={r.text} />}
                    {r.trOnly && <span className="pro-tronly"> ({t().common.descTrOnly})</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
