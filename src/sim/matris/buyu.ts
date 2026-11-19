/**
 * Mekanik matris: büyü × bağlam. Beklenen sonuç `srd.ts` kahininden (SRD 5.2.1 metni) ve D&D 5e kurallarından
 * hesaplanır; gerçek sonuç motorun olaylarından (`ortak.ts` `run`). Motorun büyü verisi yalnızca komutun biçimini
 * (alan nişanı, seçim) belirlemek ve bilinen sapmaları (`offCombat`, `unsupported`, `upcast.applied`) sınıflandırmak için okunur.
 */
import { spells } from '../../data';
import type { Spell } from '../../data/types';
import { mechanicsAt } from '../../battle/spellVersion';
import { defaultRuleVersion } from '../../battle/create';
import { P1 } from '../../battle/fixtures';
import type { BattleState, Combatant, Command } from '../../battle/types';
import { distance as hexDistance, type Offset } from '../../rules/hex';
import { SRD_SPELLS, type SrdSpell } from './srd';
import { OZEL, type Yapim } from './ozel';
import {
  A_ROW, AX, CASTER_DC, CASTER_MOD, ROWS, TARGET_AC, ally, band, caster, charmedBy, concentrating, counterCaster, enemy, flatTiles,
  frightenedBy, hex, scene, shieldCaster,
} from './kurulum';
import { D20_CRIT, D20_MISS, D20_NORMAL, SAVE_DIS_PROBE, SAVE_FAIL, SAVE_HALF_COVER, SAVE_OK, SAVE_TQ_COVER, exprTotal, kullan, plan, type D20, type Plan } from './zar';
import { adjust, alan, ctxOf, fmt, kanon, kanonExpr, mode as modeOf, run, type Alan, type Gozlem, type Mode, type Satir, type Sonuc } from './ortak';

/** Ölçülen kural sürümü (`--kural-surumu N`; yoksa güncel): komut biçimi o sürümün büyü verisinden. */
const ST = { get kuralSurumu(): number { return defaultRuleVersion(); } };
const CLASS_TR: Record<string, string> = { Bard: 'Bard', Cleric: 'Cleric', Druid: 'Druid', Paladin: 'Paladin', Ranger: 'Ranger', Sorcerer: 'Sorcerer', Warlock: 'Warlock', Wizard: 'Wizard' };

/** Kahinin yerleşimi: hedef (T), ikinci düşman (U), dost ateşi dostu, alan dışı düşman (Z), nişan. */
export interface Geo {
  kind: 'single' | 'point' | 'self' | 'emanation';
  t: Offset; u: Offset | null; ff: Offset | null; z: Offset | null; aim: Offset | null;
  /** Siper bağlamı: hedefin yeri ve bant satırları (yoksa siper bağlamı yok). */
  coverT: Offset | null; bandRows: [number, number] | null;
  radius: number;
}

const inMap = (o: Offset | null): Offset | null => (o && o.row >= 0 && o.row < ROWS ? o : null);

export function geometry(s: SrdSpell, sp: Spell): Geo {
  const rangeHex = Math.floor((Number.isFinite(s.rangeFt) ? s.rangeFt : 600) / 5);
  // Duvar (motorda `wall`; SRD'de alan kalıbı yok): nokta duvarın üstünde; duvar büyücü yönüne dik, hedef noktada.
  if (!s.area && sp.area?.shape === 'wall') {
    const d = Math.max(1, Math.min(rangeHex, 6));
    const t = hex(A_ROW + d);
    return { kind: 'point', t, u: null, ff: null, z: hex(A_ROW + d + 4), aim: t, coverT: null, bandRows: null, radius: 0 };
  }
  const area = s.area ?? (sp.area ? { shape: sp.area.shape === 'wall' ? 'line' : sp.area.shape, sizeFt: sp.area.sizeFt, origin: sp.area.origin } : null);
  if (area && area.origin === 'point') {
    const R = area.shape === 'cube' ? Math.floor(area.sizeFt / 10) : Math.floor(area.sizeFt / 5);
    const c = Math.max(1, Math.min(rangeHex, R + 4, ROWS - 6 - A_ROW));
    const t = hex(A_ROW + c);
    return { kind: 'point', t, u: R >= 1 ? hex(A_ROW + c + 1) : null, ff: R >= 1 && c - 1 > 0 ? hex(A_ROW + c - 1) : null, z: inMap(hex(A_ROW + c + R + 3)), aim: t,
      coverT: R >= 2 ? hex(A_ROW + c + 2) : null, bandRows: R >= 2 ? [A_ROW + c + 1, A_ROW + c + 1] : null, radius: R };
  }
  if (area && (area.shape === 'emanation' || (area.shape === 'sphere' && area.origin === 'self'))) {
    const R = Math.floor(area.sizeFt / 5);
    // Motorda kendinden çıkan küre yön ister (öbek nişan yönünde); yayılım nişansız.
    return { kind: 'emanation', t: hex(A_ROW + 1), u: R >= 2 ? hex(A_ROW + 2) : null, ff: hex(A_ROW, AX - 1), z: inMap(hex(A_ROW + R + 3)), aim: sp.area?.shape === 'sphere' ? hex(A_ROW + 1) : null,
      coverT: R >= 2 ? hex(A_ROW + 2) : null, bandRows: R >= 2 ? [A_ROW + 1, A_ROW + 1] : null, radius: R };
  }
  if (area) {
    const L = area.shape === 'cube' ? Math.floor(area.sizeFt / 5) : Math.floor(area.sizeFt / 5);
    return { kind: 'self', t: hex(A_ROW + 1), u: L >= 2 ? hex(A_ROW + 2) : null, ff: L >= 3 ? hex(A_ROW + 3) : null, z: inMap(hex(A_ROW + L + 3)), aim: hex(A_ROW + 1),
      coverT: L >= 2 ? hex(A_ROW + 2) : null, bandRows: L >= 2 ? [A_ROW + 1, A_ROW + 1] : null, radius: L };
  }
  const d = s.rangeFt >= 30 ? 4 : s.rangeFt >= 10 ? 2 : 1;
  return { kind: 'single', t: hex(A_ROW + d), u: hex(A_ROW + d, AX + 1), ff: null, z: null, aim: null,
    coverT: d >= 2 ? hex(A_ROW + d) : null, bandRows: d >= 2 ? [A_ROW + 1, A_ROW + d - 1] : null, radius: 0 };
}

/** Seçilebilen hasar türlü büyüler: komutta seçim ve kahinin türü. */
const CHOSEN_TYPE: Record<string, string> = {
  'chromatic-orb': 'fire', 'sorcerous-burst': 'fire', 'dragons-breath': 'fire', 'spirit-guardians': 'radiant', 'elemental-weapon': 'fire',
  'protection-from-energy': 'fire', 'resistance': 'fire', 'absorb-elements': 'fire',
};
const CHOSEN_DICE: Record<string, string> = { 'chromatic-orb': '3d8', 'sorcerous-burst': '1d8', 'dragons-breath': '3d6' };

