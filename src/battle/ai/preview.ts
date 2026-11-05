/**
 * Y1 G1: kuru çalıştırma (dry-run) API'si. Bir komutu gerçek çözücüyle (`execute`) birkaç kez, zarları zorlanmış
 * olarak çalıştırır ve sonucu olasılıklarla özetler. İkinci bir hesap kodu yok: isabet eşiği, hasar, durumlar,
 * itme/ışınlanma, çarpma/düşme hasarı, yüzey/aura/tuzak tetikleri ve fırsat saldırıları motorun kendi olaylarından
 * okunur. Yapay zekâ değerlendiricisi (`evaluate.ts`) ve K58 arayüz önizlemesi aynı işlevi kullanır.
 *
 * Yöntem:
 * - Yoklama: saldırı ve save d20'leri 10'a, hasar zarları orta değere zorlanır; her saldırının/save'in değiştiricisi
 *   (`total − natural`), AC/DC'si ve zar kipi (avantaj/dezavantaj) olaylardan alınır → analitik olasılık
 *   (normal 1/20; avantaj (k² − (k−1)²)/400; dezavantaj ((21−k)² − (20−k)²)/400).
 * - Senaryolar: saldırı sınıfı (ıska / isabet / kritik) × save sınıfı (başarı / başarısız) × hasar zarı (alt-orta /
 *   üst-orta). Bir zarın alt ve üst ortası ortalamayı tam verir ((s+1)/2). İsteğe bağlı en düşük/en yüksek zar.
 * - Beklenen değer olay başına ayrıştırılır (çoklu saldırıda her saldırı kendi olasılığıyla); saldırı dışı hasar
 *   (save, yüzey, çarpma, düşme) hedefin belirleyici zarının sınıfıyla ağırlıklanır.
 * Yaklaşıklar: aynı komuttaki bütün saldırılar bir senaryoda aynı sınıfa zorlanır (olasılıklar yine olay başına);
 * yetenek kontrolü (itme, kurtulma) d20'si 10'a sabit; eklenti zarları (Bless) orta değerde; ikinci şans zarları
 * (Lucky, Indomitable) olasılığa girmez. Saf: durum değişmez, Rng kullanılmaz.
 */
import type { DiceRequest, RollMode } from '../../rules/dice';
import type { Offset } from '../../rules/hex';
import { execute } from '../commands';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from '../types';

type AttackClass = 'miss' | 'hit' | 'crit';
type SaveClass = 'success' | 'fail';
type DieLevel = 'low' | 'high' | 'min' | 'max';

export interface Range { min: number; avg: number; max: number }

export interface TargetPreview {
  id: string;
  /** Saldıranın tarafından değil: hedef saldıranın dostu mu (dost ateşi). */
  ally: boolean;
  self: boolean;
  /** İlk saldırının isabet olasılığı (kritik dahil); saldırı yoksa yok. */
  hitP?: number;
  critP?: number;
  /** Hedefin save'i başarma olasılığı (ilk save). */
  saveP?: number;
  /** Beklenen hasar (avg) ve başarılı senaryoda en düşük/en yüksek (min/max). */
  damage: Range;
  healing: Range;
  /** Ölme / 0 HP'ye düşme olasılığı. */
  killP: number;
  /** Eklenen durum → olasılık (durum adı ya da etkinin verdiği durum). */
  conditions: Record<string, number>;
  /** Eklenen süren etki adı → olasılık. */
  effects: Record<string, number>;
  /** Etkisiz bırakan etki bayrakları → olasılık (banished, sealed, dominate, polymorph, charm, command, noAttack, taraf değişimi). */
  flags: Record<string, number>;
  /** Zorla hareket / ışınlanma sonucu (başarılı senaryoda). */
  movedTo?: Offset;
  moveBy?: string;
  teleportedTo?: Offset;
}

export interface CommandPreview {
  ok: boolean;
  error?: string;
  targets: TargetPreview[];
  /** Dostlara (kendisi hariç) beklenen toplam hasar. */
  friendlyFire: number;
  /** Kendisine beklenen hasar (fırsat saldırısı, yüzey, geri tepme). */
  selfDamage: number;
  /** Fırsat saldırıları (saldıran, beklenen hasar). */
  opportunity: Array<{ attackerId: string; damage: number }>;
  /** Tetiklenen yüzey tepkimeleri (tablo satırı ya da tür), alan tetikleri, tuzaklar. */
  triggers: string[];
  /** Orta senaryonun olayları (açıklama için). */
  events: BattleEvent[];
  /** Komutu verenin harcadığı kaynaklar (orta senaryo): slot seviyeleri ve kaynak adı → adet. */
  spent: { slots: number[]; resources: Record<string, number> };
  /** Komutu verenin komuttan sonraki konumu (orta senaryo; yürüyüş, ışınlanma, itilme). */
  actorPos?: Offset;
  /** Kaç kez çalıştırıldı (başarım ölçümü). */
  runs: number;
}

