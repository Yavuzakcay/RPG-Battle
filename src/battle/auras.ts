/**
 * Kuyruk 18 H3: Paladin Aura of Protection'ın dostlara uzanması (SRD 5.2.1). Paladin ve 10 ft (18. seviyede Aura
 * Expansion: 30 ft) içindeki dostları save'lerine Paladin'in CHA değiştiricisini (en az +1) ekler; Paladin Incapacitated
 * iken aura etkisiz. Birden çok Paladin'de yalnızca en büyüğü. Paladin'in kendi bonusu sheet'ten (Kuyruk 39, `saves`
 * içinde); burada yalnızca fark yazılır. Tek yer: reducer sonrası `syncAuras` her savaşçıya `auraSave` yazar,
 * `saveDice` (bütün save'lerin ortak eklentisi) sabit eklenti olarak okur. Game Master anahtarı `auraOfProtection`
 * (global, kural sürümü 14); kapalıyken yalnızca Paladin'in kendi bonusu.
 */
import { inWater } from './underwaterCore';
import { k73cOn } from './k73cSurum';
import { anyPaketSans, paketSansOf } from './paket/sans';
import { groundWardSave } from './groundWard';
import { anyBirlik, shoulderOf } from './imzaBirlik';
import { auraCoreOn, passiveAuraOf } from './auraCore';
import { imzaAuraBonus } from './imzaCore';
import { isIncapacitated } from '../rules/conditions';
import { auraDist, gap64, rangeGap } from './adjacency';
import { gap } from './body';
import { globalRule } from './ruleControl';
import { b94On } from './b94Surum';
import { sourceDown } from './sourceDown';
import { ruleVersion } from './ruleVersion';
import { matrisOn } from './matrisSurum';
import { genel96On } from './genel96Surum';
import { silencedAt, zoneSpecOf } from './zones';
import { fateHolder, shadowyFormResist } from './boons';
import type { BattleState, Combatant } from './types';

const TRAIT = 'aura-of-protection';
/** Kuyruk 19 (11–20): durum bilmeyen yollarda `featuresK19` gereken işaretler (savaşçıda `k19Traits`). */
const K19_SYNC = ['peerless-skill', 'improved-primal-strike', 'improved-blessed-strikes', 'arcane-apotheosis', 'peerless-aim', 'boon-truesight', 'overcome-defenses'];
const radiusOf = (p: Combatant): number => ((p.level ?? 0) >= 18 ? 6 : 2);
const bonusOf = (p: Combatant): number => Math.max(1, p.modifiers.cha);

/**
 * Görev B94 (A2, sürüm 94+): Paladin'in kendi aurası (save'lere yazılmadıysa, `auraOwnLive`): Incapacitated/0 HP iken 0
 * (`sourceDown`). Sürüm < 94'te işaretli savaşçıda eski davranış (her zaman).
 */
export function ownAuraOf(state: BattleState, c: Combatant): number {
  if (!c.auraOwnLive || !c.traits?.includes(TRAIT)) return 0;
  return b94On(state) && sourceDown(c) ? 0 : bonusOf(c);
}

/** Savaşçının bu durumdaki aura bonusu (kendi bonusu sheet'te sayılan Paladin için yalnızca fazlası). */
export function auraSaveOf(state: BattleState, c: Combatant): number {
  // Görev B94: kendi bonusu save'lerde yazılı değilse burada (dostların aurasıyla en büyüğü).
  if (c.auraOwnLive) return Math.max(ownAuraOf(state, c), othersAura(state, c));
  if (c.hp <= 0 || !c.pos) return 0;
  const own = c.traits?.includes(TRAIT) ? bonusOf(c) : 0;
  return Math.max(0, othersAura(state, c) - own);
}

/** Başka Paladin'lerin aurasından gelen en büyük bonus. */
function othersAura(state: BattleState, c: Combatant): number {
  if (c.hp <= 0 || !c.pos) return 0;
  let best = 0;
  for (const p of Object.values(state.combatants)) {
    if (p.id === c.id || p.side !== c.side || p.hp <= 0 || !p.pos || !p.traits?.includes(TRAIT) || isIncapacitated(p.conditions)) continue;
    // Kuyruk K73b (sürüm 63+): 3B uzaklık, döşeme keser.
    if (auraDist(state, p, c) > radiusOf(p)) continue;
    best = Math.max(best, bonusOf(p));
  }
  return best;
}

