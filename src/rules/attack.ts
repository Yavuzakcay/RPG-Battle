/** Saldırı ve save çözümleme. Zarlar dışarıdan verilen rastgele üreticiyle atılır. */
import { rollD20, rollDice, rollTag, type D20Result, type DiceResult, type Rng, type RollKind, type RollMode } from './dice';

/**
 * Zar eklentisi (Görev R2; Bless +1d4, Bane −1d4): d20'nin ardından atılır, toplama eklenir (doğal 20/1 değişmez).
 * `label` günlükte görünen kaynak (büyü adı); `effectId`/`holderId` tek kullanımlık etkinin tüketilmesi için.
 */
export interface ExtraDie {
  label: string; die: string; sign: 1 | -1; effectId?: string; holderId?: string; single?: boolean;
  /**
   * Görev F: başarısız zarın ardından (eklenti olarak atılmaz). `d20`: yeniden at, `rerollBonus` ekle (Indomitable);
   * `twenty`: zar 20 sayılır (Stroke of Luck); `onFail`: `die` kadar ekle, tutarsa harca (Tactical Mind). Kullanılınca
   * `resource` harcanır (reducer, `holderId`).
   */
  /** Kuyruk 43: `success`: başarısız save başarıya döner (Legendary Resistance). */
  /** Kuyruk 19: `floor`: toplam `rerollBonus`'tan küçükse o sayılır (Indomitable Might: STR skoru); diğer ikinci şanslardan önce. */
  /** Kuyruk 19: `onSuccess`: başarılı zardan `die` düşülür, sonucu bozarsa harcanır (Improve Fate, düşmana). */
  reroll?: 'd20' | 'twenty' | 'onFail' | 'success' | 'floor' | 'onSuccess' | 'plus';
  /** Kuyruk 19 (`plus`): sahibinin tepki havuzu ve kalan (kullanılınca bir azalır). */
  pool?: { id: string; remaining: number };
  /** Kuyruk 19 (Halfling Luck): yalnızca doğal 1'de. */
  onNatural1?: boolean;
  rerollBonus?: number;
  resource?: string;
  /** Kuyruk 18 H3: yalnızca bu durumlara karşı save'de (Countercharm: Charmed, Frightened). */
  against?: string[];
  /** Kuyruk 18 H3: yeniden atış bu kipte (Countercharm: avantajlı). */
  rerollMode?: RollMode;
  /** Kuyruk 18 H3: kullanılınca sahibinin tepkisi harcanır (Countercharm). */
  reaction?: boolean;
  /**
   * Kuyruk K48 (kural sürümü 19): ilk ikinci şans (Indomitable, Luck, Tactical Mind…) sonucu yine başarısızsa bu giriş
   * ayrıca denenir (Bardic Inspiration: "when the creature fails a D20 Test").
   */
  chain?: boolean;
}
/** Atılmış eklenti zarı: işaretli değer (−1d4 ise negatif). `resource`: kullanılan kaynak (Görev F). */
export interface RolledExtra { label: string; die: string; value: number; effectId?: string; holderId?: string; single?: boolean; resource?: string; /** Kuyruk 18 H3: sahibinin tepkisi harcandı. */ reaction?: boolean;
  /** Kuyruk 19: sahibinin tepki havuzu (Burst of Ingenuity 2/Day): kalan. */ pool?: { id: string; remaining: number } }

/** Eklenti zarlarını atar (d20'nin ardından, aynı türde zar isteğiyle). */
export function rollExtras(extra: ExtraDie[] | undefined, kind: RollKind, rng: Rng): RolledExtra[] {
  return (extra ?? []).filter((x) => !x.reroll).map((x) => {
    const v = rollDice(x.die, rollTag(rng, { kind })).total;
    const { sign, ...rest } = x;
    return { ...rest, value: sign * v };
  });
}

/**
 * Başarısız zar sonrası ikinci şans (Görev F; Indomitable, Stroke of Luck, Tactical Mind): ilk uygun giriş kullanılır.
 * Yeni toplam ve günlük girişi (değer: toplamdaki fark; kaynak yalnızca harcandıysa).
 */