export interface PreviewOptions {
  /** En düşük/en yüksek zar senaryoları da (2 çalıştırma daha). Varsayılan: açık. */
  range?: boolean;
}

interface Scenario { attack: AttackClass; save: SaveClass; dice: DieLevel }

/** Doğal yüz k için zar kipine göre olasılık. */
export function faceP(k: number, mode: RollMode | undefined): number {
  if (mode === 'advantage') return (k * k - (k - 1) * (k - 1)) / 400;
  if (mode === 'disadvantage') return ((21 - k) * (21 - k) - (20 - k) * (20 - k)) / 400;
  return 1 / 20;
}

/** Saldırı sınıflarının olasılığı: değiştirici, AC, kip, kritik eşiği. Doğal 1 ıska, kritik eşiği ve üstü kritik. */
export function attackClassP(bonus: number, ac: number, mode: RollMode | undefined, critOn = 20, autoMiss = false): Record<AttackClass, number> {
  if (autoMiss) return { miss: 1, hit: 0, crit: 0 };
  let hit = 0;
  let crit = 0;
  for (let k = 2; k <= 20; k++) {
    const p = faceP(k, mode);
    if (k >= critOn) crit += p;
    else if (k + bonus >= ac) hit += p;
  }
  return { miss: Math.max(0, 1 - hit - crit), hit, crit };
}

/** Save'i başarma olasılığı (doğal 20/1 kendiliğinden değil; SRD 5.2.1). */
export function saveSuccessP(bonus: number, dc: number, mode: RollMode | undefined): number {
  let p = 0;
  for (let k = 1; k <= 20; k++) if (k + bonus >= dc) p += faceP(k, mode);
  return Math.min(1, p);
}

const ctxOf = (c: Combatant): CommandContext =>
  c.side === 'enemies' || c.civilian ? { playerId: 'gm', isGm: true } : { playerId: c.ownerId, isGm: false };

/** Zorlanmış zar kancalı Rng. */
function forcedRng(sc: Scenario | 'probe', hitFace: number, seen?: { varied: boolean }): () => number {
  const rng = (() => 0.5) as (() => number) & { dice?: (r: DiceRequest) => number[] };
  const dieValue = (s: number): number => {
    const lvl = sc === 'probe' ? 'low' : sc.dice;
    if (lvl === 'min') return 1;
    if (lvl === 'max') return s;
    return lvl === 'low' ? Math.floor((s + 1) / 2) : Math.ceil((s + 1) / 2);
  };
  rng.dice = (req) => {
    const n = req.count;
    if (req.sides === 20 && (req.kind === 'attack' || req.kind === 'save')) {
      let face = 10;
      if (sc !== 'probe') {
        if (req.kind === 'attack') face = sc.attack === 'miss' ? 1 : sc.attack === 'crit' ? 20 : hitFace;
        else face = sc.save === 'success' ? 20 : 1;
      }
      return Array.from({ length: n }, () => face);
    }
    if (req.sides === 20 && req.kind !== 'damage' && req.kind !== 'heal') return Array.from({ length: n }, () => 10);
    // Y2 G2: alt/üst orta yalnız çift yüzlü zarda ayrışır; en düşük/en yüksek her zarda (1 yüzlü hariç).
    if (seen && n > 0 && req.sides > 1) seen.varied = true;
    return Array.from({ length: n }, () => dieValue(req.sides));
  };
  return rng;
}

interface RunOut { ok: boolean; error?: string; state?: BattleState; events: BattleEvent[] }

function run(state: BattleState, cmd: Command, ctx: CommandContext, sc: Scenario | 'probe', hitFace: number, seen?: { varied: boolean }): RunOut {
  try {
    const r = execute(state, cmd, ctx, forcedRng(sc, hitFace, seen));
    return r.ok ? { ok: true, state: r.state, events: r.events } : { ok: false, error: r.error, events: [] };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message ?? e), events: [] };
  }
}

