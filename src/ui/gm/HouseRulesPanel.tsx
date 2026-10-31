/**
 * Görev K13B: ev kuralları listesi (Game Master kurulumu). Her kural `data/ev-kurallari.json`'da ayrı bayrak; sefer
 * kuralları yalnızca haritanın sefer bayrağıyla açık gelir. Ayrı bileşen: GM Atölyesi aynı listeyi kullanacak.
 */
import { HOUSE_RULES, HOUSE_RULE_IDS, type HouseRuleId } from '../../battle/houseRules';
import { getLang, t } from '../../i18n';

export function HouseRulesPanel(props: { value: Record<HouseRuleId, boolean>; onChange: (next: Record<HouseRuleId, boolean>) => void }) {
  const H = t().gm.houseRules;
  const en = getLang() === 'en';
  return (
    <details className="house-rules">
      <summary>{H.title(HOUSE_RULE_IDS.filter((id) => props.value[id]).length)}</summary>
      <p className="mute">{H.note}</p>
      {HOUSE_RULE_IDS.map((id) => {
        const def = HOUSE_RULES[id];
        return (
          <label key={id} className="house-rule">
            <input type="checkbox" checked={!!props.value[id]} onChange={(e) => props.onChange({ ...props.value, [id]: e.target.checked })} />
            {' '}{en ? def?.en : def?.tr}{def?.sefer ? <span className="mute"> · {H.sefer}</span> : null}
          </label>
        );
      })}
    </details>
  );
}