export function secondChance(
  extra: ExtraDie[] | undefined, fail: { total: number; natural: number; bonus: number; need: number; mode: RollMode; kind: RollKind; against?: string[] }, rng: Rng,
): { total: number; natural: number; entry: RolledExtra } | null {
  // Kuyruk 19: taban (Indomitable Might): başarıya yetiyorsa yalnızca o; yetmiyorsa öbür ikinci şanslar denenir.
  const floor = (extra ?? []).find((e) => e.reroll === 'floor' && (e.rerollBonus ?? 0) > fail.total);
  if (floor && (floor.rerollBonus ?? 0) >= fail.need) {
    return { total: floor.rerollBonus as number, natural: fail.natural, entry: { label: floor.label, die: 'STR', value: (floor.rerollBonus as number) - fail.total } };
  }
  // Kuyruk 19 (`plus`, Burst of Ingenuity): sabit ek yalnızca başarıya çevirecekse seçilir.
  const x = (extra ?? []).find((e) => e.reroll && e.reroll !== 'floor' && e.reroll !== 'onSuccess' && (!e.onNatural1 || fail.natural === 1) && (!e.against || e.against.some((c) => fail.against?.includes(c)))
    && (e.reroll !== 'plus' || fail.total + (e.rerollBonus ?? 0) >= fail.need));
  if (!x) return null;
  // Görev BARD: tek kullanımlık etkinin zarı (Bardic Inspiration) atılınca etki biter (reducer: `single` + `effectId`).
  const base = { label: x.label, ...(x.holderId ? { holderId: x.holderId } : {}), ...(x.single && x.effectId ? { single: true, effectId: x.effectId } : {}) };
  if (x.reroll === 'plus') {
    const v = x.rerollBonus ?? 0;
    return { total: fail.total + v, natural: fail.natural, entry: { ...base, die: x.die, value: v, ...(x.reaction ? { reaction: true } : {}), ...(x.pool ? { pool: x.pool } : {}) } };
  }
  if (x.reroll === 'success') {
    return { total: fail.need, natural: fail.natural, entry: { ...base, die: x.die, value: fail.need - fail.total, ...(x.resource ? { resource: x.resource } : {}) } };
  }
  if (x.reroll === 'onFail') {
    const v = rollDice(x.die, rollTag(rng, { kind: fail.kind })).total;
    const total = fail.total + v;
    return { total, natural: fail.natural, entry: { ...base, die: x.die, value: v, ...(total >= fail.need && x.resource ? { resource: x.resource } : {}) } };
  }
  const natural = x.reroll === 'twenty' ? 20 : rollD20(x.rerollMode ?? fail.mode, rollTag(rng, { kind: fail.kind, bonus: fail.bonus })).kept;
  const total = fail.total - fail.natural + natural + (x.rerollBonus ?? 0);
  return { total, natural, entry: { ...base, die: x.reroll === 'twenty' ? '20' : 'd20', value: total - fail.total, ...(x.resource ? { resource: x.resource } : {}), ...(x.reaction ? { reaction: true } : {}) } };
}
/**
 * Kuyruk K48: ikinci şans zinciri. Önce `secondChance`; sonuç yine başarısızsa ve seçilmeyen `chain` girişi (Bardic
 * Inspiration) varsa o da atılır. Girişler sırayla döner (olaydaki `bonusDice`). `chain` yoksa eski davranış (tek giriş).
 */
