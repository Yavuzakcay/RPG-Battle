/**
 * Kuyruk K54b: imza eylemleri için özel yapay zekâ sezgiselleri (`spec.yz`; `imzaAi` çağırır). Büyü slotu dursa da
 * denenir (kontrol ve konum eylemleri büyünün yerine geçebilir). En basit kurallar:
 * - mevzi: düşmana en yakın dostun (2 altıgen içinde düşman varsa) altıgeni işaretlenir; işaret sürerken yenisi yok.
 * - duvar: büyücüye 2–5 altıgen uzaktaki en yakın düşmanla büyücü arasına (düşmanın bir adım önüne) duvar.
 * - zeminDusman: içinde en az 3 düşman olup dost olmayan alan (merkez bir düşman).
 * - cagri: 30 ft içinde en az 2 düşman (Dunganga Çağrısı).
 * - plan: 60 ft içinde en az 3 dost (kendisi dahil) varken.
 * - kontrol: düşman sayısı en az 2 ise (Ninni); tek hedefli kontrolde en güçlü (en çok canlı) düşman (Sepet).
 * - hukum: hükümlü yokken en düşük canlı görülen düşman.
 * - ovgu / hiciv (Şair Mısra): yarı canın altındaki ya da çökmüş dosta Övgü; en düşük canlı düşmana Hiciv.
 * - fal / falDusman (Astrolog Yıldız Falı): Uğurlu olmayan en çok saldırılı dost; Uğursuz olmayan en canlı düşman.
 * - bag: bağ yokken 2+ dost yakınken; nobet: bağlı dostlardan biri yaralıyken.
 * Saf.
 */
import { distance, line, type Offset } from '../rules/hex';
import { occupantAt, terrainAt } from './movement';
import type { ImzaSpec } from './imza';
import type { BattleState, Combatant, Command } from './types';

const zonesOf = (s: BattleState, owner: string, spellId: string) => (s.map?.zones ?? []).filter((z) => z.casterId === owner && z.spellId === spellId);

