/**
 * Kuyruk 34b: yerleşim hub'ı (Serüven parçasıyla tembel). Dükkân (sabit fiyat tablosu), han (uzun dinlenme), görevler
 * (veri şablonları, yer tutucu NPC), haritalar (yerleşimin harita zinciri; kapı geçişi açıkken yalnızca başlangıç ve
 * ulaşılmış haritalar). Görünüm filtresi başlıkta (`gorunum`).
 */
import { toggleOn, nodeKey, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { YERLESIM, gorevById, gorunumFiltre, satisFiyati, yerlesimById, type Yerlesim } from '../yerlesim/yerlesim';
import { getLang, t } from '../i18n';
import { STRINGS_TR } from '../i18n/strings';
import { HAPIS, sucById } from '../journey/hapishane';

const mapName = (y: Yerlesim, id: string, en: boolean): string => {
  const h = y.haritalar.find((x) => x.id === id);
  const own = h ? (en ? h.en : h.tr) : undefined;
  const info = h ? (en ? t().gm.mapInfo[h.mapId] : STRINGS_TR.gm.mapInfo[h.mapId]) : undefined;
  return own ?? info?.name ?? id;
};

export function YerlesimHub(props: { state: SeruvenState; run: (c: SeruvenCommand) => boolean; onMap: (map: string) => void; onSuc?: () => void; error: string | null }) {
  const { state, run } = props;
  const S = t().seruven;
  const en = getLang() === 'en';
  const y = state.yerlesim ? yerlesimById(state.yerlesim.id) : undefined;
  if (!y || !state.yerlesim) return null;
  const cur = state.yerlesim;
  const door = toggleOn(state, 'yerlesimKapi');
  const maps = y.haritalar.filter((h) => !door || h.id === y.baslangic || cur.seen.includes(h.id));
  return (
    <section className="panel seruven-hub" data-yerlesim={y.id}>
      <h3 style={{ filter: gorunumFiltre(y) || undefined }}>{en ? y.en : y.tr} <small className="mute">· {S.hubType[y.sablon]}</small></h3>
      <p className="mute">{S.gold(state.gold)} · {S.potions(state.potions)}</p>
      <h4>{S.hubMaps}</h4>
      <p>{maps.map((h) => <button key={h.id} type="button" onClick={() => props.onMap(h.id)}>{mapName(y, h.id, en)}</button>)}</p>
      {door && <p className="mute">{S.hubDoorHint}</p>}
      {y.hub.dukkan && (
        <>
          <h4>{S.hubShop}</h4>
          <ul className="seruven-shop">
            {YERLESIM.dukkan.map((u) => {
              const have = u.tur === 'iksir' ? state.potions : state.items.filter((i) => i === u.id).length;
              return (
                <li key={u.id}>
                  {en ? u.en : u.tr} · {S.price(u.fiyat)} {have ? <small className="mute">({have})</small> : null}{' '}
                  <button type="button" disabled={state.gold < u.fiyat} onClick={() => run({ type: 'shop_buy', item: u.id })}>{S.buy}</button>
                  <button type="button" className="ghost" disabled={!have} onClick={() => run({ type: 'shop_sell', item: u.id })}>{S.sell(satisFiyati(u))}</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {y.hub.han && (
        <>
          <h4>{S.hubInn}</h4>
          <p><button type="button" onClick={() => run({ type: 'inn_rest' })}>{S.innRest(YERLESIM.hanUcreti)}</button></p>
        </>
      )}
      {y.hub.gorevler.length > 0 && (
        <>
          <h4>{S.hubQuests}</h4>
          <ul className="seruven-quests">
            {y.hub.gorevler.map((id) => {
              const g = gorevById(id);
              if (!g) return null;
              // Kuyruk 36: Büyük suç zinciri (üç suç; ön savaş, muhafız baskını, Teslim ol).
              if (g.zincir === 'buyuk-suc') {
                const cur = state.suc ? sucById(state.suc.id) : undefined;
                return (
                  <li key={g.id}>
                    <strong>{en ? g.en : g.tr}</strong> · <small>{en ? g.npc.en : g.npc.tr}</small><br />
                    <small className="mute">{en ? g.aciklama.en : g.aciklama.tr}</small><br />
                    {state.quests?.[g.id] === 'done' && <small>{S.questDone}</small>}
                    {!state.suc && state.quests?.[g.id] !== 'done' && HAPIS.suclar.map((x) => (
                      <button key={x.id} type="button" title={en ? x.aciklama.en : x.aciklama.tr} onClick={() => run({ type: 'suc_basla', suc: x.id })}>{en ? x.en : x.tr}</button>
                    ))}
                    {state.suc && cur && (
                      <>
                        <small>{en ? cur.en : cur.tr} · {state.suc.asama === 'on' ? S.crimeJob : S.crimeRaid}</small><br />
                        <button type="button" className="cta" onClick={() => props.onSuc?.()}>{state.suc.asama === 'on' ? S.crimeStart : S.crimeResist}</button>
                        {state.suc.asama === 'baskin' && <button type="button" className="ghost" onClick={() => run({ type: 'teslim_ol' })}>{S.crimeSurrender}</button>}
                      </>
                    )}
                  </li>
                );
              }
              const st = state.quests?.[g.id];
              const ready = st === 'taken' && state.done.includes(nodeKey(g.hedef.page, g.hedef.node));
              return (
                <li key={g.id}>
                  <strong>{en ? g.en : g.tr}</strong> · <small>{en ? g.npc.en : g.npc.tr}</small><br />
                  <small className="mute">{en ? g.aciklama.en : g.aciklama.tr} · {S.reward(g.odul.gold, 0)}</small><br />
                  {!st && <button type="button" onClick={() => run({ type: 'quest_take', quest: g.id })}>{S.questTake}</button>}
                  {st === 'taken' && (ready ? <button type="button" className="cta" onClick={() => run({ type: 'quest_claim', quest: g.id })}>{S.questClaim}</button> : <small>{S.questOpen}</small>)}
                  {st === 'done' && <small>{S.questDone}</small>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {/* Kuyruk 36: tapınak hizmeti "Tasmayı çıkar" (altınla ya da hizmetle). */}
      {y.hub.tapinak && state.tasma && (
        <>
          <h4>{S.hubTemple}</h4>
          <p>
            <button type="button" disabled={state.gold < HAPIS.tasmaUcreti} onClick={() => run({ type: 'tasma_cikar', yol: 'altin' })}>{S.collarPay(HAPIS.tasmaUcreti)}</button>
            <button type="button" className="ghost" onClick={() => run({ type: 'tasma_cikar', yol: 'hizmet' })}>{S.collarServe}</button>
          </p>
        </>
      )}
      <p><button type="button" className="ghost" onClick={() => run({ type: 'yerlesim_leave' })}>{S.hubLeave}</button></p>
      {props.error && <p className="error">{props.error}</p>}
    </section>
  );
}