/**
 * Kuyruk 18 H3: Countercharm (Bard 7): 30 ft içindeki (kendisi dahil) Bard; tepkisi hazır, Incapacitated değil.
 * Anahtar `countercharm` (global, kural sürümü 14).
 */
export function countercharmOf(state: BattleState, c: Combatant): string | undefined {
  if (c.hp <= 0 || !c.pos) return undefined;
  return Object.values(state.combatants).find((b) => b.side === c.side && b.hp > 0 && !!b.pos && b.traits?.includes('countercharm')
    && !b.economy.reaction && !isIncapacitated(b.conditions) && (b.id === c.id || rangeGap(state, b, c) <= 6))?.id;
}

/** Kuyruk 19: Aura of Life: taşıyan ve menzilindeki dostlar için dirençler. */
export function auraResistOf(state: BattleState, c: Combatant): string[] {
  if (!c.pos) return [];
  const out = new Set<string>();
  for (const p of Object.values(state.combatants)) {
    if (p.side !== c.side || p.hp <= 0 || !p.pos) continue;
    for (const e of p.effects ?? []) if (e.auraLife && auraDist(state, p, c) * 5 <= e.auraLife.radiusFt) for (const r of e.auraLife.resist) out.add(r);
  }
  // Kuyruk K73c (sürüm 64+, SRD Underwater Combat): su altındaki (derin suda, uçmayan) her şey ateşe dirençli.
  if (k73cOn(state) && inWater(state, c)) out.add('fire');
  // Kuyruk 19 (Epic Boon): Night Spirit / Shadowy Form: loş ışıkta ya da karanlıkta Psychic ve Radiant dışı direnç.
  for (const r of shadowyFormResist(state, c)) out.add(r);
  // Kuyruk 19 (11–20): Nature's Sanctuary: alandaki dostlara Nature's Ward direnci.
  for (const z of state.map?.zones ?? []) {
    if (z.side === c.side && z.spec?.resist?.length && z.hexes.some((h) => h.col === c.pos?.col && h.row === c.pos?.row)) for (const r of z.spec.resist) out.add(r);
  }
  return [...out].sort();
}

/** Kuyruk 19 (srdK19): 30 ft içindeki (kendisi dahil) tepkisi ve havuzu duran Burst of Ingenuity sahibi. */
export function burstOf(state: BattleState, c: Combatant): Combatant['burstBy'] {
  if (c.hp <= 0 || !c.pos) return undefined;
  for (const b of Object.values(state.combatants)) {
    if (b.side !== c.side || b.hp <= 0 || !b.pos || b.economy.reaction || isIncapacitated(b.conditions)) continue;
    const spec = b.reactions?.find((r) => r.kind === 'burst');
    if (!spec?.pool) continue;
    const left = b.reactionUses?.[spec.pool] ?? spec.uses ?? 0;
    if (left <= 0 || (b.id !== c.id && gap64(state, b, c) * 5 > (spec.rangeFt ?? 30))) continue;
    return { id: b.id, pool: { id: spec.pool, remaining: left - 1 } };
  }
  return undefined;
}

/**
 * Mekanik matris B13 (sürüm 83+): Holy Aura (SRD 5.2.1: "you emit an aura in a 30-foot Emanation. While in the aura,
 * creatures of your choice have Advantage on all saving throws, and other creatures have Disadvantage on attack rolls
 * against them"). "Seçtiğin yaratıklar" = büyücünün dostları (kendisi dahil); yayılım büyücüyle yürür, çıkan yararını
 * yitirir. Birden çok yayılımda en yüksek DC'li (yararlar aynı).
 */
export function allyAuraOf(state: BattleState, c: Combatant): Combatant['allyAura'] {
  if (!c.pos) return undefined;
  let best: Combatant['allyAura'];
  for (const p of Object.values(state.combatants)) {
    if (p.side !== c.side || !p.pos || p.hp <= 0) continue;
    for (const e of p.effects ?? []) {
      const a = e.allyAura;
      if (!a || (p.id !== c.id && auraDist(state, p, c) * 5 > a.radiusFt)) continue;
      if (best && (best.blindRetort?.dc ?? 0) >= (a.blindRetort?.dc ?? 0)) continue;
      best = { by: p.id, srd: e.id, name: e.name, ...(a.saveAdvAll ? { saveAdvAll: true as const } : {}), ...(a.attackedDis ? { attackedDis: true as const } : {}),
        ...(a.blindRetort ? { blindRetort: a.blindRetort } : {}) };
    }
  }
  return best;
}

