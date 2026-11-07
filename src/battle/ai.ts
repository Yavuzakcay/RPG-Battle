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
import { heldFollow, mechanicsAt } from './spellVersion';
import { breathOf } from './breath';
import { isIncapacitated } from '../rules/conditions';
import { adjustDamage } from '../rules/damage';
import { monsters, spells } from '../data';
import { availableForms } from './druid';
import { costsFrom, distance, hexKey, neighbors, offsetToAxial, type Offset } from '../rules/hex';
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
import { heightAt, heightCombatRule } from './heights';
import { ruleVersion } from './ruleVersion';
import { zoneKnownBy } from './hiddenZones';
import { zoneSpecOf } from './zones';
import { climbTargets } from './climb';
import { rageProblem, recklessProblem } from './rage';
import { activeBuffs } from './divine';
import { offhandProblem } from './offhand';
import { islandJumpProblem, moveCostFn, occupantAt, speedHexes, terrainAt } from './movement';
import { bonusOptionsOf, freeCast } from './economy';
import { bestAim, pickArea } from './areaAttack';
import { multiSpecOf, multiTotal } from './monsters';
import { abilitiesOf, abilityReady } from './monsterAbilities';
import { checkReach as reachOk, monsterAttackReach as atkReach } from './range';
import type { MultiStep } from './types';
import { center as hexCenter } from '../rules/area';
import { objectAttackCommand, objectRisk } from './objects';
import { goalStatus, leafGoals } from './goals';
import { ALARM, notices as noticesHero, patrolOf } from './alarm';
import { hideCheck } from './stealth';
import { OBJECTS, OBJECT_DATA } from './objectData';
import { houseRule } from './houseRules';
import { STEAM_PENALTY, isWater, surfaceRisk, surfacesReact } from './surfaces';
import { reactionHurtsSide } from './hexResolver';
import { terrainEndangersSide } from './terrainSpell';
import type { Spell } from '../data/types';
import aiData from '../../data/yapay-zeka.json';

/** Kuyruk 41b: yenilenen hedefe ateş/asit (yenilenmeyi keser) seçeneğinin puan çarpanı. */
const REGEN_CUT: number = aiData.yenilenmeKesme;
const cutsRegen = (type: string | undefined): boolean => type === 'fire' || type === 'acid';
import { resourceLeft, type BattleState, type Combatant, type Command, type CommandContext, type CunningOption } from './types';
import { isAirborne } from './flight';
import { legendaryOf } from './boss';
import { bodyAt, bodyOf, gap } from './body';
import { footprintDistance } from '../rules/footprint';
import { globalRule } from './ruleControl';
import { teleportHexes } from './teleport';
import { steerableSummon, steerHexes } from './summons';
import { steedActions } from './steed';
import { IMZA_SPECS } from './imza';
import { imzaHintCmds } from './imzaAi';
import { GAZE_KEY, SPIDER_KEY } from './karadul';
import { candidatesFor, registerAction, type AiHelpers, type Candidate } from './ai/actions';
import { difficultyOf, evaluateCandidates, pickByDifficulty, roleOf } from './ai/evaluate';
import aiRoles from '../../data/yz-roller.json';
import { bonusPoolCands } from './ai/behaviors';
import { aiStats } from './ai/preview';

const noRoll = () => 0.5;
const ctxOf = (c: Combatant): CommandContext =>
  c.side === 'enemies' || c.civilian ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
/**
 * Y2 G2: aynı durumda aynı komutun deneme sonucu önbellekte (durum değişmez nesne; `noRoll` deterministik): karar
 * içinde ve ardışık kararlarda (metamagic, Usta ileri bakışı, hareket yeri taraması) tekrar eden `execute` çağrıları.
 */
const tryCache = new WeakMap<BattleState, Map<string, ReturnType<typeof execute>>>();
const tryCmd = (state: BattleState, actor: Combatant, cmd: Command) => {
  let m = tryCache.get(state);
  if (!m) { m = new Map(); tryCache.set(state, m); }
  const k = `${actor.side}|${actor.civilian ? 1 : 0}|${actor.ownerId}|${JSON.stringify(cmd)}`;
  const hit = m.get(k);
  aiStats.tries++;
  if (hit) return hit;
  aiStats.tryMisses++;
  const r = execute(state, cmd, ctxOf(actor), noRoll);
  m.set(k, r);
  return r;
};

/**
 * Kuyruk K48 (ev kuralı, basit kural): Karadul. Biçimde değilken menzildeki en güçlü uygun düşmana Büyüleyici Bakış;
 * büyülü düşman varsa (ya da slot kalmadıysa) Örümcek Biçimi; dönüşülen turda büyülü hedef erişimdeyse sürpriz vuruş.
 */
function karadulAi(state: BattleState, actor: Combatant): Command | null {
  const gaze = actor.features?.find((f) => f.key === GAZE_KEY);
  const spider = actor.features?.find((f) => f.key === SPIDER_KEY);
  if (!gaze && !spider) return null;
  const foes = foesOf(state, actor).sort((a, b) => b.hp - a.hp);
  const charmed = foes.filter((f) => f.effects?.some((e) => e.id === `karadul:gaze:${actor.id}`));
  const bonusFree = !actor.economy.bonus;
  if (spider && actor.shape?.spider && actor.traitTurns?.['karadul-transform'] === turnKey(state)) {
    const bite = actor.weaponOptions[0];
    for (const t of charmed) {
      const cmd: Command | null = bite ? { type: 'attack', actorId: actor.id, targetId: t.id, option: bite } : null;
      if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  if (!actor.shape && gaze && (gaze.type === 'bonus' ? bonusFree : !actor.economy.action) && !charmed.length) {
    for (const t of foes) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: gaze.key, targetId: t.id };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Biçimde kalmanın tek nedeni tuzak ısırığı ya da slotsuzluk: tuzak turu değilse ve slot duruyorsa biçimi bırak (büyüye dön).
  const slotsLeft = actor.spellSlots.some((n) => n > 0);
  if (spider && actor.shape?.spider && actor.traitTurns?.['karadul-transform'] !== turnKey(state) && slotsLeft && !actor.economy.action) {
    const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: spider.key };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  if (!actor.shape && spider && bonusFree && (charmed.length || !slotsLeft)) {
    const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: spider.key };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}
/**
 * Kuyruk K50: imza alt sınıf eylemleri (basit kural). Bonus eylemliler bonus boşken; eylemliler yalnızca çok hedefli
 * (2+) ya da kontrol (durum veren) olduğunda. İyileştirme yalnız yaralıya (≤ %60), işaret/bağ zaten varsa tekrarlanmaz.
 */
function imzaAi(state: BattleState, actor: Combatant): Command | null {
  const feats = (actor.features ?? []).filter((f) => f.key.startsWith('imza:'));
  if (!feats.length) return null;
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.life !== 'dead' && !c.summon?.gone);
  const foes = foesOf(state, actor).sort((a, b) => a.hp - b.hp);
  const wounded = [...allies].filter((c) => c.hp <= c.maxHp * 0.6).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  for (const f of feats) {
    const spec = IMZA_SPECS[f.key];
    if (!spec) continue;
    if (spec.tur === 'bonus' ? actor.economy.bonus : actor.economy.action) continue;
    // Y1: eylem harcayan imza özellikleri değerlendiricide (büyüyle aynı puanla; `eski:imza` açıklayıcısı).
    if (spec.tur === 'action' && !state.yz?.eski) continue;
    // Kuyruk K54b: özel sezgiseller (slot dursa da; `spec.yz`).
    if (spec.yz) {
      for (const cmd of imzaHintCmds(state, actor, f.key, spec, foes, allies)) if (tryCmd(state, actor, cmd).ok) return cmd;
      continue;
    }
    // Büyücü slotu dururken eylem harcayan imza özelliği büyünün yerine geçmez (Ninni, Zemin Yeniden Yaz, Kuyruklu Yıldız…); havuz hariç.
    if (spec.tur === 'action' && spec.ozel !== 'havuz' && actor.spellSlots.some((n) => n > 0)) continue;
    const marked = (id: string) => Object.values(state.combatants).some((c) => c.effects?.some((e) => e.id === `${id}:${actor.id}`));
    if ((spec.tek || spec.bag) && marked(f.key)) continue;
    let cands: Array<string | undefined> = [undefined];
    if (spec.hedef === 'enemy' || spec.hedef === 'areaEnemies') cands = foes.map((c) => c.id);
    else if (spec.iyilestir) cands = spec.hedef === 'allies' ? (wounded.length >= 2 ? [undefined] : []) : wounded.map((c) => c.id);
    else if (spec.hedef === 'ally' || spec.hedef === 'allyOrSelf') cands = spec.temizle ? allies.filter((c) => c.conditions.some((x) => spec.temizle?.includes(x))).map((c) => c.id)
      : allies.filter((c) => c.id !== actor.id).sort((a, b) => b.hp - a.hp).map((c) => c.id);
    for (const targetId of cands.slice(0, 6)) {
      const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: f.key, ...(targetId ? { targetId } : {}) };
      const r = tryCmd(state, actor, cmd);
      if (!r.ok) continue;
      if (spec.tur === 'action') {
        const hits = new Set(r.events.filter((e) => e.type === 'save_resolved' || e.type === 'effect_added' || e.type === 'healed').map((e) => ('targetId' in e ? e.targetId : '')));
        const control = !!spec.etki && Array.isArray(spec.etki.grants);
        if (hits.size < 2 && !control && spec.ozel !== 'havuz') continue;
      }
      return cmd;
    }
  }
  return null;
}
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
  const all = Object.values(state.combatants).filter(
    (c) => c.side === other && c.hp > 0 && isTargetable(c) && !c.hidden && !c.asleep && canSee(state, actor, c) && !(c.summon?.intangible && !c.summon.gone)
      // Görev S4: açık bir sızma hedefi (ulaş, yok et, al) varken parti habersiz düşmana dokunmaz.
      && !(c.unaware && sneaking(state)),
  );
  // Kuyruk K48 (Karadul, basit kural): dostun büyülediği düşmana (Tatlı Tuzak bekliyor) başka hedef varken dokunulmaz.
  const spared = all.filter((c) => !c.effects?.some((e) => e.id.startsWith('karadul:gaze:') && e.sourceId !== actor.id && state.combatants[e.sourceId]?.side === actor.side));
  return spared.length ? spared : all;
}

/**
 * Kuyruk 41b: 0 HP'de yenilenmeyi bekleyen düşman (Troll): ateş ya da asit hasarı yenilenmeyi keser ve onu öldürür.
 * Partide böyle bir seçenek varsa önce o vurulur (yoksa hedef listesine girmez; başka hasar işe yaramaz).
 */
function finishRegen(state: BattleState, actor: Combatant): Command | null {
  const other = actor.side === 'enemies' ? 'party' : 'enemies';
  const down = Object.values(state.combatants).filter((c) => c.side === other && c.hp <= 0 && c.regenPending && !c.regenBlocked
    && c.life !== 'dead' && isTargetable(c) && !c.hidden && canSee(state, actor, c));
  for (const t of down) {
    for (const o of partyOptions(actor, t, state)) {
      const type = o.cmd.type === 'attack' ? o.cmd.option.damageType
        : o.cmd.type === 'cast_spell' ? (o.cmd.choice ?? spells.find((s) => s.name === (o.cmd as { spellName: string }).spellName)?.mechanics.damageType) : undefined;
      if (cutsRegen(type) && tryCmd(state, actor, o.cmd).ok) return o.cmd;
    }
  }
  return null;
}

/** Görev S4: açık sızma hedefi (ulaş, yok et, al ve çıkar) var mı. */
const sneaking = (state: BattleState): boolean =>
  !!state.goals && leafGoals(state.goals.list).some((g) => g.kind !== 'defeat' && g.kind !== 'protect' && g.kind !== 'survive' && goalStatus(state, g) === 'open');