export function secondChanceAll(
  extra: ExtraDie[] | undefined, fail: Parameters<typeof secondChance>[1], rng: Rng,
): { total: number; natural: number; entries: RolledExtra[] } | null {
  const first = secondChance(extra, fail, rng);
  if (!first) return null;
  const entries = [first.entry];
  let { total, natural } = first;
  const ok = () => (fail.kind === 'attack' ? natural === 20 || (natural !== 1 && total >= fail.need) : total >= fail.need);
  if (!ok()) {
    const rest = (extra ?? []).filter((e) => e.chain && !(e.effectId && e.effectId === first.entry.effectId));
    const again = rest.length ? secondChance(rest, { ...fail, total, natural }, rng) : null;
    if (again) { total = again.total; natural = again.natural; entries.push(again.entry); }
  }
  return { total, natural, entries };
}
export const extrasTotal = (xs: RolledExtra[] | undefined): number => (xs ?? []).reduce((n, x) => n + x.value, 0);

export interface AttackInput {
  attackBonus: number;
  targetAc: number;
  mode: RollMode;
  /** Hasar zarı, örneğin "1d8+3". */
  damage: string;
  /** Hedef durumu yüzünden isabet kritik sayılır (Paralyzed gibi). */
  autoCritical?: boolean;
  /** Kuyruk 19 (Adamantine Armor): kritik vuruş normal isabet sayılır. */
  noCrit?: boolean;
  /** Hasar zarında bundan küçük değer bu sayılır (Great Weapon Fighting: 1 ve 2 → 3). */
  minDie?: number;
  /** Saldırı zarına eklenti zarları (Bless, Bane). */
  extra?: ExtraDie[];
  /** Görev F: kritik vuruş eşiği (Improved Critical 19, Superior Critical 18); yoksa 20. */
  critOn?: number;
  /**
   * F1: Savage Attacker (SRD 5.2.1): isabette silahın hasar zarları iki kez atılır, biri kullanılır (yüksek olan).
   * İkinci atış da Rng'den (zar defteri, elle zar ve replay aynı yoldan).
   */
  savage?: boolean;
}

/** Hasar zarlarında en düşük değer: küçük zarlar `min` sayılır, toplam yeniden hesaplanır. */
export function withMinDie(d: DiceResult, min: number | undefined): DiceResult {
  if (!min) return d;
  const rolls = d.rolls.map((r) => Math.max(r, min));
  return { ...d, rolls, total: rolls.reduce((n, r) => n + r, 0) + d.bonus };
}

export interface AttackResult {
  d20: D20Result;
  total: number;
  hit: boolean;
  critical: boolean;
  /** Doğal 1: her zaman ıska. */
  fumble: boolean;
  damage: DiceResult | null;
  /** Atılan eklenti zarları (toplama dahil). */
  extra?: RolledExtra[];
  /** F1: Savage Attacker'ın iki hasar atışı (zarlar ve toplamlar) ve kullanılan. */
  savage?: { rolls: [number[], number[]]; totals: [number, number]; kept: 0 | 1 };
}

/**
 * Doğal 20 her zaman isabet eder ve kritiktir. Doğal 1 her zaman ıskalar.
 * Diğer durumlarda toplam, hedefin AC'sine eşit veya büyükse isabet olur.
 * Hasar zarları yalnızca isabette atılır.
 */
export function resolveAttack(input: AttackInput, rng: Rng = Math.random): AttackResult {
  const d20 = rollD20(input.mode, rollTag(rng, { kind: 'attack', bonus: input.attackBonus }));
  let natural = d20.kept;
  const extra = rollExtras(input.extra, 'attack', rng);
  let total = natural + input.attackBonus + extrasTotal(extra);
  const fumble = natural === 1;
  const crit = (n: number) => n >= Math.min(20, input.critOn ?? 20);
  let hit = crit(natural) || (!fumble && total >= input.targetAc);
  // Görev F: ıskada ikinci şans (Stroke of Luck: zar 20 sayılır).
  if (!hit) {
    const again = secondChanceAll(input.extra, { total, natural, bonus: input.attackBonus, need: input.targetAc, mode: input.mode, kind: 'attack' }, rng);
    if (again) { natural = again.natural; total = again.total; extra.push(...again.entries); hit = crit(natural) || (natural !== 1 && total >= input.targetAc); }
  } else if (!crit(natural)) {
    const spoil = spoilChance(input.extra, { total, need: input.targetAc, kind: 'attack' }, rng);
    if (spoil) { total = spoil.total; extra.push(spoil.entry); hit = false; }
  }
  const critical = !input.noCrit && (crit(natural) || (hit && !!input.autoCritical));
  const roll = () => withMinDie(rollDice(input.damage, rollTag(rng, { kind: 'damage' }), critical), input.minDie);
  const first = hit ? roll() : null;
  // F1: Savage Attacker: ikinci atış; büyük olan kullanılır (eşitse ilki).
  const second = first && input.savage ? roll() : null;
  const kept: 0 | 1 = second && first && second.total > first.total ? 1 : 0;
  const damage = kept === 1 ? second : first;
  return {
    d20, total, hit, critical, fumble: fumble && !hit, damage, ...(extra.length ? { extra } : {}),
    ...(first && second ? { savage: { rolls: [first.rolls, second.rolls] as [number[], number[]], totals: [first.total, second.total] as [number, number], kept } } : {}),
  };
}

