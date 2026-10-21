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
import { spells } from '../data';
import { costsFrom, distance, hexKey, neighbors, type Offset } from '../rules/hex';
import { execute } from './commands';
import { canSneak, spellOf } from './features';
import { standUpProblem } from './grapple';
import { pushOutcome, shoveDc, shoveHex } from './forced';
import { jumpTargets, lavaOver } from './jumprisk';
import { sleepingDragon, turnKey, wakeRule, wakesDragon } from './dragon';
import { currentActorId, isTargetable } from './common';
import { canSee, isRiskyHex, ruleOf, stuckInBog } from './maprules';
import { islandJumpProblem, moveCostFn, occupantAt, speedHexes, terrainAt } from './movement';
import type { BattleState, Combatant, Command, CommandContext } from './types';

const noRoll = () => 0.5;
const ctxOf = (c: Combatant): CommandContext =>
  c.side === 'enemies' || c.civilian ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };
const tryCmd = (state: BattleState, actor: Combatant, cmd: Command) => execute(state, cmd, ctxOf(actor), noRoll);

/** Zar ifadesinin ortalaması ("2d6+3" → 10). */
function avg(dice: string | undefined): number {
  if (!dice) return 0;
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(dice.replace(/\s/g, ''));
  if (!m) return 0;
  return Number(m[1]) * (Number(m[2]) + 1) / 2 + Number(m[3] ?? 0);
}

/** Saldırılabilir karşı taraf: ayakta, gizlenmemiş, görülen. */
function foesOf(state: BattleState, actor: Combatant): Combatant[] {
  const other = actor.side === 'enemies' ? 'party' : 'enemies';
  return Object.values(state.combatants).filter(
    (c) => c.side === other && c.hp > 0 && isTargetable(c) && !c.hidden && !c.asleep && canSee(state, actor, c),
  );
}

function byPriority(actor: Combatant, foes: Combatant[]): Combatant[] {
  const d = (c: Combatant) => (actor.pos && c.pos ? distance(actor.pos, c.pos) : 0);
  // Yakalayan önce yakaladığına vurur (kaçmasın; Restrained ise avantajlı).
  const held = (c: Combatant) => (c.grapple?.by === actor.id ? 0 : 1);
  return [...foes].sort((a, b) => held(a) - held(b) || d(a) - d(b) || a.hp / a.maxHp - b.hp / b.maxHp);
}

/** Düşmanın saldırı komutları, öncelik sırasıyla. */
function monsterCommands(actor: Combatant, targetId: string): Command[] {
  const ready = actor.attacks
    .map((a, i) => ({ a, i }))
    .filter(({ a, i }) => a.damageDice !== undefined && !(a.recharge !== undefined && actor.rechargeUsed.includes(i)));
  const breath = ready.filter(({ a }) => a.recharge !== undefined && a.save !== undefined);
  const rest = ready.filter(({ a }) => !(a.recharge !== undefined && a.save !== undefined));
  return [
    ...breath.map(({ i }) => ({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i }) as Command),
    ...(actor.multiattack ? [{ type: 'multiattack', actorId: actor.id, targetId } as Command] : []),
    ...rest.map(({ i }) => ({ type: 'monster_attack', actorId: actor.id, targetId, attackIndex: i }) as Command),
  ];
}