/** Etkisiz bırakan etki alanları (değerlendirici `durumDegeri`'ne benzer değer verir). */
export const DISABLE = ['banished', 'sealed', 'dominate', 'polymorph', 'charm', 'command', 'noAttack'] as const;

const pool = (c: Combatant | undefined): number => (c ? Math.max(0, c.hp) + (c.tempHp ?? 0) : 0);

type Att = Extract<BattleEvent, { type: 'attack_resolved' }>;
type Sav = Extract<BattleEvent, { type: 'save_resolved' }>;
type Cs = Extract<BattleEvent, { type: 'condition_save' }>;

/** Bir senaryoda yaratık başına: saldırı hasarı (olay sırasıyla), toplam can değişimi, durumlar, konum. */
interface Outcome {
  attacks: Array<{ targetId: string; actorId: string; dmg: number; hit: boolean; reroll: 'd20' | '20' | null }>;
  /** Hedef başına ilk save: başarı ve ikinci şans zarı. */
  saves: Record<string, { success: boolean; reroll: boolean }>;
  delta: Record<string, number>;
  dead: Record<string, boolean>;
  conds: Record<string, string[]>;
  effs: Record<string, string[]>;
  flags: Record<string, string[]>;
  pushed: Record<string, { to: Offset; by: string }>;
  tele: Record<string, Offset>;
  triggers: string[];
}

function outcomeOf(before: BattleState, r: RunOut): Outcome {
  const o: Outcome = { attacks: [], saves: {}, delta: {}, dead: {}, conds: {}, effs: {}, flags: {}, pushed: {}, tele: {}, triggers: [] };
  const after = r.state as BattleState;
  for (const id of Object.keys(before.combatants)) {
    const b = before.combatants[id] as Combatant;
    const a = after.combatants[id];
    o.delta[id] = pool(b) - pool(a);
    o.dead[id] = !!a && b.life !== 'dead' && (a.life === 'dead' || (b.hp > 0 && a.hp <= 0));
    const bc = new Set([...b.conditions, ...(b.effects ?? []).flatMap((e) => e.grants ?? [])]);
    o.conds[id] = a ? [...new Set([...a.conditions, ...(a.effects ?? []).flatMap((e) => e.grants ?? [])])].filter((x) => !bc.has(x)) : [];
    const be = new Set((b.effects ?? []).map((e) => e.id));
    const fresh = a ? (a.effects ?? []).filter((e) => !be.has(e.id)) : [];
    o.effs[id] = fresh.map((e) => e.name ?? e.id);
    const fl = new Set<string>();
    for (const e of fresh) for (const k of DISABLE) if ((e as unknown as Record<string, unknown>)[k]) fl.add(k);
    if (a && a.side !== b.side) fl.add('dominate');
    if (a && a.shape && !b.shape) fl.add('polymorph');
    if (a && a.regenBlocked && !b.regenBlocked && b.hp <= 0) fl.add('regenBlocked');
    o.flags[id] = [...fl];
  }
  for (const e of r.events) {
    if (e.type === 'attack_resolved') {
      const rr = (e.bonusDice ?? []).find((x) => x.die === 'd20' || x.die === '20');
      o.attacks.push({ targetId: e.targetId, actorId: e.actorId, dmg: e.appliedDamage, hit: e.hit, reroll: rr ? (rr.die === '20' ? '20' : 'd20') : null });
    } else if ((e.type === 'save_resolved' || e.type === 'condition_save') && !o.saves[e.targetId]) {
      o.saves[e.targetId] = { success: e.success, reroll: (e.bonusDice ?? []).some((x) => x.die === 'd20') };
    }
    if (e.type === 'pushed') o.pushed[e.targetId] = { to: e.to, by: e.by };
    else if (e.type === 'teleported') o.tele[e.actorId] = e.to;
    else if (e.type === 'surface_reacted') o.triggers.push(e.row ?? e.reaction);
    else if (e.type === 'zone_triggered') o.triggers.push(`zone:${e.zoneId}`);
  }
  return o;
}

/**
 * Kuru çalıştırma. `ctx` verilmezse komutu veren yaratığın bağlamı (düşman: Game Master). Komut geçersizse
 * `ok: false` ve motorun hata metni.
 */