export interface SaveInput {
  modifier: number;
  dc: number;
  mode: RollMode;
  /** Otomatik başarısız (Paralyzed hedefin STR/DEX save'i gibi). */
  autoFail?: boolean;
  /** Save zarına eklenti zarları (Bless, Bane). */
  extra?: ExtraDie[];
  /** Kuyruk 18 H3: save'in karşı koyduğu durumlar (Countercharm yalnızca Charmed/Frightened'a). */
  against?: string[];
}

export interface SaveResult {
  d20: D20Result | null;
  total: number | null;
  success: boolean;
  extra?: RolledExtra[];
}

/**
 * Kuyruk 19 (Improve Fate): başarılı zarın ardından ceza zarı (`reroll: 'onSuccess'`); sonucu başarısızlığa çevirirse
 * kullanılır (kaynak harcanır), çevirmezse atılmaz.
 */
export function spoilChance(extra: ExtraDie[] | undefined, ok: { total: number; need: number; kind: RollKind }, rng: Rng): { total: number; entry: RolledExtra } | null {
  const x = (extra ?? []).find((e) => e.reroll === 'onSuccess');
  if (!x) return null;
  const parsed = /^(\d+)d(\d+)$/.exec(x.die);
  // En büyük olası ceza bile bozamıyorsa zar atılmaz (karar: yalnızca sonucu değiştirebilecekse).
  if (parsed && ok.total - Number(parsed[1]) * Number(parsed[2]) >= ok.need) return null;
  const v = rollDice(x.die, rollTag(rng, { kind: ok.kind })).total;
  if (ok.total - v >= ok.need) return null;
  return { total: ok.total - v, entry: { label: x.label, die: x.die, value: -v, ...(x.holderId ? { holderId: x.holderId } : {}), ...(x.resource ? { resource: x.resource } : {}) } };
}

/** Save çözümleme: toplam DC'ye eşit veya büyükse başarılı. */
export function resolveSave(input: SaveInput, rng: Rng = Math.random): SaveResult {
  if (input.autoFail) return { d20: null, total: null, success: false };
  const d20 = rollD20(input.mode, rollTag(rng, { kind: 'save', bonus: input.modifier }));
  const extra = rollExtras(input.extra, 'save', rng);
  let total = d20.kept + input.modifier + extrasTotal(extra);
  // Görev F: başarısız save'de ikinci şans (Indomitable, Stroke of Luck).
  if (total < input.dc) {
    const again = secondChanceAll(input.extra, { total, natural: d20.kept, bonus: input.modifier, need: input.dc, mode: input.mode, kind: 'save', ...(input.against ? { against: input.against } : {}) }, rng);
    if (again) { total = again.total; extra.push(...again.entries); }
  } else {
    const spoil = spoilChance(input.extra, { total, need: input.dc, kind: 'save' }, rng);
    if (spoil) { total = spoil.total; extra.push(spoil.entry); }
  }
  return { d20, total, success: total >= input.dc, ...(extra.length ? { extra } : {}) };
}
