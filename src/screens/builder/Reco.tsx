/**
 * SD11 (yalnız arayüz): oluşturucuda önerilen seçimler açık. `RecoTag` önerilen ve seçili öğenin yanında küçük "Önerilen"
 * etiketi (yalnız yeni karakter oturumunda); `RecoBar` bölüm başlığında "Önerilenleri seç" (üstüne yazacaksa tek satır onay)
 * ve "Temizle". Seçim mantığı `builderDefaults.ts` (`applyReco`, `clearReco`, `recoSets`).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { t } from '../../i18n';
import { applyReco, clearReco, recoSets, recoWouldOverwrite, type RecoPart } from '../builderDefaults';
import type { SavedCharacter } from '../../rules/builder';

export interface RecoValue { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void; suggest: boolean }
const Ctx = createContext<RecoValue | null>(null);
export function RecoProvider(props: { value: RecoValue; children: ReactNode }) { return <Ctx.Provider value={props.value}>{props.children}</Ctx.Provider>; }

/** Önerilen kümeler (etiket için); bağlam yoksa boş. */
export function useRecoSets() {
  const v = useContext(Ctx);
  return useMemo(() => (v && v.suggest ? recoSets(v.c) : null), [v]);
}

export function RecoTag(props: { show: boolean }) {
  if (!props.show) return null;
  return <small className="reco-tag">{t().reco.tag}</small>;
}

export function RecoBar(props: { part: RecoPart }) {
  const v = useContext(Ctx);
  const R = t().reco;
  const [ask, setAsk] = useState(false);
  if (!v) return null;
  const apply = () => { v.setC((x) => applyReco(x, props.part)); setAsk(false); };
  return (
    <div className="reco-bar" role="group" aria-label={R.tag}>
      {ask ? (
        <>
          <span className="mute">{R.confirm}</span>
          <button type="button" className="cta" onClick={apply}>{R.yes}</button>
          <button type="button" className="ghost" onClick={() => setAsk(false)}>{R.no}</button>
        </>
      ) : (
        <>
          <button type="button" className="ghost" onClick={() => (recoWouldOverwrite(v.c, props.part) ? setAsk(true) : apply())}>{R.pick}</button>
          <button type="button" className="ghost" onClick={() => v.setC((x) => clearReco(x, props.part))}>{R.clear}</button>
        </>
      )}
    </div>
  );
}
