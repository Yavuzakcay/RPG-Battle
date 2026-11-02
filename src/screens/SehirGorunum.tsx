/**
 * Kuyruk 44: yerleşim şehir görünümü. Tek üstten görsel (public/yerlesim/<id>.webp, `npm run sehir-gorunum`), üstünde
 * bina düğümleri (0–1 koordinat, `data/sehir-gorunum.json`). Düğüme dokununca kart: hizmet (eski hub bölümleri),
 * savaş haritası, "Yakında" ya da NPC yer tutucu. Görsel yüklenemezse `onFail` (çağıran eski hub'a döner).
 */
import { useState } from 'react';
import { toggleOn, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { gorunumFiltre, yerlesimById } from '../yerlesim/yerlesim';
import { dugumHedefi, sehirGorunumu, type DugumHedefi, type SehirDugum } from '../yerlesim/sehirGorunum';
import { getLang, t } from '../i18n';
import { HubInn, HubQuests, HubShop, HubTemple, mapName } from './YerlesimHub';

export function SehirGorunumEkrani(props: {
  state: SeruvenState; run: (c: SeruvenCommand) => boolean; onMap: (map: string) => void; onSuc?: () => void;
  onFail: () => void; error: string | null;
}) {
  const { state, run } = props;
  const S = t().seruven;
  const C = S.city;
  const en = getLang() === 'en';
  const [sel, setSel] = useState<string | null>(null);
  const y = state.yerlesim ? yerlesimById(state.yerlesim.id) : undefined;
  const g = y ? sehirGorunumu(y.id) : undefined;
  if (!y || !g?.gorsel || !g.boyut || !state.yerlesim) return null;
  const cur = state.yerlesim;
  const door = toggleOn(state, 'yerlesimKapi');
  const mapOpen = (id: string) => !door || id === y.baslangic || cur.seen.includes(id);
  const [w, h] = g.boyut;
  const node = sel ? g.dugumler.find((n) => n.id === sel) : undefined;
  const target = node ? dugumHedefi(y, node) : undefined;
  const label = (n: SehirDugum) => (en ? n.en : n.tr);
  const mapButton = (id: string) => (
    <p><button type="button" disabled={!mapOpen(id)} title={mapOpen(id) ? undefined : C.mapLocked} onClick={() => props.onMap(id)}>{C.goMap(mapName(y, id, en))}</button></p>
  );
  const body = (tg: DugumHedefi, n: SehirDugum) => {
    if (tg.tur === 'yakinda') return <p className="mute">{C.soonInfo}</p>;
    if (tg.tur === 'npc') return <p className="mute">{C.npc(label(n))}</p>;
    if (tg.tur === 'harita') return mapButton(tg.harita);
    return (
      <>
        {tg.hizmet === 'han' && <HubInn state={state} run={run} />}
        {tg.hizmet === 'sifa' && (
          <>
            {y.hub.han && <p><button type="button" onClick={() => run({ type: 'inn_rest' })}>{C.heal}</button></p>}
            {y.hub.tapinak && state.tasma && <HubTemple state={state} run={run} />}
          </>
        )}
        {tg.hizmet === 'dukkan' && <HubShop state={state} run={run} />}
        {tg.hizmet === 'gorev' && <HubQuests state={state} run={run} onSuc={props.onSuc} />}
        {tg.hizmet === 'cikis' && <p><button type="button" onClick={() => run({ type: 'yerlesim_leave' })}>{S.hubLeave}</button></p>}
        {tg.harita && mapButton(tg.harita)}
      </>
    );
  };
  return (
    <section className="sehir-gorunum" data-yerlesim={y.id}>
      <div className="sehir-bar">
        <strong style={{ filter: gorunumFiltre(y) || undefined }}>{en ? y.en : y.tr}</strong>
        <span className="mute">{S.gold(state.gold)} · {S.potions(state.potions)}</span>
        <button type="button" className="ghost" onClick={() => run({ type: 'yerlesim_leave' })}>{S.hubLeave}</button>
      </div>
      <div className="sehir-kutu" style={{ ['--ar' as string]: `${w / h}` }}>
        <img src={`${import.meta.env.BASE_URL}${g.gorsel}`} alt={C.title(en ? y.en : y.tr)} width={w} height={h} draggable={false} onError={props.onFail} />
        {g.dugumler.map((n) => {
          const tg = dugumHedefi(y, n);
          return (
            <button key={n.id} type="button" className={`sehir-dugum ${tg.tur}${n.id === sel ? ' secili' : ''}`} data-dugum={n.id}
              style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} aria-label={label(n)} title={label(n)}
              onClick={() => setSel(n.id === sel ? null : n.id)}>
              <span className="sehir-ad">{label(n)}</span>
            </button>
          );
        })}
      </div>
      {!node && <p className="mute sehir-ipucu">{C.hint}</p>}
      {node && target && (
        <div className="panel sehir-kart" role="dialog" aria-label={label(node)}>
          <h4>{label(node)} {target.tur === 'yakinda' && <small className="mute">· {C.soon}</small>}</h4>
          {body(target, node)}
          <p><button type="button" className="ghost" onClick={() => setSel(null)}>{C.close}</button></p>
        </div>
      )}
      {door && <p className="mute">{S.hubDoorHint}</p>}
      {props.error && <p className="error">{props.error}</p>}
    </section>
  );
}