function byPriority(actor: Combatant, foes: Combatant[], state?: BattleState): Combatant[] {
  // Kuyruk 43: uzaklık gövdeler arası (`gap`; çok altıgen kapalıyken `distance` ile aynı).
  const d = (c: Combatant) => (actor.pos && c.pos ? (state ? gap(state, actor, c) : distance(actor.pos, c.pos)) : 0);
  // Yakalayan önce yakaladığına vurur (kaçmasın; Restrained ise avantajlı).
  const held = (c: Combatant) => (c.grapple?.by === actor.id ? 0 : 1);
  // Vex işaretli hedef (bir sonraki saldırı avantajlı) öne geçer.
  const vexed = (c: Combatant) => (actor.marks?.some((m) => m.kind === 'vex' && m.targetId === c.id) ? 0 : 1);
  // Çağrılmış yaratık (Görev R3) sahibini korur: sahibine bitişik düşman öne geçer.
  const owner = actor.summon ? state?.combatants[actor.summon.by] : undefined;
  const guard = (c: Combatant) => (owner?.pos && c.pos && (state ? gap(state, owner, c) : distance(owner.pos, c.pos)) <= 1 ? 0 : 1);
  // Kuyruk 16 K16D: düşman, hedefi taşıyanı ya da çıkışa en yakın kahramanı (açık ulaş/al-çıkar hedefi varken) önce vurur.
  const runner = state && actor.side === 'enemies' && aiOn(state, 'aiCutRunner') ? objectiveRunner(state) : null;
  const key = (c: Combatant) => (runner?.id === c.id ? 0 : 1);
  // Kuyruk K54b (İnfazcı): hükümlü öne geçer (gizli saldırı fırsatı: yanında dost varsa daha da önde).
  const verdict = (c: Combatant) => (actor.imza === 'imza_infazci' && c.effects?.some((e) => e.id === `imza:imza_infazci/verdict:${actor.id}`)
    ? (state && c.pos && Object.values(state.combatants).some((x) => x.id !== actor.id && x.side === actor.side && x.hp > 0 && x.pos && distance(x.pos, c.pos as Offset) <= 1) ? 0 : 1) : 2);
  return [...foes].sort((a, b) => key(a) - key(b) || held(a) - held(b) || verdict(a) - verdict(b) || vexed(a) - vexed(b) || guard(a) - guard(b) || d(a) - d(b) || a.hp / a.maxHp - b.hp / b.maxHp);
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
    // Kuyruk 40: "çalışmıyor" büyüler savaşta yapılamaz.
    .filter((s) => !s.mechanics.unsupported)
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
    const base = avg(o.damage) + mastery + pactExtra + (opens && off ? avg(off.damage) : 0);
    out.push({ cmd: { type: 'attack', actorId: actor.id, targetId: target.id, option: o }, score: target.regeneration > 0 && cutsRegen(o.damageType) ? base * REGEN_CUT : base });
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
    const regen = target.regeneration > 0 && cutsRegen(choice ?? m.damageType) ? REGEN_CUT : 1;
    out.push({ cmd: { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetId: target.id, ...(choice ? { choice } : {}) },
      score: (steam ? base * STEAM_PENALTY : base) * regen });
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
      const r0 = tryCmd(state, actor, cmd);
      // Kuyruk K55: tepkime zinciri (tutuşan gres, patlama, suda yıldırım) dostu yakacaksa seçme.
      // Kuyruk K56: arazi etkisi (tutuşan ot, donan su) dostun altında ya da yanında yüzey bırakacaksa seçme.
      if (r0.ok && !reactionHurtsSide(state, r0.events, actor.side) && !terrainEndangersSide(state, r0.events, actor.side)) return cmd;
      continue;
    }
    // Kuyruk K57 (Meteor Swarm, `multiPoint`): en çok düşmanı kapsayan, dost vurmayan en çok N nokta (açgözlü).
    const multi = state.map ? mechanicsAt(state, s).multiPoint ?? 0 : 0;
    if (multi > 1 && s.area) {
      const pts = multiPointAim(state, actor, s.area, s.rangeFt, foes, multi);
      if (pts) {
        const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: pts[0] as Offset, targetHexes: pts };
        const r = tryCmd(state, actor, cmd);
        if (r.ok && !reactionHurtsSide(state, r.events, actor.side) && !terrainEndangersSide(state, r.events, actor.side)) return cmd;
      }
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
      // Kuyruk 19: büyü yapan canavar da kullanır (taraflar büyücüye göre).
      const foeSide = actor.side === 'enemies' ? 'party' : 'enemies';
      if (sides.filter((x) => x === foeSide).length >= (steams ? 3 : 2) && !sides.includes(actor.side) && !reactionHurtsSide(state, r.events, actor.side) && !terrainEndangersSide(state, r.events, actor.side)) return cmd;
    }
  }
  return null;
}

/**
 * Kuyruk K57: çok noktalı alan (Meteor Swarm) için noktalar. Adaylar düşmanların altıgenleri; her adımda henüz kapsanmamış
 * en çok düşmanı ekleyen, hiç dost/masum kapsamayan nokta seçilir (SRD: alanlar birleşir, her yaratık bir kez). Toplam en az
 * iki düşman yoksa null.
 */
export function multiPointAim(state: BattleState, actor: Combatant, area: NonNullable<Spell['area']>, rangeFt: number, foes: Combatant[], max: number): Offset[] | null {
  const foeIds = new Set(foes.map((f) => f.id));
  const cands = foes.flatMap((f) => {
    if (!f.pos) return [];
    const p = pickArea(state, actor, area, rangeFt, f.pos, 'büyü');
    if ('ok' in p) return [];
    if (p.reached.some((x) => x.c.side === actor.side || x.c.civilian)) return [];
    return [{ at: f.pos, ids: p.reached.filter((x) => foeIds.has(x.c.id) && x.c.hp > 0).map((x) => x.c.id) }];
  });
  const covered = new Set<string>();
  const pts: Offset[] = [];
  while (pts.length < max) {
    let best: (typeof cands)[number] | null = null;
    let gain = 0;
    for (const c of cands) {
      if (pts.some((p) => p.col === c.at.col && p.row === c.at.row)) continue;
      const g = c.ids.filter((id) => !covered.has(id)).length;
      if (g > gain) { gain = g; best = c; }
    }
    if (!best) break;
    pts.push(best.at);
    for (const id of best.ids) covered.add(id);
  }
  return covered.size >= 2 ? pts : null;
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
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex: f.pos, ...spareAllies(state, actor, spell) };
      const r = tryCmd(state, actor, cmd);
      if (!r.ok) continue;
      const ids = r.events.filter((e) => e.type === 'save_resolved').map((e) => (e.type === 'save_resolved' ? e.targetId : ''));
      const sides = ids.map((id) => state.combatants[id]?.side);
      // Denge turu (K20 ölçümü, Drow): aynı büyünün etkisi zaten üstünde olan düşman sayılmaz (dört Drow aynı düşmanlara
      // sırayla Faerie Fire atıp eylemlerini harcıyordu).
      const fresh = ids.filter((id) => state.combatants[id]?.side !== actor.side && !(state.combatants[id]?.effects ?? []).some((x) => x.name === spell.name));
      // Yeni hedef en az üç ve hedeflerin çoğu (yoksa aynı büyünün tekrarı).
      if (fresh.length >= 3 && fresh.length * 2 > ids.length && !sides.includes(actor.side)) return cmd;
    }
  }
  return null;
}

/**
 * CILA (basit kural): kalıcı zemin büyüsü (Entangle, Web, Grease, Spike Growth, Sleet Storm, Stinking Cloud): alanda
 * en az iki düşman, hiç dost yoksa (büyücü `notCaster` ya da yalnızca düşmanlara işleyen alanda sayılmaz); düşmanların
 * altıgenlerine nişan, en çok düşman kapsayan. Görüş/örtü alanları (Fog Cloud, Darkness, Silence) ve duvar yapılmaz.
 */
/** Kuyruk S2 (sürüm 41, Plant Growth `excludable`): dostların altıgenleri alanın dışında bırakılır. */
function spareAllies(state: BattleState, actor: Combatant, spell: (typeof spells)[number]): { excludeHexes?: Offset[] } {
  if (ruleVersion(state) < 41 || !mechanicsAt(state, spell).excludable) return {};
  const hexes = Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.pos).map((c) => c.pos as Offset);
  return hexes.length ? { excludeHexes: hexes } : {};
}

