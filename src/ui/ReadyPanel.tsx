/**
 * Hazırla (Ready) paneli (kural sürümü 90; SRD 5.2.1 s.186–187): tetik (veriden, `data/hazirla.json`), isteğe bağlı
 * tetikleyen yaratık, yanıt (tek saldırı / hareket / eylem süreli büyü) ve onay. Altıgen gereken seçimler (tetik
 * altıgeni, hareket varışı) haritadan (`onPickHex`). Büyüde slotun hemen harcandığı ve konsantrasyon uyarısı açıkça
 * yazılır. Yalnız komut kurar; motor `ready.ts` doğrular. Savaş ekranı parçasında (tembel).
 */
import { spells } from '../data';
import type { BattleState, Combatant, Command } from '../battle';
import type { Offset } from '../rules/hex';
import { READY_TRIGGERS, readyProblem } from '../battle/ready';
import { getLang, t } from '../i18n';

export interface ReadyDraft {
  trigger: string; sourceId?: string; hex?: Offset;
  kind: 'attack' | 'move' | 'spell';
  weapon?: string; attackIndex?: number; to?: Offset;
  spellName?: string; slotLevel?: number;
}
export const READY_DRAFT: ReadyDraft = { trigger: READY_TRIGGERS[0]?.id ?? 'erisime-girer', kind: 'attack' };

/** Hazırlanabilen büyüler: bilinen, döküm süresi eylem (SRD), desteklenen. */
export function readySpells(actor: Combatant) {
  return spells.filter((s) => actor.spellNames.includes(s.name) && s.castingTime === 'action' && !s.mechanics.unsupported && !s.mechanics.offCombat);
}

/** Taslaktan komut (eksikse null). */
export function readyCommand(actor: Combatant, d: ReadyDraft): Extract<Command, { type: 'ready' }> | null {
  const base = { type: 'ready' as const, actorId: actor.id, trigger: d.trigger, ...(d.sourceId ? { sourceId: d.sourceId } : {}), ...(d.hex ? { hex: d.hex } : {}) };
  if (d.kind === 'attack') {
    const option = actor.weaponOptions.find((o) => o.label === d.weapon);
    if (option) return { ...base, response: { kind: 'attack', option } };
    if (d.attackIndex !== undefined) return { ...base, response: { kind: 'attack', attackIndex: d.attackIndex } };
    return null;
  }
  if (d.kind === 'move') return d.to ? { ...base, response: { kind: 'move', to: d.to } } : null;
  return d.spellName ? { ...base, response: { kind: 'spell', spellName: d.spellName, ...(d.slotLevel ? { slotLevel: d.slotLevel } : {}) } } : null;
}