export function previewCommand(state: BattleState, cmd: Command, ctx?: CommandContext, opts: PreviewOptions = {}): CommandPreview {
  // Y2 G2: aynı durumda aynı komutun önizlemesi önbellekte (durum değişmez nesne; kuru çalıştırma saf).
  let m = previewCache.get(state);
  if (!m) { m = new Map(); previewCache.set(state, m); }
  const k = `${ctx ? `${ctx.playerId}|${ctx.isGm ? 1 : 0}` : '-'}|${opts.range === false ? 0 : 1}|${JSON.stringify(cmd)}`;
  const hit = m.get(k);
  aiStats.previews++;
  if (hit) return hit;
  const out = previewUncached(state, cmd, ctx, opts);
  aiStats.previewRuns += out.runs;
  aiStats.previewMisses++;
  m.set(k, out);
  return out;
}

/**
 * Y2 G2: başarım sayaçları (yalnız ölçüm betikleri okur; kararı etkilemez): önizleme çağrısı / önbellek dışı /
 * kuru çalıştırma (`execute`) sayısı, `tryCmd` çağrısı / önbellek dışı, puanlanan aday sayısı.
 */
export const aiStats = { previews: 0, previewMisses: 0, previewRuns: 0, tries: 0, tryMisses: 0, candidates: 0 };
export function resetAiStats(): void { for (const k of Object.keys(aiStats) as Array<keyof typeof aiStats>) aiStats[k] = 0; }

const previewCache = new WeakMap<BattleState, Map<string, CommandPreview>>();

