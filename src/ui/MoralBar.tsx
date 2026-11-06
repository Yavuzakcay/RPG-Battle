/** Kuyruk K48: Moral çubuğu (HP'nin yanında, ayrı renk). Savaş ve Serüven ekranlarında (tembel parçalar). */
import { t } from '../i18n';

export function MoralBar({ moral, max }: { moral: number; max: number }) {
  const pct = Math.round((100 * Math.max(0, moral)) / Math.max(1, max));
  return (
    <span className="moral-bar" title={t().view.moral.tip}>
      <span>{t().view.moral.label(moral, max)}</span>
      <span className="track" aria-hidden="true"><span className="fill" style={{ width: `${pct}%` }} /></span>
    </span>
  );
}
