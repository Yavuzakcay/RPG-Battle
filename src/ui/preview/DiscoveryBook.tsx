/**
 * Kuyruk K58 G1b: Keşif Defteri (Ayarlar): oyuncu profili, keşfedilen tepkimeler (ad, kısa açıklama, kaç kez
 * görüldüğü), keşfedilmemişler "???" ve sayaç; JSON dışa/içe aktarım. Yalnız arayüz durumu.
 */
import { useState } from 'react';
import { t } from '../../i18n';
import { REACTION_ROWS, counts, exportStore, importStore, isDiscovered, loadStore, saveStore, seenOf, switchProfile } from '../../app/discovery';

export function DiscoveryBook() {
  const [s, setS] = useState(loadStore);
  const D = t().battle.discovery;
  const c = counts(s);
  const set = (n: typeof s) => { saveStore(n); setS(n); };
  return (
    <div className="discovery-book">
      <h3>{D.book} <small>{D.count(c.found, c.total)}</small></h3>
      <label>{D.profile} <input value={s.profil} onChange={(e) => set(switchProfile(s, e.target.value || 'varsayilan'))} /></label>
      <ul>
        {REACTION_ROWS.map((r) => isDiscovered(s, r.id)
          ? <li key={r.id}><b>{D.name[r.id] ?? r.id}</b> <small>{D.seen(seenOf(s)[r.id] ?? 0)}</small>{r.not ? <div className="mute">{r.not}</div> : null}</li>
          : <li key={r.id} className="mute">{D.unknown}</li>)}
      </ul>
      <button type="button" onClick={() => { void navigator.clipboard?.writeText(exportStore(s)); }}>{D.exportBtn}</button>
      <button type="button" onClick={() => { const txt = window.prompt(D.importBtn); if (txt) { try { set(importStore(txt)); } catch { /* geçersiz JSON */ } } }}>{D.importBtn}</button>
    </div>
  );
}
