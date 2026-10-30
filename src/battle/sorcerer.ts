/**
 * Sorcerer (Görev SORCERER; SRD 5.2.1, veriden). Kodda sınıf adı yok: kaynaklar (`sorceryPoints`, `innateSorcery`),
 * işaretler (`sorcery-incarnate`, `affinity-<tür>`) ve karakterin Metamagic seçimleri (`Combatant.metamagic`).
 * - Innate Sorcery: bonus eylem, 1 dakika: büyü save DC'si +1, büyü saldırılarında avantaj. Sorcery Incarnate (7):
 *   kullanım kalmadıysa 2 Sorcery Point ile; etkinken bir büyüye iki Metamagic.
 * - Font of Magic: slot → Sorcery Point (eylemsiz; slot seviyesi kadar), Sorcery Point → slot (bonus eylem; 1–5. seviye
 *   bedeli 2/3/5/6/7, en düşük Sorcerer seviyesi 2/3/5/7/9).
 * - Metamagic (seçilen seçenekler): Careful, Distant, Empowered, Extended, Heightened, Quickened, Subtle, Twinned.
 *   `castWithMetamagic` büyüyü ve büyücüyü bu yapım için dönüştürür; etkileri ilgili yollarda (`spells.ts`).
 * Saf.
 */
import { spells, type Spell } from '../data';
import { rollDie, rollTag, type Rng } from '../rules/dice';
import { resourceDef } from '../rules/classFeatures';
import { fail, finish, type CommandResult, type Failure } from './common';
import { resourceLeft, type BattleEvent, type BattleState, type Combatant } from './types';

/** Motorun uyguladığı Metamagic seçenekleri (bedelleri sınıf verisinde: `data/class-features.json` `metamagic.costs`). */
export const METAMAGIC = ['careful', 'distant', 'empowered', 'extended', 'heightened', 'quickened', 'subtle', 'twinned'] as const;
export type MetamagicId = typeof METAMAGIC[number];
export const POINTS = 'sorceryPoints';
const INNATE = 'sorcerer:innate-sorcery';

export const innateActive = (state: BattleState, c: Combatant) => !!c.effects?.some((e) => e.id === INNATE && (e.until === undefined || e.until >= state.round));

/** Bu yapımda en çok kaç Metamagic (Sorcery Incarnate + Innate Sorcery etkin: 2). */
export const metamagicLimit = (state: BattleState, c: Combatant) => (c.traits?.includes('sorcery-incarnate') && innateActive(state, c) ? 2 : 1);

/** Metamagic seçiminin sorunu (null: geçerli). */
export function metamagicProblem(state: BattleState, actor: Combatant, ids: string[] | undefined, spell: Spell): string | null {
  if (!ids?.length) return null;
  const known = actor.metamagic ?? {};
  for (const id of ids) if (known[id] === undefined) return `Bu Metamagic seçeneği bilinmiyor: ${id}.`;
  // Empowered Spell başka bir seçenekle birlikte kullanılabilir (SRD); sınıra sayılmaz.
  const counted = ids.filter((x) => x !== 'empowered');
  if (counted.length > metamagicLimit(state, actor)) return 'Bir büyüye tek Metamagic (Sorcery Incarnate etkinken iki).';
  const cost = ids.reduce((n, x) => n + (known[x] ?? 0), 0);
  if (cost > resourceLeft(actor, POINTS)) return `Sorcery Point yetmiyor (${cost} gerekli).`;
  if (ids.includes('quickened') && spell.castingTime !== 'action') return 'Quickened Spell yalnızca eylemle yapılan büyüde.';
  if (ids.includes('extended') && !(spell.mechanics.effect?.rounds && spell.mechanics.effect.rounds >= 10)) return 'Extended Spell en az 1 dakika süren büyüde.';
  if (ids.includes('twinned') && !(spell.mechanics.upcast?.applied && spell.mechanics.upcast.targets)) return 'Twinned Spell yalnızca yukarı slotta ek hedef alan büyüde.';
  if (ids.includes('heightened') && !spell.mechanics.save) return 'Heightened Spell save isteyen büyüde.';
  if (ids.includes('careful') && !spell.mechanics.save) return 'Careful Spell save isteyen büyüde.';
  if (ids.includes('distant') && spell.rangeFt <= 0) return 'Distant Spell menzili olan büyüde.';
  return null;
}

/**
 * Metamagic ve Innate Sorcery'yi bu yapıma uygular: harcanan Sorcery Point olayı, dönüştürülmüş büyü ve büyücü
 * (geçici işaretler: careful, empowered, heightened, twinned; DC +1 ve büyü saldırısında avantaj).
 */