export function ReadyPanel(props: {
  state: BattleState; actor: Combatant; draft: ReadyDraft; onDraft: (d: ReadyDraft) => void;
  onPickHex: (field: 'hex' | 'to') => void; onConfirm: (cmd: Command) => void; onCancel: () => void;
  /** Ekonomi ve sıra engeli (savaş ekranından). */
  blocked?: string | null; hexLabel: (h: Offset) => string;
}) {
  const U = t().readyUi;
  const lang = getLang() === 'en' ? 'en' : 'tr';
  const { state, actor, draft: d } = props;
  const set = (p: Partial<ReadyDraft>) => props.onDraft({ ...d, ...p });
  const trig = READY_TRIGGERS.find((x) => x.id === d.trigger);
  const foes = Object.values(state.combatants).filter((c) => c.side !== actor.side && c.hp > 0 && c.pos && !c.civilian && !c.hidden);
  const weapons = actor.weaponOptions.filter((o) => !o.spell);
  const monsterAttacks = actor.attacks.map((a, i) => ({ a, i })).filter(({ a }) => !a.save && !!a.damageDice);
  const castables = readySpells(actor);
  const spell = castables.find((s) => s.name === d.spellName);
  const slots = spell && spell.level > 0 ? actor.spellSlots.map((n, i) => ({ level: i + 1, n })).filter((x) => x.level >= spell.level && x.n > 0) : [];
  const cmd = readyCommand(actor, d);
  const problem = props.blocked ?? (cmd ? readyProblem(state, actor, cmd) : null);
  const conc = actor.concentration && !actor.concentration.spell.startsWith('ready:') ? actor.concentration.spell : null;
  return (
    <div className="ready-panel" role="dialog" aria-label={U.title}>
      <h3>{U.title}</h3>
      <label>{U.trigger}
        <select value={d.trigger} onChange={(e) => set({ trigger: e.target.value, hex: undefined })}>
          {READY_TRIGGERS.map((x) => <option key={x.id} value={x.id}>{x.ad[lang]}</option>)}
        </select>
      </label>
      {trig?.kosul === 'altigen' && (
        <button type="button" className="ghost" onClick={() => props.onPickHex('hex')}>{U.pickHex} · {d.hex ? U.hexSet(props.hexLabel(d.hex)) : U.unset}</button>
      )}
      <label>{U.who}
        <select value={d.sourceId ?? ''} onChange={(e) => set({ sourceId: e.target.value || undefined })}>
          <option value="">{U.anyEnemy}</option>
          {foes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <fieldset className="ready-kinds">
        <legend>{U.response}</legend>
        {(['attack', 'move', 'spell'] as const).map((k) => (
          <button key={k} type="button" className={d.kind === k ? 'on' : 'ghost'} aria-pressed={d.kind === k} onClick={() => set({ kind: k })}>{U[k]}</button>
        ))}
      </fieldset>
      {d.kind === 'attack' && (
        <label>{U.weapon}
          <select value={d.weapon ?? (d.attackIndex !== undefined ? `#${d.attackIndex}` : '')}
            onChange={(e) => (e.target.value.startsWith('#') ? set({ weapon: undefined, attackIndex: Number(e.target.value.slice(1)) }) : set({ weapon: e.target.value || undefined, attackIndex: undefined }))}>
            <option value="">—</option>
            {weapons.map((o) => <option key={o.label} value={o.label}>{o.label}</option>)}
            {monsterAttacks.map(({ a, i }) => <option key={`#${i}`} value={`#${i}`}>{a.name}</option>)}
          </select>
        </label>
      )}
      {d.kind === 'move' && (
        <button type="button" className="ghost" onClick={() => props.onPickHex('to')}>{U.pickTo} · {d.to ? U.hexSet(props.hexLabel(d.to)) : U.unset}</button>
      )}
      {d.kind === 'spell' && (castables.length === 0 ? <p className="mute">{U.noSpells}</p> : (
        <>
          <label>{U.spell}
            <select value={d.spellName ?? ''} onChange={(e) => set({ spellName: e.target.value || undefined, slotLevel: undefined })}>
              <option value="">—</option>
              {castables.map((s) => <option key={s.name} value={s.name}>{s.name}{s.level ? ` (${s.level})` : ''}</option>)}
            </select>
          </label>
          {slots.length > 0 && (
            <label>{U.slot}
              <select value={d.slotLevel ?? slots[0]?.level} onChange={(e) => set({ slotLevel: Number(e.target.value) })}>
                {slots.map((x) => <option key={x.level} value={x.level}>{x.level} ({x.n})</option>)}
              </select>
            </label>
          )}
          {spell && (
            <p className="ready-warn" role="note">
              {spell.level > 0 && <>{U.slotWarn} </>}{U.concWarn}{conc ? ` ${U.concEnds(conc)}` : ''} {U.target}
            </p>
          )}
        </>
      ))}
      <p className="mute ready-holds">{U.holds}</p>
      {problem && <p className="ready-why">{problem}</p>}
      <div className="ready-actions">
        <button type="button" disabled={!cmd || !!problem} onClick={() => cmd && props.onConfirm(cmd)}>{U.confirm}</button>
        <button type="button" className="ghost" onClick={props.onCancel}>{U.cancel}</button>
      </div>
    </div>
  );
}
