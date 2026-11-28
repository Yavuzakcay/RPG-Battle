/**
 * Görev KATALOG-GUC-TAM D: oluşturucunun Ekipman adımında mühür taşı yuvaları (yalnız arayüz; kural `src/rules/sockets.ts`).
 * Konak (zırh/kalkan/cübbe/özel) başına yuvalar; her yuva tek seçim kutusu (taş listesi kutunun içinde, SD3: görünen seçenek
 * sayısını artırmaz). Kalıcı kaynaşmalı konakta takılı taş değiştirilemez.
 */
import { items } from '../../data';
import { t } from '../../i18n';
import { STONE_IDS, socketHosts, socketProblem } from '../../rules/sockets';
import type { CharacterSheet } from '../../rules/stats';
import { Fold, InfoPop } from './shared';

type SetFn = (p: Partial<CharacterSheet>) => void;

export function SocketPanel({ sheet: s, set }: { sheet: CharacterSheet; set: SetFn }) {
  const W = t().builder.wiz;
  const hosts = socketHosts(s);
  const total = hosts.reduce((n, h) => n + h.slots, 0);
  const used = hosts.reduce((n, h) => n + (s.yuvalar?.[h.key]?.length ?? 0), 0);
  const nameOf = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const put = (key: string, i: number, id: string) => {
    const cur = [...(s.yuvalar?.[key] ?? [])];
    if (id) cur[i] = id; else cur.splice(i, 1);
    const next = { ...(s.yuvalar ?? {}), [key]: cur.filter(Boolean) };
    if (!next[key]?.length) delete next[key];
    set({ yuvalar: next });
  };
  return (
    <Fold title={W.sockets} summary={hosts.length ? W.socketsSum(used, total) : W.socketNone} className="eq-sockets">
      <p className="mute">{W.socketInfo}<InfoPop text={W.socketInfo} /></p>
      {!hosts.length && <p className="mute">{W.socketNone}</p>}
      {hosts.map((h) => {
        const cur = s.yuvalar?.[h.key] ?? [];
        const ok = STONE_IDS.filter((id) => !socketProblem(h, id));
        return (
          <div key={h.key} className="socket-host">
            <b>{h.name}</b> <small className="mute">{W.socketTier(h.tier)}{h.permanent ? ` · ${W.socketPermanent}` : ''}</small>
            <ul className="eq-list">
              {Array.from({ length: Math.min(h.slots, cur.length + 1) }, (_, i) => {
                const val = cur[i] ?? '';
                const locked = !!h.permanent && !!val;
                return (
                  <li key={i} className="eq-row">
                    <label className="socket-slot"><small>{W.socketSlot(i + 1)}</small>
                      <select value={val} disabled={locked} onChange={(e: { target: { value: string } }) => put(h.key, i, e.target.value)}>
                        <option value="">{W.socketEmpty}</option>
                        {ok.filter((id) => id === val || !cur.includes(id)).map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
                      </select></label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </Fold>
  );
}