/** Bilinen ve slotu olan büyüler; konsantre olan yeni konsantrasyon büyüsü yapmaz. */
function castable(actor: Combatant) {
  return actor.spellNames
    .map((n) => spells.find((s) => s.name === n))
    .filter((s): s is NonNullable<typeof s> => s !== undefined)
    .filter((s) => !(s.concentration && actor.concentration))
    .filter((s) => s.level === 0 || actor.spellSlots.slice(s.level - 1).some((n) => n > 0)
      || (s.name === "Hunter's Mark" && actor.resources.favoredEnemy > 0));
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
function partyOptions(actor: Combatant, target: Combatant): Array<{ cmd: Command; score: number }> {
  const out: Array<{ cmd: Command; score: number }> = [];
  for (const o of actor.weaponOptions) {
    out.push({ cmd: { type: 'attack', actorId: actor.id, targetId: target.id, option: o }, score: avg(o.damage) });
  }
  for (const s of castable(actor)) {
    const m = s.mechanics;
    if (s.area || !m.damage || (m.kind !== 'attack' && m.kind !== 'auto' && m.kind !== 'save')) continue;
    if (s.level > 0 && target.hp < 12) continue; // slotu küçük hedefe harcama
    const rays = (m as { rays?: number }).rays ?? 1;
    const scale = m.scalesWithLevel && actor.level >= 5 ? 2 : 1;
    out.push({ cmd: { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetId: target.id }, score: avg(m.damage) * rays * scale + s.level });
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
    for (const f of state.map ? foes : foes.slice(0, 1)) {
      const cmd: Command = state.map
        ? { type: 'cast_spell', actorId: actor.id, spellName: s.name, targetHex: f.pos as Offset }
        : { type: 'cast_spell', actorId: actor.id, spellName: s.name };
      const r = tryCmd(state, actor, cmd);
      if (!r.ok) continue;
      const hit = r.events.filter((e) => e.type === 'save_resolved').map((e) => (e.type === 'save_resolved' ? e.targetId : ''));
      const sides = hit.map((id) => state.combatants[id]?.side);
      if (sides.filter((x) => x === 'enemies').length >= 2 && !sides.includes('party')) return cmd;
    }
  }
  return null;
}

/** Ölmekte olan (ya da çok yaralı) müttefiki iyileştir. */
function healAlly(state: BattleState, actor: Combatant): Command | null {
  const heals = castable(actor).filter((s) => s.mechanics.kind === 'heal');
  if (heals.length === 0) return null;
  const hurt = Object.values(state.combatants)
    .filter((c) => c.side === 'party' && !c.civilian && c.life !== 'dead' && (c.life === 'dying' || c.hp < c.maxHp * 0.25))
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
  const same = partyOptions(actor, target).find((o) => o.cmd.type === cmd.type
    && (cmd.type === 'attack' ? o.cmd.type === 'attack' && o.cmd.option.label === cmd.option.label
      : o.cmd.type === 'cast_spell' && o.cmd.spellName === cmd.spellName));
  return (same?.score ?? 0) + sneakBonus(state, actor, cmd);
}

/** Şu an yapılabilen en iyi eylem. */
function bestNow(state: BattleState, actor: Combatant): Command | null {
  const foes = byPriority(actor, foesOf(state, actor));
  const shove = deadlyShove(state, actor, foes);
  if (shove) return shove;
  if (actor.side === 'party') {
    const heal = healAlly(state, actor);
    if (heal) return heal;
    const area = areaSpell(state, actor, foes);
    if (area) return area;
    if (actor.sneakAttackDice > 0) {
      // Haydut: Sneak Attack'ın tuttuğu hedef öne geçer (eşitse öncelik sırası).
      let best: { cmd: Command; score: number } | null = null;
      for (const t of foes) {
        for (const o of partyOptions(actor, t)) {
          if (!tryCmd(state, actor, o.cmd).ok) continue;
          const score = o.score + sneakBonus(state, actor, o.cmd);
          if (!best || score > best.score) best = { cmd: o.cmd, score };
        }
      }
      return best?.cmd ?? null;
    }
    for (const t of foes) {
      for (const o of partyOptions(actor, t)) if (tryCmd(state, actor, o.cmd).ok) return o.cmd;
    }
    return null;
  }
  for (const t of foes) for (const cmd of monsterCommands(actor, t.id)) if (tryCmd(state, actor, cmd).ok) return cmd;
  return null;
}

/** Bir altıgende durmanın riski. */
function risk(state: BattleState, actor: Combatant, h: Offset): number {
  let r = dragonRisk(state, actor, h);
  if (actor.fly > 0) return r;
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
    if (occupantAt(state, to, actor.id) || terrainAt(state, to).movement === 'deadly') continue;
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
  if (actor.resources.secondWind > 0 && actor.hp <= actor.maxHp / 2 && ok({ type: 'second_wind', actorId: id })) {
    return { type: 'second_wind', actorId: id };
  }
  const foes = byPriority(actor, foesOf(state, actor));
  const conc = actor.concentration;
  const spell = spellOf(conc?.spell);
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
      for (const f of foes) {
        if (!bestNowAgainst(state, actor, f)) continue;
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

/** Eylemini kullandı, Action Surge'ü duruyor ve hâlâ vurabileceği hedef var: bir eylem daha. */
function surge(state: BattleState, actor: Combatant): Command | null {
  const e = actor.economy;
  if (actor.resources.actionSurge <= 0 || e.surged || !e.action || e.attacksLeft > 0) return null;
  const cmd: Command = { type: 'action_surge', actorId: actor.id };
  const r = tryCmd(state, actor, cmd);
  if (!r.ok) return null;
  const next = bestNow(r.state, r.state.combatants[actor.id] as Combatant);
  return next?.type === 'attack' ? cmd : null;
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

  // Haritasız savaş: düşman en düşük HP oranlıya saldırır; parti en iyi seçeneği seçer.
  if (!state.map || !actor.pos) {
    if (actor.side === 'enemies') {
      if (!canAct) return end;
      const target = Object.values(state.combatants)
        .filter((c) => c.side === 'party' && c.hp > 0 && !c.hidden)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!target) return end;
      return monsterCommands(actor, target.id).find((cmd) => tryCmd(state, actor, cmd).ok) ?? end;
    }
    return bestNow(state, actor) ?? end;
  }

  if (stuckInBog(state, actor)) return canAct && tryCmd(state, actor, { type: 'escape', actorId }).ok ? { type: 'escape', actorId } : end;
  // Yakalanmış: önce eylemiyle kaçmayı dener. Yerdeyse (hareketi yetiyorsa) önce ayağa kalkar.
  const escape: Command = { type: 'escape_grapple', actorId };
  if (actor.grapple && !actor.economy.action && tryCmd(state, actor, escape).ok) return escape;
  if (actor.conditions.includes('Prone') && standUpProblem(actor) === null) return { type: 'stand_up', actorId };

  // Masum: hiçbir şey yapmaz (sırası motor tarafından atlanır).
  if (actor.civilian) return end;

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
  if (now && !poor) return now;
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

  // Yaklaş: en yakın hedefe mesafeyi en çok kısaltan güvenli altıgen.
  const nearest = (h: Offset) => Math.min(...foes.map((t) => distance(h, t.pos as Offset)));
  const here = nearest(actor.pos);
  const approach = spots
    .filter((s) => nearest(s.to) < here)
    .map((s) => ({ ...s, score: nearest(s.to) * 10 + risk(state, actor, s.to) + s.cost }))
    .sort((a, b) => a.score - b.score);
  return guardMove(state, actor, firstMove(state, actor, approach)) ?? end;
}

/** Yalnızca düşman sırasında karar verir (GM'in "Düşmanı oynat" düğmesi). */
export function chooseEnemyCommand(state: BattleState): Command {
  const actor = state.combatants[currentActorId(state)];
  if (!actor || actor.side !== 'enemies') return { type: 'end_turn', actorId: currentActorId(state) };
  return chooseCommand(state);
}

export { avg as averageDamage };
