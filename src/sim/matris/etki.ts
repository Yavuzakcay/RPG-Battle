/**
 * Mekanik matris: süren etki ve güçlendirme büyüleri (Bless, Hold Person'ın etki biçimi, Haste, Charm Person…).
 * Beklenen: SRD'den hedef tarafı (Self → kendi, save → düşman, aksi → dost), save, durumlar, süre (tur), konsantrasyon,
 * yukarı slotta ek hedef.
 */
import type { Spell } from '../../data/types';
import type { Combatant, Command } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import type { SrdSpell } from './srd';
import { OZEL } from './ozel';
import { A_ROW, AX, ally, enemy, hex } from './kurulum';
import { SAVE_DIS_PROBE, SAVE_FAIL, SAVE_OK, type D20 } from './zar';
import { alan, type Gozlem, type Mode, type Satir } from './ortak';
import { charmedBy } from './kurulum';
import { classify, counterRows, expSave, mechOf, runCtx, type Geo } from './buyu';
import { concSwapRow } from './alanBuyu';

export type Taraf = 'dost' | 'dusman' | 'kendi';

export function tarafOf(s: SrdSpell): Taraf {
  const o = OZEL[s.id];
  if (o?.taraf) return o.taraf;
  if (s.raw.range === 'Self') return 'kendi';
  if (s.save) return 'dusman';
  return 'dost';
}

/** Etkinin süresi (tur): yapım turu dahil (`until` − tur + 1). */
const roundsOf = (g: Gozlem, id: string, srd: string, name: string): number | null => {
  const e = g.olaylar.find((x) => (x.type === 'effect_added' && x.targetId === id && (x.effect.id === srd || x.effect.name.startsWith(name)))
    || (x.type === 'buff_added' && x.targetId === id));
  if (!e) return null;
  const until = e.type === 'effect_added' ? e.effect.until : e.type === 'buff_added' ? e.buff.until : undefined;
  return until === undefined ? Infinity : until;
};
const fmtRounds = (n: number | null): string => (n === null ? 'yok' : !Number.isFinite(n) || n >= 14400 ? 'kalıcı' : `${n} tur`);
const srdRounds = (s: SrdSpell): string => (s.rounds === null ? 'özel' : !Number.isFinite(s.rounds) || (s.rounds ?? 0) >= 14400 ? 'kalıcı' : `${s.rounds} tur`);