export function castWithMetamagic(state: BattleState, actor: Combatant, spell: Spell, ids: string[] | undefined):
  { spell: Spell; actor: Combatant; events: BattleEvent[] } | Failure {
  const why = metamagicProblem(state, actor, ids, spell);
  if (why) return fail(why);
  const list = (ids ?? []) as MetamagicId[];
  const cost = list.reduce((n, x) => n + (actor.metamagic?.[x] ?? 0), 0);
  const events: BattleEvent[] = cost > 0 ? [{ type: 'feature_used', actorId: actor.id, feature: POINTS, remaining: resourceLeft(actor, POINTS) - cost }] : [];
  let s = spell;
  // Distant: 5+ ft menzil iki katı, dokunuş (5 ft) 30 ft; kendinden (0) değişmez.
  if (list.includes('distant') && s.rangeFt > 0) s = { ...s, rangeFt: s.rangeFt <= 5 ? 30 : s.rangeFt * 2 };
  if (list.includes('extended') && s.mechanics.effect) s = { ...s, mechanics: { ...s.mechanics, effect: { ...s.mechanics.effect, rounds: Math.min(14400, s.mechanics.effect.rounds * 2) } } };
  if (list.includes('subtle')) s = { ...s, noVerbal: true };
  const marks = list.filter((x) => x === 'careful' || x === 'empowered' || x === 'heightened' || x === 'twinned').map((x) => `mm-${x}`);
  const innate = innateActive(state, actor);
  const a: Combatant = {
    ...actor,
    ...(marks.length ? { traits: [...(actor.traits ?? []), ...marks] } : {}),
    ...(innate && actor.spellSaveDc !== null ? { spellSaveDc: (actor.spellSaveDc ?? 0) + 1 } : {}),
  };
  return { spell: s, actor: a, events };
}

/** Empowered Spell: hasar zarlarından ortalamanın altındaki en düşük CHA değiştiricisi kadarı (en az 1) yeniden atılır. */
export function empowerRolls(actor: Combatant, rolls: number[], sides: number, rng: Rng): number[] {
  if (!actor.traits?.includes('mm-empowered')) return rolls;
  const n = Math.max(1, actor.modifiers.cha);
  const order = rolls.map((v, i) => ({ v, i })).filter((x) => x.v < (sides + 1) / 2).sort((a, b) => a.v - b.v).slice(0, n);
  const out = [...rolls];
  for (const { i } of order) out[i] = rollDie(sides, rollTag(rng, { kind: 'damage', by: actor.id }));
  return out;
}

/** Font of Magic: `font_of_magic` komutu. `toPoints`: slot → puan (eylemsiz); `toSlot`: puan → slot (bonus eylem). */
export function executeFontOfMagic(state: BattleState, actor: Combatant, mode: 'toPoints' | 'toSlot', level: number): CommandResult {
  if (actor.resources[POINTS] === undefined) return fail('Font of Magic yok.');
  const max = actor.resourceCap?.[POINTS] ?? Infinity;
  if (mode === 'toPoints') {
    const left = actor.spellSlots[level - 1] ?? 0;
    if (left <= 0) return fail(`${level}. seviye slot yok.`);
    const points = Math.min(max, resourceLeft(actor, POINTS) + level);
    return finish(state, [{ type: 'slot_spent', actorId: actor.id, level, remaining: left - 1 },
      { type: 'feature_used', actorId: actor.id, feature: POINTS, remaining: points }]);
  }
  // Slot yaratma tablosu kaynağın verisinde (SRD 5.2.1 Creating Spell Slots): seviye → [bedel, en düşük seviye].
  const row = resourceDef(POINTS)?.slotCost?.[String(level)];
  if (!row) return fail('En çok 5. seviye slot yaratılır.');
  if (actor.level < row[1]) return fail(`${level}. seviye slot için Sorcerer seviyesi en az ${row[1]}.`);
  if (resourceLeft(actor, POINTS) < row[0]) return fail(`${row[0]} Sorcery Point gerekli.`);
  return finish(state, [{ type: 'feature_used', actorId: actor.id, feature: POINTS, remaining: resourceLeft(actor, POINTS) - row[0] },
    { type: 'slot_created', actorId: actor.id, level }]);
}

/** Innate Sorcery etkisi (use_feature): kullanım ya da Sorcery Incarnate ile 2 puan. */
export function innateSorceryEvents(state: BattleState, actor: Combatant, key: string, name: string, resource: string | undefined, rounds: number): BattleEvent[] | string {
  if (innateActive(state, actor)) return `${name} zaten etkin.`;
  const left = resource ? resourceLeft(actor, resource) : 1;
  const pay: BattleEvent | null = left > 0 && resource ? { type: 'feature_used', actorId: actor.id, feature: resource, remaining: left - 1 }
    : actor.traits?.includes('sorcery-incarnate') && resourceLeft(actor, POINTS) >= 2 ? { type: 'feature_used', actorId: actor.id, feature: POINTS, remaining: resourceLeft(actor, POINTS) - 2 }
      : null;
  if (!pay) return `${name}: kullanım kalmadı.`;
  return [pay, { type: 'effect_added', targetId: actor.id, effect: { id: key, name, sourceId: actor.id, until: state.round + rounds - 1, icon: '✺' } }];
}

/** Elemental Affinity: büyünün hasar türü soyun türüyse CHA (bir kez). */
export const affinityBonus = (actor: Combatant, type: string | undefined) =>
  type && actor.traits?.includes(`affinity-${type}`) ? Math.max(0, actor.modifiers.cha) : 0;

export const spellByName = (name: string) => spells.find((s) => s.name === name);
