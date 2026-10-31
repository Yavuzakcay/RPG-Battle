/**
 * Savaş yapay zekâsı (Adım 9; Adım 11'de partiye genişletildi). Sırası gelen savaşçı için bir
 * sonraki komutu seçer; tur, `end_turn` dönene kadar adım adım oynanır (her komuttan sonra
 * durum yeniden okunur). Kurallar kopyalanmaz: bir komutun yapılıp yapılamayacağı ve neyi
 * etkileyeceği motorda zarsız denenerek bulunur.
 *
 * Haritalı savaşta: (1) batağa saplandıysa Çık; yakalandıysa kaçmayı dener, yerdeyse kalkar; (2) bulunduğu yerden yapabileceği en iyi
 * eylemi yapar; (3) yapamıyorsa yapabileceği en ucuz ve en güvenli altıgene yürür; (4) o da
 * yoksa en yakın hedefe yaklaşır; (5) turu bitirir. Lavdan, lav kenarından, alevden, bataktan,
 * buzdan, bilinen tuzaktan ve lav uyarısı olan altıgenlerden kaçınır.
 *
 * Düşmanlar: yenilenen save saldırısı > Multiattack > ilk uygun saldırı; hedef en yakın, eşitse
 * HP oranı düşük. Parti: ölmekte olan müttefiki iyileştirme > en az iki düşmanı vuran ve hiç
 * müttefik vurmayan alan büyüsü > en yüksek ortalama hasarlı saldırı (slotlu büyü yalnızca
 * hedefin HP'si yüksekse). Masumlar hiçbir şey yapmaz.
 *
 * Sınıf özellikleri (bonus eylem önce): yaralıyken (HP yarı veya altı) Second Wind; saldırıdan
 * önce Hunter's Mark, işaretli hedef düşünce işareti taşıma; Spiritual Weapon'ı sonraki turlarda
 * sürdürme. Eylemini saldırıyla harcayıp hâlâ vurabileceği hedef varsa Action Surge. Haydut
 * Sneak Attack koşulunun (avantaj ya da hedefin yanında müttefik) tuttuğu hedefi ve yeri yeğler;
 * fırsat saldırısı yiyecek yürüyüşten önce bonus eylemle ayrılır (Cunning Action). Konsantre
 * olan büyücü yeni bir konsantrasyon büyüsü yapmaz.
 */
import { isIncapacitated } from '../rules/conditions';
import { adjustDamage } from '../rules/damage';
import { monsters, spells } from '../data';
import { availableForms } from './druid';
import { costsFrom, distance, hexKey, neighbors, type Offset } from '../rules/hex';
import { execute } from './commands';
import { canSneak, spellOf } from './features';
import { standUpProblem } from './grapple';
import { pushOutcome, shoveDc, shoveHex, sizeRank } from './forced';
import { cunningOptions, hasTrait } from './classTraits';
import { jumpTargets, lavaOver } from './jumprisk';
import { sleepingDragon, turnKey, wakeRule, wakesDragon } from './dragon';
import { currentActorId, isTargetable } from './common';
import { canSee, isRiskyHex, ruleOf, stuckInBog } from './maprules';
import { masteryMechanic } from '../rules/mastery';
import { heightOf } from './cover';
import { rageProblem, recklessProblem } from './rage';
import { activeBuffs } from './divine';
import { offhandProblem } from './offhand';
import { islandJumpProblem, moveCostFn, occupantAt, speedHexes, terrainAt } from './movement';
import { freeCast } from './economy';
import { bestAim } from './areaAttack';
import { objectAttackCommand, objectRisk } from './objects';
import { goalStatus } from './goals';
import { STEAM_PENALTY, isWater, surfaceRisk, surfacesReact } from './surfaces';
import { resourceLeft, type BattleState, type Combatant, type Command, type CommandContext, type CunningOption } from './types';
import { isAirborne } from './flight';
import { teleportHexes } from './teleport';
import { steerableSummon, steerHexes } from './summons';

const noRoll = () => 0.5;
const ctxOf = (c: Combatant): CommandContext =>
  c.side === 'enemies' || c.civilian ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
const tryCmd = (state: BattleState, actor: Combatant, cmd: Command) => execute(state, cmd, ctxOf(actor), noRoll);
/** CILA: komut yapılabilir ve boşa gitmez (rüzgâr duvarından geçen menzilli saldırı otomatik ıskalar). */
const worthIt = (state: BattleState, actor: Combatant, cmd: Command): boolean => {
  const r = tryCmd(state, actor, cmd);
  return r.ok && !r.events.some((e) => e.type === 'attack_resolved' && !!e.autoMiss);
};

/** Zar ifadesinin ortalaması ("2d6+3" → 10). */
function avg(dice: string | undefined): number {
  if (!dice) return 0;
  if (/^-?\d+$/.test(dice.replace(/\s/g, ''))) return Number(dice.replace(/\s/g, '')); // sabit hasar (Görev F)
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(dice.replace(/\s/g, ''));
  if (!m) return 0;
  return Number(m[1]) * (Number(m[2]) + 1) / 2 + Number(m[3] ?? 0);
}

/** Saldırılabilir karşı taraf: ayakta, gizlenmemiş, görülen. */
function foesOf(state: BattleState, actor: Combatant): Combatant[] {
  const other = actor.side === 'enemies' ? 'party' : 'enemies';
  return Object.values(state.combatants).filter(
    (c) => c.side === other && c.hp > 0 && isTargetable(c) && !c.hidden && !c.asleep && canSee(state, actor, c) && !(c.summon?.intangible && !c.summon.gone),
  );
}

function byPriority(actor: Combatant, foes: Combatant[], state?: BattleState): Combatant[] {
  const d = (c: Combatant) => (actor.pos && c.pos ? distance(actor.pos, c.pos) : 0);
  // Yakalayan önce yakaladığına vurur (kaçmasın; Restrained ise avantajlı).
  const held = (c: Combatant) => (c.grapple?.by === actor.id ? 0 : 1);
  // Vex işaretli hedef (bir sonraki saldırı avantajlı) öne geçer.
  const vexed = (c: Combatant) => (actor.marks?.some((m) => m.kind === 'vex' && m.targetId === c.id) ? 0 : 1);
  // Çağrılmış yaratık (Görev R3) sahibini korur: sahibine bitişik düşman öne geçer.
  const owner = actor.summon ? state?.combatants[actor.summon.by] : undefined;
  const guard = (c: Combatant) => (owner?.pos && c.pos && distance(owner.pos, c.pos) <= 1 ? 0 : 1);
  return [...foes].sort((a, b) => held(a) - held(b) || vexed(a) - vexed(b) || guard(a) - guard(b) || d(a) - d(b) || a.hp / a.maxHp - b.hp / b.maxHp);
}

/** Düşmanın saldırı komutları, öncelik sırasıyla. */
function monsterCommands(actor: Combatant, targetId: string, mapped = false): Command[] {
  const ready = actor.attacks
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => a.damageDice !== undefined && !(a.recharge !== undefined && actor.rechargeUsed.includes(i)))
    // Haritalı savaşta alanlı saldırı (nefes, koni, çizgi) hedef altıgeniyle ayrıca seçilir (`areaAttack`; Görev R4).
    .filter(({ a }) => !(mapped && a.area));
  const breath = ready.filter(({ a }) => a.recharge !== undefined && a.save !== undefined);
  const rest = ready.filter(({ a }) => !(a.recharge !== undefined && a.save !== undefined));
  return [
    ...breath.map(({ i }) => ({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i }) as Command),
    ...(actor.multiattack ? [{ type: 'multiattack', actorId: actor.id, targetId } as Command] : []),
    ...rest.map(({ i }) => ({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i }) as Command),
  ];
}

/**
 * Bilinen ve slotu olan büyüler; konsantre olan yeni konsantrasyon büyüsü yapmaz. Yapay zekâ slot seviyesi
 * yazmaz: büyü en düşük uygun slotla (Favored Enemy'de slotsuz) atılır (Görev N).
 */
function castable(actor: Combatant) {
  // Görev K9d: eğitimsiz zırh büyüyü engeller.
  if (actor.effects?.some((e) => e.noCast)) return [];
  return actor.spellNames
    .map((n) => spells.find((s) => s.name === n))
    .filter((s): s is NonNullable<typeof s> => s !== undefined)
    .filter((s) => !(s.concentration && actor.concentration))
    // Tepki büyüleri (Shield, Counterspell, Hellish Rebuke, Feather Fall) tetikle yapılır (Görev R1).
    .filter((s) => s.castingTime !== 'reaction')
    // Çağırma büyülerini yapay zekâ yapmaz (Görev R3: çağrılan birimi yalnızca oynatır); ritüel savaşta yapılmaz.
    .filter((s) => s.mechanics.kind !== 'summon' && s.castingTime !== 'ritual')
    .filter((s) => s.level === 0 || actor.spellSlots.slice(s.level - 1).some((n) => n > 0)
      || freeCast(actor, s.name));
}

/** Sneak Attack'ın tutacağı saldırıysa ortalama ek hasar. */
function sneakBonus(state: BattleState, actor: Combatant, cmd: Command): number {
  if (actor.sneakAttackDice === 0 || cmd.type !== 'attack') return 0;
  const target = state.combatants[cmd.targetId];
  const r = tryCmd(state, actor, cmd);
  const ev = r.ok ? r.events.find((e) => e.type === 'attack_resolved') : undefined;
  if (!target || ev?.type !== 'attack_resolved') return 0;
  return canSneak(state, actor, target, cmd.option, ev.mode) ? actor.sneakAttackDice * 3.5 : 0;
}

