/** Sırası gelen savaşçının yapabileceği seçimleri listeler ve komuta çevirir. */
import { spells } from '../data';
import type { BattleState, Command } from '../battle';
import type { Height } from '../rules/conditions';
import { HIDE_DC, hideSpotBonus } from '../battle/stealth';
import { economyBlock, preferBonus } from '../battle/economy';

export type ActionGroup = 'Saldırı' | 'Büyü' | 'Gizlenme' | 'Konum' | 'Tur';

export interface ActionChoice {
  id: string;
  group: ActionGroup;
  label: string;
  detail: string;
  /** Hedef seçmek gerekiyor mu? */
  needsTarget: boolean;
  /** Şu an yapılamıyorsa nedeni. */
  disabled?: string;
  build: (targetId?: string) => Command;
}

const HEIGHT_NAMES: Record<string, string> = { '-1': 'Alçak zemin', '0': 'Aynı seviye', '1': 'Yüksek zemin' };

export function actionsFor(state: BattleState, actorId: string): ActionChoice[] {
  const actor = state.combatants[actorId];
  if (!actor || state.status !== 'active') return [];
  const out: ActionChoice[] = [];

  // Karakterin silahları
  actor.weaponOptions.forEach((option, i) => {
    out.push({
      id: `weapon-${i}`, group: 'Saldırı', label: option.label,
      detail: `${option.attackBonus >= 0 ? '+' : ''}${option.attackBonus} vuruş, ${option.damage} ${option.damageType ?? ''}`.trim(),
      needsTarget: true,
      build: (targetId) => ({ type: 'attack', actorId, targetId: targetId ?? '', option }),
    });
  });

  // Canavar saldırıları
  actor.attacks.forEach((a, i) => {
    const used = a.recharge !== undefined && actor.rechargeUsed.includes(i);
    out.push({
      id: `attack-${i}`, group: 'Saldırı', label: a.name,
      detail: a.save ? `${a.save.ability.toUpperCase()} save DC ${a.save.dc}` : `${a.bonus >= 0 ? '+' : ''}${a.bonus} vuruş`,
      needsTarget: true,
      disabled: used ? 'Şarj bekliyor' : undefined,
      build: (targetId) => ({ type: 'monster_attack', actorId, targetId: targetId ?? '', attackIndex: i }),
    });
  });
  if (actor.multiattack) {
    out.push({
      id: 'multiattack', group: 'Saldırı', label: 'Multiattack', detail: 'tüm saldırılar sırayla',
      needsTarget: true,
      build: (targetId) => ({ type: 'multiattack', actorId, targetId: targetId ?? '' }),
    });
  }

  // Büyüler
  for (const name of actor.spellNames) {
    const spell = spells.find((s) => s.name === name);
    if (!spell) continue;
    const needsTarget = spell.mechanics.kind !== 'utility';
    const hasSlot = spell.level === 0 || actor.spellSlots.some((n, i) => i + 1 >= spell.level && n > 0);
    out.push({
      id: `spell-${name}`, group: 'Büyü', label: spell.name,
      detail: spell.level === 0 ? 'cantrip' : `${spell.level}. seviye`,
      needsTarget,
      disabled: hasSlot ? undefined : 'Slot yok',
      build: (targetId) => ({ type: 'cast_spell', actorId, spellName: name, ...(targetId ? { targetId } : {}) }),
    });
  }

  // Gizlenme ve arama (haritalı savaş)
  if (state.map && actor.pos) {
    const spot = hideSpotBonus(state, actor.pos);
    out.push({
      id: 'hide', group: 'Gizlenme', label: 'Gizlen',
      detail: spot === null ? '' : `Stealth DC ${HIDE_DC}${spot ? `, zemin +${spot}` : ''}`,
      needsTarget: false,
      disabled: actor.hidden ? 'Zaten gizlenmiş' : spot === null ? 'Burada gizlenilemez' : undefined,
      build: () => ({ type: 'hide', actorId, bonus: preferBonus(actor, 'hide') }),
    });
    out.push({
      id: 'search', group: 'Gizlenme', label: 'Ara', detail: 'Perception', needsTarget: false,
      build: () => ({ type: 'search', actorId }),
    });
  }

  // Koşma ve ayrılma
  for (const [type, label, detail] of [['dash', 'Koş (Dash)', 'bu tur hareket iki katı'], ['disengage', 'Ayrıl (Disengage)', 'fırsat saldırısı yok']] as const) {
    if (type === 'dash' && !state.map) continue; // haritasız savaşta hareket mesafesi yok
    const bonus = preferBonus(actor, type);
    out.push({
      id: type, group: 'Konum', label, detail: bonus ? `${detail}, bonus eylem` : detail, needsTarget: false,
      build: () => ({ type, actorId, bonus }),
    });
  }

  // Konum değiştirme (haritasız savaş; haritada yükseklik altıgenden gelir)
  for (const h of [1, 0, -1] as Height[]) {
    if (state.map || h === actor.height) continue;
    out.push({
      id: `move-${h}`, group: 'Konum', label: HEIGHT_NAMES[String(h)] ?? String(h),
      detail: h > actor.height ? 'tırmanma kontrolü gerekir' : 'otomatik',
      needsTarget: false,
      build: () => ({ type: 'change_height', actorId, toHeight: h }),
    });
  }

  // Eylem ekonomisi: harcanmış eylemle yapılamayanlar soluk ve nedenli.
  for (const a of out) {
    if (a.disabled === undefined) a.disabled = economyBlock(state, actor, a.build('')) ?? undefined;
  }

  out.push({
    id: 'end-turn', group: 'Tur', label: 'Turu bitir', detail: '', needsTarget: false,
    build: () => ({ type: 'end_turn', actorId }),
  });
  return out;
}