export function syncAuras(state: BattleState): BattleState {
  const on = !!globalRule(state, 'auraOfProtection');
  const charmOn = !!globalRule(state, 'countercharm');
  // Kuyruk 19 (karar 1): özellik işaretli savaşçıda Bardic Inspiration zarı ikinci şans listesinden düşmesin (kural sürümü 16).
  const inspireOn = !!globalRule(state, 'bardicInspirationFix');
  // Kuyruk K48 (sürüm 19): ilk ikinci şans tutmazsa ilham zarı da denenir (zincir).
  const chainOn = !!globalRule(state, 'bardicInspirationChain');
  // Kuyruk 19 (11–20): devlet bilmeyen zar yollarında (ikinci şans) `featuresK19` anahtarı savaşçıda işaret olarak.
  const k19On = !!globalRule(state, 'featuresK19');
  const anyLife = Object.values(state.combatants).some((c) => c.effects?.some((e) => e.auraLife) || c.traits?.includes('night-spirit')) || !!state.map?.zones?.some((z) => z.spec?.resist?.length)
    // Kuyruk K73c (sürüm 64+): su altındaki ateş direnci.
    || (k73cOn(state) && !!state.map && Object.values(state.combatants).some((c) => inWater(state, c)));
  const anyFate = k19On && Object.values(state.combatants).some((c) => c.traits?.includes('improve-fate'));
  const anyBurst = !!globalRule(state, 'srdK19') && Object.values(state.combatants).some((c) => c.reactions?.some((r) => r.kind === 'burst'));
  let next = state;
  // Kuyruk K50: Taht Varlığı (İmparator) aurası; imza savaşçısı yoksa hesap yok.
  const anyImza = Object.values(state.combatants).some((c) => c.imza);
  const anyWard = !!state.map?.zones?.some((z) => z.groundWard?.saveBonus);
  const anyUnion = anyBirlik(state);
  // Kuyruk K53 S5: veriden pasif auralar (save bonusu en güçlüsü, bağışıklık, can yenileyemez, ölüm save dezavantajı).
  const anyCore = auraCoreOn(state) && Object.values(state.combatants).some((c) => c.effects?.some((e) => e.aura?.trigger === 'passive' || e.auras?.some((a) => a.trigger === 'passive')));
  // Görev P6: ek paket zar mührü / zorla sonuç menzili.
  const anyPk = anyPaketSans(state);
  // Kuyruk A6 (sürüm 35): Silence içindeki yaratık Deafened sayılır, sözlü tepki büyüsü yapamaz (`silenced`).
  const anyPack = Object.values(state.combatants).some((p) => p.summon?.withOwner && !p.summon.gone);
  const anySilence = ruleVersion(state) >= 35 && !!state.map?.zones?.some((z) => zoneSpecOf(z)?.silence);
  // Mekanik matris (sürüm 83+): durum bilmeyen save yolları için sürüm işareti (Restrained DEX dezavantajı, B01).
  const m83 = matrisOn(state);
  // GENEL96 (sürüm 96+): durum bilmeyen hasar profili yolu için sürüm işareti (direnç/zayıflık sırası, Petrified direnci).
  const g96 = genel96On(state);
  // Mekanik matris B13 (sürüm 83+): Holy Aura dost yayılımı.
  const anyAllyAura = m83 && Object.values(state.combatants).some((c) => c.effects?.some((e) => e.allyAura));
  for (const c of Object.values(state.combatants)) {
    const aa = anyAllyAura ? allyAuraOf(state, c) : undefined;
    const pkSans = anyPk ? paketSansOf(state, c) : [];
    const hush = anySilence && !!c.pos && !!silencedAt(state, c.pos);
    const pack = anyPack && Object.values(state.combatants).some((p) => p.summon?.withOwner && p.summon.by === c.id && !p.summon.gone && p.hp > 0 && gap(state, p, c) <= 1);
    const core = anyCore ? passiveAuraOf(state, c) : null;
    // Görev B94: save'lere yazılmamış kendi aurası anahtar kapalıyken de (eskiden sheet'te; kapalıyken yalnız kendi bonusu).
    const mine = ownAuraOf(state, c);
    const want = mine > 0 ? mine + Math.max(on ? auraSaveOf(state, c) - mine : 0, core?.saveBonus ?? 0) : Math.max(on ? auraSaveOf(state, c) : 0, core?.saveBonus ?? 0);
    const throne = anyImza ? imzaAuraBonus(state, c, 'wis') : 0;
    // Kuyruk K54b: Mevzi İşareti altıgeninde kurtulma bonusu.
    const ward = anyWard ? groundWardSave(state, c) : 0;
    // Kuyruk K54b: Omuz Ver (Birlik Manastırı).
    const shoulder = anyUnion ? shoulderOf(state, c) : undefined;
    const by = charmOn ? countercharmOf(state, c) : undefined;
    const fix = inspireOn && !!c.traits?.length && (c.effects ?? []).some((e) => e.inspire);
    const chain = chainOn && (c.effects ?? []).some((e) => e.inspire);
    const life = [...new Set([...(anyLife ? auraResistOf(state, c) : []), ...(core?.resist ?? [])])];
    const sdis = !!core?.saveDis;
    const k19 = k19On && !!c.traits?.some((x) => K19_SYNC.includes(x));
    const fateBy = anyFate ? fateHolder(state, c, true) : undefined;
    const fateFoe = anyFate ? fateHolder(state, c, false) : undefined;
    const burst = anyBurst ? burstOf(state, c) : undefined;
    if (JSON.stringify(c.burstBy) === JSON.stringify(burst) && (c.auraSave ?? 0) === want && c.countercharmBy === by && !!c.inspireFix === fix && !!c.inspireChain === chain && (c.auraResist ?? []).join() === life.join() && !!c.k19Traits === k19
      && c.fateBy === fateBy && c.fateFoe === fateFoe && (c.imzaWisSave ?? 0) === throne && (c.wardSave ?? 0) === ward && JSON.stringify(c.shoulderBy) === JSON.stringify(shoulder)
      && (c.auraImmune ?? []).join() === (core?.immune ?? []).join() && !!c.auraNoHeal === !!core?.noHeal && !!c.auraDeathDis === !!core?.deathDis && !!c.auraDeathAdv === !!core?.deathAdv
      && JSON.stringify(c.pkSans ?? []) === JSON.stringify(pkSans) && !!c.auraSaveDis === sdis && !!c.silenced === hush && !!c.packStrAdv === pack && !!c.srd83 === m83 && !!c.srd96 === g96
      && JSON.stringify(c.allyAura) === JSON.stringify(aa)) continue;
    const { auraSave: _a, countercharmBy: _b, inspireFix: _c, inspireChain: _i, auraResist: _d, k19Traits: _e, fateBy: _f, fateFoe: _g, burstBy: _h, imzaWisSave: _j, auraImmune: _k, auraNoHeal: _l, auraDeathDis: _m, auraDeathAdv: _n, wardSave: _w, shoulderBy: _s, pkSans: _pk, auraSaveDis: _sd, silenced: _hu, packStrAdv: _pa, srd83: _m83, srd96: _g96, allyAura: _aa, ...rest } = next.combatants[c.id] as Combatant;
    next = { ...next, combatants: { ...next.combatants, [c.id]: { ...rest, ...(m83 ? { srd83: true } : {}), ...(g96 ? { srd96: true } : {}), ...(aa ? { allyAura: aa } : {}), ...(want > 0 ? { auraSave: want } : {}), ...(by ? { countercharmBy: by } : {}),
      ...(fix ? { inspireFix: true } : {}), ...(chain ? { inspireChain: true } : {}), ...(life.length ? { auraResist: life } : {}), ...(k19 ? { k19Traits: true } : {}),
      ...(fateBy ? { fateBy } : {}), ...(fateFoe ? { fateFoe } : {}), ...(burst ? { burstBy: burst } : {}), ...(throne > 0 ? { imzaWisSave: throne } : {}), ...(ward > 0 ? { wardSave: ward } : {}), ...(shoulder ? { shoulderBy: shoulder } : {}), ...(pkSans.length ? { pkSans } : {}),
      ...(core?.immune.length ? { auraImmune: core.immune } : {}), ...(sdis ? { auraSaveDis: true } : {}), ...(hush ? { silenced: true } : {}), ...(pack ? { packStrAdv: true } : {}), ...(core?.noHeal ? { auraNoHeal: true } : {}), ...(core?.deathDis ? { auraDeathDis: true } : {}), ...(core?.deathAdv ? { auraDeathAdv: true } : {}) } as Combatant } };
  }
  return next;
}