/** Partinin bir hedefe karşı seçenekleri ve ortalama hasar tahmini (yüksekten düşüğe). */
function partyOptions(actor: Combatant, target: Combatant, state?: BattleState): Array<{ cmd: Command; score: number }> {
  const out: Array<{ cmd: Command; score: number }> = [];
  for (const o of actor.weaponOptions) {
    // Silah ustalığı: ortalama hasara verideki öncelik puanı eklenir (data/class-features.json "masteries" ai).
    const mastery = o.mastery ? masteryMechanic(o.mastery)?.ai ?? 0 : 0;
    // Yan el: bu saldırı Light ek saldırısını açıyorsa (yan el silahından farklı Light silah) onun ortalama hasarı da sayılır.
    const off = actor.offHandOption;
    const opens = !!off && !!o.light && o.weaponId !== off.weaponId && !actor.economy.offhandUsed && (!!actor.nickOffhand || !actor.economy.bonus);
    // K13: Attack eylemi pact silahıyla başlarsa Thirsting Blade'in ek saldırıları da gelir.
    const pactExtra = o.pact && actor.economy.attacksLeft <= 0 ? Math.max(0, (actor.pactAttacks ?? 0) - actor.attacksPerAction) * avg(o.damage) : 0;
    out.push({ cmd: { type: 'attack', actorId: actor.id, targetId: target.id, option: o }, score: avg(o.damage) + mastery + pactExtra + (opens && off ? avg(off.damage) : 0) });
  }
  for (const s of castable(actor)) {
    const m = s.mechanics;
    if (s.area || !m.damage || (m.kind !== 'attack' && m.kind !== 'auto' && m.kind !== 'save')) continue;
    if (s.level > 0 && target.hp < 12) continue; // slotu küçük hedefe harcama
    // Eldritch Blast'in ışınları seviyeyle; Agonizing Blast (Görev WARLOCK) her ışına büyü yeteneği.
    const rays = m.raysByLevel ? 1 + (actor.level >= 5 ? 1 : 0) + (actor.level >= 11 ? 1 : 0) + (actor.level >= 17 ? 1 : 0) : (m as { rays?: number }).rays ?? 1;
    const scale = m.scalesWithLevel && actor.level >= 5 ? 2 : 1;
    const agon = actor.cantripMods?.[s.name]?.ability ? Math.max(0, actor.spellMod) : 0;
    // Görev SORCERER: seçilebilen hasar türünde hedefe en çok işleyeni (eşitse verideki tür).
    const choice = m.damageChoices ? bestChoice(m.damageChoices, m.damageType, target) : undefined;
    const base = (avg(m.damage) + agon) * rays * scale + s.level;
    // Görev K13B: suda duran hedefe ateş buhar bırakır (1 tur yoğun örtü: hedef görülmez, dostların saldırıları
    // dezavantajlı); hedefi öldürmeyecekse puan yarıya iner (yine de en iyi seçenekse atılır).
    const fire = (choice ?? m.damageType) === 'fire';
    const steam = !!state && fire && !!target.pos && surfacesReact(state) && isWater(state, target.pos) && avg(m.damage) * rays * scale < target.hp;
    out.push({ cmd: { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetId: target.id, ...(choice ? { choice } : {}) },
      score: steam ? base * STEAM_PENALTY : base });
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * Alan büyüsü: en az iki düşman, hiç müttefik vurmuyorsa (motorda denenerek). Haritasız savaşta
 * yalnızca yayılım (Spirit Guardians: büyücüyle aynı yükseklikteki düşmanlar).
 */
function areaSpell(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  const usable = castable(actor).filter((x) => x.area && x.mechanics.damage && (state.map || x.mechanics.lingering === 'aura'));
  for (const s of usable.sort((a, b) => b.level - a.level)) {
    // Yaratıktan çıkan koni ve çizgi (Görev R4): en çok düşmanı kapsayan, dost vurmayan yön. Noktadan çıkan alan
    // (Fireball, Acid Splash) eskisi gibi aşağıda düşmanların altıgenine (akıllı nokta araması kapalı; DECISIONS.md).
    if (state.map && s.area && s.area.origin === 'self' && s.area.shape !== 'emanation') {
      const visible = new Set(foes.map((f) => f.id));
      const best = bestAim(state, actor, s.area, s.rangeFt, (c) => visible.has(c.id));
      if (!best?.aim || best.allies > 0 || best.foes < 2) continue;
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: best.aim };
      if (tryCmd(state, actor, cmd).ok) return cmd;
      continue;
    }
    for (const f of state.map ? foes : foes.slice(0, 1)) {
      const cmd: Command = state.map
        ? { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: f.pos as Offset }
        : { type: 'cast_spell', actorId: actor.id, spellName: s.name };
      const r = tryCmd(state, actor, cmd);
      if (!r.ok) continue;
      const hit = r.events.filter((e) => e.type === 'save_resolved').map((e) => (e.type === 'save_resolved' ? e.targetId : ''));
      const sides = hit.map((id) => state.combatants[id]?.side);
      // Görev K13B: alan buhar bırakacaksa (suda ateş) en az üç düşman gerekir (buhar dostların görüşünü de keser).
      const steams = r.events.some((e) => e.type === 'surface_reacted' && e.reaction === 'steam');
      if (sides.filter((x) => x === 'enemies').length >= (steams ? 3 : 2) && !sides.includes('party')) return cmd;
    }
  }
  return null;
}

/**
 * Görev BARD (basit kural): hasarsız alan kontrol büyüsü (Hypnotic Pattern, Fear: başarısız save'de durum): konsantre
 * değilken, alanda en az üç düşman ve hiç dost yoksa; düşmanların altıgenlerine nişan.
 */
function controlArea(state: BattleState, actor: Combatant): Command | null {
  if (actor.concentration || !state.map) return null;
  // DENGE-4: en yüksek seviyeli kontrol büyüsü önce (Hypnotic Pattern, Faerie Fire'dan önce); listedeki ilk büyü değil.
  const list = castable(actor).filter((s) => s.area && !s.mechanics.damage && !!s.mechanics.failEffect && s.area.origin !== 'self')
    .sort((a, b) => b.level - a.level);
  for (const spell of list) {
    for (const f of foesOf(state, actor)) {
      if (!f.pos) continue;
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex: f.pos };
      const r = tryCmd(state, actor, cmd);
      if (!r.ok) continue;
      const ids = r.events.filter((e) => e.type === 'save_resolved').map((e) => (e.type === 'save_resolved' ? e.targetId : ''));
      const sides = ids.map((id) => state.combatants[id]?.side);
      if (sides.filter((x) => x !== actor.side).length >= 3 && !sides.includes(actor.side)) return cmd;
    }
  }
  return null;
}

/**
 * CILA (basit kural): kalıcı zemin büyüsü (Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud): alanda
 * en az iki düşman, hiç dost yoksa (büyücü `notCaster` ya da yalnızca düşmanlara işleyen alanda sayılmaz); düşmanların
 * altıgenlerine nişan, en çok düşman kapsayan. Görüş/örtü alanları (Fog Cloud, Darkness, Silence) ve duvar yapılmaz.
 */
function zoneSpell(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  if (!state.map) return null;
  const usable = castable(actor).filter((x) => x.area && x.mechanics.zone && x.mechanics.kind !== 'summon' && !x.mechanics.zone.windWall
    && (x.mechanics.zone.save || x.mechanics.zone.damage));
  let best: { cmd: Command; foes: number } | null = null;
  for (const s of usable) {
    const z = s.mechanics.zone;
    for (const f of foes) {
      if (!f.pos) continue;
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: f.pos };
      const r = tryCmd(state, actor, cmd);
      const made = r.ok ? r.events.find((e) => e.type === 'zone_created') : undefined;
      if (made?.type !== 'zone_created') continue;
      const inside = Object.values(state.combatants).filter((c) => c.hp > 0 && c.pos && !c.summon?.intangible
        && made.zone.hexes.some((h) => h.col === c.pos?.col && h.row === c.pos?.row));
      const foesIn = inside.filter((c) => c.side !== actor.side && !c.civilian);
      const enemies = foesIn.length;
      const friends = inside.filter((c) => (c.side === actor.side || c.civilian) && !(z?.notCaster && c.id === actor.id) && z?.targets !== 'enemies').length;
      // Görev DRUID: hasar veren alan (Moonbeam) tek güçlü (20+ HP) düşmana da.
      const worth = enemies >= 2 || (!!z?.damage && foesIn.some((c) => c.hp >= 20));
      if (worth && friends === 0 && (!best || enemies > best.foes)) best = { cmd, foes: enemies };
    }
  }
  return best?.cmd ?? null;
}

/**
 * Dragonborn Breath Weapon (Görev R4; basit kural): kullanımı varsa, en az iki görünen düşmanı kapsayan ve dost vurmayan
 * koni ya da çizgi (hangisi daha çok düşman kapsıyorsa).
 */
function breathWeapon(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  const b = actor.breath;
  if (!b || !state.map || (actor.resources[b.resource] ?? 0) <= 0) return null;
  const visible = new Set(foes.map((f) => f.id));
  let best: { cmd: Command; foes: number } | null = null;
  for (const s of b.shapes) {
    const aim = bestAim(state, actor, { shape: s.shape, sizeFt: s.sizeFt, origin: 'self', targets: 'all', ...(s.widthFt ? { widthFt: s.widthFt } : {}) }, 0, (c) => visible.has(c.id));
    if (!aim?.aim || aim.allies > 0 || aim.foes < 2 || (best && best.foes >= aim.foes)) continue;
    best = { cmd: { type: 'breath_weapon', actorId: actor.id, shape: s.shape, targetHex: aim.aim }, foes: aim.foes };
  }
  return best && tryCmd(state, actor, best.cmd).ok ? best.cmd : null;
}