export interface Profil { res?: string[]; imm?: string[]; vul?: string[] }

export interface Hesap {
  /** Beklenen hasar zarı grupları (kahin). */
  zar: string[];
  /** Hedefin beklenen HP kaybı. */
  hasar: number;
  tur: string;
}

/** Kahin: büyünün hasar parçaları (kantrip kademesi, yukarı slot, seçilen tür). */
export function parts(s: SrdSpell, tier: number, up: number): Array<{ dice: string; type: string }> {
  let base = s.damage.length ? s.damage.map((d) => ({ dice: d.dice + (d.addMod ? `+${CASTER_MOD}` : ''), type: d.type })) : [];
  if (CHOSEN_DICE[s.id]) base = [{ dice: CHOSEN_DICE[s.id] as string, type: CHOSEN_TYPE[s.id] as string }];
  if (s.id === 'spirit-guardians') base = [{ dice: '3d8', type: 'radiant' }];
  if (s.cantrip && s.cantrip.kind === 'dice' && base[0] && tier > 1) {
    const t = s.cantrip.tiers[tier - 1] as string;
    const m = /^(\d+)d(\d+)/.exec(base[0].dice);
    const tm = /^(\d+)d(\d+)/.exec(t);
    if (m && tm) base[0] = { ...base[0], dice: base[0].dice.replace(/^\d+d\d+/, `${tm[1]}d${tm[2]}`) };
  }
  if (up > 0 && s.upcast?.dice?.length) {
    base = base.map((p, i) => {
      const inc = (s.upcast?.dice?.[i] ?? s.upcast?.dice?.[0]) as string;
      const pm = /^(\d+)d(\d+)(.*)$/.exec(p.dice);
      const im = /^(\d+)d(\d+)$/.exec(inc);
      if (pm && im && pm[2] === im[2]) return { ...p, dice: `${Number(pm[1]) + Number(im[1]) * up}d${pm[2]}${pm[3]}` };
      return p;
    });
  }
  return base;
}

/** Bir hasar zarının (save/isabet sonucu, kritik, profil) beklenen uygulanan değeri. */
export function applied(dice: string, type: string, o: { crit?: boolean; save?: 'fail' | 'ok'; half?: boolean; cantrip?: boolean; prof: Profil }): number {
  const raw = exprTotal(dice, !!o.crit);
  const afterSave = o.save === 'ok' ? (o.half && !o.cantrip ? Math.floor(raw / 2) : 0) : raw;
  return adjust(afterSave, type, o.prof);
}

const dmgPartsStr = (ps: Array<{ dice: string }>, crit = false) => ps.map((p) => {
  const m = /^(\d+)d(\d+)(.*)$/.exec(p.dice);
  return m && crit ? `${Number(m[1]) * 2}d${m[2]}${m[3]}` : p.dice;
});

export interface Ctx {
  ad: string;
  kategori: string;
  casterX?: Partial<Combatant>;
  targetX?: Partial<Combatant>;
  tPos?: Offset;
  extra?: Combatant[];
  noB?: boolean;
  /** Hedef T yok (kendine ya da dosta büyü). */
  noT?: boolean;
  bPos?: Offset;
  bX?: Partial<Combatant>;
  tiles?: string[];
  cmd?: Partial<Extract<Command, { type: 'cast_spell' }>>;
  /** Yapımdan sonra çalışan komutlar (tur sonu tetikleri, saldırı). */
  post?: Command[];
  /** İlk komut büyü yapımı değilse (tepki bağlamı: canavar saldırısı). */
  main?: Command;
  /** Kurulumdan sonra durum değişikliği (konsantrasyon değişimi bağlamı). */
  prep?: (st: BattleState) => BattleState;
  p: Partial<Plan>;
  /** Beklenen alanlar (karşılaştırma); `refuse` reddedilmeli. */
  bek: (g: Gozlem) => Alan[];
  refuse?: boolean;
  /** Sonuç sınıflandırması için not. */
  not?: string;
}

/** Bağlamı kurar, çalıştırır ve satıra çevirir. */
export function runCtx(sp: Spell, s: SrdSpell, geo: Geo, c: Ctx, cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>>, mech: string, why: (g: Gozlem, diff: Alan[]) => { sonuc: Sonuc; not: string }): Satir {
  const parts0: Combatant[] = [caster({ spellNames: [sp.name], ...(OZEL[s.id]?.buyucuEk ?? {}), ...c.casterX })];
  parts0.push(enemy('T', c.tPos ?? geo.t, { ...(s.targetType ? { creatureType: s.targetType.toLowerCase() } : {}), ...(OZEL[s.id]?.hedefEk ?? {}), ...c.targetX }));
  if (c.noT) parts0.pop();
  if (!c.noB) parts0.push(ally('B', c.bPos ?? hex(A_ROW, AX - 6), c.bX));
  for (const x of c.extra ?? []) parts0.push(x);
  const state0 = scene(parts0, c.tiles ?? flatTiles());
  const state = c.prep ? c.prep(state0) : state0;
  const cmd = c.main ?? ({ type: 'cast_spell', actorId: 'A', spellName: sp.name, ...cmdBase, ...c.cmd } as Command);
  const g = run(state, [cmd, ...(c.post ?? [])], c.main ? ctxOf(state, (c.main as { actorId: string }).actorId) : P1, plan({ ...c.p, ...(OZEL[s.id]?.saveEtiketsiz ? { untaggedSave: true } : {}) }));
  const base: Omit<Satir, 'beklenen' | 'gercek' | 'sonuc' | 'not'> = {
    tur: 'büyü', ad: sp.name, seviye: String(sp.level), siniflar: s.raw.classes.map((x) => CLASS_TR[x] ?? x).join(', '), mekanik: mech, baglam: c.ad, kategori: c.kategori,
  };
  if (g.cokme) return { ...base, beklenen: c.refuse ? 'red' : 'kabul', gercek: `istisna: ${g.cokme}`, sonuc: 'çökme', not: 'Komut istisna fırlattı.' };
  if (c.refuse) {
    const ok = !g.kabul;
    return { ...base, beklenen: 'red (yapılamaz)', gercek: g.kabul ? 'kabul edildi' : `red: ${g.hata}`, sonuc: ok ? 'doğru' : 'yanlış', not: ok ? '' : (c.not ?? '') };
  }
  if (!g.kabul) {
    const w = why(g, []);
    return { ...base, beklenen: 'kabul', gercek: `red: ${g.hata}`, sonuc: w.sonuc, not: w.not };
  }
  const want = c.bek(g);
  const diff = want.filter((a) => a.b !== a.g);
  const beklenen = want.map((a) => `${a.k}=${a.b}`).join('; ');
  const gercek = want.map((a) => `${a.k}=${a.g}`).join('; ');
  if (!diff.length) return { ...base, beklenen, gercek, sonuc: 'doğru', not: c.not ?? '' };
  const w = why(g, diff);
  return { ...base, beklenen, gercek, sonuc: w.sonuc, not: [`fark: ${diff.map((a) => a.k).join(', ')}`, w.not, c.not].filter(Boolean).join(' — ') };
}

