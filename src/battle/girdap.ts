/**
 * Control Water girdabı (kullanıcı kararı 2026-11-19; kural sürümü 84, Game Master anahtarı `controlWaterWhirlpool`).
 * SRD 5.2.1 Whirlpool'un savaş biçimi (⚠ ev kuralı, `data/girdap.json` `_not`):
 * - Büyü hedef yaratığın altıgeninde girdap alanı açar; haritada su gerekmez. Yarıçap ve hasar slotla büyür
 *   (taban `data/girdap.json`, slot başı `k84.upcast`: +1d8, +5 ft; yarıçap üst sınırı 5 altıgen). Konsantrasyon, 10 dakika.
 * - Alana ilk girişte (turda bir) ve alandayken tur başında STR save: başarısızlıkta hasar ve yakalanma (hız 0; kurtulma
 *   eylemle Athletics, büyü DC'si, `escape`), başarıda yarı hasar. Alanın dışında, bandın içindeki yaratık tur başında merkeze
 *   10 ft çekilir (`forcedMove` çekme kipi; girişte tetik). Uçan (25 ft'e kadar) ve yüzen/batık yaratık da etkilenir.
 * - Taşkın, hendek ve akış yönlendirme savaş dışı (`k84.gmNote`).
 * Kapalıyken ve 83 ve altında Control Water eski yolundan (`spellsK19` su girdabı, `terraform.ts`). Saf.
 */
import cfg from '../../data/girdap.json';
import { distance, withinRange, type Offset } from '../rules/hex';
import { formatDice, parseDice, type Rng } from '../rules/dice';
import { fail, finish, type CommandResult } from './common';
import { sightBlockedBetween } from './cover';
import { forcedMove } from './motion';
import { concentrationEvent, spendSlot } from './slots';
import { registerCommandEnd } from './turnHooks';
import { girdapOn } from './girdapSurum';
import { altitudeInZone } from './altitude';
import { bodyAt } from './body';
import { affects, bodyInZone, newZoneId, whirlEffectId, zoneSpecOf } from './zones';
import { registerZoneStartPull } from './zoneHooks';
import type { Spell, SpellMechanics, ZoneSpec } from '../data/types';
import type { BattleEvent, BattleState, Combatant, Command, SpellZone } from './types';

type CastCommand = Extract<Command, { type: 'cast_spell' }>;

/** Büyünün girdap bloğu (yoksa undefined): yalnız `k84.whirlpool` taşıyan büyü (Control Water). */
export const whirlpoolBlock = (spell: Pick<Spell, 'mechanics'>): Partial<SpellMechanics> | undefined =>
  spell.mechanics.k84?.whirlpool ? spell.mechanics.k84 : undefined;

/** Bu savaşta büyü girdap olarak mı yapılır (sürüm 84+, anahtar açık, büyüde girdap bloğu). */
export const whirlpoolCast = (state: Pick<BattleState, 'kuralSurumu' | 'map'>, spell: Pick<Spell, 'mechanics'>): boolean =>
  !!whirlpoolBlock(spell) && girdapOn(state);

/** Slot seviyesinde girdabın yarıçapı (altıgen) ve hasar zarı. */
export function whirlpoolSize(spell: Pick<Spell, 'mechanics' | 'level'>, slotLevel: number): { radius: number; dice: string } {
  const b = whirlpoolBlock(spell);
  const up = Math.max(0, slotLevel - Math.max(spell.level, cfg.tabanSlot));
  const perHex = Math.floor((b?.upcast?.radiusFt ?? 0) / 5);
  const radius = Math.min(cfg.azamiYaricap, cfg.tabanYaricap + up * perHex);
  const base = parseDice(b?.damage ?? '2d8');
  const per = b?.upcast?.dice ? parseDice(b.upcast.dice).count : 0;
  return { radius, dice: formatDice(base.count + up * per, base.sides, base.bonus) };
}

/** Alanın kuralı (alan kaydında `spec`; tetikler, save, çekme bandı). */
export function whirlpoolSpec(spell: Pick<Spell, 'mechanics'>): ZoneSpec {
  const b = whirlpoolBlock(spell);
  return {
    on: ['enter', 'start'], once: true, save: b?.save ?? 'str', damageType: b?.damageType ?? 'bludgeoning', half: true,
    heightFt: cfg.yukseklikFt, whirl: { band: cfg.cekme.bantAltigen, pullFt: cfg.cekme.ft }, color: cfg.renk, icon: cfg.simge,
  };
}