function zoneSpell(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  if (!state.map) return null;
  const usable = castable(actor).filter((x) => x.area && x.mechanics.zone && x.mechanics.kind !== 'summon' && !x.mechanics.zone.windWall
    && (x.mechanics.zone.save || x.mechanics.zone.damage));
  let best: { cmd: Command; foes: number } | null = null;
  for (const s of usable) {
    const z = s.mechanics.zone;
    for (const f of foes) {
      if (!f.pos) continue;
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: f.pos, ...spareAllies(state, actor, s) };
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
  const bo = breathOf(actor);
  const b = bo?.spec;
  if (!b || !state.map || (!bo.spell && (actor.resources[b.resource] ?? 0) <= 0)) return null;
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
    const to = shoveHex(actor, f, state);
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

/**
 * Şu an yapılabilen en iyi eylem (eski kural zinciri). Y2 G2: (durum, yaratık) başına önbellekte; yaratık durumdaki
 * kaydın kendisi ya da `at` ile kopyası (aynı ekonomi, can, konum) olmalı.
 */
const bestCache = new WeakMap<BattleState, Map<string, Command | null>>();
function bestNow(state: BattleState, actor: Combatant): Command | null {
  const cur = state.combatants[actor.id];
  const same = !!cur && (cur === actor || (cur.economy === actor.economy && cur.hp === actor.hp && cur.movementUsed === actor.movementUsed
    && cur.pos?.col === actor.pos?.col && cur.pos?.row === actor.pos?.row));
  if (!same) return bestNowUncached(state, actor);
  let m = bestCache.get(state);
  if (!m) { m = new Map(); bestCache.set(state, m); }
  if (m.has(actor.id)) return m.get(actor.id) ?? null;
  const r = bestNowUncached(state, actor);
  m.set(actor.id, r);
  return r;
}

function bestNowUncached(state: BattleState, actor: Combatant): Command | null {
  const foes = byPriority(actor, foesOf(state, actor), state);
  const shove = deadlyShove(state, actor, foes);
  if (shove) return shove;
  if (actor.side === 'party' && !actor.summon) {
    const heal = healAlly(state, actor);
    if (heal) return heal;
    const cut = finishRegen(state, actor);
    if (cut) return cut;
    const area = areaSpell(state, actor, foes);
    if (area) return area;
    // Kuyruk 19 (görev 3): Power Word Kill (100 HP ve altı) ve Stun (150 HP ve altı), Mass Heal (iki ya da daha çok yaralı dost).
    const pw = powerWordCommand(state, actor, foes);
    if (pw) return pw;
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
  // Kuyruk 19 (srdK19): SRD canavar yetenekleri (bonus eylemler önce; eylemler yalnızca saldırıdan iyiyse).
  const ab = abilityCommand(state, actor);
  if (ab) return ab;
  const area = areaAttack(state, actor);
  if (area) return area;
  // CILA: büyü listesi olan düşman tarafı (çağrılmış ya da Game Master'ın büyücüsü) da zemin büyüsünü kullanır.
  if (actor.spellNames.length > 0 && !actor.summon) {
    const zone = zoneSpell(state, actor, foes);
    if (zone) return zone;
  }
  // Kuyruk 19 (SRD canavar büyüleri): alan büyüsü (en az iki düşman, dost yok), sonra saldırılarından iyiyse tek hedef büyüsü.
  if (actor.monsterId && actor.spellNames.length > 0 && !actor.summon) {
    const areaS = areaSpell(state, actor, foes);
    if (areaS) return areaS;
    const base = monsterAttackScore(actor);
    for (const t of foes) {
      const o = partyOptions(actor, t, state).find((x) => x.cmd.type === 'cast_spell' && worthIt(state, actor, x.cmd));
      if (o && o.score > base) return o.cmd;
    }
  }
  // Kuyruk 19 (srdK19): SRD Multiattack planı (bileşim, yerine nefes/büyü, ek kullanım, saldırılar arasında hedef değişimi).
  const plan = multiPlanCommand(state, actor, foes);
  if (plan && worthIt(state, actor, plan)) return plan;
  for (const t of foes) for (const cmd of monsterCommands(actor, t.id, !!state.map)) if (worthIt(state, actor, cmd)) return cmd;
  return null;
}

/**
 * Kuyruk 19: Multiattack planı kurar: (1) yerine geçen alan saldırısı (en az iki düşman, dost yok) ya da erişimde düşman
 * yokken yerine geçen büyü; (2) kalan saldırılar her adımda erişimdeki en yüksek ortalamalı saldırı, hedef beklenen
 * hasarla düşünce sıradaki düşmana; (3) ek kullanımlar (erişimdeki ilk düşmana ya da alanın en iyi altıgenine).
 */
function multiPlanCommand(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  const spec = multiSpecOf(state, actor);
  if (!spec || !actor.multiattack || !foes.length) return null;
  const idx = (n: string) => actor.attacks.findIndex((a) => a.name === n);
  const ready = (n: string) => { const i = idx(n); const a = actor.attacks[i]; return a && !(a.recharge !== undefined && actor.rechargeUsed.includes(i)) ? a : undefined; };
  const inReach = (n: string, f: Combatant) => { const a = ready(n); return !!a && !a.area && reachOk(state, actor, f, atkReach(a)).ok; };
  const visible = new Set(foes.map((f) => f.id));
  const steps: MultiStep[] = [];
  let left = multiTotal(spec, actor);
  for (const r of spec.replace ?? []) {
    if (r.cost > left) continue;
    const a = r.name ? ready(r.name) : undefined;
    if (a?.area && state.map) {
      const best = bestAim(state, actor, a.area, a.area.rangeFt ?? 0, (c) => visible.has(c.id));
      if (best?.aim && best.allies === 0 && best.foes >= 2) { steps.push({ attack: r.name, targetHex: best.aim }); left -= r.cost; break; }
    }
    if (r.spell && !foes.some((f) => (spec.names ?? []).some((n) => inReach(n, f)))) { steps.push({ spell: r.spell, targetId: foes[0]!.id }); left -= r.cost; break; }
  }
  const hpLeft = new Map(foes.map((f) => [f.id, f.hp]));
  const per: Record<string, number> = {};
  for (let k = 0; k < left; k++) {
    let best: { n: string; f: Combatant; v: number } | null = null;
    for (const f of foes) {
      if ((hpLeft.get(f.id) ?? 0) <= 0) continue;
      for (const n of spec.names ?? []) {
        if (spec.max?.[n] !== undefined && (per[n] ?? 0) >= spec.max[n]!) continue;
        if (!inReach(n, f)) continue;
        const v = avg(ready(n)?.damageDice);
        if (!best || v > best.v) best = { n, f, v };
      }
      if (best) break; // öncelik sırasındaki ilk ulaşılan düşman
    }
    if (!best) break;
    per[best.n] = (per[best.n] ?? 0) + 1;
    hpLeft.set(best.f.id, (hpLeft.get(best.f.id) ?? 0) - best.v);
    steps.push({ attack: best.n, targetId: best.f.id });
  }
  for (const n of spec.extra ?? []) {
    const a = ready(n);
    if (!a || a.damageDice === undefined && !a.save) continue;
    const f = foes.find((x) => a.area ? true : reachOk(state, actor, x, atkReach(a)).ok);
    if (!f) continue;
    steps.push(a.area ? { attack: n, targetHex: f.pos as Offset } : { attack: n, targetId: f.id });
    if (!spec.extraTwice) break;
  }
  // K59 (duman bulgusu): erişim denetimi görüşü (kar, duvar) ve çok altıgen erişimini bilmiyordu; motorun reddedeceği
  // plan seçilmez: geçersiz adımlar sırayla düşülür (geçerli bir plan kalmazsa null).
  let plan = steps;
  const cmdOf = (p: MultiStep[]): Command => ({ type: 'multiattack', actorId: actor.id, targetId: p.find((x) => x.targetId)?.targetId ?? foes[0]!.id, plan: p });
  while (plan.length && !tryCmd(state, actor, cmdOf(plan)).ok) {
    const keep: MultiStep[] = [];
    for (const st of plan) if (tryCmd(state, actor, cmdOf([...keep, st])).ok) keep.push(st);
    plan = keep.length < plan.length ? keep : [];
  }
  return plan.length ? cmdOf(plan) : null;
}

/**
 * Kuyruk 19: canavar yeteneği komutu. Bonus eylemli yetenekler (Charge, Leap, Petrifying Gaze, War Cry, Moan…) her
 * uygun turda; eylemli yetenekler yalnızca save/çağırma/yutma/büyü/ışınlanma türünde. Ethereal ve kendine aç/kapa
 * yetenekleri yapay zekâ kullanmaz (Game Master seçer).
 */
function abilityCommand(state: BattleState, actor: Combatant): Command | null {
  for (const a of abilitiesOf(state, actor)) {
    if (!abilityReady(actor, a) || a.kind === 'ethereal' || a.toggle || (a.kind === 'grant' && !a.jumpFt && !a.grant?.includes('dash'))) continue;
    if (a.cost === 'action' && !['save', 'summon', 'swallow', 'spell', 'teleport'].includes(a.kind)) continue;
    if (a.kind === 'grant' && a.grant?.includes('dash') && foesOf(state, actor).some((f) => f.pos && actor.pos && gap(state, f, actor) <= 1)) continue;
    const cmd: Command = { type: 'monster_ability', actorId: actor.id, abilityId: a.id };
    if (worthIt(state, actor, cmd)) return cmd;
  }
  return null;
}

function powerWordCommand(state: BattleState, actor: Combatant, foes: Combatant[]): Command | null {
  const can = new Set(castable(actor).map((x) => x.name));
  const tries: Command[] = [];
  if (can.has('Power Word Kill')) for (const f of foes) if (f.hp <= 100 && f.hp >= 30) tries.push({ type: 'cast_spell', actorId: actor.id, spellName: 'Power Word Kill', targetId: f.id });
  if (can.has('Power Word Stun')) for (const f of foes) if (f.hp <= 150 && f.hp >= 40 && !f.conditions.includes('Stunned')) tries.push({ type: 'cast_spell', actorId: actor.id, spellName: 'Power Word Stun', targetId: f.id });
  const hurt = Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.hp < c.maxHp / 2).length;
  if (can.has('Mass Heal') && hurt >= 2) tries.push({ type: 'cast_spell', actorId: actor.id, spellName: 'Mass Heal' });
  return tries.find((c) => worthIt(state, actor, c)) ?? null;
}

/** Canavarın bir eylemde saldırılarıyla ortalama hasarı (Multiattack'ta tekrar sayılarıyla). */
function monsterAttackScore(actor: Combatant): number {
  const each = actor.attacks.filter((a) => !a.area && !a.bonusAction).map((a) => ({ v: avg(a.damageDice), n: a.repeat }));
  if (!each.length) return 0;
  return actor.multiattack ? Math.max(each.reduce((t, a) => t + a.v * a.n, 0), ...each.map((a) => a.v)) : Math.max(...each.map((a) => a.v));
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
    if (!foes.some((f) => f.pos && gap(state, f, actor) <= reach)) continue;
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
  // Kuyruk S2 (sürüm 41): bilinen düşman hasar alanı (Spike Growth); gizli ve fark edilmemişse bilinmez, kaçınılmaz.
  if (ruleVersion(state) >= 41) for (const z of state.map?.zones ?? []) {
    if (z.side === actor.side || !zoneKnownBy(z, actor) || !z.hexes.some((x) => x.col === h.col && x.row === h.row)) continue;
    const sp = zoneSpecOf(z);
    if (sp?.damage && (sp.on ?? []).some((t) => t === 'move' || t === 'enter') && !(sp.ground && isAirborne(actor))) r += 20;
  }
  if (isAirborne(actor)) return r;
  if (isRiskyHex(state, h)) r += 50;
  if (state.map?.lavaWarning?.hexes.some((w) => w.col === h.col && w.row === h.row)) r += 100;
  const size = { cols: state.map?.tiles[0]?.length ?? 0, rows: state.map?.tiles.length ?? 0 };
  if (ruleOf(state, 'lavaEdge') && neighbors(h, size).some((n) => terrainAt(state, n).movement === 'deadly')) r += 8;
  // Kuyruk 41b: kayalık çukura girmek (hasar + tur kaybı) büyük risk.
  if (ruleOf(state, 'pitFall') && terrainAt(state, h).rule === 'pitFall') r += 40;
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

/**
 * Varsayımsal konum durumu. Y2 G2: aynı (durum, yaratık, altıgen) için aynı nesne döner; böylece hareket yeri
 * taramaları (daha iyi yer, Sneak Attack yeri, kötü koşul, tehlikeden çıkış) aynı karar içinde `tryCmd`/`bestNow`
 * önbelleklerini paylaşır.
 */
const atCache = new WeakMap<BattleState, Map<string, BattleState>>();
const at = (state: BattleState, actor: Combatant, to: Offset): BattleState => {
  let m = atCache.get(state);
  if (!m) { m = new Map(); atCache.set(state, m); }
  const k = `${actor.id}|${to.col},${to.row}`;
  const cur = state.combatants[actor.id];
  // Önbellek yalnız durumdaki yaratığın kendisinden türetilen konumlar için (geçici ekonomi değişikliği yok).
  const plain = cur === actor;
  const hit = plain ? m.get(k) : undefined;
  if (hit) return hit;
  const out: BattleState = { ...state, combatants: { ...state.combatants, [actor.id]: { ...actor, pos: to } } };
  if (plain) m.set(k, out);
  return out;
};

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
  // Kuyruk K20 (ev kuralı, basit kural): Celestial Şifa Eli: bitişikte düşmüş dost, yoksa HP'si üçte birin altındaki dost ya da kendisi.
  const touch = (actor.features ?? []).find((f) => f.effect.kind === 'celestialHeal');
  if (touch) {
    const hurt = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.civilian && c.life !== 'dead' && c.hp < c.maxHp)
      .sort((a, b) => (a.hp <= 0 ? -1 : 0) - (b.hp <= 0 ? -1 : 0) || a.hp / a.maxHp - b.hp / b.maxHp);
    for (const c of hurt.filter((x) => x.hp <= 0 || x.hp <= x.maxHp / 3)) {
      const cmd: Command = { type: 'use_feature', actorId: id, feature: touch.key, targetId: c.id };
      if (ok(cmd)) return cmd;
    }
  }
  const foes = byPriority(actor, foesOf(state, actor), state);
  // Rage (basit kural): yaralıysa ya da 10 ft içinde düşman varsa öfkelenir; sürüyorsa ve bu tur saldıramadıysa
  // (eylem bitti, uzatılmadı) bonus eylemle uzatır.
  if (actor.rageDamage && rageProblem(actor) === null && ok({ type: 'rage', actorId: id })) {
    const close = foes.some((f) => (state.map ? !!f.pos && !!actor.pos && gap(state, f, actor) <= 2
      : heightOf(state, f) === heightOf(state, actor)));
    if (!actor.rage && (actor.hp < actor.maxHp || close)) return { type: 'rage', actorId: id };
    if (actor.rage && !actor.rage.refreshed && !canAct) return { type: 'rage', actorId: id };
  }
  // Kuyruk 19: Animate Objects: bonus eylemle nesnelere emir (yoksa yalnızca Kaçın yaparlar).
  if (!actor.economy.bonus && !actor.economy.summonCommand && Object.values(state.combatants).some((c) => c.summon?.by === id && c.summon.commandBonus && !c.summon.gone && c.hp > 0)) {
    const cmd: Command = { type: 'command_summons', actorId: id };
    if (ok(cmd)) return cmd;
  }
  const conc = actor.concentration;
  // Kuyruk A6: sürüme göre mekanik (`a4`/`a6`).
  const spell0 = spellOf(conc?.spell);
  const spell = spell0 ? { ...spell0, mechanics: mechanicsAt(state, spell0) } : spell0;
  // Görev B1: süreli tekrar (Heat Metal bonus eylemle; Call Lightning, Vampiric Touch eylemle): dost vurmayan ilk hedef.
  const rep = spell?.mechanics.repeat;
  // Kuyruk 19: Dispel Evil and Good: bitişik türden düşmana Dismissal.
  if (conc && spell?.mechanics.endFunctions && canAct) {
    for (const f of foes) {
      const cmd: Command = { type: 'spell_followup', actorId: id, targetId: f.id };
      if (f.hp >= 20 && ok(cmd)) return cmd;
    }
  }
  if (conc && spell && rep?.direction) {
    // Kuyruk 19: Compulsion: büyülenenleri kendi tarafından uzaklaştıran yönü seçen yaratık (yönün çıkış noktası büyücü).
    const charmed = Object.values(state.combatants).filter((c) => c.pos && c.hp > 0 && (c.effects ?? []).some((e) => e.sourceId === id && e.compel));
    const mine = Object.values(state.combatants).filter((c) => c.pos && c.hp > 0 && c.side === actor.side);
    let best: { cmd: Command; score: number } | null = null;
    for (const t of Object.values(state.combatants)) {
      if (!t.pos || !actor.pos || t.id === id || t.hp <= 0) continue;
      const a = offsetToAxial(actor.pos); const b = offsetToAxial(t.pos);
      const v = { q: b.q - a.q, r: b.r - a.r };
      const score = charmed.reduce((sum, c) => {
        const cp = offsetToAxial(c.pos as Offset);
        return sum + mine.reduce((m, f) => { const fp = offsetToAxial(f.pos as Offset); const w = { q: cp.q - fp.q, r: cp.r - fp.r }; return m + w.q * v.q + w.r * v.r + (-w.q - w.r) * (-v.q - v.r); }, 0);
      }, 0);
      const cmd: Command = { type: 'spell_followup', actorId: id, targetId: t.id };
      if (score > 0 && (!best || score > best.score) && ok(cmd)) best = { cmd, score };
    }
    if (best) return best.cmd;
  } else if ((conc && spell && rep && (rep.cost === 'bonus' || canAct)) || (canAct && heldFollow(state, actor))) {
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
  if (Object.values(state.combatants).some((c) => c.side !== actor.side && !c.civilian && c.hp > 0 && c.pos && actor.pos && gap(state, c, actor) === 1)) return null;
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

/**
 * Kuyruk 18 H3: Brutal Strike (basit kural): Reckless turunda, hedef 20+ HP'liyken ilk STR saldırısında avantajdan
 * vazgeçer; hedef bitişikteki tek düşmansa Forceful Blow (iter), değilse Hamstring Blow.
 */
function withBrutal(state: BattleState, actor: Combatant, cmd: Command): Command {
  if (cmd.type !== 'attack' || cmd.brutal || !actor.traits?.includes('brutal-strike') || cmd.option.ability !== 'str') return cmd;
  const t = state.combatants[cmd.targetId];
  if (!t || t.hp < 20) return cmd;
  const adjacentFoes = foesOf(state, actor).filter((f) => f.hp > 0 && f.pos && actor.pos && distance(f.pos, actor.pos) === 1).length;
  const next: Command = { ...cmd, brutal: adjacentFoes === 1 ? 'forceful' : 'hamstring' };
  const r = tryCmd(state, actor, next);
  return r.ok && r.events.some((e) => e.type === 'attack_resolved' && e.brutal) ? next : cmd;
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
  // Kuyruk 19: Arcane Hand: yakaladığını ezer, yoksa en düşük HP'li düşmanın yanına gidip yumruk atar.
  if (s.summon.hand) {
    const held = foes.find((f) => f.grapple?.by === s.id);
    const crush: Command | null = held ? { type: 'summon_move', actorId: actor.id, to: s.pos, ramId: held.id, hand: 'crush' } : null;
    if (crush && tryCmd(state, actor, crush).ok) return crush;
    for (const f of [...foes].sort((a, b) => a.hp - b.hp)) {
      const spot = [s.pos, ...hexes].filter((h) => distance(h, f.pos as Offset) === 1).sort((a, b) => distance(a, s.pos as Offset) - distance(b, s.pos as Offset))[0];
      const cmd: Command | null = spot ? { type: 'summon_move', actorId: actor.id, to: spot, ramId: f.id, hand: 'fist' } : null;
      if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
    }
    return null;
  }
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
  // Kuyruk 19: serbest kayma hakkı varsa ve hedef bütçe içindeyse fırsat saldırısı almadan kay.
  if (cmd?.type === 'move' && (actor.economy.shiftLeft ?? 0) > 0) {
    const shift: Command = { type: 'shift_move', actorId: actor.id, to: cmd.to };
    if (tryCmd(state, actor, shift).ok) return shift;
  }
  if (!cmd || cmd.type !== 'move' || actor.economy.disengaged || actor.economy.bonus || !bonusOptionsOf(actor).includes('disengage')) return cmd;
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
  // Kuyruk 16 K16D: devriyedeki habersiz üye rotadaki sıradaki noktaya yürür (durakta bekler); diğer habersizler bekler.
  if (actor.unaware) return patrolCommand(state, actor) ?? end;
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
  const engaged = actor.pos && foesOf(state, actor).some((f) => f.pos && actor.pos && gap(state, f, actor) === 1);
  if (dragon?.pos && actor.side === 'party' && !actor.civilian && actor.pos && !actor.hidden && !engaged
    && distance(actor.pos, dragon.pos) * 5 <= wakeRule(state).perceptionFt) {
    const away = reachable(state, actor)
      .filter((s) => distance(s.to, dragon.pos as Offset) * 5 > wakeRule(state).perceptionFt && risk(state, actor, s.to) < 50)
      .sort((a, b) => a.cost - b.cost);
    const go = firstMove(state, actor, away);
    if (go) return go;
  }
  // Kuyruk 33: uçan boss saldırdıktan sonra kalan hareketiyle yer düşmanlarının erişiminden çıkar (lav üstü tercih).
  const lift = bossFlightMove(state, actor);
  if (lift) return lift;
  const cmd = withMetamagic(state, actor, decide(state, actor, end), end);
  // Ejderhayı uyandırmaması gereken düşman: komut yine de uyandırıyorsa (gürültülü saldırı gibi) yapmaz.
  if (cmd.type !== 'end_turn' && mustNotWake(state, actor)) {
    const r = tryCmd(state, actor, cmd);
    if (r.ok && wakesDragon(r.events)) return end;
  }
  return cmd;
}

/**
 * Kuyruk 43: yapay zekânın basit Metamagic kullanımı (bedeller `actor.metamagic`, puan `sorceryPoints`).
 * - Twinned Spell: yukarı slotta ek hedef alan büyüde; çok hedefli yukarı slot kararı bir alt slota iner, tek hedefliye
 *   aynı taraftan en yakın ikinci hedef eklenir.
 * - Quickened Spell: eylem harcanmış, bonus eylem boşken (ve kararı tur sonuysa) eylem boşmuş gibi verilen karar eylemle
 *   yapılan bir büyüyse bonus eylemle yapılır (slot kuralı motorda: turda tek slotlu büyü).
 * Her ek komut denetimden geçmezse karar olduğu gibi kalır.
 */
function withMetamagic(state: BattleState, actor: Combatant, cmd: Command, end: Command): Command {
  const mm = actor.metamagic;
  if (!mm) return cmd;
  const points = resourceLeft(actor, 'sorceryPoints');
  if (cmd.type === 'cast_spell' && !cmd.metamagic?.length && mm.twinned !== undefined && points >= mm.twinned) {
    const spell = spellOf(cmd.spellName);
    const first = cmd.targetId ?? (cmd.targetIds?.length === 1 ? cmd.targetIds[0] : undefined);
    const t = first ? state.combatants[first] : undefined;
    // Yukarı slotla çok hedef seçilmişse Twinned bir slot seviyesi kazandırır: aynı hedefler bir alt slotla.
    const lvl = cmd.slotLevel ?? spell?.level ?? 0;
    if (spell?.mechanics.upcast?.applied && spell.mechanics.upcast.targets && (cmd.targetIds?.length ?? 0) > 1 && lvl > spell.level) {
      const cheaper: Command = { ...cmd, slotLevel: lvl - 1, metamagic: ['twinned'] };
      if (tryCmd(state, actor, cheaper).ok) return cheaper;
    }
    if (spell?.mechanics.upcast?.applied && spell.mechanics.upcast.targets && t?.pos && actor.pos) {
      const others = Object.values(state.combatants)
        .filter((c) => c.id !== t.id && c.side === t.side && c.hp > 0 && c.pos && isTargetable(c))
        .sort((a, b) => gap(state, a, t) - gap(state, b, t));
      for (const o of others.slice(0, 3)) {
        const { targetId: _drop, ...rest } = cmd;
        const twin: Command = { ...rest, targetIds: [t.id, o.id], metamagic: ['twinned'] };
        if (tryCmd(state, actor, twin).ok) return twin;
      }
    }
  }
  if (cmd.type === end.type && mm.quickened !== undefined && points >= mm.quickened && actor.economy.action && !actor.economy.bonus
    && actor.economy.attacksLeft <= 0) {
    const free: BattleState = { ...state, combatants: { ...state.combatants, [actor.id]: { ...actor, economy: { ...actor.economy, action: false } } } };
    const alt = decide(free, free.combatants[actor.id] as Combatant, end);
    if (alt.type === 'cast_spell' && spellOf(alt.spellName)?.castingTime === 'action') {
      const quick: Command = { ...alt, metamagic: [...(alt.metamagic ?? []), 'quickened'] };
      if (tryCmd(state, actor, quick).ok) return quick;
    }
  }
  return cmd;
}

/**
 * Kuyruk 33 (`bossFlight`, kural sürümü 11): efsanevi eylemli uçan boss eylemini harcadıktan sonra kalan hareketiyle
 * yerdeki düşmanların bitişiğinden kalkar: erişim dışı, tercihen lav üstü (uçan lava düşmez), en yakın düşmana 6 altıgen
 * içinde (nefes/ışın menzili). Zaten erişim dışındaysa ya da yer yoksa null; eylemden önce normal karar (yaklaşma = iniş).
 */
function bossFlightMove(state: BattleState, actor: Combatant): Command | null {
  if (!globalRule(state, 'bossFlight') || !actor.pos || !state.map || !isAirborne(actor) || !legendaryOf(state, actor)) return null;
  if (!actor.economy.action || actor.economy.attacksLeft > 0) return null;
  const ground = foesOf(state, actor).filter((f) => f.pos && !isAirborne(f));
  if (!ground.length) return null;
  const threat = (h: Offset) => ground.some((f) => distance(f.pos as Offset, h) <= 1);
  if (!threat(actor.pos)) return null;
  const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
  const budget = speedHexes(actor) - actor.movementUsed;
  if (budget <= 0) return null;
  const near = (h: Offset) => Math.min(...ground.map((f) => distance(f.pos as Offset, h)));
  const spots = [...costsFrom(actor.pos, size, moveCostFn(state, actor), budget)]
    .map(([key, cost]) => { const [col, row] = key.split(',').map(Number) as [number, number]; return { to: { col, row }, cost }; })
    .filter((x) => x.cost > 0 && !occupantAt(state, x.to, actor.id) && terrainAt(state, x.to).movement !== 'blocked' && !threat(x.to) && near(x.to) <= 6)
    .map((x) => ({ ...x, lava: terrainAt(state, x.to).movement === 'deadly' ? 1 : 0 }))
    .sort((a, b) => b.lava - a.lava || a.cost - b.cost || a.to.col - b.to.col || a.to.row - b.to.row);
  for (const sp of spots.slice(0, 12)) {
    const cmd: Command = { type: 'move', actorId: actor.id, to: sp.to };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/** Kuyruk 16 K16D: devriye yürüyüşü (kendi hızıyla, rotadaki sıradaki noktaya; `waitUntil` turuna dek durakta). */
function patrolCommand(state: BattleState, actor: Combatant): Command | null {
  if (!aiOn(state, 'aiPatrol')) return null;
  const g = patrolOf(state, actor);
  if (!g?.route?.length || state.round < (g.waitUntil ?? 0) || isIncapacitated(actor.conditions)) return null;
  const target = g.route[(g.routeIndex ?? 0) % g.route.length] as Offset;
  const go = moveToward(state, actor, [target]);
  return go && tryCmd(state, actor, go).ok ? go : null;
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
  // Kuyruk K48 (Karadul, basit kural): bakış → dönüşüm → büyülü hedefe sürpriz vuruş.
  const widow = karadulAi(state, actor);
  if (widow) return widow;
  // Kuyruk K50: imza alt sınıf eylemleri (basit kural). Y1: bonus/serbest imza özellikleri ve G3 havuzu puanlanır.
  // K59 (Şair Koleji, denge turu): imza bonus eylemi Bardic Inspiration'ı harcıyor ve aşağıdaki ilham kuralından önce
  // geliyordu: imza bard dostlara hiç ilham vermiyordu. Dostlarda bu bardın ilhamı yokken önce bir ilham.
  const firstInspire = actor.imza && !state.yz?.eski ? inspireFirst(state, actor) : null;
  if (firstInspire) return firstInspire;
  const sig = state.yz?.eski ? imzaAi(state, actor) : bonusEvaluated(state, actor);
  if (sig) return sig;
  // Kuyruk K48 (Moral tam modu, basit kural): eylemi duruyorsa menzildeki çökmüş dostu toparla.
  if (!actor.economy.action && actor.moralMax !== undefined) {
    for (const c of Object.values(state.combatants)) {
      if (c.id === actorId || !c.effects?.some((e) => e.id === 'moral:cokmus')) continue;
      const cmd: Command = { type: 'moral_rally', actorId, targetId: c.id };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Kuyruk A6 (sürüm 35): eylemi duruyorsa bitişik, uyutulmuş/büyülenmiş dostu sarsarak uyandır (Sleep, Hypnotic Pattern).
  if (!actor.economy.action) {
    for (const c of Object.values(state.combatants)) {
      if (c.id === actorId || c.side !== actor.side || c.summon || c.hp <= 0) continue;
      if (!c.effects?.some((e) => e.shakeable || e.escapeCheck?.allyHelp) && !(c.conditionTimers ?? []).some((t) => t.wakeOnDamage && c.conditions.includes(t.condition))) continue;
      const cmd: Command = { type: 'help', actorId, targetId: c.id };
      if (tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
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
  // Kuyruk 19: Divine Sense: gizlenmiş Celestial/Fiend/Undead düşman varken ve etki yokken.
  if (canAct && !actor.economy.bonus && !(actor.effects ?? []).some((e) => e.senseTypes)) {
    for (const f of (actor.features ?? []).filter((x) => x.effect.kind === 'divineSense')) {
      const types = (f.effect as { types: string[] }).types;
      const cmd: Command = { type: 'use_feature', actorId, feature: f.key };
      if (foesOf(state, actor).some((c) => c.hidden && c.creatureType && types.includes(c.creatureType)) && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Süren güçlendirme özelliği (Sacred Weapon; basit kural): saldırabilecekken, etkin değilse ve yakında düşman varsa.
  if (actor.side === 'party' && canAct) {
    for (const f of (actor.features ?? []).filter((x) => x.effect.kind === 'buff')) {
      if (activeBuffs(state, actor).some((b) => b.source === f.name)) continue;
      const near = foesOf(state, actor).some((c) => (state.map ? !!c.pos && !!actor.pos && gap(state, c, actor) <= 2 : heightOf(state, c) === heightOf(state, actor)));
      const cmd: Command = { type: 'use_feature', actorId, feature: f.key };
      if (near && tryCmd(state, actor, cmd).ok) return cmd;
    }
  }
  // Kuyruk K20 (ev kuralı, basit kural): Göksel Uyanış: bonus eylem boşken 10 ft içinde düşman varsa.
  if (!actor.economy.bonus) {
    const wake = (actor.features ?? []).find((f) => f.effect.kind === 'celestialAwakening');
    const near = foesOf(state, actor).some((c) => (state.map ? !!c.pos && !!actor.pos && gap(state, c, actor) <= 2 : heightOf(state, c) === heightOf(state, actor)));
    const cmd: Command | null = wake ? { type: 'use_feature', actorId, feature: wake.key } : null;
    if (cmd && near && tryCmd(state, actor, cmd).ok) return cmd;
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
  // Kuyruk S1: Plane Shift ile geri çekilme (son çare).
  if (canAct) {
    const cmd = retreatChoice(state, actor);
    if (cmd) return cmd;
  }
  // Görev WIZARD (basit kural): felç eden save büyüsü (Hold Person) güçlü düşmanlara; yukarı slotta ek hedef.
  if (canAct && state.yz?.eski) {
    const cmd = holdChoice(state, actor) ?? blindChoice(state, actor) ?? sphereGuard(state, actor) ?? banishChoice(state, actor) ?? wallChoice(state, actor)
      // Denge turu (K20 ölçümü): üç+ düşmana hasar veren alan büyüsü (Fireball) varken kontrol alanı (Faerie Fire) beklemeli.
      ?? (areaSpell(state, actor, foesOf(state, actor)) ? null : controlArea(state, actor));
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
        && (c.id === actor.id || !state.map || (!!c.pos && !!actor.pos && gap(state, c, actor) * 5 <= buff.rangeFt)))
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
    return evaluatedNow(state, actor) ?? end;
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
  // Kuyruk 19: Find Steed atının bonus eylemleri: yarı canın altındaki bitişik dosta Healing Touch; görülen en güçlü düşmana Fell Glare.
  if (!actor.economy.bonus && steedActions(state, actor).length) {
    const kinds = steedActions(state, actor);
    const hurt = Object.values(state.combatants).filter((c) => c.side === actor.side && !c.summon && c.hp > 0 && c.hp < c.maxHp / 2 && c.pos && actor.pos && gap(state, c, actor) <= 1)[0];
    const glare = foesOf(state, actor).sort((a, b) => b.hp - a.hp)[0];
    const pick: Command | null = kinds.includes('healing-touch') && hurt ? { type: 'steed_action', actorId, kind: 'healing-touch', targetId: hurt.id }
      : kinds.includes('fell-glare') && glare ? { type: 'steed_action', actorId, kind: 'fell-glare', targetId: glare.id } : null;
    if (pick && tryCmd(state, actor, pick).ok) return pick;
  }

  // Kuyruk 14 K14A: düşman, yolundaki kapalı (kilitsiz) kapıyı tek etkileşimle açar (kırmaz, kilidi açmaz).
  const door = enemyDoor(state, actor);
  if (door) return door;
  // Kuyruk 16 K16D: barut fıçısı (alanında ≥ 2 kahraman, hiç müttefik yok) ve hedef taşıyıcısını/çıkışı kesme.
  const keg = canAct && aiOn(state, 'aiKeg') ? enemyKeg(state, actor) : null;
  if (keg) return keg;
  const cut = aiOn(state, 'aiCutRunner') ? enemyObjective(state, actor, canAct) : null;
  if (cut) return cut;
  // Kuyruk 18 H5: Ork Kampı takviyesi (hornReinforce) sürerken parti çadırları hedefler (çadır ayakta kaldıkça dalga gelir).
  const tent = canAct && aiOn(state, 'aiTentTarget') ? partyTent(state, actor) : null;
  if (tent) return tent;
  // Görev S3: hedef (ulaş, yok et, al ve çıkar) savaştan önce gelir.
  const goal = goalCommand(state, actor, canAct);
  if (goal) return goal;
  // Görev S1: kıstırılmış menzilli büyücü ışınlanır (Misty Step).
  const blink = teleportEscape(state, actor);
  if (blink) return blink;
  // Y1 G2 (arazi farkındalığı): tehlikeli altıgende (alev, zehir bulutu, lav kıyısı…) duruyorsa önce daha güvenli bir
  // yere yürür (orada da eylem yapabiliyorsa o yer önce; yoksa en güvenlisi).
  const leave = state.yz?.eski ? null : leaveHazard(state, actor);
  if (leave) return leave;
  const now = evaluatedNow(state, actor);
  // Parti: bu tur yürüyerek çok daha iyi bir saldırı yapabiliyorsa (en az %25 fazla ortalama
  // hasar; örn. savaşçı arbalet yerine kılıç) önce oraya yürür. Güvenli ve en ucuz yerler.
  if (now && canAct && actor.side === 'party' && !actor.civilian && actor.movementUsed < speedHexes(actor)) {
    // Y2: karşılaştırma iki uçta aynı ölçüyle (`bestNow`): değerlendiricinin buradaki seçimi ile eski kuralın oradaki
    // seçimi farklı komutlar olunca iki altıgen arasında ileri-geri yürüyordu (Mağara beraberlikleri; YZ-DENETIM Y2).
    const legacyHere = state.yz?.eski ? null : bestNow(state, actor);
    const here = Math.max(commandScore(state, actor, now), legacyHere ? commandScore(state, actor, legacyHere) : 0);
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
  // K59 (Dunganga, veride `yzYaklas`): yakın menzilli imza eylemi (Ninni 30 ft yarıçap, Sepet 30 ft) yalnız oradan
  // yapılabildiği için büyücü uzakta kalınca hiç seçilmiyordu. Temas yokken, eylem duruyorken: güvenli, düşmana
  // bitişik olmayan yerlerde değerlendiricinin en iyi imza adayı şimdiki en iyi hamleden iyiyse önce oraya yürür.
  // Yalnız işaretli eylemi olan yaratık (diğer alt sınıflar ve canavarlar değişmez).
  const near = nearImzaMove(state, actor, canAct, now);
  if (near) return near;
  // K59 (Usta, iki taraf): temas yokken (bitişik düşman yok: fırsat saldırısı yok) yetişilebilen başka bir hedefin
  // değerlendirici puanı şimdikinin `yerDegistir` katıysa önce oraya yürür (odaklı saldırı: yaralı/öldürülebilir hedef).
  // Ölçüm (K59): düşman tarafında zayıflattı (parti %72,8 → %75,3), parti tarafında güçlendirdi (+5): veride taraf listesi.
  const ustaNow = !state.yz?.eski && difficultyOf(state, actor.side) === 'usta' && USTA.yerDegistirTaraf.includes(actor.side) ? USTA : null;
  if (ustaNow && now && canAct && !actor.civilian && actor.pos && actor.movementUsed < speedHexes(actor)
    && !foesOf(state, actor).some((f) => f.pos && gap(state, f, actor) <= 1)) {
    const here = scoredCandidates(state, actor).scored[0]?.score ?? 0;
    if (here > 0) {
      const seen = new Set<string>();
      const spots: Spot[] = [];
      for (const sp of reachable(state, actor).filter((x) => risk(state, actor, x.to) < 50).sort((a, b) => a.cost - b.cost).slice(0, 30)) {
        const tgt = foesOf(state, actor).filter((f) => f.pos && distance(sp.to, f.pos) <= 1).map((f) => f.id).sort().join(',');
        if (!tgt || seen.has(tgt)) continue;
        seen.add(tgt);
        spots.push(sp);
        if (spots.length >= ustaNow.yerAday) break;
      }
      const best = spots.length ? ustaSpotOrder(state, actor, spots, ustaNow)[0] : undefined;
      if (best) {
        const there = at(state, actor, best.to);
        const v = scoredCandidates(there, there.combatants[actor.id] as Combatant).scored[0]?.score ?? 0;
        const go = v >= here * ustaNow.yerDegistir ? guardMove(state, actor, firstMove(state, actor, [best])) : null;
        if (go) return go;
      }
    }
  }
  // Steady Aim (Görev F): hareket etmeden, bu saldırı avantajsızsa (Sneak Attack tutmuyorsa) önce bonus eylemle nişan al.
  const aim = steadyAimFirst(state, actor, now);
  if (aim) return aim;
  // Haydut: buradan Sneak Attack tutmuyorsa, tutacağı (güvenli) bir yere yürür.
  // Y2: eski kural burada Sneak Attack buluyorsa yürümez (değerlendiricinin seçimi farklı olsa da; ileri-geri yürüme).
  const sneakHere = (): boolean => { const l = state.yz?.eski ? null : bestNow(state, actor); return !!l && sneakBonus(state, actor, l) > 0; };
  if (now && canAct && actor.sneakAttackDice > 0 && actor.sneakTurn !== `${state.round}:${state.turnIndex}` && sneakBonus(state, actor, now) === 0 && !sneakHere()) {
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
  // Y2: değerlendiricinin seçimi kötü koşullu (dezavantaj, yoğun siper) ama eski kural burada iyi koşullu bir eylem
  // buluyorsa yer değiştirmez: seçim olasılığı zaten içeriyor; yalnız ikisi de kötüyse daha iyi yere yürür (yoksa
  // değerlendirici ile eski kural farklı hedef seçince iki altıgen arasında ileri-geri yürüyordu; YZ-DENETIM Y2).
  const poorNow = now !== null && canAct && poorOdds(state, actor, now);
  const legacyNow = poorNow && !state.yz?.eski ? bestNow(state, actor) : null;
  const poor = poorNow && !(legacyNow && !poorOdds(state, actor, legacyNow));
  if (now && !poor) return withBrutal(state, actor, withCunning(state, actor, now));
  if (!canAct) return now ?? end;

  const foes = foesOf(state, actor);
  if (foes.length === 0) return now ?? end;
  const spots = reachable(state, actor);
  const ranged = actor.side === 'party' && actor.weaponOptions.some((o) => o.ranged);
  // Kuyruk 43: `h` çapasındaki gövdeden hedefin gövdesine (çok altıgen kapalıyken `distance`).
  const gapFrom = (h: Offset, t: Combatant) => footprintDistance(bodyAt(state, actor, h), bodyOf(state, t));
  const enemyNear = (h: Offset) => foes.some((f) => f.pos && gapFrom(h, f) === 1);

  // Eylem yapabileceği en ucuz ve en güvenli altıgen (menzilli parti üyesi bitişikten kaçınır).
  // Y1 G2: menzilli yaratık yükseklik kuralı açıkken yüksek zemini tercih eder (seviye başına 1 maliyet indirimi).
  const lift = (h: Offset) => (!state.yz?.eski && heightCombatRule(state) && (ranged || actor.weaponOptions.some((o) => o.ranged) || actor.attacks.some((a) => a.ranged)) ? heightAt(state, h) : 0);
  const scored = spots
    .map((s) => ({ ...s, score: s.cost + risk(state, actor, s.to) + (ranged && enemyNear(s.to) ? 3 : 0) - lift(s.to) }))
    .sort((a, b) => a.score - b.score);
  // K59 (Usta): saldırı yeri adayları çoğaltılır ve oradaki en iyi değerlendirici puanına göre sıralanır (yakın olan değil,
  // en değerli hedef: yaralı, öldürülebilir, tehlikeli); Normal/Kolay eskisi gibi en ucuz üç yer.
  const usta = !state.yz?.eski && difficultyOf(state, actor.side) === 'usta' ? USTA : null;
  let attackSpots: Spot[] = [];
  // Usta: hedef başına en ucuz yer (aynı hedefin yanındaki yerler tek aday), en çok `yerAday` hedef.
  const targetsSeen = new Set<string>();
  for (const s of scored) {
    const there = at(state, actor, s.to);
    const mover = { ...actor, pos: s.to };
    const cmd = bestNow(there, mover);
    if (cmd && (!poor || !poorOdds(there, mover, cmd))) {
      if (usta) {
        const near = foes.filter((f) => f.pos && gapFrom(s.to, f) <= 1).map((f) => f.id).sort().join(',') || ((cmd as { targetId?: string }).targetId ?? '');
        if (targetsSeen.has(near)) continue;
        targetsSeen.add(near);
      }
      attackSpots.push(s);
      if (attackSpots.length >= (usta ? usta.yerAday : 3)) break;
    }
  }
  if (usta && attackSpots.length > 1) attackSpots = ustaSpotOrder(state, actor, attackSpots, usta);
  const go = guardMove(state, actor, firstMove(state, actor, attackSpots));
  if (go) return go;
  if (now) return now;
  // Görev S1: yürüyerek hiçbir düşmana yetişemiyorsa ve uçarak yetişebilecekse kendine Fly.
  const fly = flyToReach(state, actor, attackSpots.length > 0);
  if (fly) return fly;

  // Yaklaş: en yakın hedefe mesafeyi en çok kısaltan güvenli altıgen.
  const nearest = (h: Offset) => Math.min(...foes.map((t) => gapFrom(h, t)));
  const here = nearest(actor.pos);
  const approach = spots
    .filter((s) => nearest(s.to) < here)
    .map((s) => ({ ...s, score: nearest(s.to) * 10 + risk(state, actor, s.to) + s.cost }))
    .sort((a, b) => a.score - b.score);
  // K17 G5: yürüyerek yaklaşamıyorsa yukarı tırman (kural sürümü 13).
  return guardMove(state, actor, firstMove(state, actor, approach)) ?? climbToward(state, actor, nearest, here) ?? end;
}

/**
 * Kuyruk 14 K14A: düşmanın kapı açması. Yalnızca nesneli haritalarda: bitişikteki kapalı (kilitli değil) kapı, en yakın
 * görünen kahramana düşmandan daha yakınsa (yolunun üstünde) açılır. Açma serbest etkileşim; kapı bir kez açılınca kalır.
 */
function enemyDoor(state: BattleState, actor: Combatant): Command | null {
  const objs = state.map?.objects;
  if (actor.side !== 'enemies' || actor.civilian || !actor.pos || !objs?.length) return null;
  const pos = actor.pos;
  const doors = objs.filter((o) => OBJECTS[o.kind]?.door && o.state === 'closed' && !o.carriedBy && distance(o.at, pos) === 1);
  if (!doors.length) return null;
  const foes = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.civilian && c.hp > 0 && c.pos && !c.hidden);
  if (!foes.length) return null;
  const nearest = (h: Offset) => Math.min(...foes.map((f) => distance(h, f.pos as Offset)));
  const door = doors.find((d) => nearest(d.at) < nearest(pos));
  if (!door) return null;
  const cmd: Command = { type: 'object_use', actorId: actor.id, objectId: door.id, action: 'open' };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * Kuyruk 16 K16D: açık "al ve çıkar" hedefinde nesneyi taşıyan kahraman; yoksa açık "ulaş" ya da "al ve çıkar" hedefinin
 * çıkış altıgenine en yakın (12 altıgen içinde) kahraman ve o çıkış. Hedefi olmayan haritada null (eski davranış).
 */
export function objectiveRunner(state: BattleState): (Combatant & { exit: Offset[] }) | null {
  const open = leafGoals(state.goals?.list ?? []).filter((g) => (g.kind === 'retrieve' || g.kind === 'reach') && g.hexes?.length && goalStatus(state, g) === 'open');
  if (!open.length) return null;
  const heroes = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.civilian && !c.summon && c.hp > 0 && c.pos);
  for (const g of open) {
    if (g.kind !== 'retrieve' || !g.objectId) continue;
    const ob = state.map?.objects?.find((o) => o.id === g.objectId);
    const carrier = ob?.carriedBy ? heroes.find((c) => c.id === ob.carriedBy) : undefined;
    if (carrier) return { ...carrier, exit: g.hexes as Offset[] };
  }
  let best: (Combatant & { exit: Offset[] }) | null = null;
  let bestD = 13;
  for (const g of open) {
    for (const c of heroes) {
      const d = Math.min(...(g.hexes as Offset[]).map((h) => distance(h, c.pos as Offset)));
      if (d < bestD) { bestD = d; best = { ...c, exit: g.hexes as Offset[] }; }
    }
  }
  return best;
}

/**
 * Kuyruk 16 K16D: taşıyıcıyı ve çıkışı kesme. Bu tur yürüyüp koşucuya saldırabiliyorsa oraya; bitişiğinde başka kahraman
 * yoksa koşucuyla çıkış arasına (koşucuya ya da çıkışa en yakın) yürür. Saldırı seçimi `byPriority` ile koşucuya öncelik verir.
 */
function enemyObjective(state: BattleState, actor: Combatant, canAct: boolean): Command | null {
  if (actor.side !== 'enemies' || actor.civilian || actor.summon || !actor.pos) return null;
  const runner = objectiveRunner(state);
  if (!runner?.pos) return null;
  const pos = actor.pos;
  if (canAct) {
    for (const cmd of monsterCommands(actor, runner.id, !!state.map)) if (tryCmd(state, actor, cmd).ok) return null; // şimdi vurabilir: normal akış (byPriority) vurur
    const spots = reachable(state, actor).filter((sp) => risk(state, actor, sp.to) < 50).sort((a, b) => a.cost - b.cost).slice(0, 30)
      .filter((sp) => monsterCommands({ ...actor, pos: sp.to }, runner.id, true).some((c) => tryCmd(at(state, actor, sp.to), { ...actor, pos: sp.to }, c).ok));
    const go = firstMove(state, actor, spots);
    if (go) return go;
  }
  const engaged = Object.values(state.combatants).some((c) => c.side === 'party' && c.hp > 0 && c.pos && distance(c.pos, pos) === 1);
  if (engaged) return null;
  // Yol kapatma: koşucunun çıkışa giden yolunda, koşucuya yakın altıgenler (çıkış altıgenleri ve koşucunun yanı).
  const exit = runner.exit.reduce((b, h) => (distance(h, runner.pos as Offset) < distance(b, runner.pos as Offset) ? h : b), runner.exit[0] as Offset);
  return moveToward(state, actor, [runner.pos, exit]);
}

/**
 * Kuyruk 16 K16D: düşman barut fıçısını hedefler: patlama yarıçapında (veri) en az `kegMinFoes` kahraman ve hiç müttefik
 * (kendisi dahil) yoksa, menzildeki fıçıya saldırır. Yalnızca patlama ev kuralı (`barutPatlama`) açıkken.
 */
function enemyKeg(state: BattleState, actor: Combatant): Command | null {
  const objs = state.map?.objects;
  if (actor.side !== 'enemies' || actor.civilian || actor.summon || !actor.pos || !objs?.length || !houseRule(state, 'barutPatlama')) return null;
  const r = OBJECT_DATA.keg.radiusHexes;
  for (const ob of objs) {
    if (!OBJECTS[ob.kind]?.explodes || ob.carriedBy || ob.hp <= 0) continue;
    const inBlast = (c: Combatant) => !!c.pos && c.hp > 0 && distance(c.pos, ob.at) <= r;
    const foes = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.civilian && inBlast(c)).length;
    const friends = Object.values(state.combatants).filter((c) => c.side === 'enemies' && inBlast(c)).length;
    if (foes < ALARM.kegMinFoes || friends > 0) continue;
    const cmd = objectAttackCommand(actor, ob);
    if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/** Kuyruk 18 H5: yapay zekâ hedef davranışlarının Game Master anahtarları (global; kapalıysa davranış yok). */
const aiOn = (state: BattleState, id: string): boolean => !!globalRule(state, id);

/**
 * Kuyruk 18 H5: Ork Kampı sürekli takviyesi (`hornReinforce`) varken parti yapay zekâsı ayakta çadırı hedefler: bitişikteki
 * çadırı tutuşturur (tentFire); 4 altıgen içinde düşman yoksa ve en çok iki düşman görüyorsa menzildeki çadıra saldırır ya
 * da en yakın çadıra yürür (kalabalıkta önce dövüş; ilk ölçümde koşulsuz hedefleme kazanmayı %93'ten %43'e düşürdü).
 */
function partyTent(state: BattleState, actor: Combatant): Command | null {
  if (actor.side !== 'party' || actor.civilian || actor.summon || !actor.pos || !state.map || !ruleOf(state, 'hornReinforce')) return null;
  const tents = (state.map.objects ?? []).filter((o) => o.kind === 'tent' && o.hp > 0 && o.state !== 'burning');
  if (!tents.length) return null;
  const pos = actor.pos;
  const near = [...tents].sort((a, b) => distance(a.at, pos) - distance(b.at, pos));
  // Bitişikteki çadır tutuşturulur (çadır yangını kuralı; eylem): dövüşte bile değer, çadır ve yanındakiler yanar.
  for (const t of near.filter((x) => distance(x.at, pos) <= 1)) {
    const cmd: Command = { type: 'object_use', actorId: actor.id, objectId: t.id, action: 'ignite' };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  // Saldırı ve yürüme yalnızca 4 altıgen içinde görülen düşman yokken ve en çok iki düşman görülürken.
  const foes = foesOf(state, actor);
  if (foes.length > 2 || foes.some((f) => f.pos && distance(f.pos, pos) <= 4)) return null;
  for (const t of near) {
    const cmd = objectAttackCommand(actor, t);
    if (cmd && tryCmd(state, actor, cmd).ok) return cmd;
  }
  const first = near[0];
  return first ? moveToward(state, actor, [first.at]) : null;
}

/** Görev S3: hedef altıgenlerinden birine en çok yaklaştıran güvenli yer (yaklaştırmıyorsa yok). */
function moveToward(state: BattleState, actor: Combatant, targets: Offset[], ok: (h: Offset) => boolean = () => true): Command | null {
  if (!actor.pos || !targets.length) return null;
  const near = (h: Offset) => Math.min(...targets.map((t) => distance(h, t)));
  const here = near(actor.pos);
  const lift = (h: Offset) => (heightCombatRule(state) ? heightAt(state, h) : 0);
  const spots = reachable(state, actor)
    .filter((sp) => near(sp.to) < here && risk(state, actor, sp.to) < 50 && ok(sp.to))
    // Kuyruk 26: yükseklik katmanında eşit uzaklıkta yüksek zemin tercih edilir (hafif; katmansız haritada 0).
    .sort((a, b) => near(a.to) - near(b.to) || lift(b.to) - lift(a.to) || a.cost - b.cost);
  return firstMove(state, actor, spots) ?? climbToward(state, actor, near, here);
}

/**
 * K17 G5 (kural sürümü 13): yürüyerek yaklaşılamıyorsa yukarı tırmanma (Atletizm, `climb`): hedefe yaklaştıran, daha
 * yüksek ve tehlikesiz komşu uçurum altıgeni. Aşağı atlamaz (düşme hasarı).
 */
function climbToward(state: BattleState, actor: Combatant, near: (h: Offset) => number, here: number): Command | null {
  if (ruleVersion(state) < 13 || !actor.pos) return null;
  const from = heightAt(state, actor.pos);
  const opts = climbTargets(state, actor).filter((h) => heightAt(state, h) > from && near(h) < here && risk(state, actor, h) < 50)
    .sort((a, b) => near(a) - near(b) || a.col - b.col || a.row - b.row);
  for (const to of opts) {
    const cmd: Command = { type: 'climb', actorId: actor.id, to };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
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
  // Kuyruk 14 K14A: sızma (uyuyan/habersiz grup varken ve açık sızma hedefi varken): gözcü yakındaysa gizlenir, gizli
  // ilerler; habersiz ya da uyuyan bir gözcünün fark edeceği altıgenlerden kaçınır (SRD 5.2.1 Hide).
  const watchers = ALARM.aiHide !== false && (state.groups ?? []).some((g) => g.state !== 'alarmed') && sneaking(state)
    ? Object.values(state.combatants).filter((c) => c.side === 'enemies' && (c.asleep || c.unaware) && c.hp > 0 && c.pos) : [];
  const unseen = (h: Offset): boolean => {
    const me = { ...actor, pos: h };
    return !watchers.some((w) => noticesHero(state, w, me));
  };
  if (watchers.length && !engaged) {
    const close = watchers.some((w) => distance(w.pos as Offset, pos) * 5 <= ALARM.calmSightFt + speedHexes(actor) * 5);
    if (close && !actor.hidden) {
      const hide: Command = { type: 'hide', actorId: actor.id, ...(actor.economy.action && bonusOptionsOf(actor).includes('hide') ? { bonus: true } : {}) };
      if (hideCheck(state, actor).ok && tryCmd(state, actor, hide).ok) return hide;
      // Buradan gizlenilemiyorsa: fark edilmeyen bir gizlenme yerine yürü (sonra gizlenir).
      if (!actor.economy.action && actor.movementUsed < speedHexes(actor)) {
        const spots = reachable(state, actor)
          .filter((sp) => risk(state, actor, sp.to) < 50 && unseen(sp.to) && hideCheck(at(state, actor, sp.to), { ...actor, pos: sp.to }).ok)
          .sort((a, b) => a.cost - b.cost);
        const go = firstMove(state, actor, spots);
        if (go) return go;
      }
    }
  }
  const sneak = watchers.length ? unseen : undefined;
  const party = Object.values(state.combatants).filter((c) => c.side === 'party' && !c.summon && !c.civilian && c.hp > 0 && c.pos);
  for (const g of leafGoals(state.goals.list)) {
    if (goalStatus(state, g) !== 'open') continue;
    const ob = g.objectId ? state.map.objects?.find((x) => x.id === g.objectId) : undefined;
    if (g.kind === 'retrieve' && ob && g.hexes?.length) {
      if (ob.carriedBy === actor.id) { const go = moveToward(state, actor, g.hexes, sneak); if (go) return go; continue; }
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
      const there = reachable(state, actor).filter((sp) => keys.has(hexKey(sp.to)) && risk(state, actor, sp.to) < 50 && (!sneak || sneak(sp.to))).sort((a, b) => a.cost - b.cost);
      const go = firstMove(state, actor, there);
      if (go) return go;
      if (!engaged) { const near = (sneak && moveToward(state, actor, g.hexes, sneak)) || moveToward(state, actor, g.hexes); if (near) return near; }
    }
    if (g.kind === 'destroy' && ob && !ob.carriedBy) {
      const hit = canAct ? objectAttackCommand(actor, ob) : null;
      if (hit && tryCmd(state, actor, hit).ok) return hit;
      if (canAct && !engaged && distance(pos, ob.at) > 1) {
        const size = { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length };
        const go = (sneak && moveToward(state, actor, neighbors(ob.at, size), sneak)) || moveToward(state, actor, neighbors(ob.at, size));
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
  if (!foes.some((f) => gap(state, f, actor) === 1)) return null;
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
    && a.hp > 0 && a.pos && f.pos && gap(state, a, f) === 1);
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
  // Kuyruk 19 (srdK19): hareket veren bonus eylem yetenekleri (Charge, Leap, Aquatic Charge) yürümeden önce, düşman yanında değilken.
  if (!actor.economy.bonus && actor.movementUsed === 0 && !foesOf(state, actor).some((f) => f.pos && actor.pos && gap(state, f, actor) <= 1)) {
    for (const a of abilitiesOf(state, actor)) {
      if (a.cost !== 'bonus' || !abilityReady(actor, a) || !(a.moveOnly || a.jumpFt || a.leapFt)) continue;
      const cmd: Command = { type: 'monster_ability', actorId: actor.id, abilityId: a.id };
      if (worthIt(state, actor, cmd)) return cmd;
    }
  }
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
  const near = (c: Combatant, ft: number) => !state.map || (!!c.pos && !!actor.pos && gap(state, c, actor) * 5 <= ft);
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
 * Kuyruk S1 (sürüm 40, Plane Shift `retreat`): son çare: tarafın ayakta kalanlarının canı toplamın %20'sinin altında,
 * karşı tarafınki %50'nin üstündeyken büyücü bitişik (zincirle) dostlarıyla haritadan ayrılır.
 */
function retreatChoice(state: BattleState, actor: Combatant): Command | null {
  if (ruleVersion(state) < 40) return null;
  const sp = castable(actor).find((x) => mechanicsAt(state, x).retreat);
  if (!sp) return null;
  const side = (c: Combatant) => c.allegiance?.side ?? c.side;
  const members = (s: string) => Object.values(state.combatants).filter((c) => side(c) === s && !c.summon && !c.civilian && !c.offFloor);
  const frac = (cs: Combatant[]) => cs.reduce((n, c) => n + Math.max(0, c.hp), 0) / Math.max(1, cs.reduce((n, c) => n + c.maxHp, 0));
  const mine = members(side(actor));
  const theirs = Object.values(state.combatants).filter((c) => side(c) !== side(actor) && !c.summon && !c.civilian && !c.offFloor);
  if (frac(mine) >= 0.2 || frac(theirs) <= 0.5) return null;
  const max = mechanicsAt(state, sp).retreat?.max ?? 8;
  const chain = [actor.id];
  for (let grew = true; grew && chain.length <= max;) {
    grew = false;
    for (const c of mine) {
      if (chain.includes(c.id) || c.hp <= 0 || chain.length > max) continue;
      if (chain.some((id) => gap(state, c, state.combatants[id] as Combatant) <= 1)) { chain.push(c.id); grew = true; }
    }
  }
  const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: sp.name, targetIds: chain };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * K17 G1: Banishment: en az iki ayakta düşman varken en çok HP'li (30+) düşmanı sürgün eder (tek düşmanı sürmek savaşı
 * yalnızca erteler). Konsantrasyon sürerken ya da güçlü sürdürülen büyü varken yapmaz (Hold Person kuralı).
 */
function banishChoice(state: BattleState, actor: Combatant): Command | null {
  // Kuyruk 18 H2: aynı kuralla Dominate Person/Beast (yönetilen düşman bizim için savaşır), Polymorph (düşman zayıf
  // Beast olur) ve Resilient Sphere (güçlü düşman kürede yalıtılır). Öncelik: Dominate > Polymorph > Banishment > küre.
  if (actor.concentration || castable(actor).some((s) => s.concentration && !!s.mechanics.lingering)) return null;
  const foes = foesOf(state, actor).filter((c) => c.hp > 0);
  if (foes.length < 2) return null;
  const rank = (s: (typeof spells)[number]) => { const e = s.mechanics.effect; return e?.dominate ? 0 : e?.polymorph ? 1 : e?.banished ? 2 : 3; };
  const spells = castable(actor).filter((s) => s.mechanics.kind === 'effect'
    && (!!s.mechanics.effect?.banished || !!s.mechanics.effect?.dominate || !!s.mechanics.effect?.polymorph || !!s.mechanics.effect?.sealed))
    .sort((a, b) => rank(a) - rank(b));
  for (const spell of spells) {
    const types = spell.mechanics.effect?.onlyTypes;
    const target = foes.filter((c) => c.hp >= 30 && !c.shape && !c.effects?.some((e) => e.banished || e.dominate || e.polymorph || e.sealed)
      && (!types || types.includes(c.creatureType ?? 'humanoid')))
      .sort((a, b) => b.hp - a.hp)[0];
    if (!target) continue;
    const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId: target.id };
    if (worthIt(state, actor, cmd)) return cmd;
  }
  return null;
}

/**
 * Kuyruk 18 H2: Resilient Sphere ile koruma: çok yaralı (en çok HP'sinin ≤ %25'i), düşmana bitişik ayakta dost (büyücünün
 * kendisi değil) küreye alınır: içerideyken hasar almaz. Konsantrasyon sürerken yapılmaz.
 */
function sphereGuard(state: BattleState, actor: Combatant): Command | null {
  const spell = castable(actor).find((s) => s.mechanics.kind === 'effect' && !!s.mechanics.effect?.sealed);
  if (!spell || actor.concentration) return null;
  const foes = foesOf(state, actor).filter((c) => c.hp > 0 && c.pos);
  const ally = Object.values(state.combatants)
    .filter((c) => c.side === actor.side && c.id !== actor.id && !c.summon && !c.civilian && c.hp > 0 && c.pos && c.hp <= c.maxHp * 0.25
      && !c.effects?.some((e) => e.sealed) && foes.some((f) => gap(state, f, c) <= 1))
    .sort((a, b) => a.hp - b.hp)[0];
  if (!ally) return null;
  const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId: ally.id };
  return tryCmd(state, actor, cmd).ok ? cmd : null;
}

/**
 * Kuyruk 18 H2: Wall of Force / Wall of Stone ile bölme: duvar büyücüden düşmana doğru çizginin dik açısıyla, bir düşmanın
 * bize yakın yanına kurulur. Duvarın öte yanında en az iki ayakta düşman kalmalı ve hiç dost olmamalı; duvarın altıgenlerinde yaratık olmamalı. En çok düşmanı öteye ayıran duvar seçilir. Yalnızca 3+
 * düşmanda ve konsantrasyon yokken.
 */
function wallChoice(state: BattleState, actor: Combatant): Command | null {
  if (!state.map || !actor.pos || actor.concentration) return null;
  const walls = castable(actor).filter((s) => s.area?.shape === 'wall' && !!s.mechanics.zone?.solid);
  if (walls.length === 0) return null;
  const foes = foesOf(state, actor).filter((c) => c.hp > 0 && c.pos);
  if (foes.length < 3) return null;
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.pos);
  const me = hexCenter(actor.pos);
  let best: { cmd: Command; beyond: number } | null = null;
  for (const spell of walls) {
    for (const f of foes) {
      const fp = f.pos as Offset;
      // Düşmandan büyücüye doğru bir adım: duvar onun önüne iner.
      const step = neighbors(fp, { cols: state.map.tiles[0]?.length ?? 0, rows: state.map.tiles.length })
        .sort((a, b) => distance(a, actor.pos as Offset) - distance(b, actor.pos as Offset))[0];
      if (!step || distance(step, actor.pos) < 2) continue;
      const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetHex: step };
      const r = tryCmd(state, actor, cmd);
      const made = r.ok ? r.events.find((e) => e.type === 'zone_created') : undefined;
      if (made?.type !== 'zone_created') continue;
      const hexes = made.zone.hexes;
      if (Object.values(state.combatants).some((c) => c.hp > 0 && c.pos && hexes.some((h) => h.col === c.pos?.col && h.row === c.pos?.row))) continue;
      const a = hexCenter(step);
      const dir = { x: a.x - me.x, y: a.y - me.y };
      const side = (c: Combatant) => { const p = hexCenter(c.pos as Offset); return (p.x - a.x) * dir.x + (p.y - a.y) * dir.y > 0; };
      const beyond = foes.filter(side).length;
      if (beyond < 2 || allies.some(side)) continue;
      if (!best || beyond > best.beyond) best = { cmd, beyond };
    }
  }
  return best && worthIt(state, actor, best.cmd) ? best.cmd : null;
}

/**
 * Kuyruk 19: seçimli durum büyüsü (Blindness/Deafness): en güçlü (≥ 20 HP), henüz kör olmayan düşmana. Görüşe dayanmayan
 * (Blindsight/Truesight/Tremorsense) hedefte Blinded işe yaramaz: Deafened; yoksa Blinded (saldırısı dezavantajlı, ona
 * saldırı avantajlı). Kalabalıkta (4+) alan büyüsü öncelikli. Anahtar `aiBlindness` (sürüm 16).
 */
export function blindChoice(state: BattleState, actor: Combatant): Command | null {
  if (!globalRule(state, 'aiBlindness')) return null;
  const spell = castable(actor).find((s) => s.mechanics.kind === 'save' && !s.area && (s.mechanics.conditionChoices ?? []).includes('Blinded'));
  if (!spell) return null;
  if (foesOf(state, actor).filter((c) => c.hp > 0).length > 3) return null;
  const foe = foesOf(state, actor).filter((c) => c.hp >= 20 && !c.conditions.includes('Blinded') && !c.conditions.includes('Deafened'))
    .sort((a, b) => b.hp - a.hp)[0];
  if (!foe) return null;
  const sees = !!(foe.senses?.blindsight || foe.senses?.truesight || foe.senses?.tremorsense || foe.traits?.includes('boon-truesight'));
  const cmd: Command = { type: 'cast_spell', actorId: actor.id, spellName: spell.name, targetId: foe.id, choice: sees ? 'Deafened' : 'Blinded' };
  return worthIt(state, actor, cmd) ? cmd : null;
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


// ---------------------------------------------------------------------------------------------------------------
// Y1 G2: ortak değerlendirici bağlantısı. Eski kural zincirinin üreticileri açıklayıcı olarak kaydedilir; karar
// noktasında (`bestNow`'un yeri) bütün adaylar kuru çalıştırmayla puanlanır. `state.yz.eski` eski zinciri çalıştırır.

const threatCache = new WeakMap<BattleState, Map<string, number>>();
/** Yaratığın bir turluk tehdidi (beklenen hasar; canavar saldırıları, silah × saldırı sayısı, en iyi hasar büyüsü). */
function threatOf(state: BattleState, c: Combatant): number {
  let m = threatCache.get(state);
  if (!m) { m = new Map(); threatCache.set(state, m); }
  const hit = m.get(c.id);
  if (hit !== undefined) return hit;
  const mon = c.attacks.length ? monsterAttackScore(c) : 0;
  const weapon = c.weaponOptions.reduce((x, o) => Math.max(x, avg(o.damage)), 0) * Math.max(1, c.attacksPerAction);
  const spell = castable(c).reduce((x, s) => Math.max(x, s.mechanics.damage ? avg(s.mechanics.damage) * (s.area ? 2 : 1) : 0), 0);
  const v = Math.max(1, mon, weapon, spell);
  m.set(c.id, v);
  return v;
}

function aiHelpers(state: BattleState, actor: Combatant): AiHelpers {
  const canAct = !actor.economy.action || actor.economy.attacksLeft > 0;
  return {
    foes: byPriority(actor, foesOf(state, actor), state),
    allies: Object.values(state.combatants).filter((c) => c.side === actor.side && c.hp > 0 && c.life !== 'dead' && !c.civilian && !c.summon?.gone),
    ok: (cmd) => tryCmd(state, actor, cmd).ok,
    threat: (c) => threatOf(state, c),
    risk: (c, h) => risk(state, c, h),
    priorityKeys: (c) => {
      const keys: string[] = [];
      if (c.grapple?.by === actor.id) keys.push('yakalanan');
      if (actor.side === 'enemies' && aiOn(state, 'aiCutRunner') && objectiveRunner(state)?.id === c.id) keys.push('kosucu');
      if (actor.imza === 'imza_infazci' && c.effects?.some((e) => e.id === `imza:imza_infazci/verdict:${actor.id}`)) keys.push('hukumlu');
      if (actor.marks?.some((m) => m.kind === 'vex' && m.targetId === c.id)) keys.push('vex');
      const owner = actor.summon ? state.combatants[actor.summon.by] : undefined;
      if (owner?.pos && c.pos && gap(state, owner, c) <= 1) keys.push('sahipKoruma');
      return keys;
    },
    canAct,
  };
}

const partyBranch = (a: Combatant) => a.side === 'party' && !a.summon;
const monsterBranch = (a: Combatant) => !partyBranch(a);

/** Eylem (ya da bonus/serbest) harcayan imza özelliklerinin adayları (ipucu sezgiselleri kapısız, yoksa hedef listesi). */
function imzaActionCands(state: BattleState, actor: Combatant, h: AiHelpers, tur: 'action' | 'bonus' = 'action', hints: boolean | 'only' | 'gated' = true): Command[] {
  if (tur === 'action' ? actor.economy.action : false) return [];
  const out: Command[] = [];
  const foes = [...h.foes].sort((a, b) => a.hp - b.hp);
  const wounded = h.allies.filter((c) => c.hp <= c.maxHp * 0.6).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  for (const f of (actor.features ?? []).filter((x) => x.key.startsWith('imza:'))) {
    const spec = IMZA_SPECS[f.key];
    if (!spec) continue;
    if (tur === 'action' ? spec.tur !== 'action' : (spec.tur === 'action' || (spec.tur === 'bonus' && actor.economy.bonus)
      || (spec.tur !== 'bonus' && actor.economy.action))) continue;
    if (spec.yz) { if (hints) out.push(...imzaHintCmds(state, actor, f.key, spec, foes, h.allies, { gate: hints === 'gated' }).slice(0, 3)); continue; }
    if (hints === 'only' || hints === 'gated') continue;
    const marked = Object.values(state.combatants).some((c) => c.effects?.some((e) => e.id === `${f.key}:${actor.id}`));
    if ((spec.tek || spec.bag) && marked) continue;
    let cands: Array<string | undefined> = [undefined];
    if (spec.hedef === 'enemy' || spec.hedef === 'areaEnemies') cands = foes.map((c) => c.id);
    else if (spec.iyilestir) cands = spec.hedef === 'allies' ? (wounded.length >= 1 ? [undefined] : []) : wounded.map((c) => c.id);
    else if (spec.hedef === 'ally' || spec.hedef === 'allyOrSelf') cands = spec.temizle ? h.allies.filter((c) => c.conditions.some((x) => spec.temizle?.includes(x))).map((c) => c.id)
      : h.allies.filter((c) => c.id !== actor.id).sort((a, b) => b.hp - a.hp).map((c) => c.id);
    for (const targetId of cands.slice(0, 3)) out.push({ type: 'use_feature', actorId: actor.id, feature: f.key, ...(targetId ? { targetId } : {}) });
  }
  return out;
}

registerAction({ id: 'eski:itme', rule: true, kind: 'damage', note: 'ölümcül itme (lav, uçurum, batak, 20+ ft)', gen: (s, a, h) => [deadlyShove(s, a, h.foes)] });
registerAction({ id: 'eski:iyilestir', rule: true, kind: 'heal', note: 'ölmekte olan / çok yaralı dosta iyileştirme büyüsü', gen: (s, a) => (partyBranch(a) ? [healAlly(s, a)] : []) });
registerAction({ id: 'eski:yenilenme', rule: true, kind: 'damage', note: 'yerdeki yenilenen düşmana ateş/asit', gen: (s, a) => (partyBranch(a) ? [finishRegen(s, a)] : []) });
registerAction({ id: 'eski:alan', rule: true, kind: 'damage', note: 'alan hasar büyüsü (2+ düşman, dost yok)', gen: (s, a, h) => (partyBranch(a) || (a.monsterId && a.spellNames.length && !a.summon) ? [areaSpell(s, a, h.foes)] : []) });
registerAction({ id: 'eski:soz', rule: true, kind: 'damage', note: 'Power Word Kill/Stun, Mass Heal', gen: (s, a, h) => (partyBranch(a) ? [powerWordCommand(s, a, h.foes)] : []) });
registerAction({ id: 'eski:zemin', rule: true, kind: 'control', note: 'kalıcı zemin büyüsü (Entangle, Web, Spike Growth…)', gen: (s, a, h) => (partyBranch(a) || (a.spellNames.length && !a.summon) ? [zoneSpell(s, a, h.foes)] : []) });
registerAction({ id: 'eski:nefes', rule: true, kind: 'damage', note: 'Dragonborn nefesi', gen: (s, a, h) => (partyBranch(a) ? [breathWeapon(s, a, h.foes)] : []) });
registerAction({
  id: 'eski:tek', kind: 'damage', note: 'tek hedefli silah/büyü (öncelikli 4 düşman × en iyi 3 seçenek)',
  gen: (s, a, h) => {
    if (!partyBranch(a) && !(a.monsterId && a.spellNames.length && !a.summon)) return [];
    const out: Command[] = [];
    for (const t of h.foes.slice(0, 4)) {
      const opts = partyOptions(a, t, s).filter((o) => partyBranch(a) || o.cmd.type === 'cast_spell');
      out.push(...opts.slice(0, 3).map((o) => o.cmd));
    }
    return out;
  },
});
registerAction({
  id: 'eski:kontrol', rule: true, kind: 'control', note: 'Hold Person, Blindness, Resilient Sphere, Banishment/Dominate/Polymorph, Wall, kontrol alanı',
  gen: (s, a, h) => (h.canAct ? [holdChoice(s, a), blindChoice(s, a), sphereGuard(s, a), banishChoice(s, a), wallChoice(s, a), controlArea(s, a)] : []),
});
registerAction({ id: 'eski:imzaIpucu', rule: true, kind: 'control', note: 'imza ipucu sezgiselleri (K54b/K54c `yz`, slot kapısıyla: kural önceliği)', gen: (s, a, h) => imzaActionCands(s, a, h, 'action', 'gated') });
registerAction({ id: 'eski:imzaIpucuKapisiz', kind: 'control', note: 'imza ipucu sezgiselleri (kapısız: yalnız puanıyla)', gen: (s, a, h) => imzaActionCands(s, a, h, 'action', 'only') });
registerAction({ id: 'eski:imza', kind: 'control', note: 'eylem harcayan imza alt sınıf özellikleri (ipucusuz)', gen: (s, a, h) => imzaActionCands(s, a, h, 'action', false) });
registerAction({ id: 'eski:yetenek', rule: true, kind: 'damage', note: 'SRD canavar yetenekleri', gen: (s, a) => (monsterBranch(a) ? [abilityCommand(s, a)] : []) });
registerAction({ id: 'eski:alanSaldiri', rule: true, kind: 'damage', note: 'canavar alanlı saldırısı / nefes', gen: (s, a) => (monsterBranch(a) ? [areaAttack(s, a)] : []) });
registerAction({ id: 'eski:coklu', rule: true, kind: 'damage', note: 'SRD Multiattack planı', gen: (s, a, h) => (monsterBranch(a) ? [multiPlanCommand(s, a, h.foes)] : []) });
registerAction({
  id: 'eski:saldiri', kind: 'damage', note: 'canavar saldırıları (öncelikli 3 düşman)',
  gen: (s, a, h) => (monsterBranch(a) ? h.foes.slice(0, 3).flatMap((t) => monsterCommands(a, t.id, !!s.map)) : []),
});

/** Rol türetmesi için büyü sayıları (iyileştirme, durum veren). */
function spellKinds(actor: Combatant): { heal: number; control: number } {
  const cs = castable(actor);
  return {
    heal: cs.filter((x) => x.mechanics.kind === 'heal').length,
    control: cs.filter((x) => !!x.mechanics.failEffect || (x.mechanics.conditions ?? []).length > 0 || !!x.mechanics.zone).length,
  };
}

const MAX_CANDIDATES = 24;
const LEGACY: Candidate['desc'] = { id: 'eski:zincir', kind: 'utility', note: 'Y1 öncesi kural zincirinin seçimi', gen: () => [] };

/** Adayların puanlı listesi (testler ve K58 açıklaması için de). */
export function scoredCandidates(state: BattleState, actor: Combatant) {
  const legacy = bestNow(state, actor);
  const h = aiHelpers(state, actor);
  const cands = candidatesFor(state, actor, h).slice(0, MAX_CANDIDATES);
  if (legacy && !cands.some((c) => JSON.stringify(c.cmd) === JSON.stringify(legacy))) cands.push({ cmd: legacy, desc: LEGACY });
  return { legacy, helpers: h, scored: evaluateCandidates(state, actor, cands, h, roleOf(actor, spellKinds(actor)), legacy, difficultyOf(state, actor.side)) };
}

/** K59: imza bardı, dostlarda kendi ilhamı yokken (ve yarı canın altında dost yokken) önce bir Bardic Inspiration (en çok saldıran dosta). */
function inspireFirst(state: BattleState, actor: Combatant): Command | null {
  if (actor.economy.bonus || !foesOf(state, actor).length) return null;
  const insp = (actor.features ?? []).find((f) => f.effect.kind === 'inspire');
  if (!insp || (insp.resource && resourceLeft(actor, insp.resource) <= 0)) return null;
  const allies = Object.values(state.combatants).filter((c) => c.side === actor.side && c.id !== actor.id && !c.civilian && c.hp > 0 && !c.summon);
  if (allies.some((c) => c.effects?.some((e) => e.inspire && e.sourceId === actor.id))) return null;
  // Yaralı dost (yarı canın altı) varken Övgü önce gelir.
  if (allies.some((c) => c.hp <= c.maxHp * 0.5)) return null;
  for (const a of allies.filter((c) => !c.effects?.some((e) => e.inspire)).sort((x, y) => y.attacksPerAction - x.attacksPerAction || y.level - x.level)) {
    const cmd: Command = { type: 'use_feature', actorId: actor.id, feature: insp.key, targetId: a.id };
    if (tryCmd(state, actor, cmd).ok) return cmd;
  }
  return null;
}

/** K59: `yzYaklas` işaretli imza eylemi için yaklaşma (bkz. `decide`). */
function nearImzaMove(state: BattleState, actor: Combatant, canAct: boolean, now: Command | null): Command | null {
  if (!canAct || state.yz?.eski || actor.civilian || !actor.pos || !state.map || actor.movementUsed >= speedHexes(actor)) return null;
  const keys = (actor.features ?? []).filter((f) => (IMZA_SPECS[f.key] as { yzYaklas?: boolean } | undefined)?.yzYaklas).map((f) => f.key);
  if (!keys.length) return null;
  const foes = foesOf(state, actor);
  if (foes.some((f) => f.pos && gap(state, f, actor) <= 1)) return null;
  const imzaBest = (s: BattleState, c: Combatant) => scoredCandidates(s, c).scored
    .filter((x) => x.cmd.type === 'use_feature' && keys.includes((x.cmd as { feature: string }).feature))[0]?.score ?? 0;
  const here = Math.max(now ? commandScore(state, actor, now) : 0, scoredCandidates(state, actor).scored[0]?.score ?? 0);
  if (imzaBest(state, actor) >= here) return null;
  let best: { sp: Spot; v: number } | null = null;
  const spots = reachable(state, actor).filter((sp) => sp.kind === 'move' && risk(state, actor, sp.to) < 20
    && !foes.some((f) => f.pos && distance(f.pos, sp.to) <= 1) && foes.some((f) => f.pos && distance(f.pos, sp.to) <= 6))
    .sort((a, b) => a.cost - b.cost).slice(0, 12);
  for (const sp of spots) {
    const there = at(state, actor, sp.to);
    const v = imzaBest(there, there.combatants[actor.id] as Combatant) - sp.cost * NEAR_COST;
    if (v > here && (!best || v > best.v)) best = { sp, v };
  }
  return best ? guardMove(state, actor, firstMove(state, actor, [best.sp])) : null;
}
/** Yaklaşmada altıgen başına puan cezası. */
const NEAR_COST = 0.5;

/** K59: Usta'nın yer seçimi parametreleri (`data/yz-roller.json` `zorluk.usta`). */
const USTA = aiRoles.zorluk.usta as { yerAday: number; yerMaliyet: number; yerDegistir: number; yerDegistirTaraf: string[] };
/**
 * K59 (Usta): saldırı yeri adaylarını oradaki en iyi değerlendirici adayının puanına göre sıralar (eşitlikte ucuz olan);
 * yer maliyeti (yürüme + risk) `yerMaliyet` ile düşülür. Kuru çalıştırma; durum değişmez.
 */
function ustaSpotOrder(state: BattleState, actor: Combatant, spots: Array<Spot & { score?: number }>, u: typeof USTA): Spot[] {
  const ranked = spots.map((s, i) => {
    const there = at(state, actor, s.to);
    const mover = there.combatants[actor.id] as Combatant;
    const best = scoredCandidates(there, mover).scored[0];
    return { s, i, v: (best?.score ?? 0) - u.yerMaliyet * (s.score ?? s.cost) };
  });
  return ranked.sort((a, b) => b.v - a.v || a.i - b.i).map((r) => r.s);
}

/** Usta: komut uygulandıktan sonra aynı yaratığın en iyi sonraki komutunun puanı (ileri bakış yok). */
function followScore(state: BattleState, actor: Combatant, cmd: Command): number {
  const r = tryCmd(state, actor, cmd);
  if (!r.ok || r.state.status !== 'active') return 0;
  const next = r.state.combatants[actor.id];
  if (!next || next.hp <= 0 || currentActorId(r.state) !== actor.id) return 0;
  const { scored } = scoredCandidates(r.state, next);
  return scored[0]?.score ?? 0;
}

/**
 * Y1 G3: bonus/serbest eylem seçimi (imza bonus özellikleri, Zihin Gücü kipleri, Yetişen Yol Adımı, Cloud's Jaunt /
 * Blink Steps kaçışı, iyileştirme iksiri). Olumlu puanlı en iyi aday; yoksa eski kural (ilk geçerli imza bonus özelliği).
 */
export function bonusScored(state: BattleState, actor: Combatant) {
  const legacy = imzaAi(state, actor);
  if (actor.civilian) return { legacy, scored: [] };
  const h = aiHelpers(state, actor);
  const cmds = [...imzaActionCands(state, actor, h, 'bonus'), ...bonusPoolCands(state, actor, h)];
  if (!cmds.length) return { legacy, scored: [] };
  const desc: Candidate['desc'] = { id: 'g3:bonus', kind: 'support', note: 'bonus/serbest havuz', gen: () => [] };
  return { legacy, scored: evaluateCandidates(state, actor, cmds.map((cmd) => ({ cmd, desc })), h, roleOf(actor, spellKinds(actor)), legacy, difficultyOf(state, actor.side)) };
}
function bonusEvaluated(state: BattleState, actor: Combatant): Command | null {
  const { legacy, scored } = bonusScored(state, actor);
  const best = scored[0];
  return best && best.score > 0 ? best.cmd : legacy;
}

/** Y1 G2: şu an yapılacak eylem (değerlendirici). Eski zincirde `bestNow`. Olumlu puanlı aday yoksa null. */
function evaluatedNow(state: BattleState, actor: Combatant): Command | null {
  if (state.yz?.eski) return bestNow(state, actor);
  const { legacy, scored } = scoredCandidates(state, actor);
  const diff = difficultyOf(state, actor.side);
  const pick = pickByDifficulty(state, actor, scored, diff, diff === 'usta' ? (cmd) => followScore(state, actor, cmd) : undefined);
  if (!pick) return legacy;
  return pick.score > 0 ? pick.cmd : null;
}

/** Y1 G2: tehlikeli altıgenden çıkış (risk ≥ 20): eylem yapılabilen daha güvenli yer önce, yoksa en güvenli yer. */
function leaveHazard(state: BattleState, actor: Combatant): Command | null {
  if (!state.map || !actor.pos || actor.civilian || actor.movementUsed >= speedHexes(actor)) return null;
  const here = risk(state, actor, actor.pos);
  if (here < 20) return null;
  const safer = reachable(state, actor).filter((sp) => sp.kind === 'move' && risk(state, actor, sp.to) < here / 2)
    .map((sp) => ({ ...sp, r: risk(state, actor, sp.to) }))
    .sort((a, b) => a.r - b.r || a.cost - b.cost).slice(0, 12);
  if (!safer.length) return null;
  const canAct = !actor.economy.action || actor.economy.attacksLeft > 0;
  const acting = canAct ? safer.filter((sp) => bestNow(at(state, actor, sp.to), { ...actor, pos: sp.to }) !== null) : [];
  return firstMove(state, actor, [...acting, ...safer]);
}
