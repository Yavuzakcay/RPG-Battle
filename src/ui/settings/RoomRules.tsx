/**
 * SD8 (Ayarlar): "Oda kuralları" (Game Master kurulumu). Eskiden Ayarlar ekranındaki oda ayarları buraya taşındı; saklama
 * anahtarları ve varsayılanlar aynı (`app/features`, `carrySetting`, önizleme ayarı), yalnız yeri değişti.
 */
import { useState } from 'react';
import { t } from '../../i18n';
import { alignmentAutoOnly, alignmentEnabled, alignmentMoralEnabled, alignmentRace, journeyEnabled, setAlignmentAutoOnly, setAlignmentEnabled, setAlignmentMoralEnabled, setAlignmentRace, setJourneyEnabled, setUpperLevelsEnabled, upperLevelsEnabled } from '../../app/features';
import { CARRY_RULES, type CarryRule } from '../../rules/carry';
import { saveCarryRule, storedCarryRule } from '../carrySetting';
import { loadSettings, saveSettings, type PreviewSettings } from '../../app/discovery';
import { Fold, OnOffRow, SegRow } from './SegRow';

export function RoomRules() {
  const R = t().roomRules, U = t().settingsUi, K = t().carry;
  const [upper, setUpper] = useState(upperLevelsEnabled);
  const [carry, setCarry] = useState<CarryRule>(storedCarryRule);
  const [align, setAlign] = useState({ on: alignmentEnabled(), race: alignmentRace(), auto: alignmentAutoOnly(), moral: alignmentMoralEnabled() });
  const [pv, setPv] = useState<PreviewSettings>(loadSettings);
  const [journey, setJourney] = useState(journeyEnabled);
  const setPvs = (p: Partial<PreviewSettings>) => { const n = { ...pv, ...p }; saveSettings(n); setPv(n); };
  return (
    <Fold title={R.title} help={R.help} className="room-rules-fold">
      <OnOffRow label={R.upper} help={R.upperHelp} value={upper} on={U.on} off={U.off} onChange={(v) => { setUpperLevelsEnabled(v); setUpper(v); }} />
      <SegRow label={R.carry} help={R.carryHelp[carry]} value={carry} options={CARRY_RULES.map((r) => ({ value: r, label: K.rule[r] ?? r }))} onChange={(v) => { saveCarryRule(v); setCarry(v); }} />
      <OnOffRow label={R.align} help={R.alignHelp} value={align.on} on={U.on} off={U.off} onChange={(v) => { setAlignmentEnabled(v); setAlign({ ...align, on: v }); }} />
      {align.on && (
        <div className="set-sub">
          <OnOffRow label={R.alignRace} value={align.race} on={U.on} off={U.off} onChange={(v) => { setAlignmentRace(v); setAlign({ ...align, race: v }); }} />
          <OnOffRow label={R.alignAuto} value={align.auto} on={U.on} off={U.off} onChange={(v) => { setAlignmentAutoOnly(v); setAlign({ ...align, auto: v }); }} />
          <OnOffRow label={R.alignMoral} value={align.moral} on={U.on} off={U.off} onChange={(v) => { setAlignmentMoralEnabled(v); setAlign({ ...align, moral: v }); }} />
        </div>
      )}
      <OnOffRow label={R.discovery} help={R.discoveryHelp} value={pv.discovery} on={U.on} off={U.off} onChange={(v) => setPvs({ discovery: v })} />
      <OnOffRow label={R.hints} help={R.hintsHelp} value={pv.hints} on={U.on} off={U.off} onChange={(v) => setPvs({ hints: v })} />
      <OnOffRow label={R.journey} help={R.journeyHelp} value={journey} on={U.on} off={U.off} onChange={(v) => { setJourneyEnabled(v); setJourney(v); }} />
    </Fold>
  );
}