function previewUncached(state: BattleState, cmd: Command, ctx: CommandContext | undefined, opts: PreviewOptions): CommandPreview {
  const actorId = (cmd as { actorId?: string }).actorId ?? '';
  const actor = state.combatants[actorId];
  const context = ctx ?? (actor ? ctxOf(actor) : { playerId: 'gm', isGm: true });
  const empty: CommandPreview = { ok: false, targets: [], friendlyFire: 0, selfDamage: 0, opportunity: [], triggers: [], events: [], spent: { slots: [], resources: {} }, runs: 1 };
  const probe = run(state, cmd, context, 'probe', 10);
  if (!probe.ok) return { ...empty, error: probe.error };
  let runs = 1;

  // Olay başına olasılıklar (yoklamadan).
  const attP: Array<Record<AttackClass, number>> = [];
  const firstAtt: Record<string, Record<AttackClass, number>> = {};
  let hitFace = 2;
  for (const e of probe.events) {
    if (e.type !== 'attack_resolved') continue;
    const a = e as Att;
    const bonus = a.total - a.natural;
    const critOn = state.combatants[a.actorId]?.critOn ?? 20;
    const p = attackClassP(bonus, a.targetAc, a.mode, Math.min(critOn, 20), !!a.autoMiss);
    attP.push(p);
    if (!firstAtt[a.targetId]) firstAtt[a.targetId] = p;
    hitFace = Math.max(hitFace, Math.min(19, Math.max(2, a.targetAc - bonus)));
  }
  const firstSave: Record<string, number> = {};
  for (const e of probe.events) {
    if (e.type === 'save_resolved') {
      const s = e as Sav;
      if (s.natural == null || s.total == null) { firstSave[s.targetId] ??= s.success ? 1 : 0; continue; }
      firstSave[s.targetId] ??= saveSuccessP(s.total - s.natural, s.dc, s.mode);
    } else if (e.type === 'condition_save') {
      const s = e as Cs;
      const nat = s.d20.length ? (s.d20.length > 1 ? Math.max(...s.d20) : s.d20[0] as number) : 10;
      firstSave[s.targetId] ??= saveSuccessP(s.total - nat, s.dc, 'normal');
    }
  }
  const hasAtt = attP.length > 0;
  const hasSave = Object.keys(firstSave).length > 0;
  const aClasses: AttackClass[] = hasAtt ? ['miss', 'hit', 'crit'] : ['hit'];
  const sClasses: SaveClass[] = hasSave ? ['success', 'fail'] : ['fail'];

  const outs = new Map<string, Outcome>();
  let midEvents: BattleEvent[] = probe.events;
  let midState: BattleState | undefined = probe.state;
  const key = (s: Scenario) => `${s.attack}/${s.save}/${s.dice}`;
  // Y2 G2: aynı saldırı/save sınıfında alt-orta çalıştırma hiç (2+ yüzlü) hasar zarı istemediyse üst-orta ve en
  // düşük/en yüksek çalıştırmalar aynı sonucu verir (zar dışında her şey deterministik): yeniden çalıştırılmaz.
  const noDice = new Set<string>();
  for (const attack of aClasses) for (const save of sClasses) for (const dice of ['low', 'high'] as DieLevel[]) {
    const sc = { attack, save, dice };
    const twin = dice === 'high' && noDice.has(`${attack}/${save}`) ? outs.get(key({ attack, save, dice: 'low' })) : undefined;
    if (twin) { outs.set(key(sc), twin); continue; }
    const seen = { varied: false };
    const r = run(state, cmd, context, sc, hitFace, seen);
    runs++;
    if (r.ok && dice === 'low' && !seen.varied) noDice.add(`${attack}/${save}`);
    if (r.ok) outs.set(key(sc), outcomeOf(state, r));
    if (r.ok && attack === 'hit' && save === 'fail' && dice === 'low') { midEvents = r.events; midState = r.state; }
  }
  const ranged = opts.range !== false;
  if (ranged) {
    for (const dice of ['min', 'max'] as DieLevel[]) {
      const sc: Scenario = { attack: 'hit', save: 'fail', dice };
      const twin = noDice.has('hit/fail') ? outs.get(key({ attack: 'hit', save: 'fail', dice: 'low' })) : undefined;
      if (twin) { outs.set(key(sc), twin); continue; }
      const r = run(state, cmd, context, sc, hitFace);
      runs++;
      if (r.ok) outs.set(key(sc), outcomeOf(state, r));
    }
  }
  const get = (a: AttackClass, s: SaveClass, d: DieLevel) => outs.get(`${a}/${s}/${d}`);

  // İkinci şans: ıska senaryosunda (yüz 1) yeniden atış görüldüyse ıska olasılığı bir kez daha denenir; zarsız
  // kendiliğinden isabet (Peerless Aim, Yazgı Mührü) ıskayı isabete, doğal 20 ikinci şansı kritiğe çevirir.
  const missRun = get('miss', 'fail', 'low') ?? get('miss', 'success', 'low');
  attP.forEach((p, i) => {
    const f = missRun?.attacks[i];
    if (!f || p.miss <= 0) return;
    if (f.reroll === '20') { p.crit += p.miss; p.miss = 0; }
    else if (f.reroll === 'd20') { const m = p.miss; const q = 1 - m; if (q > 0) { p.hit += m * p.hit; p.crit += m * p.crit; } p.miss = m * m; }
    else if (f.hit) { p.hit += p.miss; p.miss = 0; }
  });
  const failRun = get('hit', 'fail', 'low');
  for (const id of Object.keys(firstSave)) {
    const f = failRun?.saves[id];
    const p = firstSave[id] as number;
    if (!f) continue;
    if (f.reroll) firstSave[id] = p + (1 - p) * p;
    else if (f.success) firstSave[id] = 1;
  }

  const ids = Object.keys(state.combatants);
  const targets: TargetPreview[] = [];
  const opportunity: Array<{ attackerId: string; damage: number }> = [];
  const triggers = new Set<string>();
  for (const o of outs.values()) for (const t of o.triggers) triggers.add(t);

  // Saldırı olaylarının beklenen hasarı (olay sırasıyla; kaybolan olaylar 0).
  const attackExp: Record<string, number> = {};
  const attackByScenario = (o: Outcome | undefined, id: string) => (o?.attacks ?? []).filter((x) => x.targetId === id).reduce((s, x) => s + x.dmg, 0);
  probe.events.filter((e): e is Att => e.type === 'attack_resolved').forEach((pe, i) => {
    const p = attP[i] as Record<AttackClass, number>;
    let exp = 0;
    for (const c of aClasses) {
      let v = 0;
      let n = 0;
      for (const d of ['low', 'high'] as DieLevel[]) {
        const o = get(c, 'fail', d) ?? get(c, 'success', d);
        const at = o?.attacks[i];
        if (at) { v += at.dmg; n++; }
      }
      exp += p[c] * (n ? v / n : 0);
    }
    attackExp[pe.targetId] = (attackExp[pe.targetId] ?? 0) + exp;
    if (pe.actorId !== actorId && pe.targetId === actorId) opportunity.push({ attackerId: pe.actorId, damage: exp });
  });

  for (const id of ids) {
    const c = state.combatants[id] as Combatant;
    const aP = firstAtt[id];
    const sP = firstSave[id];
    // Hedefin senaryo ağırlıkları (belirleyici zarı: ilk saldırı, yoksa ilk save; ikisi yoksa tek senaryo).
    const weights: Array<{ a: AttackClass; s: SaveClass; w: number }> = [];
    for (const a of aClasses) for (const s of sClasses) {
      const wa = aP ? aP[a] : (a === 'hit' ? 1 : 0);
      const ws = sP !== undefined ? (s === 'success' ? sP : 1 - sP) : (s === 'fail' ? 1 : 0);
      if (wa * ws > 0) weights.push({ a, s, w: wa * ws });
    }
    let otherExp = 0;
    let healExp = 0;
    let killP = 0;
    const condP: Record<string, number> = {};
    const effP: Record<string, number> = {};
    const flagP: Record<string, number> = {};
    let any = false;
    for (const { a, s, w } of weights) {
      for (const d of ['low', 'high'] as DieLevel[]) {
        const o = get(a, s, d);
        if (!o) continue;
        const delta = o.delta[id] ?? 0;
        const att = attackByScenario(o, id);
        const other = delta - att;
        if (other > 0) otherExp += (w / 2) * other;
        if (delta < 0) healExp += (w / 2) * -delta;
        if (o.dead[id]) killP += w / 2;
        for (const x of o.conds[id] ?? []) condP[x] = (condP[x] ?? 0) + w / 2;
        for (const x of o.effs[id] ?? []) effP[x] = (effP[x] ?? 0) + w / 2;
        for (const x of o.flags[id] ?? []) flagP[x] = (flagP[x] ?? 0) + w / 2;
        if (delta !== 0 || o.conds[id]?.length || o.effs[id]?.length || o.pushed[id] || o.tele[id]) any = true;
      }
    }
    if (!any && !aP && sP === undefined) continue;
    const dmgAvg = (attackExp[id] ?? 0) + otherExp;
    const succ = get('hit', 'fail', 'low') ?? get('hit', 'success', 'low');
    const lo = get('hit', 'fail', 'min');
    const hi = get('hit', 'fail', 'max') ?? get('crit', 'fail', 'high');
    const crit = get('crit', 'fail', 'high');
    const pos = (n: number | undefined) => Math.max(0, n ?? 0);
    const neg = (n: number | undefined) => Math.max(0, -(n ?? 0));
    const t: TargetPreview = {
      id,
      ally: !!actor && c.side === actor.side && id !== actorId,
      self: id === actorId,
      damage: {
        min: ranged ? pos(lo?.delta[id]) : pos(succ?.delta[id]),
        avg: dmgAvg,
        max: Math.max(pos(hi?.delta[id]), pos(crit?.delta[id])),
      },
      healing: { min: ranged ? neg(lo?.delta[id]) : neg(succ?.delta[id]), avg: healExp, max: neg(hi?.delta[id]) },
      killP: Math.min(1, killP),
      conditions: condP,
      effects: effP,
      flags: flagP,
    };
    if (aP) { t.hitP = aP.hit + aP.crit; t.critP = aP.crit; }
    if (sP !== undefined) t.saveP = sP;
    const mv = succ?.pushed[id];
    if (mv) { t.movedTo = mv.to; t.moveBy = mv.by; }
    const tp = succ?.tele[id];
    if (tp) t.teleportedTo = tp;
    targets.push(t);
  }
  const friendlyFire = targets.filter((t) => t.ally).reduce((s, t) => s + t.damage.avg, 0);
  const selfDamage = targets.find((t) => t.self)?.damage.avg ?? 0;
  const spent: CommandPreview['spent'] = { slots: [], resources: {} };
  const after = midState?.combatants[actorId];
  if (actor && after) {
    actor.spellSlots.forEach((n, i) => { for (let k = 0; k < n - (after.spellSlots[i] ?? 0); k++) spent.slots.push(i + 1); });
    for (const [k, v] of Object.entries(actor.resources ?? {})) {
      const d = (v ?? 0) - (after.resources?.[k] ?? 0);
      if (d > 0) spent.resources[k] = d;
    }
  }
  return { ok: true, targets, friendlyFire, selfDamage, opportunity, triggers: [...triggers], events: midEvents, spent, ...(after?.pos ? { actorPos: after.pos } : {}), runs };
}

/** Kısa yardımcı: komutun bir hedefe beklenen hasarı (yoksa 0). */
export const expectedDamageTo = (p: CommandPreview, id: string): number => p.targets.find((t) => t.id === id)?.damage.avg ?? 0;