/** Denenecek komutlar (sırayla; ilk geçerli olan seçilir). Boş liste: bu tur kullanma. */
export function imzaHintCmds(state: BattleState, actor: Combatant, key: string, spec: ImzaSpec, foes: Combatant[], allies: Combatant[]): Command[] {
  if (!actor.pos) return [];
  const me = actor.pos;
  const cmd = (extra: Partial<Extract<Command, { type: 'use_feature' }>>): Command => ({ type: 'use_feature', actorId: actor.id, feature: key, ...extra });
  const near = (a: Offset, n: number) => foes.filter((f) => f.pos && distance(a, f.pos) <= n);
  // Eylem harcayan kontrol/zemin ipuçları güçlü büyünün yerine geçmesin: 3.+ seviye slot dururken yalnız çok hedefte.
  const bigSlots = actor.spellSlots.slice(2).some((n) => n > 0);
  if (spec.tur === 'action' && bigSlots && spec.yz !== 'cagri' && spec.yz !== 'plan' && spec.yz !== 'nobet') {
    const r = Math.floor(Number(spec.yaricapFt ?? spec.param?.yaricapFt ?? 30) / 5);
    if (spec.hedef === 'enemy' || spec.yz === 'duvar' || near(me, r).length < 3) return [];
  }
  switch (spec.yz) {
    case 'mevzi': {
      if (zonesOf(state, actor.id, 'imza:mevzi').length) return [];
      return allies.filter((a) => a.pos && distance(me, a.pos) <= 12 && near(a.pos, 2).length)
        .sort((a, b) => near(b.pos as Offset, 2).length - near(a.pos as Offset, 2).length)
        .map((a) => cmd({ to: a.pos as Offset }));
    }
    case 'duvar': {
      const out: Command[] = [];
      for (const f of foes.filter((x) => x.pos && distance(me, x.pos) >= 2 && distance(me, x.pos) <= 5).sort((a, b) => distance(me, a.pos as Offset) - distance(me, b.pos as Offset))) {
        const path = line(f.pos as Offset, me);
        const h = path[1];
        if (h && !occupantAt(state, h) && terrainAt(state, h).movement !== 'blocked') out.push(cmd({ to: h }));
      }
      return out.slice(0, 3);
    }
    case 'zeminDusman': {
      const r = Math.floor(Number(spec.param?.yaricapFt ?? 20) / 5);
      return foes.filter((f) => f.pos && distance(me, f.pos) <= 12 && near(f.pos, r).length >= 3 && !allies.some((a) => a.pos && distance(a.pos, f.pos as Offset) <= r))
        .map((f) => cmd({ to: f.pos as Offset }));
    }
    case 'cagri':
      return near(me, 6).length >= 2 ? [cmd({})] : [];
    case 'plan':
      return allies.filter((a) => a.pos && distance(me, a.pos) <= 12).length >= 3 ? [cmd({})] : [];
    case 'kontrol': {
      if (spec.hedef === 'enemy') {
        return foes.filter((f) => !f.effects?.some((e) => e.grants?.includes('Incapacitated')) && !f.conditions.includes('Incapacitated'))
          .sort((a, b) => b.hp - a.hp).slice(0, 3).map((f) => cmd({ targetId: f.id }));
      }
      const r = Math.floor(Number(spec.yaricapFt ?? 30) / 5);
      return near(me, r).length >= 2 ? [cmd({})] : [];
    }
    case 'hukum': {
      const marked = Object.values(state.combatants).some((c) => c.hp > 0 && c.effects?.some((e) => e.id === `${key}:${actor.id}`));
      if (marked) return [];
      return [...foes].sort((a, b) => a.hp - b.hp).slice(0, 4).map((f) => cmd({ targetId: f.id }));
    }
    case 'ovgu': {
      // Övgü: en yaralı (yarı canın altı) ya da çökmüş dost; geçici canı yoksa.
      return allies.filter((a) => a.id !== actor.id && a.pos && distance(me, a.pos) <= 12 && !(a.tempHp ?? 0)
        && (a.hp <= a.maxHp * 0.5 || a.effects?.some((e) => e.id === 'moral:cokmus')))
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp).slice(0, 3).map((a) => cmd({ targetId: a.id }));
    }
    case 'hiciv':
      // Hiciv: en düşük canlı görülen düşman (öldürme şansı) ya da hiç ovgu yoksa yakındaki düşman.
      return [...foes].filter((f) => f.pos && distance(me, f.pos) <= 12).sort((a, b) => a.hp - b.hp).slice(0, 3).map((f) => cmd({ targetId: f.id }));
    case 'fal': {
      // Yıldız Falı (Uğur): Uğurlu olmayan, en çok saldırılı dost (kendisi dahil).
      return allies.filter((a) => a.pos && distance(me, a.pos) <= 12 && !a.effects?.some((e) => e.name === 'Uğurlu'))
        .sort((a, b) => b.attacksPerAction - a.attacksPerAction || b.hp - a.hp).slice(0, 2).map((a) => cmd({ targetId: a.id }));
    }
    case 'falDusman':
      return [...foes].filter((f) => f.pos && distance(me, f.pos) <= 12 && !f.effects?.some((e) => e.name === 'Uğursuz'))
        .sort((a, b) => b.hp - a.hp).slice(0, 2).map((f) => cmd({ targetId: f.id }));
    case 'bag': {
      const bonded = Object.values(state.combatants).some((c) => c.hp > 0 && c.effects?.some((e) => e.id === `${key}:${actor.id}`));
      return !bonded && allies.filter((a) => a.id !== actor.id && a.pos && distance(me, a.pos) <= 6).length >= 1 ? [cmd({})] : [];
    }
    case 'nobet': {
      const bonded = allies.filter((c) => c.effects?.some((e) => e.id === `imza:imza_birlik/forge-bond:${actor.id}`));
      return bonded.length >= 2 && bonded.some((c) => c.hp <= c.maxHp * 0.5 && !(c.tempHp ?? 0)) ? [cmd({})] : [];
    }
    default:
      return [];
  }
}