/** Ölmekte olan (ya da çok yaralı) müttefiki iyileştir. */
function healAlly(state: BattleState, actor: Combatant): Command | null {
  const heals = castable(actor).filter((s) => s.mechanics.kind === 'heal');
  if (heals.length === 0) return null;
  const hurt = Object.values(state.combatants)
    .filter((c) => c.side === 'party' && !c.civilian && !c.summon && c.life !== 'dead' && (c.life === 'dying' || c.hp < c.maxHp * 0.25))
    .sort((a, b) => a.hp - b.hp);
  for (const ally of hurt) {
    for (const s of heals.sort((a, b) => (a.castingTime === 'bonus' ? -1 : 1) - (b.castingTime === 'bonus' ? -1 : 1))) {
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetId: ally.id };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  return null;
}

/** Eylem kötü koşullarda mı (dezavantajlı saldırı ya da 3/4 siper arkasındaki hedef). */
function poorOdds(state: BattleState, actor: Combatant, cmd: Command): boolean {
  if (cmd.type === 'move' || cmd.type === 'end_turn') return false;
  const r = tryCmd(state, actor, cmd);
  if (!r.ok) return false;
  return r.events.some((e) => (e.type === 'attack_resolved' && (e.mode === 'disadvantage' || (e.cover ?? 0) >= 5))
    || (e.type === 'save_resolved' && (e.cover ?? 0) >= 5));
}

/**
 * İtme fırsatı: bitişik düşmanın arkası lav, uçurum, derin batak (saplanır, boğulabilir) ya da
 * en az 20 ft düşüşse ve düşmanın
 * save'ini kaçırma şansı en az %30 ise (DC − en iyi STR/DEX save ≥ 6) onu iter.
 */
function deadlyShove(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  if (!state.map || !actor.pos || actor.civilian) return null;
  for (const f of foes) {
    const to = shoveHex(actor, f);
    if (!to || !f.pos) continue;
    const out = pushOutcome(state, f, f.pos, to);
    if (!out.ok || !(out.kind === 'lava' || out.kind === 'chasm' || out.kind === 'bog' || out.kind === 'stairwell'
      || (out.kind === 'fall' && out.fallFeet >= 20))) continue;
    if (shoveDc(actor) - Math.max(f.saves.str, f.saves.dex) < 6) continue;
    const cmd: Command = { type: 'shove', actorId: actor.id, targetId: f.id, effect: 'push' };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/** Parti komutunun beklenen değeri (ortalama hasar; Sneak Attack dahil). Saldırı olmayan komut 0. */
function commandScore(state: BattleState, actor: Combatant, cmd: Command): number {
  if (cmd.type !== 'attack' && cmd.type !== 'cast_spell') return 0;
  const target = 'targetId' in cmd && cmd.targetId ? state.combatants[cmd.targetId] : undefined;
  if (!target) return 0;
  const same = partyOptions(actor, target, state).find((o) => o.cmd.type === cmd.type
    && (cmd.type === 'attack' ? o.cmd.type === 'attack' && o.cmd.option.label === cmd.option.label
      : o.cmd.type === 'cast_spell' && o.cmd.spellName === cmd.spellName));
  return (same?.score ?? 0) + sneakBonus(state, actor, cmd);
}

/** Şu an yapılabilen en iyi eylem. */
function bestNow(state: BattleState, actor: Combatant): Command | null {
  const foes = byPriority(actor, foesOf(state, actor), state);
  const shove = deadlyShove(state, actor, foes);
  if (shove) return shove;
  if (actor.side === 'party' && !actor.summon) {
    const heal = healAlly(state, actor);
    if (heal) return heal;
    const area = areaSpell(state, actor, foes);
    if (area) return area;
    const zone = zoneSpell(state, actor, foes);
    if (zone) return zone;
    const breath = breathWeapon(state, actor, foes);
    if (breath) return breath;
    if (actor.sneakAttackDice > 0) {
      // Haydut: Sneak Attack'ın tuttuğu hedef öne geçer (eşitse öncelik sırası).
      let best: { cmd: Command; score: number } | null = null;
      for (const t of foes) {
        for (const o of partyOptions(actor, t, state)) {
          if (!worthIt(state, actor, o.cmd)) continue;
          const score = o.score + sneakBonus(state, actor, o.cmd);
          if (!best || score > best.score) best = { cmd: o.cmd, score };
        }
      }
      return best?.cmd ?? null;
    }
    for (const t of foes) {
      for (const o of partyOptions(actor, t, state)) if (worthIt(state, actor, o.cmd)) return o.cmd;
    }
    return null;
  }
  const area = areaAttack(state, actor);
  if (area) return area;
  // CILA: büyü listesi olan düşman tarafı (çağrılmış ya da Game Master'ın büyücüsü) da zemin büyüsünü kullanır.
  if (actor.spellNames.length > 0 && !actor.summon) {
    const zone = zoneSpell(state, actor, foes);
    if (zone) return zone;
  }
  for (const t of foes) for (const cmd of monsterCommands(actor, t.id, !!state.map)) if (worthIt(state, actor, cmd)) return cmd;
  return null;
}

/**
 * Canavarın alanlı saldırısı (Görev R4): en çok düşmanı kapsayan, dost vurmayan yön/nokta (`bestAim`). Recharge'lı nefes
 * bir düşman için bile kullanılır (eskiden olduğu gibi önce nefes); Recharge'sız alan saldırısı en az iki düşmanda.
 */
function areaAttack(state: BattleState, actor: Combatant): Command | null {
  if (!state.map || !actor.pos) return null;
  const foes = foesOf(state, actor);
  if (foes.length === 0) return null;
  const visible = new Set(foes.map((f) => f.id));
  for (const [i, a] of actor.attacks.entries()) {
    if (!a.area || !a.save || a.damageDice === undefined || (a.recharge !== undefined && actor.rechargeUsed.includes(i))) continue;
    // Multiattack'ın içindeki alanlı saldırı (Draconic Spirit) Multiattack'la yapılır.
    if (actor.multiattack && a.repeat > 0 && a.recharge === undefined) continue;
    const reach = Math.floor(a.area.sizeFt / 5) + Math.floor((a.area.rangeFt ?? 0) / 5) + 1;
    if (!foes.some((f) => f.pos && distance(f.pos, actor.pos as Offset) <= reach)) continue;
    const best = bestAim(state, actor, a.area, a.area.rangeFt ?? 0, (c) => visible.has(c.id));
    if (!best || best.allies > 0 || best.foes < (a.recharge !== undefined ? 1 : 2)) continue;
    const cmd: Command = { type: 'monster_attack', actorId: actor.id, targetId: '', attackIndex: i, ...(best.aim ? { targetHex: best.aim } : {}) };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/** Bir altıgende durmanın riski. */
function risk(state: BattleState, actor: Combatant, h: Offset): number {
  let r = dragonRisk(state, actor, h);
  // Görev Y1: tehlikeli yüzey (alev, yanan ağ, zehir bulutu, buz) maliyet olarak; 50'nin altında: kazanç yeterliyse girilir.
  r += surfaceRisk(state, h, isAirborne(actor));
  // Görev S2: patlayacak barut fıçısının yanı (ev kuralı açıksa).
  r += objectRisk(state, h);
  if (isAirborne(actor)) return r;
  if (isRiskyHex(state, h)) r += 50;
  if (state.map?.lavaWarning?.hexes.some((w) => w.col === h.col && w.row === h.row)) r += 100;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (ruleOf(state, 'lavaEdge') && neighbors(h, size).some((n) => terrainAt(state, n).movement === 'deadly')) r += 8;
  return r;
}

/**
 * Uyuyan ejderha: bitişik altıgen onu uyandırır (herkes için büyük risk; uyandırmaya giden düşman
 * hariç). Parti, tur sonu Algı menzilinde (25 ft) kalmaktan da kaçınır.
 */
function dragonRisk(state: BattleState, actor: Combatant, h: Offset): number {
  const d = sleepingDragon(state);
  if (!d?.pos || d.id === actor.id || rousing(state, actor)) return 0;
  const dist = distance(h, d.pos);
  if (dist <= 1) return 60;
  return actor.side === 'party' && dist * 5 <= wakeRule(state).perceptionFt ? 25 : 0;
}

/** `dragonWake: chance`: bu tur eğilim zarı tuttu, ejderhayı uyandırmaya gidiyor. */
function rousing(state: BattleState, actor: Combatant): boolean {
  return state.map?.dragon?.mode === 'chance' && actor.rouseHit === true && actor.rouseTurn === turnKey(state);
}

/** Yapay zekâ düşmanı ejderhayı uyandıracak hiçbir şey yapmamalı mı (`never`, `gm`, ya da `chance` tutmadıysa). */
function mustNotWake(state: BattleState, actor: Combatant): boolean {
  return actor.side === 'enemies' && !actor.civilian && sleepingDragon(state) !== undefined && !rousing(state, actor);
}

type Spot = { to: Offset; cost: number; kind: 'move' | 'jump' };

/** Ada atlamasında (lav üstünden) en az bu kadar güvenli iniş şansı aranır; altı "DC çok yüksek". */
const MIN_JUMP_SAFE = 0.6;

/**
 * Atlanabilen altıgenler: lavsız kanal/yarık için 5e uzun atlama (en çok 4 altıgen öteye, motorda
 * denenerek) ve Volkan'da ada atlaması (`lavJump`, mesafe sınırsız, hareketin yerine). Ada atlaması
 * riskli: HP %40 ve altındaysa hiç, değilse yalnızca güvenli iniş şansı yeterliyse (DC çok yüksek
 * değil) ve risk kadar ek maliyetle; yürüyerek benzer yere varılabiliyorsa yürür. Doğal 1 her
 * atlamada %5 ölüm demek: bu yüzden atlama, yürüyüşün ulaştıramadığı bir değer (yaklaşma, saldırı
 * yeri) olmadıkça seçilmez (çağıranlar yalnızca yaklaştıran/saldırtan yerleri seçer).
 */
function jumps(state: BattleState, actor: Combatant): Spot[] {
  if (!actor.pos || !state.map) return [];
  const from = actor.pos;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const out: Spot[] = [];
  const critical = actor.hp <= actor.maxHp * 0.4;
  // Ada atlaması: arayüzle aynı kaynak (`jumpTargets`); hareketin yerine geçer (bu tur yürünmemiş olmalı).
  if (ruleOf(state, 'lavJump') !== undefined && actor.movementUsed === 0 && speedHexes(actor) > 0) {
    for (const t of jumpTargets(state, actor)) {
      if (t.risk && (critical || t.risk.pSafe < MIN_JUMP_SAFE)) continue;
      // Uyuyan ejderhanın yanına (herkes) ya da Algı menziline (parti) atlamaz.
      if (dragonRisk(state, actor, t.to) > 0) continue;
      // Maliyet: aşılan mesafe (lav + iniş) ve risk (doğal 1 ölümü 40, yanma 6 ağırlıkla).
      const penalty = t.risk ? 4 + Math.round(40 * t.risk.pFall + 6 * t.risk.pBurn) : 2;
      out.push({ to: t.to, cost: t.lava + 1 + penalty, kind: 'jump' });
    }
  }
  // Lavsız kanal/yarık: 5e uzun atlama (en çok 4 altıgen öteye, motorda denenerek).
  for (let row = 0; row < size.rows; row++) {
    for (let col = 0; col < size.cols; col++) {
      const to = { col, row };
      if (distance(from, to) < 2 || distance(from, to) > 4 || lavaOver(state, from, to).length > 0) continue;
      const r = tryCmd(state, actor, { type: 'jump', actorId: actor.id, to });
      const ev = r.ok ? r.events.find((e) => e.type === 'jumped') : undefined;
      if (ev?.type === 'jumped') out.push({ to, cost: ev.cost, kind: 'jump' });
    }
  }
  return out;
}

/** Yürünebilen boş altıgenler ve tahmini maliyetleri (tek Dijkstra) ve atlamalar. */
function reachable(state: BattleState, actor: Combatant): Spot[] {
  if (!actor.pos || !state.map) return [];
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const budget = speedHexes(actor) - actor.movementUsed;
  if (budget <= 0) return [];
  const costs = costsFrom(actor.pos, size, moveCostFn(state, actor), budget);
  const out: Spot[] = [];
  for (const [key, cost] of costs) {
    if (cost === 0) continue;
    const [col, row] = key.split(',').map(Number) as [number, number];
    const to = { col, row };
    if (occupantAt(state, to, actor.id) || terrainAt(state, to).movement === 'deadly' || terrainAt(state, to).movement === 'blocked') continue;
    out.push({ to, cost, kind: 'move' });
  }
  const walk = new Set(out.map((x) => hexKey(x.to)));
  return [...out, ...jumps(state, actor).filter((j) => !walk.has(hexKey(j.to)))];
}

/** Sıradaki yerlerden motorun kabul ettiği ilk yürüyüş veya atlama. */
function firstMove(state: BattleState, actor: Combatant, order: Spot[]): Command | null {
  // Ejderhayı uyandırmaması gereken düşman, yolu ejderhanın yanından geçen yerleri de atlar.
  const careful = mustNotWake(state, actor);
  for (const { to, kind } of order) {
    if (kind === 'jump') {
      const cmd: Command = { type: 'jump', actorId: actor.id, to };
      const r = tryCmd(state, actor, cmd);
      if (r.ok && !(careful && wakesDragon(r.events))) return cmd;
      continue;
    }
    const cmd: Command = { type: 'move', actorId: actor.id, to };
    const r = tryCmd(state, actor, cmd);
    if (careful && r.ok && wakesDragon(r.events)) continue;
    const ev = r.ok ? r.events[0] : undefined;
    const last = ev?.type === 'moved' ? ev.path[ev.path.length - 1] : undefined;
    if (last && hexKey(last) === hexKey(to)) return cmd;
  }
  return null;
}

const at = (state: BattleState, actor: Combatant, to: Offset): BattleState =>
  ({ ...state, combatants: { ...state.combatants, [actor.id]: { ...actor, pos: to } } });

/**
 * Bonus eylemle yapılacak sınıf özelliği veya büyü sürdürme: Second Wind (HP yarı veya altı),
 * düşen hedeften Hunter's Mark'ı taşıma, saldırabilecekken Hunter's Mark, Spiritual Weapon
 * saldırısı. Yoksa null.
 */
function bonusFeature(state: BattleState, actor: Combatant, canAct: boolean): Command | null {
  if (actor.side !== 'party' || actor.civilian || actor.economy.bonus) return null;
  const id = actor.id;
  const ok = (cmd: Command) => tryCmd(state, actor, cmd).ok;
  if (resourceLeft(actor, 'secondWind') > 0 && actor.hp <= actor.maxHp / 2 && ok({ type: 'second_wind', actorId: id })) {
    return { type: 'second_wind', actorId: id };
  }
  // İyileştirme havuzu (Lay On Hands; basit kural): yanındaki düşmüş dostu yarı HP'sine dek kaldırır; yoksa kendi
  // HP'si üçte birin altındaysa kendini iyileştirir.
  const pool = (actor.features ?? []).find((f) => f.effect.kind === 'healPool');
  const poolLeft = pool?.resource ? resourceLeft(actor, pool.resource) : 0;
  if (pool && poolLeft > 0) {
    const downed = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && c.life !== 'dead' && c.hp <= 0);
    for (const c of downed) {
      const cmd: Command = { type: 'use_feature', actorId: id, feature: pool.key, targetId: c.id, amount: Math.min(poolLeft, Math.max(1, Math.ceil(c.maxHp / 2))) };
      if (ok(cmd)) return cmd;
    }
    if (actor.hp <= actor.maxHp / 3) {
      const cmd: Command = { type: 'use_feature', actorId: id, feature: pool.key, targetId: id, amount: Math.min(poolLeft, actor.maxHp - actor.hp) };
      if (ok(cmd)) return cmd;
    }
  }
  const foes = byPriority(actor, foesOf(state, actor), state);
  // Rage (basit kural): yaralıysa ya da 10 ft içinde düşman varsa öfkelenir; sürüyorsa ve bu tur saldıramadıysa
  // (eylem bitti, uzatılmadı) bonus eylemle uzatır.
  if (actor.rageDamage && rageProblem(actor) === null && ok({ type: 'rage', actorId: id })) {
    const close = foes.some((f) => (state.map ? !!f.pos && !!actor.pos && distance(f.pos, actor.pos) <= 2
      : heightOf(state, f) === heightOf(state, actor)));
    if (!actor.rage && (actor.hp < actor.maxHp || close)) return { type: 'rage', actorId: id };
    if (actor.rage && !actor.rage.refreshed && !canAct) return { type: 'rage', actorId: id };
  }
  const conc = actor.concentration;
  const spell = spellOf(conc?.spell);
  // Görev B1: süreli tekrar (Heat Metal bonus eylemle; Call Lightning, Vampiric Touch eylemle): dost vurmayan ilk hedef.
  const rep = spell?.mechanics.repeat;
  if (conc && spell && rep && (rep.cost === 'bonus' || canAct)) {
    for (const f of foes) {
      const cmd: Command = { type: 'spell_followup', actorId: id, targetId: f.id };
      const r = tryCmd(state, actor, cmd);
      if (r.ok && !r.events.some((e) => (e.type === 'save_resolved' || e.type === 'pushed') && state.combatants[e.targetId]?.side === actor.side)) return cmd;
    }
  }
  if (conc && spell && (spell.mechanics.kind === 'mark' || spell.mechanics.lingering === 'weapon')) {
    // İşaret taşıma: tercihen saldırabileceği hedefe.
    const ranked = spell.mechanics.kind === 'mark'
      ? [...foes].sort((a, b) => Number(bestNowAgainst(state, actor, b)) - Number(bestNowAgainst(state, actor, a)))
      : foes;
    for (const f of ranked) {
      const cmd: Command = { type: 'spell_followup', actorId: id, targetId: f.id };
      if (ok(cmd)) return cmd;
    }
  }
  if (canAct && !conc) {
    // Spiritual Weapon bonus eylemle önce (turda tek slot: eyleme cantrip kalır); Spirit
    // Guardians en az iki düşmanı alacaksa o yeğlenir (ikisi de konsantrasyon).
    const weapon = castable(actor).find((s) => s.mechanics.lingering === 'weapon');
    if (weapon && !areaSpell(state, actor, foes)) {
      for (const f of foes) {
        const cmd: Command = { type: 'cast_spell', actorId: id, spellName: weapon.name, targetId: f.id };
        if (ok(cmd)) return cmd;
      }
    }
    const mark = castable(actor).find((s) => s.mechanics.kind === 'mark');
    if (mark) {
      // Görev WARLOCK: işaret büyü saldırısına da ek zar verir (Hex + Eldritch Blast).
      const spellAttacker = castable(actor).some((s) => s.level === 0 && s.mechanics.kind === 'attack' && !!s.mechanics.damage);
      for (const f of foes) {
        if (!spellAttacker && !bestNowAgainst(state, actor, f)) continue;
        const cmd: Command = { type: 'cast_spell', actorId: id, spellName: mark.name, targetId: f.id };
        if (ok(cmd)) return cmd;
      }
    }
  }
  return null;
}

/** Bu hedefe şu an bir saldırı seçeneği var mı. */
function bestNowAgainst(state: BattleState, actor: Combatant, target: Combatant): boolean {
  return actor.weaponOptions.some((o) => tryCmd(state, actor, { type: 'attack', actorId: actor.id, targetId: target.id, option: o }).ok);
}

/** Steady Aim: özelliği var, bu tur yürümedi, bonus eylemi boş, şimdiki saldırı avantajsız (Sneak Attack tutmuyor). */
function steadyAimFirst(state: BattleState, actor: Combatant, now: Command | null): Command | null {
  if (!now || now.type !== 'attack' || actor.side !== 'party' || !hasTrait(actor, 'steady-aim') || actor.movementUsed > 0 || actor.economy.bonus) return null;
  if (actor.steadyAim === turnKey(state)) return null;
  // Bitişikte düşman varken nişan almaz (yerinde kalır, yakın dövüşte; önce ayrılıp yer değiştirmeyi seçer).
  if (Object.values(state.combatants).some((c) => c.side !== actor.side && !c.civilian && c.hp > 0 && c.pos && actor.pos && distance(c.pos, actor.pos) === 1)) return null;
  const r = tryCmd(state, actor, now);
  const ev = r.ok ? r.events.find((e) => e.type === 'attack_resolved') : undefined;
  if (ev?.type === 'attack_resolved' && ev.mode === 'advantage') return null;
  const cmd: Command = { type: 'steady_aim', actorId: actor.id };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * Cunning Strike (basit kural): Sneak Attack tutacaksa ve en az 3d6 ise, hedef yerde değilse ve yanında bir dost varsa
 * Trip (dost yakın dövüşte avantaj kazanır); yakın dövüşte HP yarının altındaysa Withdraw.
 */
function withCunning(state: BattleState, actor: Combatant, cmd: Command): Command {
  if (cmd.type !== 'attack' || cmd.cunning || cunningOptions(actor).max === 0 || actor.sneakAttackDice < 3 || sneakBonus(state, actor, cmd) === 0) return cmd;
  const t = state.combatants[cmd.targetId];
  if (!t) return cmd;
  const allyNear = Object.values(state.combatants).some((c) => c.side === actor.side && c.id !== actor.id && c.hp > 0 && !c.civilian
    && c.pos && t.pos && distance(c.pos, t.pos) === 1);
  const picks: CunningOption[] = [];
  if (allyNear && !t.conditions.includes('Prone') && sizeRank(t.size) <= sizeRank('L')) picks.push('trip');
  else if (!cmd.option.ranged && actor.hp < actor.maxHp / 2) picks.push('withdraw');
  const next: Command = { ...cmd, cunning: picks };
  return picks.length && tryCmd(state, actor, next).ok ? next : cmd;
}

/** Horde Breaker: bu tur saldırdığı yaratığın 5 ft yakınındaki başka bir düşmana en iyi silahıyla. */
function hordeBreakerCmd(state: BattleState, actor: Combatant): Command | null {
  if (actor.side !== 'party' || !hasTrait(actor, 'horde-breaker') || !actor.economy.lastTargetId) return null;
  const options = [...actor.weaponOptions].filter((o) => !o.spell).sort((a, b) => avg(b.damage) - avg(a.damage));
  for (const f of byPriority(actor, foesOf(state, actor), state)) {
    for (const option of options) {
      const cmd: Command = { type: 'horde_breaker', actorId: actor.id, targetId: f.id, option };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  return null;
}

/** Eylemini kullandı, Action Surge'ü duruyor ve hâlâ vurabileceği hedef var: bir eylem daha. */
function surge(state: BattleState, actor: Combatant): Command | null {
  const e = actor.economy;
  if (resourceLeft(actor, 'actionSurge') <= 0 || e.surged || !e.action || e.attacksLeft > 0) return null;
  const cmd: Command = { type: 'action_surge', actorId: actor.id };
  const r = tryCmd(state, actor, cmd);
  if (!r.ok) return null;
  const next = bestNow(r.state, r.state.combatants[actor.id] as Combatant);
  return next?.type === 'attack' ? cmd : null;
}

/** CILA: Haste'in ek eylemi: eylemini kullandı ve hâlâ vurabileceği hedef var (tek saldırı). */
function hasteNow(state: BattleState, actor: Combatant): Command | null {
  const e = actor.economy;
  if (!actor.effects?.some((x) => x.extraAction) || e.hasteUsed || !e.action || e.attacksLeft > 0) return null;
  const cmd: Command = { type: 'haste_action', actorId: actor.id };
  const r = tryCmd(state, actor, cmd);
  if (!r.ok) return null;
  const next = bestNow(r.state, r.state.combatants[actor.id] as Combatant);
  return next?.type === 'attack' ? cmd : null;
}

/**
 * CILA (basit kural): bonus eylemle taşınan çağrı (Flaming Sphere, ruh sürüsü). Çarpabilen küre en düşük HP'li bitişik
 * düşmana çarptırılır; sürü alanında en çok düşmanı toplayan yere (eşitse en yakın düşmana yakın) gider. İyileşme yoksa
 * taşınmaz.
 */
function steerCommand(state: BattleState, actor: Combatant): Command | null {
  if (actor.economy.bonus || !state.map) return null;
  const s = steerableSummon(state, actor);
  if (!s?.pos || !s.summon?.ownerBonus) return null;
  const foes = foesOf(state, actor).filter((f) => f.pos);
  if (foes.length === 0) return null;
  const hexes = steerHexes(state, actor);
  const radius = (state.map.zones ?? []).find((z) => z.anchorId === s.id)?.radius ?? 1;
  const near = (h: Offset) => Math.min(...foes.map((f) => distance(f.pos as Offset, h)));
  const covered = (h: Offset) => foes.filter((f) => distance(f.pos as Offset, h) <= radius).length;
  if (s.summon.ownerBonus.ram) {
    for (const f of [...foes].sort((a, b) => a.hp - b.hp)) {
      const spot = hexes.filter((h) => distance(h, f.pos as Offset) === 1).sort((a, b) => distance(a, s.pos as Offset) - distance(b, s.pos as Offset))[0];
      const cmd: Command | null = spot ? { type: 'summon_move', actorId: actor.id, to: spot, ramId: f.id } : null;
      if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  const here = { n: covered(s.pos), d: near(s.pos) };
  const best = hexes.map((h) => ({ h, n: covered(h), d: near(h) })).sort((a, b) => b.n - a.n || a.d - b.d)[0];
  if (!best || best.n < here.n || (best.n === here.n && best.d >= here.d)) return null;
  const cmd: Command = { type: 'summon_move', actorId: actor.id, to: best.h };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/** Yürüyüş fırsat saldırısı yedirecekse ve bonus eylemle ayrılabiliyorsa önce ayrıl. */
function guardMove(state: BattleState, actor: Combatant, cmd: Command | null): Command | null {
  if (!cmd || cmd.type !== 'move' || actor.economy.disengaged || actor.economy.bonus || !actor.bonusActions.includes('disengage')) return cmd;
  const r = tryCmd(state, actor, cmd);
  const provokes = r.ok && r.events.some((e) => e.type === 'attack_resolved' && e.opportunity);
  return provokes ? { type: 'disengage', actorId: actor.id, bonus: true } : cmd;
}

/** Sırası gelen savaşçı için bir sonraki komut. */
export function chooseCommand(state: BattleState): Command {
  const actorId = currentActorId(state);
  const actor = state.combatants[actorId];
  const end: Command = { type: 'end_turn', actorId };
  if (!actor || state.status !== 'active' || actor.hp <= 0 || actor.asleep) return end;
  // Incapacitated (Stunned, Paralyzed…): eylem yok; yapay zekâ yürümeyi de denemez, turunu bitirir (Görev H).
  if (isIncapacitated(actor.conditions)) return end;
  const conf = state.map?.dragon;
  const dragon = sleepingDragon(state);
  if (dragon && conf && actor.side === 'enemies' && !actor.civilian) {
    // `chance`: tur başında uyandırma eğilimi zarı; tutarsa ejderhanın yanına gider.
    if (conf.mode === 'chance' && actor.rouseTurn !== turnKey(state)) return { type: 'rouse_dragon', actorId };
    if (rousing(state, actor)) {
      const go = rouseMove(state, actor, dragon);
      if (go) return go;
    }
  }
  // Parti: ejderha uyurken Algı menzilindeyse önce menzilden çıkar (sonraki adımda saldırır).
  // Yakın dövüşe girmiş (bitişiğinde düşman olan) karakter yerinde kalır: Algı zarını göze alır.
  const engaged = actor.pos && foesOf(state, actor).some((f) => f.pos && actor.pos && distance(f.pos, actor.pos) === 1);
  if (dragon?.pos && actor.side === 'party' && !actor.civilian && actor.pos && !actor.hidden && !engaged
    && distance(actor.pos, dragon.pos) * 5 <= wakeRule(state).perceptionFt) {
    const away = reachable(state, actor)
      .filter((s) => distance(s.to, dragon.pos as Offset) * 5 > wakeRule(state).perceptionFt && risk(state, actor, s.to) < 50)
      .sort((a, b) => a.cost - b.cost);
    const go = firstMove(state, actor, away);
    if (go) return go;
  }
  const cmd = decide(state, actor, end);
  // Ejderhayı uyandırmaması gereken düşman: komut yine de uyandırıyorsa (gürültülü saldırı gibi) yapmaz.
  if (cmd.type !== 'end_turn' && mustNotWake(state, actor)) {
    const r = tryCmd(state, actor, cmd);
    if (r.ok && wakesDragon(r.events)) return end;
  }
  return cmd;
}

/** Uyandırmaya giden düşman: ejderhaya bitişik (ya da en yakın) ulaşılabilir altıgene yürür. */
function rouseMove(state: BattleState, actor: Combatant, dragon: Combatant): Command | null {
  if (!dragon.pos) return null;
  const at = dragon.pos;
  const spots = reachable(state, actor)
    .map((s) => ({ ...s, d: distance(s.to, at) }))
    .filter((s) => actor.pos && s.d < distance(actor.pos, at) && risk(state, actor, s.to) < 50)
    .sort((a, b) => a.d - b.d || a.cost - b.cost);
  return firstMove(state, actor, spots);
}

function decide(state: BattleState, actor: Combatant, end: Command): Command {
  const actorId = actor.id;
  const canAct = !actor.economy.action || actor.economy.attacksLeft > 0;
  const feature = bonusFeature(state, actor, canAct);
  if (feature) return feature;
  const surged = canAct ? null : surge(state, actor);
  if (surged) return surged;
  const hasted = canAct ? null : hasteNow(state, actor);
  if (hasted) return hasted;
  // CILA: bonus eylemle çağrıyı taşı (eylemden sonra, bonus eylem boşsa).
  const steer = canAct ? null : steerCommand(state, actor);
  if (steer) return steer;
  // Horde Breaker (Görev F): saldırdığı yaratığın yanındaki başka bir düşmana ek saldırı (turda bir kez).
  const horde = hordeBreakerCmd(state, actor);
  if (horde) return horde;
  // Yan el ek saldırısı: Nick varsa hemen (Attack eyleminin içinde), yoksa eylem bitince bonus eylem boşsa.
  if (actor.side === 'party' && actor.offHandOption && offhandProblem(actor) === null && (actor.nickOffhand || (!canAct && !actor.economy.bonus))) {
    for (const f of byPriority(actor, foesOf(state, actor), state)) {
      const cmd: Command = { type: 'offhand_attack', actorId, targetId: f.id };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Smite (basit kural): yakın dövüş isabetinden sonra bonus eylem boşsa; slotsuz kullanım (Paladin's Smite) hep,
  // slotla yalnızca kritik vuruşta ya da hedef 10 HP'den fazlaysa.
  if (actor.side === 'party' && actor.economy.meleeHit && !actor.economy.bonus) {
    const hit = actor.economy.meleeHit;
    const target = state.combatants[hit.targetId];
    const smites = castable(actor).filter((s) => s.mechanics.kind === 'smite').sort((a, b) => Number(freeCast(actor, b.name)) - Number(freeCast(actor, a.name)) || a.level - b.level);
    for (const s of target && target.hp > 0 ? smites : []) {
      if (!freeCast(actor, s.name) && !hit.critical && (target?.hp ?? 0) <= 10) continue;
      const cmd: Command = { type: 'cast_spell', actorId, spellName: s.name, targetId: hit.targetId };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Görev WARLOCK (basit kural): pact silahı isabetinden sonra Eldritch Smite, kritikte ya da hedef 20+ HP'liyse.
  if (actor.traits?.includes('eldritch-smite') && actor.economy.meleeHit?.pact) {
    const t = state.combatants[actor.economy.meleeHit.targetId];
    const cmd: Command = { type: 'eldritch_smite', actorId };
    if (t && (t.hp >= 20 || actor.economy.meleeHit.critical) && tryCmd(state, actor, cmd).ok) return cmd;
  }
  // Monk (basit kurallar, veriden): Monk silahı isabetinden sonra Stunning Strike (hedef 15 HP'den fazlaysa ya da
  // kritikse); Attack eylemi bitince Flurry of Blows (Focus varsa) ya da Martial Arts'ın bonus vuruşu.
  if (actor.side === 'party' && actor.stunning && actor.economy.meleeHit) {
    const hit = actor.economy.meleeHit;
    const target = state.combatants[hit.targetId];
    const cmd: Command = { type: 'stunning_strike', actorId, targetId: hit.targetId };
    if (target && target.hp > 0 && (target.hp > 15 || hit.critical) && !target.conditions.includes(actor.stunning.condition)
      && tryCmd(state, actor, cmd).ok) return cmd;
  }
  if (actor.side === 'party' && actor.bonusStrike) {
    const foes = byPriority(actor, foesOf(state, actor), state);
    const strike = (): Command | null => {
      for (const f of foes) {
        const cmd: Command = { type: 'bonus_strike', actorId, targetId: f.id, technique: 'topple' };
        if (tryCmd(state, actor, cmd).ok) return cmd;
      }
      return null;
    };
    if ((actor.economy.flurryLeft ?? 0) > 0) { const s = strike(); if (s) return s; }
    if (!canAct && !actor.economy.bonus) {
      const flurry = (actor.focusActions ?? []).find((a) => a.strikes);
      const cmd: Command | null = flurry ? { type: 'focus_action', actorId, action: flurry.id } : null;
      if (cmd && strike() && tryCmd(state, actor, cmd).ok) return cmd;
      const s = strike(); if (s) return s;
    }
  }
  // Süren güçlendirme özelliği (Sacred Weapon; basit kural): saldırabilecekken, etkin değilse ve yakında düşman varsa.
  if (actor.side === 'party' && canAct) {
    for (const f of (actor.features ?? []).filter((x) => x.effect.kind === 'buff')) {
      if (activeBuffs(state, actor).some((b) => b.source === f.name)) continue;
      const near = foesOf(state, actor).some((c) => (state.map ? !!c.pos && !!actor.pos && distance(c.pos, actor.pos) <= 2 : heightOf(state, c) === heightOf(state, actor)));
      const cmd: Command = { type: 'use_feature', actorId, feature: f.key };
      if (near && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Görev SORCERER (basit kural): Innate Sorcery, eylemi duruyorsa ve menzilde düşman varken büyü yapabiliyorsa.
  if (canAct && !actor.economy.bonus) {
    const innate = (actor.features ?? []).find((f) => f.effect.kind === 'innate');
    const cmd: Command | null = innate ? { type: 'use_feature', actorId, feature: innate.key } : null;
    if (cmd && castable(actor).some((s) => s.mechanics.damage && (s.mechanics.kind === 'attack' || s.mechanics.kind === 'save'))
      && foesOf(state, actor).length > 0 && tryCmd(state, actor, cmd).ok) return cmd;
  }
  // Görev CLERIC (basit kurallar, veriden): Channel Divinity ve Sanctuary.
  {
    const cmd = clericChoice(state, actor, canAct);
    if (cmd) return cmd;
  }
  // Görev WIZARD (basit kural): felç eden save büyüsü (Hold Person) güçlü düşmanlara; yukarı slotta ek hedef.
  if (canAct) {
    const cmd = holdChoice(state, actor) ?? controlArea(state, actor);
    if (cmd) return cmd;
  }
  // Görev DRUID (basit kural): slotu kalmamış ve konsantre olmayan Druid bonus eylemle en güçlü bilinen biçime girer.
  if (!actor.economy.bonus && !actor.shape && !actor.concentration && foesOf(state, actor).length > 0 && actor.spellSlots.every((n) => n <= 0)) {
    const form = availableForms(monsters, actor)[0];
    const cmd: Command | null = form ? { type: 'wild_shape', actorId, form: form.id } : null;
    if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
  }
  // Görev BARD (basit kural): bonus eylemle Bardic Inspiration; en çok saldıran, zarı olmayan, menzildeki dosta.
  if (!actor.economy.bonus && foesOf(state, actor).length > 0) {
    const insp = (actor.features ?? []).find((f) => f.effect.kind === 'inspire');
    // DENGE-4: yapay zekâ Font of Inspiration'la slot harcamaz (slotlar Hypnotic Pattern, Slow gibi büyülere kalır);
    // yalnızca kullanım varken. Oyuncu slotla ilhamı elle seçebilir.
    if (insp && (!insp.resource || resourceLeft(actor, insp.resource) > 0)) {
      const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && c.id !== actor.id && !c.civilian && c.hp > 0 && !c.summon
        && !c.effects?.some((e) => e.inspire)).sort((a, b) => b.attacksPerAction - a.attacksPerAction || b.level - a.level);
      for (const a of allies) {
        const cmd: Command = { type: 'use_feature', actorId, feature: insp.key, targetId: a.id };
        if (tryCmd(state, actor, cmd).ok) return cmd;
      }
    }
  }
  // Saldırı zarı güçlendirmesi (Bless; basit kural, veriden: dostlara saldırı zarı eklentisi veren etki büyüsü): eylemi
  // duruyorsa, konsantre değilse ve sürdürülen daha güçlü konsantrasyon büyüsü (Spirit Guardians, Spiritual Weapon)
  // yoksa; menzildeki dostlar (önce kendisi), hedef sayısı kadar. Konsantrasyonu bozmaz (`castable` süzer).
  if (actor.side === 'party' && !actor.economy.action && !actor.concentration && foesOf(state, actor).length > 0) {
    const lingering = castable(actor).some((s) => s.concentration && !!s.mechanics.lingering);
    const buff = lingering ? undefined : castable(actor).find((s) => s.mechanics.kind === 'effect' && s.mechanics.effect?.side === 'ally'
      && s.mechanics.effect.dice?.on.includes('attack'));
    if (buff) {
      const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && c.hp > 0
        && (c.id === actor.id || !state.map || (!!c.pos && !!actor.pos && distance(c.pos, actor.pos) * 5 <= buff.rangeFt)))
        .sort((a, b) => Number(b.id === actor.id) - Number(a.id === actor.id));
      const cmd: Command = { type: 'cast_spell', actorId, spellName: buff.name, targetIds: allies.slice(0, buff.mechanics.effect?.targets ?? 1).map((c) => c.id) };
      if (allies.length >= 2 && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Reckless Attack (basit kural): HP yarıdan fazlaysa ve şu an yapılacak en iyi şey STR ile silah saldırısıysa.
  if (actor.side === 'party' && actor.canReckless && actor.hp > actor.maxHp / 2 && recklessProblem(actor) === null) {
    const first = bestNow(state, actor);
    if (first?.type === 'attack' && first.option.ability === 'str' && !first.option.spell) return { type: 'reckless', actorId };
  }

  // Haritasız savaş: düşman en düşük HP oranlıya saldırır; parti en iyi seçeneği seçer.
  if (!state.map || !actor.pos) {
    if (actor.side === 'enemies') {
      if (!canAct) return end;
      const target = Object.values(state.combatants)
        .filter((c) => c.side === 'party' && c.hp > 0 && !c.hidden)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!target) return end;
      return monsterCommands(actor, target.id, false).find((cmd) => tryCmd(state, actor, cmd).ok) ?? end;
    }
    return bestNow(state, actor) ?? end;
  }

  if (stuckInBog(state, actor)) return canAct && tryCmd(state, actor, { type: 'escape', actorId }).ok ? { type: 'escape', actorId } : end;
  // Yakalanmış: önce eylemiyle kaçmayı dener. Yerdeyse (hareketi yetiyorsa) önce ayağa kalkar.
  const escape: Command = { type: 'escape_grapple', actorId };
  if (actor.grapple && !actor.economy.action && tryCmd(state, actor, escape).ok) return escape;
  // CILA: büyünün tuttuğu yaratık (Entangle, Web) da önce eylemiyle kurtulmayı dener.
  const free: Command = { type: 'escape', actorId };
  if (actor.effects?.some((e) => e.escapeCheck) && !actor.economy.action && tryCmd(state, actor, free).ok) return free;
  if (actor.conditions.includes('Prone') && standUpProblem(actor) === null) return { type: 'stand_up', actorId };

  // Masum: hiçbir şey yapmaz (sırası motor tarafından atlanır).
  if (actor.civilian) return end;
  // Saldıramayan çağrılmış yaratık (familiar): sahibinin yanında kalır, Yardım ya da Kaçın.
  if (actor.summon?.noAttack) return familiarCommand(state, actor, canAct, end);
  // Görev B2: dokunulamaz çağrı (Flaming Sphere, ruh sürüsü): alanına en çok düşman (en az dost) alan yere, sonra çarpma.
  if (actor.summon?.intangible) return companionCommand(state, actor, canAct, end);

  // Görev S3: hedef (ulaş, yok et, al ve çıkar) savaştan önce gelir.
  const goal = goalCommand(state, actor, canAct);
  if (goal) return goal;
  // Görev S1: kıstırılmış menzilli büyücü ışınlanır (Misty Step).
  const blink = teleportEscape(state, actor);
  if (blink) return blink;
  const now = bestNow(state, actor);
  // Parti: bu tur yürüyerek çok daha iyi bir saldırı yapabiliyorsa (en az %25 fazla ortalama
  // hasar; örn. savaşçı arbalet yerine kılıç) önce oraya yürür. Güvenli ve en ucuz yerler.
  if (now && canAct && actor.side === 'party' && !actor.civilian && actor.movementUsed < speedHexes(actor)) {
    const here = commandScore(state, actor, now);
    if (here > 0) {
      const better = reachable(state, actor)
        .filter((sp) => risk(state, actor, sp.to) < 50)
        .sort((a, b) => a.cost - b.cost)
        .slice(0, 24)
        .filter((sp) => {
          const there = at(state, actor, sp.to);
          const mover = { ...actor, pos: sp.to };
          const cmd = bestNow(there, mover);
          return cmd !== null && !poorOdds(there, mover, cmd) && commandScore(there, mover, cmd) >= here * 1.25;
        });
      const go = guardMove(state, actor, firstMove(state, actor, better));
      if (go) return go;
    }
  }
  // Steady Aim (Görev F): hareket etmeden, bu saldırı avantajsızsa (Sneak Attack tutmuyorsa) önce bonus eylemle nişan al.
  const aim = steadyAimFirst(state, actor, now);
  if (aim) return aim;
  // Haydut: buradan Sneak Attack tutmuyorsa, tutacağı (güvenli) bir yere yürür.
  if (now && canAct && actor.sneakAttackDice > 0 && actor.sneakTurn !== `${state.round}:${state.turnIndex}` && sneakBonus(state, actor, now) === 0) {
    const better = reachable(state, actor)
      .filter((s) => risk(state, actor, s.to) < 50)
      .sort((a, b) => a.cost - b.cost)
      .slice(0, 20)
      .filter((s) => {
        const there = at(state, actor, s.to);
        const mover = { ...actor, pos: s.to };
        const cmd = bestNow(there, mover);
        return cmd !== null && sneakBonus(there, mover, cmd) > 0 && !poorOdds(there, mover, cmd);
      });
    const go = guardMove(state, actor, firstMove(state, actor, better));
    if (go) return go;
  }
  // Kötü koşullu atışta önce daha iyi bir yere yürü (siper arkasından karşılıklı dezavantajlı
  // atışla savaşın kilitlenmemesi için); öyle bir yer yoksa yine de yap.
  const poor = now !== null && canAct && poorOdds(state, actor, now);
  if (now && !poor) return withCunning(state, actor, now);
  if (!canAct) return now ?? end;

  const foes = foesOf(state, actor);
  if (foes.length === 0) return now ?? end;
  const spots = reachable(state, actor);
  const ranged = actor.side === 'party' && actor.weaponOptions.some((o) => o.ranged);
  const enemyNear = (h: Offset) => foes.some((f) => f.pos && distance(h, f.pos) === 1);

  // Eylem yapabileceği en ucuz ve en güvenli altıgen (menzilli parti üyesi bitişikten kaçınır).
  const scored = spots
    .map((s) => ({ ...s, score: s.cost + risk(state, actor, s.to) + (ranged && enemyNear(s.to) ? 3 : 0) }))
    .sort((a, b) => a.score - b.score);
  const attackSpots: Spot[] = [];
  for (const s of scored) {
    const there = at(state, actor, s.to);
    const mover = { ...actor, pos: s.to };
    const cmd = bestNow(there, mover);
    if (cmd && (!poor || !poorOdds(there, mover, cmd))) {
      attackSpots.push(s);
      if (attackSpots.length >= 3) break;
    }
  }
  const go = guardMove(state, actor, firstMove(state, actor, attackSpots));
  if (go) return go;
  if (now) return now;
  // Görev S1: yürüyerek hiçbir düşmana yetişemiyorsa ve uçarak yetişebilecekse kendine Fly.
  const fly = flyToReach(state, actor, attackSpots.length > 0);
  if (fly) return fly;

  // Yaklaş: en yakın hedefe mesafeyi en çok kısaltan güvenli altıgen.
  const nearest = (h: Offset) => Math.min(...foes.map((t) => distance(h, t.pos as Offset)));
  const here = nearest(actor.pos);
  const approach = spots
    .filter((s) => nearest(s.to) < here)
    .map((s) => ({ ...s, score: nearest(s.to) * 10 + risk(state, actor, s.to) + s.cost }))
    .sort((a, b) => a.score - b.score);
  return guardMove(state, actor, firstMove(state, actor, approach)) ?? end;
}

/** Görev S3: hedef altıgenlerinden birine en çok yaklaştıran güvenli yer (yaklaştırmıyorsa yok). */
function moveToward(state: BattleState, actor: Combatant, targets: Offset[]): Command | null {
  if (!actor.pos || !targets.length) return null;
  const near = (h: Offset) => Math.min(...targets.map((t) => distance(h, t)));
  const here = near(actor.pos);
  const spots = reachable(state, actor)
    .filter((sp) => near(sp.to) < here && risk(state, actor, sp.to) < 50)
    .sort((a, b) => near(a.to) - near(b.to) || a.cost - b.cost);
  return firstMove(state, actor, spots);
}

/**
 * Görev S3: parti yapay zekâsının hedef davranışı. Açık hedefler sırayla: al ve çıkar (sandığa en yakın üye alır,
 * taşıyan çıkışa yürür), ulaş (bu tur ulaşabiliyorsa), yok et (vurabiliyorsa vurur; düşmanla boğuşmuyorsa yanına
 * yürür). Düşmanlar için hedef davranışı yok: masumlara yönelme (protect) eskisi gibi.
 */
function goalCommand(state: BattleState, actor: Combatant, canAct: boolean): Command | null {
  if (!state.goals || actor.side !== 'party' || actor.summon || actor.civilian || !actor.pos || !state.map) return null;
  const pos = actor.pos;
  const engaged = foesOf(state, actor).some((f) => f.pos && distance(f.pos, pos) === 1);
  const party = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.summon && !c.civilian && c.hp > 0 && c.pos);
  for (const g of state.goals.list) {
    if (goalStatus(state, g) !== 'open') continue;
    const ob = g.objectId ? state.map.objects?.find((x) => x.id === g.objectId) : undefined;
    if (g.kind === 'retrieve' && ob && g.hexes?.length) {
      if (ob.carriedBy === actor.id) { const go = moveToward(state, actor, g.hexes); if (go) return go; continue; }
      if (ob.carriedBy) continue;
      const closest = [...party].sort((a, b) => distance(a.pos as Offset, ob.at) - distance(b.pos as Offset, ob.at))[0];
      if (closest?.id !== actor.id) continue;
      if (distance(pos, ob.at) <= 1) return { type: 'object_use', actorId: actor.id, objectId: ob.id, action: 'take' };
      const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
      const go = moveToward(state, actor, neighbors(ob.at, size));
      if (go) return go;
    }
    if (g.kind === 'reach' && g.hexes?.length) {
      const keys = new Set(g.hexes.map(hexKey));
      const there = reachable(state, actor).filter((sp) => keys.has(hexKey(sp.to)) && risk(state, actor, sp.to) < 50).sort((a, b) => a.cost - b.cost);
      const go = firstMove(state, actor, there);
      if (go) return go;
      if (!engaged && g.who === 'all') { const near = moveToward(state, actor, g.hexes); if (near) return near; }
    }
    if (g.kind === 'destroy' && ob && !ob.carriedBy) {
      const hit = canAct ? objectAttackCommand(actor, ob) : null;
      if (hit && tryCmd(state, actor, hit).ok) return hit;
      if (canAct && !engaged && distance(pos, ob.at) > 1) {
        const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
        const go = moveToward(state, actor, neighbors(ob.at, size));
        if (go) return go;
      }
    }
  }
  return null;
}

/**
 * Işınlanma kaçışı (Görev S1; basit kural): HP yarının altında, bitişiğinde düşman olan ve menzilli saldırısı olan
 * büyücü, bonus eylemi duruyorsa ışınlanma büyüsüyle düşmanlardan en uzak (eşitse oradan saldırabileceği) altıgene.
 */
function teleportEscape(state: BattleState, actor: Combatant): Command | null {
  if (!state.map || !actor.pos || actor.hp >= actor.maxHp / 2 || actor.economy.bonus) return null;
  const foes = foesOf(state, actor).filter((f) => f.pos);
  if (!foes.some((f) => distance(f.pos as Offset, actor.pos as Offset) === 1)) return null;
  const rangedSpell = castable(actor).some((s) => s.rangeFt > 5 && (s.mechanics.kind === 'attack' || s.mechanics.kind === 'save') && !!s.mechanics.damage);
  if (!rangedSpell && !actor.weaponOptions.some((o) => o.ranged)) return null;
  const spell = castable(actor).find((s) => s.mechanics.kind === 'teleport' && s.castingTime === 'bonus');
  if (!spell?.mechanics.teleport) return null;
  const far = (h: Offset) => Math.min(...foes.map((f) => distance(h, f.pos as Offset)));
  const hexes = teleportHexes(state, actor, spell.mechanics.teleport)
    .map((h) => ({ h, d: far(h), shot: bestNow(at(state, actor, h), { ...actor, pos: h }) !== null }))
    .filter((x) => x.d > 1)
    .sort((a, b) => b.d - a.d || Number(b.shot) - Number(a.shot) || a.h.row - b.h.row || a.h.col - b.h.col);
  const best = hexes[0];
  if (!best) return null;
  const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex: best.h };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * Uçarak yetişme (Görev S1; basit kural): bu tur yürüyerek saldırabileceği yer yoksa ve uçuş hızıyla olsaydı, eylemiyle
 * kendine uçuş büyüsü yapar (sonra uçarak yürür).
 */
function flyToReach(state: BattleState, actor: Combatant, canReachOnFoot: boolean): Command | null {
  if (canReachOnFoot || !state.map || actor.economy.action || isAirborne(actor)) return null;
  const spell = castable(actor).find((s) => s.mechanics.kind === 'effect' && (s.mechanics.effect?.fly ?? 0) > 0);
  if (!spell) return null;
  const flier: Combatant = { ...actor, effects: [...(actor.effects ?? []), { id: 'ai:fly', name: spell.name, sourceId: actor.id, fly: spell.mechanics.effect?.fly ?? 0 }] };
  const sky: BattleState = { ...state, combatants: { ...state.combatants, [actor.id]: flier } };
  const reach = reachable(sky, flier).some((sp) => bestNow(at(sky, flier, sp.to), { ...flier, pos: sp.to }) !== null);
  if (!reach) return null;
  const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetIds: [actor.id] };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * Familiar (Görev R3; basit kural): saldıramaz. Bitişiğindeki, bir dostla yakın dövüşteki düşmana Yardım eder (dostun
 * saldırısı avantajlı); yoksa sahibinin yanına gider ve Kaçın eylemi yapar.
 */
function familiarCommand(state: BattleState, actor: Combatant, canAct: boolean, end: Command): Command {
  const owner = actor.summon ? state.combatants[actor.summon.by] : undefined;
  const fighting = (f: Combatant) => Object.values(state.combatants).some((a) => a.side === actor.side && a.id !== actor.id && !a.summon
    && a.hp > 0 && a.pos && f.pos && distance(a.pos, f.pos) === 1);
  if (canAct && !actor.economy.action) {
    for (const f of foesOf(state, actor).filter(fighting)) {
      const help: Command = { type: 'help', actorId: actor.id, targetId: f.id };
      if (tryCmd(state, actor, help).ok) return help;
    }
  }
  if (owner?.pos && actor.pos && distance(owner.pos, actor.pos) > 1) {
    const spots = reachable(state, actor)
      .filter((s) => owner.pos && distance(s.to, owner.pos) === 1 && risk(state, actor, s.to) < 50)
      .sort((a, b) => risk(state, actor, a.to) - risk(state, actor, b.to) || a.cost - b.cost);
    const go = firstMove(state, actor, spots);
    if (go) return go;
  }
  const dodge: Command = { type: 'dodge', actorId: actor.id };
  return !actor.economy.action && tryCmd(state, actor, dodge).ok ? dodge : end;
}

/**
 * Görev B2: yürüyen alanlı çağrı (Flaming Sphere, ruh sürüsü). Alanına (yarıçap) giren düşman sayısı en çok, dost sayısı
 * en az olan altıgene yürür (eşitlikte ucuz olan); ardından bitişik düşmana çarpar (Flaming Sphere'in Ram'i).
 */
function companionCommand(state: BattleState, actor: Combatant, canAct: boolean, end: Command): Command {
  const zone = state.map?.zones?.find((z) => z.anchorId === actor.id);
  const radius = zone?.radius ?? 1;
  const enemyOnly = zone ? spellOf(zone.name)?.mechanics.zone?.targets === 'enemies' : false;
  const foes = foesOf(state, actor);
  const friends = Object.values(state.combatants).filter((c) => c.side === actor.side && c.id !== actor.id && c.hp > 0 && c.pos && !(c.summon?.intangible));
  const score = (h: Offset) => foes.filter((f) => f.pos && distance(f.pos, h) <= radius).length * 10
    - (enemyOnly ? 0 : friends.filter((f) => f.pos && distance(f.pos as Offset, h) <= radius).length * 15)
    - (foes.length ? Math.min(...foes.map((f) => distance(f.pos as Offset, h))) : 0) * 0.1;
  if (actor.pos && actor.movementUsed < speedHexes(actor)) {
    const here = score(actor.pos);
    const spots = reachable(state, actor).filter((sp) => sp.kind === 'move').map((sp) => ({ ...sp, s: score(sp.to) }))
      .filter((sp) => sp.s > here).sort((a, b) => b.s - a.s || a.cost - b.cost);
    const go = firstMove(state, actor, spots);
    if (go) return go;
  }
  if (canAct && !actor.economy.action) {
    for (const f of byPriority(actor, foes, state)) {
      const cmd = monsterCommands(actor, f.id, !!state.map).find((c) => tryCmd(state, actor, c).ok);
      if (cmd) return cmd;
    }
  }
  return end;
}

/** Yalnızca düşman sırasında karar verir (GM'in "Düşmanı oynat" düğmesi). */
export function chooseEnemyCommand(state: BattleState): Command {
  const actor = state.combatants[currentActorId(state)];
  if (!actor || actor.side !== 'enemies') return { type: 'end_turn', actorId: currentActorId(state) };
  return chooseCommand(state);
}

export { avg as averageDamage };

/** Görev SORCERER: seçilebilen hasar türlerinden hedefe en çok işleyeni (direnç/bağışıklık/zafiyet; eşitse varsayılan). */
function bestChoice(choices: string[], fallback: string | undefined, target: Combatant): string | undefined {
  const profile = { resistances: target.resistances, immunities: target.immunities, vulnerabilities: target.vulnerabilities };
  const score = (t: string) => adjustDamage(10, t, profile).amount;
  const best = [...choices].sort((a, b) => score(b) - score(a) || Number(b === fallback) - Number(a === fallback))[0];
  return best && best !== fallback ? best : undefined;
}

/**
 * Görev CLERIC: Channel Divinity ve Sanctuary için basit sezgiler (veriden: etki türleri). Eylem varken: iki ya da daha
 * çok Bloodied dost (ya da biri çeyrek HP'nin altında) → Preserve Life; 30 ft içinde Undead → Turn Undead; düşmüş dost
 * → Divine Spark ile kaldır. Bonus eylem varken: kendisi üçte bir HP'nin altında ve yakında düşman varsa Sanctuary.
 */
function clericChoice(state: BattleState, actor: Combatant, canAct: boolean): Command | null {
  const actorId = actor.id;
  const feats = actor.features ?? [];
  const near = (c: Combatant, ft: number) => !state.map || (!!c.pos && !!actor.pos && distance(c.pos, actor.pos) * 5 <= ft);
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && c.life !== 'dead' && !c.summon);
  if (canAct) {
    const preserve = feats.find((f) => f.effect.kind === 'preserveLife');
    if (preserve) {
      const bloodied = allies.filter((c) => c.hp < c.maxHp / 2 && near(c, 30));
      const cmd: Command = { type: 'use_feature', actorId, feature: preserve.key };
      if ((bloodied.length >= 2 || bloodied.some((c) => c.hp < c.maxHp / 4)) && tryCmd(state, actor, cmd).ok) return cmd;
    }
    const turn = feats.find((f) => f.effect.kind === 'turnUndead');
    if (turn) {
      const undead = foesOf(state, actor).filter((c) => (c.creatureType ?? '').toLowerCase() === 'undead' && near(c, 30) && !c.conditions.includes('Incapacitated'));
      const cmd: Command = { type: 'use_feature', actorId, feature: turn.key };
      if (undead.length > 0 && undead.reduce((n, c) => n + c.hp, 0) >= 15 && tryCmd(state, actor, cmd).ok) return cmd;
    }
    const spark = feats.find((f) => f.effect.kind === 'divineSpark');
    if (spark) {
      const down = allies.find((c) => c.hp <= 0 && near(c, 30));
      const cmd: Command | null = down ? { type: 'use_feature', actorId, feature: spark.key, targetId: down.id, choice: 'heal' } : null;
      if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  if (!actor.economy.bonus && actor.hp > 0 && actor.hp < actor.maxHp / 3 && !actor.effects?.some((e) => e.sanctuary)) {
    const sanct = castable(actor).find((sp) => sp.mechanics.effect?.sanctuary);
    const threatened = foesOf(state, actor).some((c) => near(c, 10));
    const cmd: Command | null = sanct ? { type: 'cast_spell', actorId, spellName: sanct.name, targetIds: [actorId] } : null;
    if (cmd && threatened && tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/**
 * Görev WIZARD: Paralyzed veren tek hedefli save büyüsü (Hold Person): türü uygun (humanoid), en az 20 HP'li, felçli
 * olmayan düşmanlar; yukarı slotta hedef sayısı kadar (en yüksek uygun slot), komut denetiminden geçen ilk birleşim.
 */
function holdChoice(state: BattleState, actor: Combatant): Command | null {
  const spell = castable(actor).find((s) => s.mechanics.kind === 'save' && !s.area && (s.mechanics.conditions ?? []).includes('Paralyzed'));
  // Konsantrasyon sürerken yeniden yapmak tutulanları bırakır; daha güçlü sürdürülen konsantrasyon büyüsü (Spirit
  // Guardians, Spiritual Weapon) varsa onu bırakmaz (Bless kuralıyla aynı).
  if (!spell || actor.concentration || castable(actor).some((s) => s.concentration && !!s.mechanics.lingering)) return null;
  // Kalabalık düşmanda (4+) alan büyüsü ve hasar daha değerli: felç yalnızca az sayıda güçlü düşmana.
  if (foesOf(state, actor).filter((c) => c.hp > 0).length > 3) return null;
  const foes = foesOf(state, actor).filter((c) => (c.creatureType ?? 'humanoid') === 'humanoid' && c.hp >= 20 && !c.conditions.includes('Paralyzed'))
    .sort((a, b) => b.hp - a.hp);
  if (foes.length === 0) return null;
  for (let slot = 9; slot >= spell.level; slot--) {
    if ((actor.spellSlots[slot - 1] ?? 0) <= 0) continue;
    const n = Math.min(foes.length, 1 + (slot - spell.level) * (spell.mechanics.upcast?.applied ? spell.mechanics.upcast.targets ?? 0 : 0));
    const cmd: Command = n > 1
      ? { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetIds: foes.slice(0, n).map((c) => c.id), slotLevel: slot }
      : { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId: (foes[0] as Combatant).id, slotLevel: slot };
    if (worthIt(state, actor, cmd)) return cmd;
    break;
  }
  return null;
}