const T0 = (g: Gozlem) => g.saldirilar.filter((x) => x.hedef === 'T');
const S0 = (g: Gozlem, id = 'T') => g.saveler.find((x) => x.hedef === id);
// İyileşen de etkilenmiştir (Conjure Celestial: "For each creature you can see in the Cylinder, choose which of these
// lights shines on it: Healing Light … Searing Light"; ölçüm düzeltmesi, eskiden yalnız save ve saldırı sayılıyordu).
const etkilenen = (g: Gozlem) => [...new Set([...g.saveler.map((x) => x.hedef), ...g.saldirilar.map((x) => x.hedef), ...Object.keys(g.iyilesme)])].sort();
const dmgZar = (g: Gozlem) => g.zarlar.filter((z) => z.kind === 'damage' || z.kind === undefined);

/** Saldırı zarının beklenen sonucu (kip, doğal zar, toplam, AC, isabet, kritik). */
export function expAttack(m: Mode, d: D20, ac: number): { kip: Mode; dogal: number; isabet: boolean; kritik: boolean; ac: number } {
  const dogal = m === 'normal' ? d.one : m === 'advantage' ? Math.max(...d.two) : Math.min(...d.two);
  const total = dogal + 10;
  return { kip: m, dogal, isabet: dogal === 20 || (dogal !== 1 && total >= ac), kritik: dogal === 20, ac };
}
export function expSave(m: Mode, d: D20, bonus: number): { kip: Mode; dogal: number; basari: boolean } {
  const dogal = m === 'normal' ? d.one : m === 'advantage' ? Math.max(...d.two) : Math.min(...d.two);
  return { kip: m, dogal, basari: dogal + bonus >= CASTER_DC };
}

/** Bilinen sapmaların sınıflandırması: farkın türüne ve veri bayraklarına göre. */
export function classify(sp: Spell, s: SrdSpell, kat: string) {
  const m = mechanicsAt(ST, sp);
  return (g: Gozlem, diff: Alan[]): { sonuc: Sonuc; not: string } => {
    if (!g.kabul) {
      const e = g.hata ?? '';
      if (m.offCombat || /savaş dışı|çalışmıyor|savaşta çalışmıyor|tanımlı değil/i.test(e)) return { sonuc: 'uygulanmıyor', not: `Motor reddetti: ${e}` };
      return { sonuc: 'yanlış', not: `Motor reddetti (SRD'ye göre yapılabilir): ${e}` };
    }
    if (kat === 'yukarı slot' && m.upcast && !m.upcast.applied) return { sonuc: 'uygulanmıyor', not: 'Veride upcast.applied yok (motor yukarı slot etkisini uygulamıyor).' };
    const keys = diff.map((d) => d.k);
    // Beklenen etki hiç yoksa (durum/hasar/save olayı yok) "uygulanmıyor", yanlış değerse "yanlış".
    const none = diff.every((d) => d.g === 'yok' || d.g === '0' || d.g === '—');
    if (none && keys.every((k) => ['durum', 'etki', 'süre', 'tepki'].includes(k))) return { sonuc: 'uygulanmıyor', not: m.approx ? `Veride yaklaşık: ${m.approx}` : '' };
    return { sonuc: 'yanlış', not: m.approx ? `Veride yaklaşık: ${m.approx}` : '' };
  };
}

