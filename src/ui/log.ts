/** Olayları insanın okuyacağı Türkçe satırlara çevirir. */
import type { BattleEvent, BattleState, DamageEffect } from '../battle';
import { hexLabel } from '../battle/movement';
import { skillLabel } from '../rules/skills';
import { terrainOf } from '../map/terrain';

const NOTE: Record<string, string> = { immune: 'bağışık', vulnerable: 'zayıflık ×2', resistant: 'direnç ½' };
const MODE: Record<string, string> = { advantage: ' (avantaj)', disadvantage: ' (dezavantaj)', normal: '' };

function effectText(e: DamageEffect): string {
  switch (e.kind) {
    case 'regen_blocked': return 'yenilenme engellendi';
    case 'regen_pending': return 'yenilenmeyi bekliyor';
    case 'undead_fortitude':
      return `Undead Fortitude (zar ${e.natural}, toplam ${e.total} / DC ${e.dc}): ${e.success ? '1 HP ile ayakta' : 'başarısız'}`;
    case 'dying': return 'ölmekte, bilinci kapandı';
    case 'instant_death': return 'anında öldü';
    case 'death_save_failed': return e.died ? 'ölüm save\'i başarısız, öldü' : `ölüm save'i başarısızlığı (${e.failures}/3)`;
    case 'concentration':
      return `konsantrasyon (${e.spell}) CON save zar ${e.natural}, toplam ${e.total} / DC ${e.dc}: ${e.success ? 'sürüyor' : 'bozuldu'}`;
  }
}

function damagePart(rolls: number[], raw: number, applied: number, type: string, note: string | null): string {
  const dice = rolls.length > 1 ? `${rolls.join('+')} = ` : '';
  const extra = note ? ` (${NOTE[note] ?? note})` : '';
  return `hasar ${dice}${raw}${extra} → ${applied} ${type}`.trim();
}

