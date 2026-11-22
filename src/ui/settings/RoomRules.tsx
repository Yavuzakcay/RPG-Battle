/**
 * SD8 (Ayarlar): "Oda kuralları" (Game Master kurulumu). Eskiden Ayarlar ekranındaki oda ayarları buraya taşındı; saklama
 * anahtarları ve varsayılanlar aynı (`app/features`, `carrySetting`, önizleme ayarı), yalnız yeri değişti.
 * Görev OD1: `value`/`onChange` verilirse (Oda kur) kurallar odanın kaydında düzenlenir, genel saklamaya yazılmaz;
 * verilmezse (Hızlı savaş yolu kalmadı; testler ve eski çağrılar) eski davranış: genel anahtarlara yazar/okur.
 */
import { useState } from 'react';
import { t } from '../../i18n';
import { alignmentAutoOnly, alignmentEnabled, alignmentMoralEnabled, alignmentRace, journeyEnabled, setAlignmentAutoOnly, setAlignmentEnabled, setAlignmentMoralEnabled, setAlignmentRace, setJourneyEnabled } from '../../app/features';
import { CARRY_RULES, type CarryRule } from '../../rules/carry';
import { saveCarryRule, storedCarryRule } from '../carrySetting';
import { loadSettings, saveSettings, type PreviewSettings } from '../../app/discovery';
import { Fold, OnOffRow, SegRow } from './SegRow';
import type { OdaKurallar } from '../../oda/model';

export function RoomRules(props: { value?: OdaKurallar; onChange?: (k: OdaKurallar) => void; disabled?: boolean }) {
  const R = t().roomRules, U = t().settingsUi, K = t().carry;
  const [carry, setCarry] = useState<CarryRule>(storedCarryRule);
  const [align, setAlign] = useState({ on: alignmentEnabled(), race: alignmentRace(), auto: alignmentAutoOnly(), moral: alignmentMoralEnabled() });
  const [pv, setPv] = useState<PreviewSettings>(loadSettings);
  const [journey, setJourney] = useState(journeyEnabled);
  const setPvs = (p: Partial<PreviewSettings>) => { const n = { ...pv, ...p }; saveSettings(n); setPv(n); };
  const v = props.value;
  const set = (p: Partial<OdaKurallar>) => { if (v && props.onChange) props.onChange({ ...v, ...p }); };
  // Oda kaydı verilmişse değer oradan, yoksa eski genel durumdan.
  const cur = {
    carry: v ? v.tasima : carry,
    align: v ? { on: v.hizalanma, race: v.hizalanmaIrk, auto: v.hizalanmaYalnizOtomatik, moral: v.hizalanmaMoral } : align,
    discovery: v ? v.kesif : pv.discovery, hints: v ? v.ipucu : pv.hints, journey: v ? v.yolculuk : journey,
  };
  const d = props.disabled;
  return (
    <Fold title={R.title} help={R.help} className="room-rules-fold" open={v !== undefined}>
      <SegRow label={R.carry} help={R.carryHelp[cur.carry]} value={cur.carry} options={CARRY_RULES.map((r) => ({ value: r, label: K.rule[r] ?? r }))} onChange={(x) => { if (d) return; if (v) set({ tasima: x }); else { saveCarryRule(x); setCarry(x); } }} />
      <OnOffRow label={R.align} help={R.alignHelp} value={cur.align.on} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ hizalanma: x }); else { setAlignmentEnabled(x); setAlign({ ...align, on: x }); } }} />
      {cur.align.on && (
        <div className="set-sub">
          <OnOffRow label={R.alignRace} value={cur.align.race} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ hizalanmaIrk: x }); else { setAlignmentRace(x); setAlign({ ...align, race: x }); } }} />
          <OnOffRow label={R.alignAuto} value={cur.align.auto} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ hizalanmaYalnizOtomatik: x }); else { setAlignmentAutoOnly(x); setAlign({ ...align, auto: x }); } }} />
          <OnOffRow label={R.alignMoral} value={cur.align.moral} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ hizalanmaMoral: x }); else { setAlignmentMoralEnabled(x); setAlign({ ...align, moral: x }); } }} />
        </div>
      )}
      <OnOffRow label={R.discovery} help={R.discoveryHelp} value={cur.discovery} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ kesif: x }); else setPvs({ discovery: x }); }} />
      <OnOffRow label={R.hints} help={R.hintsHelp} value={cur.hints} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ ipucu: x }); else setPvs({ hints: x }); }} />
      <OnOffRow label={R.journey} help={R.journeyHelp} value={cur.journey} on={U.on} off={U.off} disabled={d} onChange={(x) => { if (v) set({ yolculuk: x }); else { setJourneyEnabled(x); setJourney(x); } }} />
    </Fold>
  );
}
