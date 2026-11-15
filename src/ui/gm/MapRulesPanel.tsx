/**
 * Kuyruk 24: harita mekanikleri listesi (Game Master kurulumu). Varyantın denetlenebilir kuralları (`data/kural-kontrol.json`)
 * açılıp kapatılır, parametreleri (DC, hasar, tur, altıgen, rüzgâr yönü) düzenlenir. Varsayılan değer haritanın kuralındaki
 * değer; değerler savaşın başlangıç durumuna yazılır (`ruleControl.ts` `controlState`).
 */
import { useState } from 'react';
import { controllableRules, validParam, WIND_DIRS, type RuleParams, type RuleParamSpec } from '../../battle/ruleControl';
import type { MapRuleData } from '../../map/maps';
import { getLang, t } from '../../i18n';
import groups from '../../../data/kurulum-gruplari.json';

const GROUPS = groups as unknown as { gruplar: Array<{ id: string; tr: string; en: string }>; kural: Record<string, string> };
export const groupOf = (ruleId: string): string => GROUPS.kural[ruleId] ?? 'harita';

export function MapRulesPanel(props: {
  mapId: string; variantId: string;
  toggles: Record<string, boolean>; params: RuleParams;
  onChange: (toggles: Record<string, boolean>, params: RuleParams) => void;
}) {
  const M = t().gm.mapRules;
  const en = getLang() === 'en';
  const list = controllableRules(props.mapId, props.variantId);
  if (!list.length) return null;
  const on = (id: string, def: boolean) => props.toggles[id] ?? def;
  const count = list.filter(({ rule, spec }) => on(rule.id, spec.default !== false)).length;
  const U = t().setupUi;
  const setGroup = (ids: string[], value: boolean) => props.onChange({ ...props.toggles, ...Object.fromEntries(ids.map((id) => [id, value])) }, props.params);
  const row = ({ rule, spec }: (typeof list)[number]) => {
    const enabled = on(rule.id, spec.default !== false);
    return (
      <div key={rule.id} className="map-rule">
        <label className="house-rule">
          <input type="checkbox" checked={enabled} onChange={(e) => props.onChange({ ...props.toggles, [rule.id]: e.target.checked }, props.params)} />
          {' '}{en ? spec.en : spec.tr}
        </label>
        {spec.params.map((ps) => (
          <ParamInput key={ps.key} spec={ps} rule={rule} disabled={!enabled} en={en} value={props.params[rule.id]?.[ps.key]}
            onChange={(v) => props.onChange(props.toggles, { ...props.params, [rule.id]: { ...props.params[rule.id], [ps.key]: v } })} dirName={M.dirs} />
        ))}
      </div>
    );
  };
  // SD9: kurallar temalı gruplarda (data/kurulum-gruplari.json); grup başına aç/kapat. Varsayılanlar ve kayıt değerleri aynı.
  return (
    <details className="house-rules map-rules">
      <summary>{M.title(count, list.length)}</summary>
      <p className="mute">{M.note}</p>
      {GROUPS.gruplar.map((g) => {
        const items = list.filter((x) => groupOf(x.rule.id) === g.id);
        if (items.length === 0) return null;
        const n = items.filter(({ rule, spec }) => on(rule.id, spec.default !== false)).length;
        return (
          <details key={g.id} className="rule-group">
            <summary>{en ? g.en : g.tr} ({n}/{items.length})</summary>
            <div className="set-btns">
              <button type="button" className="ghost" onClick={() => setGroup(items.map((x) => x.rule.id), true)}>{U.groupOn}</button>
              <button type="button" className="ghost" onClick={() => setGroup(items.map((x) => x.rule.id), false)}>{U.groupOff}</button>
            </div>
            {items.map(row)}
          </details>
        );
      })}
    </details>
  );
}

function ParamInput(props: { spec: RuleParamSpec; rule: MapRuleData; value: number | string | undefined; disabled: boolean; en: boolean;
  onChange: (v: number | string) => void; dirName: Record<string, string> }) {
  const { spec, rule } = props;
  const base = rule[spec.key] as number | string | undefined;
  const value = props.value ?? base ?? '';
  const [text, setText] = useState(String(value));
  const label = props.en ? spec.en : spec.tr;
  if (spec.type === 'dir') {
    return (
      <label className="map-rule-param">{label}{' '}
        <select aria-label={label} disabled={props.disabled} value={String(value)} onChange={(e: { target: { value: string } }) => props.onChange(e.target.value)}>
          {WIND_DIRS.map((d) => <option key={d} value={d}>{props.dirName[d] ?? d}</option>)}
        </select>
      </label>
    );
  }
  if (spec.type === 'int') {
    return (
      <label className="map-rule-param">{label}{' '}
        <input type="number" aria-label={label} disabled={props.disabled} min={spec.min} max={spec.max} value={Number(value)} style={{ width: '4em' }}
          onChange={(e: { target: { value: string } }) => { const n = Math.round(Number(e.target.value)); if (validParam(spec, n)) props.onChange(n); }} />
      </label>
    );
  }
  const ok = validParam(spec, text);
  return (
    <label className="map-rule-param">{label}{' '}
      <input type="text" aria-label={label} disabled={props.disabled} value={text} style={{ width: '5em' }} aria-invalid={!ok}
        onChange={(e: { target: { value: string } }) => { setText(e.target.value); if (validParam(spec, e.target.value)) props.onChange(e.target.value.trim()); }} />
    </label>
  );
}