export function describeEvent(event: BattleEvent, state: BattleState): string {
  const n = (id: string) => state.combatants[id]?.name ?? id;
  switch (event.type) {
    case 'battle_started':
      return `Savaş başladı. Sıra: ${event.state.order.map((id) => n(id)).join(', ')}.`;
    case 'attack_resolved': {
      const parts = [`${n(event.actorId)} → ${n(event.targetId)}: ${event.opportunity ? 'fırsat saldırısı, ' : ''}${event.label}`];
      if (event.d20.length > 0) {
        const verdict = event.critical ? 'KRİTİK' : event.fumble ? 'doğal 1, ıska' : event.hit ? 'isabet' : 'ıska';
        const cover = event.cover ? `, ${event.cover === 5 ? '3/4' : 'yarım'} siper +${event.cover} dahil` : '';
        parts.push(`zar ${event.d20.join(' / ')}${MODE[event.mode] ?? ''}, toplam ${event.total} (AC ${event.targetAc}${cover}): ${verdict}`);
      }
      if (event.hit && event.rawDamage > 0) {
        const extra = (event.extra ?? []).reduce((sum, x) => sum + x.applied, 0);
        parts.push(damagePart(event.damageRolls, event.rawDamage, event.appliedDamage - extra, event.damageType, event.damageNote));
      }
      for (const x of event.extra ?? []) parts.push(`${x.label}: ${damagePart(x.rolls, x.raw, x.applied, x.type, x.note)}`);
      if (event.reasons.length > 0) parts.push(`etkiler: ${event.reasons.join(', ')}`);
      for (const e of event.effects) parts.push(effectText(e));
      if (event.rider) parts.push(`ek etki (elle): ${event.rider}`);
      return parts.join('. ');
    }
    case 'save_resolved': {
      const parts = [`${n(event.actorId)} → ${n(event.targetId)}: ${event.label}`];
      parts.push(
        event.natural === null
          ? `${event.ability.toUpperCase()} save otomatik başarısız`
          : `${event.ability.toUpperCase()} save zar ${event.d20.join(' / ')}${MODE[event.mode] ?? ''}, toplam ${event.total}${event.cover ? ` (siper +${event.cover} dahil)` : ''} / DC ${event.dc}: ${event.success ? 'başarılı' : 'başarısız'}`,
      );
      if (event.rawDamage > 0) {
        parts.push(damagePart(event.damageRolls, event.rawDamage, event.appliedDamage, event.damageType, event.damageNote));
      }
      if (event.conditionsAdded.length > 0) parts.push(`durum: ${event.conditionsAdded.join(', ')}`);
      if (event.reasons.length > 0) parts.push(`etkiler: ${event.reasons.join(', ')}`);
      for (const e of event.effects) parts.push(effectText(e));
      if (event.rider) parts.push(`ek etki (elle): ${event.rider}`);
      return parts.join('. ');
    }
    case 'healed':
      return `${n(event.actorId)} → ${n(event.targetId)}: ${event.label}, ${event.amount} HP iyileşti.`;
    case 'slot_spent':
      return `${n(event.actorId)}: ${event.level}. seviye slot harcandı (kalan ${event.remaining}).`;
    case 'spell_cast':
      return `${n(event.actorId)}: ${event.label}. ${event.note}`;
    case 'condition_changed':
      return `${n(event.targetId)}: ${event.condition} ${event.present ? 'eklendi' : 'kaldırıldı'} (${event.reason}).`;
    case 'height_changed': {
      const names = { '-1': 'alçak', '0': 'aynı seviye', '1': 'yüksek' } as const;
      if (!event.check) return `${n(event.actorId)}: ${names[String(event.to) as '-1' | '0' | '1']} zemine indi.`;
      return `${n(event.actorId)}: yüksek zemine çıkma kontrolü (zar ${event.check.natural}, toplam ${event.check.total} / DC ${event.check.dc}): ${event.moved ? 'başarılı' : 'başarısız'}.`;
    }
    case 'turn_ended':
      return `Sıra ${n(event.nextActorId)} (tur ${event.round}).`;
    case 'placed':
      return `${n(event.actorId)} yerleşti: ${hexLabel(event.at)}.`;
    case 'combat_started':
      return 'Kurulum bitti, savaş başlıyor.';
    case 'moved': {
      const last = event.path[event.path.length - 1];
      return `${n(event.actorId)} yürüdü${last ? `: ${hexLabel(last)}` : ''} (${event.cost} altıgen).`;
    }
    case 'jumped':
      return `${n(event.actorId)} ${event.running ? 'koşarak ' : ''}atladı: ${event.gap} altıgenlik kanal, ${hexLabel(event.to)} (${event.cost} altıgen).`;
    case 'hide_attempted': {
      const bonus = event.bonus ? ` + zemin ${event.bonus}` : '';
      return `${n(event.actorId)}: gizlenme (Stealth) zar ${event.d20.join(' / ')}${MODE[event.mode] ?? ''}${bonus}, toplam ${event.total} / DC ${event.dc}: ${event.success ? 'gizlendi' : 'başarısız'}.`;
    }
    case 'revealed':
      return `${n(event.actorId)} ortaya çıktı (${event.reason}).`;
    case 'skill_checked': {
      const why = event.reason ? ` (${event.reason})` : '';
      return `${n(event.actorId)}: ${skillLabel(event.skill)}${why} zar ${event.d20.join(' / ')}${MODE[event.mode] ?? ''}, toplam ${event.total} / DC ${event.dc}: ${event.success ? 'başarılı' : 'başarısız'}.`;
    }
    case 'searched': {
      const found = event.found.length > 0 ? `buldu: ${event.found.map((id) => n(id)).join(', ')}` : 'kimseyi bulamadı';
      return `${n(event.actorId)}: arama (Perception) zar ${event.natural}, toplam ${event.total}: ${found}.`;
    }
    case 'fell_into_lava':
      return `${n(event.actorId)} lava düştü ve öldü (${hexLabel(event.at)}).`;
    case 'death_save': {
      const text = { success: 'başarı', failure: 'başarısızlık', stable: 'stabil oldu', dead: 'öldü', revived: 'ayağa kalktı (1 HP)' }[event.outcome];
      return `${n(event.actorId)}: ölüm save'i zar ${event.natural}: ${text} (${event.successes} başarı, ${event.failures} başarısızlık).`;
    }
    case 'stabilized':
      return `${n(event.actorId)} → ${n(event.targetId)}: stabilize denemesi (zar ${event.natural}): ${event.success ? 'başarılı' : 'başarısız'}.`;
    case 'recharge_used':
      return `${n(event.actorId)}: saldırı kullanıldı, şarj bekliyor.`;
    case 'recharge_rolled':
      return `${n(event.actorId)}: şarj zarı ${event.d6}: ${event.recharged ? 'yeniden şarj oldu' : 'şarj olmadı'}.`;
    case 'regeneration':
      return event.died
        ? `${n(event.actorId)}: yenilenemedi ve öldü.`
        : event.blocked
          ? `${n(event.actorId)}: yenilenme bu tur engellendi.`
          : `${n(event.actorId)}: ${event.amount} HP yenilendi.`;
    case 'hp_adjusted':
      return `${n(event.targetId)}: HP elle ayarlandı → ${event.hpAfter}.`;
    case 'action_used':
      // Eylem ve kalan saldırılar ayrıca yazılmaz; bonus eylem ve tepki yazılır.
      return event.kind === 'bonus' || event.kind === 'reaction'
        ? `${n(event.actorId)}: ${event.kind === 'bonus' ? 'bonus eylem' : 'tepki'} (${event.what}).`
        : '';
    case 'dashed':
      return `${n(event.actorId)} koşuyor (Dash): bu tur hareketi iki katı.`;
    case 'disengaged':
      return `${n(event.actorId)} ayrılıyor (Disengage).`;
    case 'map_effect': {
      const parts = [`${n(event.targetId)}: ${event.text}`];
      if (event.roll) {
        const r = event.roll;
        parts.push(`${r.label} zar ${r.d20.join(' / ')}${MODE[r.mode] ?? ''}, toplam ${r.total} / DC ${r.dc}: ${r.success ? 'başarılı' : 'başarısız'}`);
      }
      const d = event.damage;
      if (d && d.applied + d.raw > 0) {
        const sum = d.rolls.reduce((a, b) => a + b, 0);
        parts.push(sum > d.raw && d.rolls.length > 0
          ? `hasar ${d.rolls.join('+')} = ${sum}, yarısı ${d.raw} → ${d.applied} ${d.type}`
          : damagePart(d.rolls, d.raw, d.applied, d.type, d.note));
      }
      if (event.addCondition) parts.push(`${event.addCondition} oldu`);
      if (event.removeCondition) parts.push(`${event.removeCondition} geçti`);
      if (event.mapStatus?.sink !== undefined) parts.push(`batma sayacı ${event.mapStatus.sink}`);
      if (event.moveTo) parts.push(`→ ${hexLabel(event.moveTo)}`);
      if (event.stopMovement) parts.push('hareketi bitti');
      return `${parts.join('. ')}.`;
    }
    case 'tile_changed':
      return event.to === '~' ? `${hexLabel(event.at)} lava döndü.` : `${hexLabel(event.at)}: ${terrainOf(event.to).name}.`;
    case 'lava_warning':
      return `Uyarı: lav yükseliyor! ${event.hexes.length} kıyı altıgeni bir sonraki tur başında lav olacak.`;
    case 'map_note':
      return event.text;
    case 'feature_used': {
      const name = { actionSurge: 'Action Surge: bir eylem daha', secondWind: 'Second Wind', favoredEnemy: 'Favored Enemy (slotsuz Hunter\'s Mark)' }[event.feature];
      return `${n(event.actorId)}: ${name} (kalan ${event.remaining}).`;
    }
    case 'concentration_started':
      return `${n(event.actorId)} ${event.spell} için konsantre oluyor.`;
    case 'concentration_moved':
      return event.targetId ? `${n(event.actorId)}: işaret ${n(event.targetId)} üstüne taşındı.` : '';
    case 'battle_finished':
      return event.winner === 'party' ? 'Savaş bitti: parti kazandı.' : 'Savaş bitti: düşmanlar kazandı.';
  }
}

export function describeEvents(events: BattleEvent[], state: BattleState): string[] {
  return events.map((e) => describeEvent(e, state)).filter((line) => line !== '');
}
