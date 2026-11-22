/**
 * SD9: tek satır "Zar teması" (Ayarlar: tüm karakterler için varsayılan; karakter kartı: o karakter). Sınıf / Irk / Klasik ve
 * açılmış temalar seçilebilir; açılmamış temalar listede kilitli, altında tek satırlık açılma ipucu (`data/zar-esleme.json`).
 * Kilitli tema seçilemez. Yalnız görünüm/profil; savaşa ve kayda girmez.
 */
import { useEffect, useState } from 'react';
import { t, getLang } from '../i18n';
import gorseller from '../../data/zar-gorselleri.json';
import { ALL_CHARACTERS, DICE_UNLOCK_EVENT, categoryOf, choiceOf, isUnlocked, loadDiceStore, saveDiceStore, setChoice, unlockHint, clearNotices, pendingNotices, themeLabel } from '../app/diceUnlock';

const THEMES = gorseller.themes as unknown as Array<{ id: string; kategori?: string; name: { tr: string; en: string } }>;
const GROUPS = ['malzeme', 'dusman', 'harita', 'esya'] as const;

export function DiceThemePicker(props: { charId: string; label?: string }) {
  const T = t().diceThemeSetting;
  const lang = getLang();
  const [store, setStore] = useState(loadDiceStore);
  useEffect(() => {
    const on = () => setStore(loadDiceStore());
    window.addEventListener(DICE_UNLOCK_EVENT, on);
    return () => window.removeEventListener(DICE_UNLOCK_EVENT, on);
  }, []);
  const current = props.charId === ALL_CHARACTERS ? choiceOf(store, undefined) : choiceOf(store, props.charId);
  const nameOf = (v: string) => (v === 'sinif' ? T.choiceClass : v === 'irk' ? T.choiceRace : themeLabel(v, lang));
  const pick = (v: string) => { const next = setChoice(store, props.charId, v); if (next !== store) { saveDiceStore(next); setStore(next); } };
  const row = (id: string, label: string) => {
    const open = id === 'sinif' || id === 'irk' || isUnlocked(store, id);
    const hint = open ? '' : unlockHint(id, lang);
    return (
      <div key={id} className={`dice-pick-row${open ? '' : ' locked'}`}>
        <button type="button" role="radio" aria-checked={current === id} disabled={!open} className={current === id ? 'on' : 'ghost'} data-zar-tema={id}
          onClick={() => pick(id)}>{open ? '' : '🔒 '}{label}</button>
        {hint && <small>{hint}</small>}
      </div>
    );
  };
  return (
    <details className="dice-picker">
      <summary>{props.label ?? T.title}: <b>{nameOf(current)}</b></summary>
      <div role="radiogroup" aria-label={T.title}>
        <div className="dice-pick-main">{row('sinif', T.choiceClass)}{row('irk', T.choiceRace)}{row('klasik', T.choiceClassic)}</div>
        {GROUPS.map((g) => (
          <fieldset key={g} className="dice-pick-group"><legend>{T.cats[g]}</legend>
            {THEMES.filter((x) => (x.kategori ?? 'malzeme') === g && x.id !== 'klasik').map((x) => row(x.id, x.name[lang]))}
          </fieldset>
        ))}
      </div>
    </details>
  );
}

/** Yeni açılan zarların bildirimi ("Yeni zar: …"); kapatınca kuyruk boşalır. Savaş sonu ve Serüven ekranında. */
export function NewDiceNotice() {
  const T = t().diceThemeSetting;
  const [ids, setIds] = useState<string[]>(() => pendingNotices(loadDiceStore()));
  useEffect(() => {
    const on = () => setIds(pendingNotices(loadDiceStore()));
    window.addEventListener(DICE_UNLOCK_EVENT, on);
    return () => window.removeEventListener(DICE_UNLOCK_EVENT, on);
  }, []);
  if (ids.length === 0) return null;
  const close = () => { saveDiceStore(clearNotices(loadDiceStore())); setIds([]); };
  return (
    <p className="dice-notice" role="status">🎲 {T.notice(ids.map((i) => themeLabel(i, getLang())).join(', '))} <button type="button" className="ghost" onClick={close} aria-label={t().common.cancel}>✕</button></p>
  );
}

/** Game Master / test anahtarı: bütün zarlar açık. */
export function DiceAllOpenToggle() {
  const T = t().diceThemeSetting;
  const [store, setStore] = useState(loadDiceStore);
  return (
    <label className="dice-all-open">
      <input type="checkbox" checked={store.hepsiAcik} onChange={(e: { target: { checked: boolean } }) => { const next = { ...store, hepsiAcik: e.target.checked }; saveDiceStore(next); setStore(next); }} /> {T.allOpen}
    </label>
  );
}