export function effectRows(sp: Spell, s: SrdSpell): Satir[] {
  const o = OZEL[s.id] ?? {};
  const m = mechOf(sp);
  const mech = m.kind;
  const taraf = tarafOf(s);
  const range = s.rangeFt;
  const near = range <= 5 ? hex(A_ROW + 1, AX - 1) : hex(A_ROW + 2, AX - 2);
  const tDist = range >= 30 ? 4 : range >= 10 ? 2 : 1;
  const tPos = hex(A_ROW + tDist);
  const geo: Geo = { kind: 'single', t: tPos, u: hex(A_ROW + tDist, AX + 1), ff: null, z: null, aim: null, coverT: null, bandRows: null, radius: 0 };
  const targetId = taraf === 'dost' ? 'B' : taraf === 'dusman' ? 'T' : 'A';
  const cmdBase: Partial<Extract<Command, { type: 'cast_spell' }>> = {
    ...(sp.area && taraf === 'dusman' ? { targetHex: tPos, targetIds: ['T'] } : { targetId }),
    ...(sp.level > 0 ? { slotLevel: sp.level } : {}),
    ...(s.id === 'enlarge-reduce' ? { choice: 'Reduce' } : {}),
  };
  const bPos = taraf === 'dost' ? near : hex(A_ROW, AX - 6);
  const slot = sp.level > 0 ? [sp.level] : null;
  const kons = s.concentration ? sp.name : null;
  const saveMode: Mode = o.saveAdv || s.saveAdvFighting ? 'advantage' : 'normal';
  const rows: Satir[] = [];
  const conds = s.id === 'dispel-evil-and-good' ? [] : s.conditions;
  const instant = s.rounds === 0;
  const cls = (k: string) => classify(sp, s, k);
  // Hedefin durum/etki gözlemi.
  const condsOf = (g: Gozlem, id: string) => [...(g.durum[id] ?? [])].filter((c) => conds.includes(c)).sort();
  const base = (g: Gozlem, id: string, failed: boolean) => [
    ...(conds.length ? [alan('durum', failed ? [...conds].sort() : null, condsOf(g, id).length ? condsOf(g, id) : null)] : []),
    ...(!instant && failed && roundsOf(g, id, sp.srd, sp.name) !== null ? [alan('süre', srdRounds(s), fmtRounds(roundsOf(g, id, sp.srd, sp.name)))] : []),
  ];
  if (taraf === 'dusman' && s.save) {
    const save = (g: Gozlem, d: D20, failExp: boolean) => {
      const v = g.saveler.find((x) => x.hedef === 'T');
      const e = expSave(saveMode, d, 0);
      return [alan('save', `${s.save}/18`, v ? `${v.yetenek}/${v.dc}` : 'yok'), alan('kip', e.kip, v?.kip), alan('başarı', !failExp, v?.basari)];
    };
    rows.push(runCtx(sp, s, geo, { ad: 'normal (save başarısız)', kategori: 'yapım', bPos, p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [...save(g, SAVE_FAIL, true), ...base(g, 'T', true), alan('slot', slot, g.slot.length ? g.slot : null), alan('kons', kons, g.kons)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'save başarılı', kategori: 'save', bPos, p: { saves: { T: [SAVE_OK] } },
      bek: (g) => [...save(g, SAVE_OK, false), ...(conds.length ? [alan('durum', null, condsOf(g, 'T').length ? condsOf(g, 'T') : null)] : [])] }, cmdBase, mech, cls('save')));
    if (s.save === 'dex') rows.push(runCtx(sp, s, geo, { ad: 'hedef Restrained (DEX save dezavantajı)', kategori: 'durum', bPos, targetX: { conditions: ['Restrained'] }, p: { saves: { T: [SAVE_DIS_PROBE] } },
      bek: (g) => { const v = g.saveler.find((x) => x.hedef === 'T'); const e = expSave(saveMode === 'advantage' ? 'normal' : 'disadvantage', SAVE_DIS_PROBE, 0); return [alan('kip', e.kip, v?.kip), alan('başarı', e.basari, v?.basari)]; } }, cmdBase, mech, cls('durum')));
    if (s.needsSight) rows.push(runCtx(sp, s, geo, { ad: 'hedef Invisible', kategori: 'durum', bPos, targetX: { conditions: ['Invisible'] }, p: { saves: { T: [SAVE_FAIL] } }, refuse: true,
      not: 'SRD: hedef "görebildiğin" yaratık olmalı (Invisible: görülmesi gereken etkiden etkilenmez).', bek: () => [] }, cmdBase, mech, cls('durum')));
  } else {
    const id = targetId;
    rows.push(runCtx(sp, s, geo, { ad: `normal (${taraf === 'dost' ? 'dosta' : 'kendine'})`, kategori: 'yapım', bPos, noT: false, p: {},
      bek: (g) => [alan('etki', true, !!g.olaylar.some((e) => (e.type === 'effect_added' || e.type === 'buff_added' || e.type === 'temp_hp' || e.type === 'hp_boosted') && e.targetId === id)
        // Konsantrasyon hedefindeki koruma (Shield of Faith: `ward`) ya da büyücünün yürüyen alanı.
        || g.after?.combatants.A?.concentration?.targetId === id || (id === 'A' && g.olaylar.some((e) => e.type === 'zone_created'))),
        ...base(g, id, true), alan('slot', slot, g.slot.length ? g.slot : null), alan('kons', kons, g.kons)] }, cmdBase, mech, cls('yapım')));
  }
  // Yukarı slot: ek hedef.
  if (sp.level > 0 && sp.level < 9 && s.upcast?.targets) {
    const two = taraf === 'dusman' ? ['T', 'U'] : ['B', 'C'];
    const extra: Combatant[] = taraf === 'dusman' ? [enemy('U', geo.u as Offset, s.targetType ? { creatureType: s.targetType.toLowerCase() } : {})] : [ally('C', range <= 5 ? hex(A_ROW + 1, AX + 1) : hex(A_ROW + 2, AX + 2))];
    const affected = (g: Gozlem) => two.filter((x) => g.olaylar.some((e) => (e.type === 'effect_added' || e.type === 'buff_added' || e.type === 'condition_changed') && e.targetId === x)
      || g.saveler.some((v) => v.hedef === x));
    rows.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+1 hedef)`, kategori: 'yukarı slot', bPos, extra, cmd: { slotLevel: sp.level + 1, targetId: undefined, targetIds: two },
      p: { saves: { T: [SAVE_FAIL], U: [SAVE_FAIL] } }, bek: (g) => [alan('etkilenen', two, affected(g)), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
    if (s.baseTargets === 1) rows.push(runCtx(sp, s, geo, { ad: `taban slotta 2 hedef (SRD: ${sp.level}. seviyede tek hedef)`, kategori: 'yukarı slot', bPos, extra, cmd: { targetId: undefined, targetIds: two },
      p: { saves: { T: [SAVE_FAIL], U: [SAVE_FAIL] } }, refuse: true, not: 'SRD: ek hedef yalnız yukarı slotta.', bek: () => [] }, cmdBase, mech, cls('yukarı slot')));
  }
  if (taraf === 'dusman' && s.save && geo.kind === 'single') {
    rows.push(runCtx(sp, s, geo, { ad: 'büyücü Charmed (hedef büyüleyen)', kategori: 'durum', bPos, casterX: charmedBy('T'), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('kabul', 'karar', g.kabul ? 'kabul' : 'red')] }, cmdBase, mech,
      () => ({ sonuc: 'karar bekliyor', not: 'SRD 5.2.1 Charmed: büyüleyen "damaging abilities or magical effects" ile hedeflenemez; zarar vermeyen büyünün yasak olup olmadığı yoruma açık.' })));
  }
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, cls, [], undefined, bPos));
  if (s.concentration) rows.push(concSwapRow(sp, s, geo, cmdBase, mech, [], false, undefined, bPos));
  return rows.map((r) => (o.not && !r.not.includes(o.not) ? { ...r, not: [r.not, o.not].filter(Boolean).join(' — ') } : r));
}
