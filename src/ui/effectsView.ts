/**
 * Süren etkilerin görünümü (Görev R2): jetondaki simgeler ve karttaki satırlar (simge, ad, kaynak, kalan tur ya da
 * konsantrasyon, açıklama). İşaretler (Hunter's Mark, Hex) büyücünün konsantrasyon hedefinden okunur.
 */
import { spells, spellDescriptionShown } from '../data';
import type { BattleState, Combatant } from '../battle';
import { getLang, t } from '../i18n';
import { spellBadgeImg } from './damageFloats';
import { describeTr } from './trDesc';

/** `desc`: Kuyruk B2 büyü betimlemesi (mekanik `text`'in üstünde, italik; EN modunda ya da veri yoksa boş). */
export interface EffectRow { key: string; icon: string; name: string; detail: string; text: string; harmful: boolean; desc?: string }

const spellOfSrd = (srd: string) => spells.find((s) => s.srd === srd);

/** Savaşçının etkileri (süren etkiler, üzerindeki işaretler, geçici HP). */
export function effectRows(state: BattleState, c: Combatant): EffectRow[] {
  const E = t().effects;
  const n = (id: string) => state.combatants[id]?.name ?? id;
  const rows: EffectRow[] = [];
  for (const e of c.effects ?? []) {
    const sp = spellOfSrd(e.id);
    const icon = e.icon ?? sp?.mechanics.effect?.icon ?? sp?.mechanics.ongoing?.icon ?? '✦';
    const left = e.concentration ? E.concentration(n(e.sourceId)) : e.until !== undefined ? E.rounds(Math.max(1, e.until - state.round + 1)) : '';
    const harmful = e.dice?.sign === -1 || !!e.ongoing || !!e.command || !!e.damagePenalty || !!e.attackDis || !!e.repeatSave || !!e.delayed || e.size === -1 || !!e.noReactions || !!e.saveDis;
    const desc = sp ? spellDescriptionShown(sp.id, getLang()) : undefined;
    rows.push({ key: e.id, icon, name: e.name, detail: [E.from(n(e.sourceId)), left].filter(Boolean).join(' · '), text: sp ? (describeTr('buyu', sp.id) ?? (getLang() === 'tr' ? sp.text : '')) : '', harmful, ...(desc ? { desc } : {}) });
  }
  // İşaret (Hunter's Mark, Hex): bir büyücünün konsantrasyon hedefi bu savaşçıysa.
  for (const caster of Object.values(state.combatants)) {
    const conc = caster.concentration;
    const sp = spells.find((s) => s.name === conc?.spell);
    if (conc?.targetId === c.id && sp?.mechanics.kind === 'mark') {
      const desc = spellDescriptionShown(sp.id, getLang());
      rows.push({ key: `mark:${caster.id}`, icon: '🎯', name: sp.name, detail: E.concentration(caster.name), text: E.mark(sp.name, caster.name), harmful: true, ...(desc ? { desc } : {}) });
    }
  }
  if ((c.tempHp ?? 0) > 0) rows.push({ key: 'temp', icon: '💠', name: E.tempHp(c.tempHp ?? 0), detail: '', text: '', harmful: false });
  return rows;
}

/** Jetondaki simgeler (en çok dört). */
export function effectIcons(state: BattleState, c: Combatant): Array<{ key: string; icon: string; title: string; img?: string }> {
  // Kuyruk E2: büyüsü `rozetBuyu`'da olan etkinin rozeti sayı oku simgesi (yalnız görsel).
  const rows = [...effectRows(state, c), ...(c.buffs ?? []).filter((b) => spellBadgeImg(b.source)).map((b) => ({ key: `buff:${b.source}`, icon: '✦', name: b.source, detail: '' })),
    // Konsantrasyon koruması (ward: Shield of Faith, Protection from Evil and Good) hedefin jetonunda.
    ...Object.values(state.combatants).filter((x) => x.concentration?.targetId === c.id && spellBadgeImg(x.concentration.spell))
      .map((x) => ({ key: `ward:${x.id}`, icon: '✦', name: x.concentration!.spell, detail: t().effects.concentration(x.name) }))];
  return rows.slice(0, 4).map((r) => {
    const img = spellBadgeImg(r.name);
    return { key: `fx-${r.key}`, icon: r.icon, title: `${r.name}${r.detail ? ` — ${r.detail}` : ''}`, ...(img ? { img } : {}) };
  });
}
