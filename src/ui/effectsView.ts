/**
 * Süren etkilerin görünümü (Görev R2): jetondaki simgeler ve karttaki satırlar (simge, ad, kaynak, kalan tur ya da
 * konsantrasyon, açıklama). İşaretler (Hunter's Mark, Hex) büyücünün konsantrasyon hedefinden okunur.
 */
import { spells } from '../data';
import type { BattleState, Combatant } from '../battle';
import { t } from '../i18n';

export interface EffectRow { key: string; icon: string; name: string; detail: string; text: string; harmful: boolean }

const spellOfSrd = (srd: string) => spells.find((s) => s.srd === srd);

/** Savaşçının etkileri (süren etkiler, üzerindeki işaretler, geçici HP). */
export function effectRows(state: BattleState, c: Combatant): EffectRow[] {
  const E = t().effects;
  const n = (id: string) => state.combatants[id]?.name ?? id;
  const rows: EffectRow[] = [];
  for (const e of c.effects ?? []) {
    const sp = spellOfSrd(e.id);
    const icon = sp?.mechanics.effect?.icon ?? sp?.mechanics.ongoing?.icon ?? '✦';
    const left = e.concentration ? E.concentration(n(e.sourceId)) : e.until !== undefined ? E.rounds(Math.max(1, e.until - state.round + 1)) : '';
    const harmful = e.dice?.sign === -1 || !!e.ongoing || !!e.command;
    rows.push({ key: e.id, icon, name: e.name, detail: [E.from(n(e.sourceId)), left].filter(Boolean).join(' · '), text: sp?.text ?? '', harmful });
  }
  // İşaret (Hunter's Mark, Hex): bir büyücünün konsantrasyon hedefi bu savaşçıysa.
  for (const caster of Object.values(state.combatants)) {
    const conc = caster.concentration;
    const sp = spells.find((s) => s.name === conc?.spell);
    if (conc?.targetId === c.id && sp?.mechanics.kind === 'mark') {
      rows.push({ key: `mark:${caster.id}`, icon: '🎯', name: sp.name, detail: E.concentration(caster.name), text: E.mark(sp.name, caster.name), harmful: true });
    }
  }
  if ((c.tempHp ?? 0) > 0) rows.push({ key: 'temp', icon: '💠', name: E.tempHp(c.tempHp ?? 0), detail: '', text: '', harmful: false });
  return rows;
}

/** Jetondaki simgeler (en çok dört). */
export function effectIcons(state: BattleState, c: Combatant): Array<{ key: string; icon: string; title: string }> {
  return effectRows(state, c).slice(0, 4).map((r) => ({ key: `fx-${r.key}`, icon: r.icon, title: `${r.name}${r.detail ? ` — ${r.detail}` : ''}` }));
}