/** Yapım: hedef yaratığın (ya da altıgendeki yaratığın) yerinde girdap alanı. */
export function executeWhirlpool(state: BattleState, actor: Combatant, cmd: CastCommand, spell: Spell): CommandResult {
  if (!state.map || !actor.pos) return fail(`${spell.name} yalnızca haritalı savaşta.`);
  const target = cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (!target?.pos || target.hp <= 0 || target.offFloor) return fail('Girdap bir yaratığın altıgenine açılır: hedef seç.');
  const at = target.pos;
  if (distance(actor.pos, at) * 5 > spell.rangeFt) return fail(`Menzil dışında (en çok ${spell.rangeFt} ft).`);
  const wall = target.id === actor.id ? null : sightBlockedBetween(state, actor.pos, at, { from: actor, to: target });
  if (wall) return fail(`Hedefe açık yol yok (${wall}).`);
  const slot = spendSlot(actor, spell.level, cmd.slotLevel, spell.name, cmd.free);
  if (!slot.ok) return slot;
  const level = slot.slotLevel ?? spell.level;
  const { radius, dice } = whirlpoolSize(spell, level);
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const events: BattleEvent[] = [...slot.events, ...concentrationEvent(state, actor, spell, level, {})];
  events.push({ type: 'spell_cast', actorId: actor.id, targetId: target.id, label: spell.name, slotLevel: slot.slotLevel,
    note: `girdap: yarıçap ${radius * 5} ft, ${dice} ${whirlpoolBlock(spell)?.damageType ?? 'bludgeoning'}` });
  const zone: SpellZone = {
    id: newZoneId(state, spell.id, actor.id), spellId: spell.id, name: `${spell.name} (girdap)`, casterId: actor.id, side: actor.side,
    dc: actor.spellSaveDc ?? 10, slotLevel: level, hexes: withinRange(at, radius, size), center: at, radius, damage: dice,
    spec: whirlpoolSpec(spell), ...(spell.concentration ? { concentration: spell.name } : {}), until: state.round + cfg.sureTur - 1,
  };
  events.push({ type: 'zone_created', zone });
  return finish(state, events);
}

/** Yaratığın gövdesinin girdap merkezine en yakın uzaklığı (altıgen). */
const gapToCenter = (state: BattleState, c: Combatant, center: Offset): number =>
  c.pos ? Math.min(...bodyAt(state, c, c.pos).map((h) => distance(h, center))) : Infinity;

/** Tur başı: alanın dışında, bandın içindeki (yarıçap + band) yaratık merkeze çekilir; ilk uygun girdap. */
export function whirlpoolPullEvents(state: BattleState, c: Combatant, rng: Rng): BattleEvent[] {
  if (!c.pos) return [];
  for (const z of state.map?.zones ?? []) {
    const spec = zoneSpecOf(z);
    if (!spec?.whirl || !z.center || z.radius === undefined || !affects(state, z, spec, c)) continue;
    if (bodyInZone(state, z, c, c.pos) || !altitudeInZone(state, z, spec, c)) continue;
    if (gapToCenter(state, c, z.center) > z.radius + spec.whirl.band) continue;
    return forcedMove(state, c.id, 'pull', spec.whirl.pullFt, z.casterId, rng, { origin: z.center, noCollision: true });
  }
  return [];
}
registerZoneStartPull(whirlpoolPullEvents);

/** Komut sonu: alanı biten ya da alandan çıkan (itilen, ışınlanan) yaratığın yakalanması biter. */
export function whirlpoolCleanupEvents(state: BattleState): BattleEvent[] {
  const out: BattleEvent[] = [];
  for (const c of Object.values(state.combatants)) {
    for (const e of c.effects ?? []) {
      if (!e.id.startsWith('girdap:')) continue;
      const z = (state.map?.zones ?? []).find((x) => whirlEffectId(x) === e.id);
      if (!z || !c.pos || c.hp <= 0 || !bodyInZone(state, z, c, c.pos)) out.push({ type: 'effect_ended', targetId: c.id, effectId: e.id, name: e.name, reason: 'expired' });
    }
  }
  return out;
}
registerCommandEnd((_before, next) => whirlpoolCleanupEvents(next));