/** Hasar/save/saldırı büyüsünün bağlamları. */
export function damageRows(sp: Spell, s0: SrdSpell, ov?: Yapim): Satir[] {
  const out: Satir[] = [];
  const s: SrdSpell = ov ? { ...s0, attack: ov.tur === 'attack' ? ov.attack ?? 'melee' : null, save: ov.tur === 'save' ? ov.save ?? s0.save : null,
    damage: (ov.dmg ?? []).map((d) => ({ dice: d.dice, type: d.type, addMod: !!ov.addMod })), halfOnSave: !!ov.half, conditions: ov.conds ?? [] } : s0;
  const geo = geometry(s, sp);
  const m = mechanicsAt(ST, sp);
  const mech = `${m.kind}${sp.area ? `+alan(${sp.area.shape})` : ''}`;
  const isAttack = !!s.attack;
  const isAuto = !s.attack && !s.save && s.damage.length > 0;
  const choice = ov?.choice ?? CHOSEN_TYPE[s.id];
  const burst = ov?.burst;
  const halfMiss = !!ov?.halfOnMiss;
  /** Save'in taban kipi: "fighting it" avantajı (Charm/Dominate). */
  const sm: Mode = s.saveAdvFighting ? 'advantage' : 'normal';
  const comb = (a: Mode, b: Mode): Mode => modeOf(a === 'advantage' || b === 'advantage', a === 'disadvantage' || b === 'disadvantage');
  // Fire Storm (serbest şekil): hedefin altıgeni ve çevresi (7 altıgen; SRD on 10 ft küp).
  const ring = (o: Offset): Offset[] => [o, { col: o.col, row: o.row - 1 }, { col: o.col, row: o.row + 1 }, { col: o.col - 1, row: o.row }, { col: o.col + 1, row: o.row },
    { col: o.col - 1, row: o.row + (o.col % 2 ? 1 : -1) }, { col: o.col + 1, row: o.row + (o.col % 2 ? 1 : -1) }];
  const cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>> = {
    ...(geo.kind === 'single' ? { targetId: 'T' } : geo.aim ? { targetHex: geo.aim } : {}),
    ...(m.freeShape && geo.aim ? { targetHexes: ring(geo.aim) } : {}),
    ...(sp.level > 0 ? { slotLevel: sp.level } : {}),
    ...(choice ? { choice } : {}),
  };
  const tier = 4;
  const ps = parts(s, tier, 0);
  const type = ps[0]?.type ?? '';
  const rays = s.cantrip?.kind === 'beams' ? 4 : s.rays;
  const ranged = s.attack === 'ranged';
  const half = s.halfOnSave;
  const can = s.level === 0;
  const slotExp = sp.level > 0 ? [sp.level] : [];
  const kons = s.concentration ? sp.name : null;
  const cls = (kat: string) => classify(sp, s, kat);

  const dmgFor = (o: { crit?: boolean; save?: 'fail' | 'ok'; prof?: Profil; up?: number; tierX?: number; hit?: boolean; n?: number }) => {
    const pp = parts(s, o.tierX ?? tier, o.up ?? 0);
    if (o.hit === false) return 0;
    const pick = (p: { dice: string; type: string }, i: number) => {
      const a = applied(p.dice, p.type, { crit: o.crit, save: o.save, half, cantrip: can, prof: o.prof ?? {} });
      // True Strike (SRD): silah hasarı Radiant ya da silahın türü (büyücü seçer; en çok işleyen).
      return s.id === 'true-strike' && i === 0 ? Math.max(a, applied(p.dice, 'radiant', { crit: o.crit, prof: o.prof ?? {} })) : a;
    };
    const one = pp.reduce((n, p, i) => n + pick(p, i), 0);
    return one * (o.n ?? 1);
  };
  const zarFor = (o: { crit?: boolean; up?: number; tierX?: number; n?: number; hit?: boolean }) => {
    if (o.hit === false) return [];
    const one = dmgPartsStr(parts(s, o.tierX ?? tier, o.up ?? 0), o.crit);
    return Array.from({ length: o.n ?? 1 }, () => one).flat();
  };

  // Ortak beklenen alanlar (saldırı büyüsü).
  // Ice Knife patlaması (isabet ya da ıska; save başarısız varsayılır: plan varsayılanı 10 < DC 18), Acid Arrow ıskada yarı.
  const burstDice = (up = 0) => (burst ? [up > 0 ? `${Number(/^(\d+)/.exec(burst.dice)?.[1]) + up * Number(/^(\d+)/.exec(burst.up)?.[1])}d${/d(\d+)/.exec(burst.dice)?.[1]}` : burst.dice] : []);
  const burstDmg = (prof: Profil, up = 0) => (burst ? adjust(exprTotal(burstDice(up)[0] as string), burst.type, prof) : 0);
  const missDmg = (prof: Profil) => (halfMiss ? parts(s, tier, 0).reduce((n, p) => n + adjust(Math.floor(exprTotal(p.dice) / 2), p.type, prof), 0) : 0);
  const atkFields = (g: Gozlem, e: { kip: Mode; dogal: number; isabet: boolean; kritik: boolean; ac: number }, n: number, prof: Profil = {}, extra: Alan[] = [], zar = false): Alan[] => {
    const a = T0(g)[0];
    const dice = [...(e.isabet ? zarFor({ crit: e.kritik, n }) : halfMiss ? zarFor({}) : []), ...burstDice()];
    return [
      alan('ışın', n, T0(g).length),
      alan('kip', e.kip, a?.kip), alan('doğal', e.dogal, a?.dogal), alan('AC', e.ac, a?.ac), alan('isabet', e.isabet, a?.isabet), alan('kritik', e.kritik, a?.kritik),
      ...(zar ? [alan('zar', kanonExpr(dice), kanon(dmgZar(g)))] : []),
      alan('hasar', (e.isabet ? dmgFor({ crit: e.kritik, prof, n }) : missDmg(prof)) + burstDmg(prof), g.hp.T ?? 0),
      ...(s.id === 'true-strike' ? [] : [alan('tür', e.isabet ? type : '—', e.isabet ? a?.tur ?? 'yok' : '—')]),
      ...extra,
    ];
  };
  const saveFields = (g: Gozlem, e: { kip: Mode; dogal: number; basari: boolean }, prof: Profil = {}, extra: Alan[] = [], zar = false): Alan[] => {
    const v = S0(g);
    const conds = e.basari ? [] : s.conditions;
    const hidden = !!OZEL[s.id]?.saveGizli;
    return [
      ...(hidden ? [] : [alan('save', `${s.save}/${CASTER_DC}`, v ? `${v.yetenek}/${v.dc}` : 'yok'), alan('kip', e.kip, v?.kip), alan('başarı', e.basari, v?.basari)]),
      ...(ps.length ? [...(zar ? [alan('zar', kanonExpr(zarFor({})), kanon(dmgZar(g)))] : []), alan('hasar', dmgFor({ save: e.basari ? 'ok' : 'fail', prof }), g.hp.T ?? 0),
        alan('tür', type, v?.tur || 'yok')] : []),
      alan('durum', conds.length ? [...conds].sort() : null, conds.length
        ? ((x: string[]) => (x.length ? x : null))(conds.filter((c) => (g.after?.combatants.T?.conditions ?? []).includes(c)).sort())
        : (g.durum.T ?? []).length ? [...(g.durum.T ?? [])].sort() : null),
      ...extra,
    ];
  };
  const common = (g: Gozlem, slot = slotExp, k = kons): Alan[] => [alan('slot', slot.length ? slot : null, g.slot.length ? g.slot : null), alan('kons', k, g.kons)];

  if (isAttack) {
    const N = rays;
    const ac = TARGET_AC;
    const norm = expAttack('normal', D20_NORMAL, ac);
    out.push(runCtx(sp, s, geo, { ad: 'normal (isabet)', kategori: 'yapım', p: { attack: D20_NORMAL }, bek: (g) => [...atkFields(g, norm, N, {}, [], true), ...common(g)] }, cmdBase, mech, cls('yapım')));
    out.push(runCtx(sp, s, geo, { ad: 'ıska (doğal 1)', kategori: 'saldırı zarı', p: { attack: D20_MISS }, bek: (g) => atkFields(g, expAttack('normal', D20_MISS, ac), N) }, cmdBase, mech, cls('saldırı zarı')));
    out.push(runCtx(sp, s, geo, { ad: 'kritik (doğal 20)', kategori: 'saldırı zarı', p: { attack: D20_CRIT }, bek: (g) => atkFields(g, expAttack('normal', D20_CRIT, ac), N, {}, [], true) }, cmdBase, mech, cls('saldırı zarı')));
    for (const [ad, prof] of [['direnç', { res: [type] }], ['zayıflık', { vul: [type] }], ['bağışıklık', { imm: [type] }]] as Array<[string, Profil]>) {
      out.push(runCtx(sp, s, geo, { ad: `hedef ${ad} (${type})`, kategori: 'hasar türü', targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] },
        p: { attack: D20_NORMAL }, bek: (g) => atkFields(g, norm, N, prof) }, cmdBase, mech, cls('hasar türü')));
    }
    // Avantaj/dezavantaj: hedef Restrained (avantaj), Prone (yakında avantaj, uzakta dezavantaj), Invisible (dezavantaj),
    // büyücü Frightened (dezavantaj), menzilli saldırıda yanında düşman (dezavantaj).
    out.push(runCtx(sp, s, geo, { ad: 'hedef Restrained', kategori: 'durum', targetX: { conditions: ['Restrained'] }, p: { attack: D20_NORMAL },
      bek: (g) => atkFields(g, expAttack('advantage', D20_NORMAL, ac), N) }, cmdBase, mech, cls('durum')));
    out.push(runCtx(sp, s, geo, { ad: `hedef Prone (${ranged ? 'menzilli: dezavantaj' : 'yakın: avantaj'})`, kategori: 'durum', targetX: { conditions: ['Prone'] }, p: { attack: D20_NORMAL },
      bek: (g) => atkFields(g, expAttack(ranged && geo.t.row - A_ROW > 1 ? 'disadvantage' : 'advantage', D20_NORMAL, ac), N) }, cmdBase, mech, cls('durum')));
    out.push(runCtx(sp, s, geo, { ad: 'hedef Invisible', kategori: 'durum', targetX: { conditions: ['Invisible'] }, p: { attack: D20_NORMAL }, refuse: s.needsSight,
      not: s.needsSight ? 'SRD: hedef "görebildiğin" yaratık olmalı.' : undefined,
      bek: (g) => atkFields(g, expAttack('disadvantage', D20_NORMAL, ac), N) }, cmdBase, mech, cls('durum')));
    out.push(runCtx(sp, s, geo, { ad: 'büyücü Frightened (kaynak görüşte)', kategori: 'durum', casterX: frightenedBy('F'), extra: [enemy('F', hex(A_ROW, AX + 8))], p: { attack: D20_NORMAL },
      bek: (g) => atkFields(g, expAttack('disadvantage', D20_NORMAL, ac), N) }, cmdBase, mech, cls('durum')));
    out.push(runCtx(sp, s, geo, { ad: 'büyücü Charmed (hedef büyüleyen)', kategori: 'durum', casterX: charmedBy('T'), p: { attack: D20_NORMAL }, refuse: true,
      not: 'SRD 5.2.1 Charmed: büyüleyene saldırılamaz, zarar veren etkiyle hedeflenemez.', bek: () => [] }, cmdBase, mech, cls('durum')));
    if (ranged && geo.t.row - A_ROW > 1) {
      out.push(runCtx(sp, s, geo, { ad: 'menzilli saldırı, yanında düşman', kategori: 'saldırı zarı', extra: [enemy('M', hex(A_ROW, AX + 1))], p: { attack: D20_NORMAL },
        bek: (g) => atkFields(g, expAttack('disadvantage', D20_NORMAL, ac), N) }, cmdBase, mech, cls('saldırı zarı')));
      if (geo.bandRows) {
        const [r0, r1] = geo.bandRows;
        out.push(runCtx(sp, s, geo, { ad: 'yarım siper (+2 AC)', kategori: 'siper', tiles: band(flatTiles(), r0, r1, 'd'), p: { attack: D20_NORMAL },
          bek: (g) => atkFields(g, expAttack('normal', D20_NORMAL, ac + 2), N) }, cmdBase, mech, cls('siper')));
        out.push(runCtx(sp, s, geo, { ad: '3/4 siper (+5 AC)', kategori: 'siper', tiles: band(flatTiles(), r0, r1, 'c'), p: { attack: D20_NORMAL },
          bek: (g) => atkFields(g, expAttack('normal', D20_NORMAL, ac + 5), N) }, cmdBase, mech, cls('siper')));
      }
    }
    // Konsantrasyon kesilmesi: hedef konsantrasyonda; hasar alınca CON save DC max(10, hasar/2); zar 1 → biter.
    out.push(runCtx(sp, s, geo, { ad: 'hedefin konsantrasyonu (CON save başarısız)', kategori: 'konsantrasyon', targetX: concentrating(), p: { attack: D20_NORMAL, saves: { T: [SAVE_FAIL, SAVE_FAIL, SAVE_FAIL, SAVE_FAIL] } },
      bek: (g) => {
        const first = dmgFor({ n: 1 });
        return [alan('kons. save DC', Math.min(30, Math.max(10, Math.floor(first / 2))), g.konsSave.find((x) => x.hedef === 'T')?.dc), alan('kons. bitti', first > 0, g.konsBitti.includes('T'))];
      } }, cmdBase, mech, cls('konsantrasyon')));
    // Shield: hedefin tepkisi, AC +5 (tetikleyen saldırıya da).
    out.push(runCtx(sp, s, geo, { ad: 'hedefte Shield (tepki)', kategori: 'tepki', targetX: shieldCaster(), p: { attack: D20_NORMAL, react: kullan('T') },
      bek: (g) => { const e = expAttack('normal', D20_NORMAL, ac + 5); const a = T0(g)[0]; return [alan('tepki', ['T:Shield'], g.tepki.filter((x) => x.startsWith('T:'))), alan('AC', e.ac, a?.ac), alan('isabet', e.isabet, a?.isabet),
        alan('hasar', (e.isabet ? dmgFor({ n: N }) : missDmg({})) + burstDmg({}), g.hp.T ?? 0)]; } }, cmdBase, mech, cls('tepki')));
  } else if (s.save) {
    const prone = (ad: string, x: Partial<Combatant>, kat = 'durum') => runCtx(sp, s, geo, { ad, kategori: kat, targetX: x, p: { saves: { T: [SAVE_DIS_PROBE] } },
      bek: (g) => saveFields(g, expSave(sm, SAVE_DIS_PROBE, 0)) }, cmdBase, mech, cls(kat));
    out.push(runCtx(sp, s, geo, { ad: 'normal (save başarısız)', kategori: 'yapım', p: { saves: { T: [SAVE_FAIL] } }, bek: (g) => [...saveFields(g, expSave(sm, SAVE_FAIL, 0), {}, [], true), ...common(g)] }, cmdBase, mech, cls('yapım')));
    out.push(runCtx(sp, s, geo, { ad: 'save başarılı', kategori: 'save', p: { saves: { T: [SAVE_OK] } }, bek: (g) => saveFields(g, expSave(sm, SAVE_OK, 0)) }, cmdBase, mech, cls('save')));
    if (ps.length) {
      for (const [ad, prof] of [['direnç', { res: [type] }], ['zayıflık', { vul: [type] }], ['bağışıklık', { imm: [type] }]] as Array<[string, Profil]>) {
        out.push(runCtx(sp, s, geo, { ad: `hedef ${ad} (${type})`, kategori: 'hasar türü', targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] },
          p: { saves: { T: [SAVE_FAIL] } }, bek: (g) => saveFields(g, expSave(sm, SAVE_FAIL, 0), prof) }, cmdBase, mech, cls('hasar türü')));
      }
      if (half) out.push(runCtx(sp, s, geo, { ad: 'save başarılı + direnç (yarının yarısı)', kategori: 'hasar türü', targetX: { resistances: [type] }, p: { saves: { T: [SAVE_OK] } },
        bek: (g) => saveFields(g, expSave(sm, SAVE_OK, 0), { res: [type] }) }, cmdBase, mech, cls('hasar türü')));
    }
    // Restrained: DEX save dezavantajlı; diğer save'ler etkilenmez.
    out.push(runCtx(sp, s, geo, { ad: `hedef Restrained (${s.save === 'dex' ? 'DEX save dezavantajı' : 'save etkilenmez'})`, kategori: 'durum', targetX: { conditions: ['Restrained'] }, p: { saves: { T: [SAVE_DIS_PROBE] } },
      bek: (g) => saveFields(g, expSave(s.save === 'dex' ? comb(sm, 'disadvantage') : sm, SAVE_DIS_PROBE, 0)) }, cmdBase, mech, cls('durum')));
    out.push(prone('hedef Prone (save etkilenmez)', { conditions: ['Prone'] }));
    if (geo.kind === 'single') {
      out.push(runCtx(sp, s, geo, { ad: 'hedef Invisible', kategori: 'durum', targetX: { conditions: ['Invisible'] }, p: { saves: { T: [SAVE_DIS_PROBE] } }, refuse: s.needsSight,
        not: s.needsSight ? 'SRD: hedef "görebildiğin" yaratık olmalı.' : undefined, bek: (g) => saveFields(g, expSave(sm, SAVE_DIS_PROBE, 0)) }, cmdBase, mech, cls('durum')));
      out.push(runCtx(sp, s, geo, { ad: 'büyücü Charmed (hedef büyüleyen)', kategori: 'durum', casterX: charmedBy('T'), p: { saves: { T: [SAVE_FAIL] } }, refuse: true,
        not: 'SRD 5.2.1 Charmed: büyüleyen zarar veren büyüyle hedeflenemez.', bek: () => [] }, cmdBase, mech, cls('durum')));
    }
    out.push(runCtx(sp, s, geo, { ad: 'büyücü Frightened (save etkilenmez)', kategori: 'durum', casterX: frightenedBy('F'), extra: [enemy('F', hex(A_ROW, AX + 8))], p: { saves: { T: [SAVE_DIS_PROBE] } },
      bek: (g) => saveFields(g, expSave(sm, SAVE_DIS_PROBE, 0)) }, cmdBase, mech, cls('durum')));
    if (s.save === 'dex' && geo.coverT && geo.bandRows && !OZEL[s.id]?.siperYok) {
      const [r0, r1] = geo.bandRows;
      const ign = s.ignoresCover;
      out.push(runCtx(sp, s, geo, { ad: `yarım siper (+2 DEX save${ign ? '; SRD: bu büyüde siper yok' : ''})`, kategori: 'siper', tPos: geo.coverT, tiles: band(flatTiles(), r0, r1, 'd'), p: { saves: { T: [SAVE_HALF_COVER] } },
        bek: (g) => saveFields(g, expSave(sm, SAVE_HALF_COVER, ign ? 0 : 2)) }, cmdBase, mech, cls('siper')));
      out.push(runCtx(sp, s, geo, { ad: `3/4 siper (+5 DEX save${ign ? '; SRD: bu büyüde siper yok' : ''})`, kategori: 'siper', tPos: geo.coverT, tiles: band(flatTiles(), r0, r1, 'c'), p: { saves: { T: [SAVE_TQ_COVER] } },
        bek: (g) => saveFields(g, expSave(sm, SAVE_TQ_COVER, ign ? 0 : 5)) }, cmdBase, mech, cls('siper')));
    }
    if (ps.length) {
      out.push(runCtx(sp, s, geo, { ad: 'hedefin konsantrasyonu (CON save başarısız)', kategori: 'konsantrasyon', targetX: concentrating(), p: { saves: { T: [SAVE_FAIL, SAVE_FAIL, SAVE_FAIL] } },
        bek: (g) => {
          const dmg = dmgFor({ save: 'fail' });
          return [alan('kons. save DC', Math.min(30, Math.max(10, Math.floor(dmg / 2))), g.konsSave.find((x) => x.hedef === 'T')?.dc), alan('kons. bitti', dmg > 0, g.konsBitti.includes('T'))];
        } }, cmdBase, mech, cls('konsantrasyon')));
    }
    if (geo.kind !== 'single' && !OZEL[s.id]?.saveGizli) {
      // Alan içi hedefler: T ve U içeride, Z dışarıda.
      // İtilen hedef (Thunderwave) ikinci düşmana çarpmasın (ev kuralı carpmaHasari): U eksenin yanında.
      const pushed = /pushed/i.test(s.raw.text);
      const uPos = !geo.u ? null : pushed && geo.kind === 'self' && sp.area?.shape === 'line' ? hex(A_ROW + Math.max(2, geo.radius - 1)) : pushed ? { col: AX + 1, row: geo.t.row + 1 } : geo.u;
      out.push(runCtx(sp, s, geo, { ad: 'alan içi hedefler (2 içeride, 1 dışarıda)', kategori: 'alan',
        extra: [...(uPos ? [enemy('U', uPos, s.targetType ? { creatureType: s.targetType.toLowerCase() } : {})] : []), ...(geo.z ? [enemy('Z', geo.z)] : [])], p: { saves: { T: [SAVE_FAIL], U: [SAVE_FAIL], Z: [SAVE_FAIL] } },
        // Alan haritanın tamamını kaplıyorsa (Storm of Vengeance: "spreading to a radius of 300 feet … Each creature under
        // the cloud when it appears"), büyücü A ve dost B de içeride (kahin düzeltmesi; harita 31×45 altıgen).
        bek: (g) => [alan('etkilenen', ['T', ...(geo.u ? ['U'] : []), ...(sp.area && sp.area.origin === 'point' && sp.area.shape === 'sphere' && sp.area.targets === 'all' && sp.area.sizeFt / 5 >= ROWS && geo.aim
          ? (['A', 'B'] as const).filter((id) => hexDistance(id === 'A' ? hex(A_ROW) : hex(A_ROW, AX - 6), geo.aim as Offset) <= (sp.area?.sizeFt ?? 0) / 5) : [])].sort(), etkilenen(g)),
          ...(ps.length && geo.u ? [alan('U hasarı', dmgFor({ save: 'fail' }), g.hp.U ?? 0)] : [])] }, cmdBase, mech, cls('alan')));
      if (geo.ff) {
        out.push(runCtx(sp, s, geo, { ad: `dost ateşi (dost alanda; SRD: ${s.chooseTargets ? 'seçilen yaratıklar' : 'alandaki herkes'})`, kategori: 'alan',
          extra: [ally('D', geo.ff)], p: { saves: { T: [SAVE_FAIL], D: [SAVE_FAIL] } },
          bek: (g) => [alan('dost etkilendi', !s.chooseTargets, etkilenen(g).includes('D'))] }, cmdBase, mech, cls('alan')));
      }
    }
  } else if (isAuto) {
    const darts = s.rays;
    out.push(runCtx(sp, s, geo, { ad: 'normal (otomatik isabet)', kategori: 'yapım', p: {}, bek: (g) => [alan('dart', darts, T0(g).length), alan('zar', kanonExpr(zarFor({ n: darts })), kanon(dmgZar(g))),
      alan('hasar', dmgFor({ n: darts }), g.hp.T ?? 0), alan('tür', type, T0(g)[0]?.tur ?? 'yok'), ...common(g)] }, cmdBase, mech, cls('yapım')));
    for (const [ad, prof] of [['direnç', { res: [type] }], ['zayıflık', { vul: [type] }], ['bağışıklık', { imm: [type] }]] as Array<[string, Profil]>) {
      out.push(runCtx(sp, s, geo, { ad: `hedef ${ad} (${type})`, kategori: 'hasar türü', targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] }, p: {},
        bek: (g) => [alan('hasar', dmgFor({ n: darts, prof }), g.hp.T ?? 0)] }, cmdBase, mech, cls('hasar türü')));
    }
    if (s.id === 'magic-missile') out.push(runCtx(sp, s, geo, { ad: 'hedefte Shield (Magic Missile engellenir)', kategori: 'tepki', targetX: shieldCaster(), p: { react: kullan('T') },
      bek: (g) => [alan('tepki', ['T:Shield'], g.tepki.filter((x) => x.startsWith('T:'))), alan('hasar', 0, g.hp.T ?? 0)] }, cmdBase, mech, cls('tepki')));
    out.push(runCtx(sp, s, geo, { ad: 'hedef Invisible', kategori: 'durum', targetX: { conditions: ['Invisible'] }, p: {}, refuse: s.needsSight,
      not: s.needsSight ? 'SRD: dart "görebildiğin" yaratığa.' : undefined, bek: (g) => [alan('hasar', dmgFor({ n: darts }), g.hp.T ?? 0)] }, cmdBase, mech, cls('durum')));
    out.push(runCtx(sp, s, geo, { ad: 'büyücü Charmed (hedef büyüleyen)', kategori: 'durum', casterX: charmedBy('T'), p: {}, refuse: true,
      not: 'SRD 5.2.1 Charmed.', bek: () => [] }, cmdBase, mech, cls('durum')));
  }

  // Yukarı slot (bir seviye).
  if (sp.level > 0 && sp.level < 9 && s.upcast) {
    const up = 1;
    const u = s.upcast;
    const c2: Partial<Extract<Command, { type: 'cast_spell' }>> = { slotLevel: sp.level + 1 };
    if (u.dice?.length) {
      if (isAttack) {
        out.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+${u.dice.join('/')})`, kategori: 'yukarı slot', cmd: c2, p: { attack: D20_NORMAL },
          bek: (g) => [alan('zar', kanonExpr([...zarFor({ up, n: rays }), ...burstDice(up)]), kanon(dmgZar(g))), alan('hasar', dmgFor({ up, n: rays }) + burstDmg({}, up), g.hp.T ?? 0), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
      } else {
        out.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+${u.dice.join('/')})`, kategori: 'yukarı slot', cmd: c2, p: { saves: { T: [SAVE_FAIL] } },
          bek: (g) => [alan('zar', kanonExpr(zarFor({ up, n: isAuto ? s.rays : 1 })), kanon(dmgZar(g))), alan('hasar', dmgFor({ up, save: s.save ? 'fail' : undefined, n: isAuto ? s.rays : 1 }), g.hp.T ?? 0),
            alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
      }
    } else if (u.rays && s.id === 'chain-lightning') {
      // SRD: ana hedef + 30 ft içinde en çok üç hedef; yukarı slot başına bir ek sıçrama.
      const near = [hex(geo.t.row, AX + 2), hex(geo.t.row, AX - 2), hex(geo.t.row + 2), hex(geo.t.row + 4)];
      const ids = ['U', 'V', 'W', 'X'];
      const others = near.map((o, i) => enemy(ids[i] as string, o));
      const hitN = (g: Gozlem) => ['T', ...ids].filter((x) => (g.hp[x] ?? 0) > 0).length;
      out.push(runCtx(sp, s, geo, { ad: 'ana hedef + 30 ft içinde 4 düşman (SRD: en çok 3 ek hedef)', kategori: 'alan', extra: others, p: { saveDefault: SAVE_FAIL },
        bek: (g) => [alan('hasar alan', 4, hitN(g))] }, { ...cmdBase, targetIds: ['T', ...ids] }, mech, cls('alan')));
      out.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+1 ek hedef)`, kategori: 'yukarı slot', extra: others, cmd: c2, p: { saveDefault: SAVE_FAIL },
        bek: (g) => [alan('hasar alan', 5, hitN(g)), alan('slot', [sp.level + 1], g.slot)] }, { ...cmdBase, targetIds: ['T', ...ids] }, mech, cls('yukarı slot')));
    } else if (u.rays) {
      out.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+1 ışın/dart)`, kategori: 'yukarı slot', cmd: c2, p: { attack: D20_NORMAL },
        bek: (g) => [alan('ışın', rays + 1, T0(g).length), alan('hasar', dmgFor({ n: rays + 1 }), g.hp.T ?? 0), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
    } else if (u.targets && geo.kind === 'single') {
      out.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+1 hedef)`, kategori: 'yukarı slot', extra: [enemy('U', geo.u as Offset)], cmd: { ...c2, targetId: undefined, targetIds: ['T', 'U'] },
        p: { saves: { T: [SAVE_FAIL], U: [SAVE_FAIL] } }, bek: (g) => [alan('etkilenen', ['T', 'U'], etkilenen(g).filter((x) => x === 'T' || x === 'U')), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
    }
  }
  // Kantrip kademesi (seviye 1, 5, 11; normal bağlam 20. seviye).
  if (s.level === 0 && s.cantrip && (s.cantrip.kind === 'dice' || s.cantrip.kind === 'beams')) {
    for (const [lv, t] of [[1, 1], [5, 2], [11, 3]] as Array<[number, number]>) {
      const n = s.cantrip.kind === 'beams' ? t : rays;
      out.push(runCtx(sp, s, geo, { ad: `kantrip: büyücü seviye ${lv}`, kategori: 'yukarı slot', casterX: { level: lv }, p: { attack: D20_NORMAL, saves: { T: [SAVE_FAIL] } },
        bek: (g) => [alan(s.cantrip?.kind === 'beams' ? 'ışın' : 'zar', s.cantrip?.kind === 'beams' ? n : kanonExpr(zarFor({ tierX: t, n })),
          s.cantrip?.kind === 'beams' ? T0(g).length : kanon(dmgZar(g)))] }, cmdBase, mech, cls('yukarı slot')));
    }
  }
  // Yüzey etkileşimi (oyunun tablosu data/yuzey-etkilesimleri.json, element tetiği): hasar türüne uyan yüzey hedefin
  // altıgeninde ve çevresinde; büyü o altıgene değince (isabet, alan ya da hasarlı ateş save'i) tablo satırı çalışmalı.
  const SURF: Record<string, [string, string]> = { fire: ['oil', 'fireOil'], cold: ['water', 'coldWater'], lightning: ['water', 'lightningWater'], thunder: ['water', 'forceWater'], force: ['water', 'forceWater'] };
  const sf = SURF[type];
  if (sf && ps.length && (isAttack || isAuto || geo.kind !== 'single' || type === 'fire')) {
    const [kind, rowId] = sf;
    const at = geo.t;
    const hexes = [at, { col: at.col, row: at.row - 1 }, { col: at.col, row: at.row + 1 }, { col: at.col - 1, row: at.row }, { col: at.col + 1, row: at.row }];
    const prep = (st: BattleState): BattleState => ({ ...st, map: { ...(st.map as NonNullable<BattleState['map']>), zones: [
      { id: `surface:${kind}:1`, spellId: `surface:${kind}`, name: kind, casterId: 'harita', side: 'enemies', dc: 10, slotLevel: 0, hexes, surface: kind } as NonNullable<NonNullable<BattleState['map']>['zones']>[number]] } });
    out.push(runCtx(sp, s, geo, { ad: `yüzey: hedef ${kind === 'oil' ? 'yağda' : 'suda'} (${type} → ${rowId})`, kategori: 'yüzey', prep, p: { attack: D20_NORMAL, saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('tepkime', rowId, g.yuzey.includes(rowId) ? rowId : g.yuzey.length ? g.yuzey.join('+') : 'yok')] }, cmdBase, mech, cls('yüzey')));
  }
  // Counterspell: büyücünün CON save'i başarısız → büyü boşa, slot harcanmaz; başarılı → büyü olur.
  out.push(...counterRows(sp, s, geo, cmdBase, mech, cls));
  return out;
}

export function counterRows(sp: Spell, s: SrdSpell, geo: Geo, cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>>, mech: string, cls: (k: string) => (g: Gozlem, d: Alan[]) => { sonuc: Sonuc; not: string }, extra: Combatant[] = [], tPos?: Offset, bPos?: Offset, prep?: (st: BattleState) => BattleState, bX?: Partial<Combatant>): Satir[] {
  const react = (q: { reactorId: string; options: Array<{ id: string; choices?: Array<{ id: string }> }> }) => {
    if (q.reactorId !== 'K' || !q.options[0]) return null;
    const o = q.options[0];
    return o.choices?.length ? { option: o.id, choice: (o.choices[0] as { id: string }).id } : { option: o.id };
  };
  const K = enemy('K', hex(A_ROW, AX + 10), counterCaster());
  // Etki yok: kimse hasar almaz, iyileşmez, durum/etki almaz (K'nin kendi yuvası dışında).
  const etki = (g: Gozlem) => {
    const hp = Object.entries(g.hp).filter(([id, v]) => id !== 'K' && v !== 0).map(([id]) => `${id}:hp`);
    const heal = Object.entries(g.iyilesme).filter(([, v]) => v > 0).map(([id]) => `${id}:iyileşme`);
    const cond = Object.keys(g.durum).map((id) => `${id}:durum`);
    const fx = Object.keys(g.etkiler).map((id) => `${id}:etki`);
    const all = [...hp, ...heal, ...cond, ...fx];
    return all.length ? all : null;
  };
  return [runCtx(sp, s, geo, { ad: "Counterspell (büyücünün CON save'i başarısız)", kategori: 'tepki', extra: [K, ...extra], ...(tPos ? { tPos } : {}), ...(bPos ? { bPos } : {}), ...(prep ? { prep } : {}), ...(bX ? { bX } : {}),
    p: { attack: D20_NORMAL, saves: { A: [SAVE_FAIL], T: [SAVE_FAIL] }, react },
    bek: (g) => [alan('tepki', ['K:Counterspell'], g.tepki.filter((x) => x.startsWith('K:'))), alan('büyücü slotu', null, g.slot.length ? g.slot : null),
      alan('K slotu', [3], g.slotBy.K ?? null), alan('etki', null, etki(g)), alan('kons', null, g.kons)] }, cmdBase, mech, cls('tepki'))];
}

/** İyileştirme büyüleri. */
export function healRows(sp: Spell, s: SrdSpell): Satir[] {
  const geo = geometry(s, sp);
  const m = mechanicsAt(ST, sp);
  const mech = `${m.kind}${sp.area ? `+alan(${sp.area.shape})` : ''}`;
  const cls = classify(sp, s, 'yapım');
  const heal = s.heal as NonNullable<SrdSpell['heal']>;
  const bPos = geo.kind === 'single' ? (s.rangeFt <= 5 ? hex(A_ROW + 1, AX - 1) : hex(A_ROW + 2, AX - 2)) : geo.t;
  const multi = !!mechanicsAt(ST, sp).healTargets;
  const cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>> = { ...(multi ? { targetIds: ['H'] } : geo.kind === 'single' ? { targetId: 'H' } : geo.aim ? { targetHex: geo.aim } : {}), ...(sp.level > 0 ? { slotLevel: sp.level } : {}) };
  const amount = (up: number) => {
    const inc = up > 0 && s.upcast?.heal ? s.upcast.heal : null;
    let d = heal.dice;
    if (inc) {
      const a = /^(\d+)d(\d+)$/.exec(d); const b = /^(\d+)d(\d+)$/.exec(inc);
      if (a && b && a[2] === b[2]) d = `${Number(a[1]) + Number(b[1]) * up}d${a[2]}`;
      else if (/^\d+$/.test(d) && /^\d+$/.test(inc)) d = String(Number(d) + Number(inc) * up);
    }
    return { dice: d + (heal.addMod ? `+${CASTER_MOD}` : ''), total: exprTotal(d) + (heal.addMod ? CASTER_MOD : 0) };
  };
  const H = ally('H', bPos, { hp: 20, maxHp: 300 });
  const rows: Satir[] = [];
  const e0 = amount(0);
  rows.push(runCtx(sp, s, geo, { ad: 'normal (dosta)', kategori: 'yapım', tPos: hex(A_ROW + 12, AX + 8), extra: [H], p: {},
    bek: (g) => [alan('iyileşme', e0.total, g.iyilesme.H ?? 0), alan('slot', sp.level > 0 ? [sp.level] : null, g.slot.length ? g.slot : null), alan('kons', s.concentration ? sp.name : null, g.kons)] }, cmdBase, mech, cls));
  if (sp.level < 9 && s.upcast?.heal) {
    const e1 = amount(1);
    rows.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+${s.upcast.heal})`, kategori: 'yukarı slot', tPos: hex(A_ROW + 12, AX + 8), extra: [H], cmd: { slotLevel: sp.level + 1 }, p: {},
      bek: (g) => [alan('iyileşme', e1.total, g.iyilesme.H ?? 0), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, classify(sp, s, 'yukarı slot')));
  }
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, (k) => classify(sp, s, k), [H], hex(A_ROW + 12, AX + 8)));
  return rows;
}

export { SRD_SPELLS, spells };
export const mechOf = (sp: Spell) => mechanicsAt(ST, sp);
export const fmtX = fmt;
export type { BattleState };
