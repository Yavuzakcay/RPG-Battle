/**
 * Mekanik matris: savaş dışı, tepki, smite, işaret, ışınlanma, onarım/diriltme, dağıtma, çağırma ve 6–9. seviye özel
 * büyüler. Beklentiler SRD 5.2.1 metninden (data/srd/spells.json; bu dosyadaki yorumlar metne dayanır).
 */
import type { Spell } from '../../data/types';
import type { ActiveEffect, AttackOption, BattleState, Combatant, Command } from '../../battle/types';
import type { SrdSpell } from './srd';
import { A_ROW, AX, CASTER_MOD, ally, enemy, flatTiles, hex, shieldCaster } from './kurulum';
import { D20_CRIT, D20_NORMAL, SAVE_FAIL, SAVE_OK, dieValue, exprTotal, kullan } from './zar';
import { adjust, alan, type Gozlem, type Satir } from './ortak';
import { classify, counterRows, mechOf, runCtx, type Geo } from './buyu';
import { OZEL } from './ozel';
import { concSwapRow } from './alanBuyu';

const single = (d: number): Geo => ({ kind: 'single', t: hex(A_ROW + d), u: hex(A_ROW + d, AX + 1), ff: null, z: null, aim: null, coverT: null, bandRows: null, radius: 0 });
const slotOf = (sp: Spell) => (sp.level > 0 ? [sp.level] : null);
const meta = (sp: Spell, s: SrdSpell) => ({ mech: mechOf(sp).kind, cls: (k: string) => classify(sp, s, k) });

/** Silah seçeneği (işaret ve smite bağlamları): +10, 1d8+3 slashing, yakın dövüş. */
export const SWORD: AttackOption = { label: 'Longsword', attackBonus: 10, damage: '1d8+3', damageType: 'slashing', ranged: false, spell: false, reachFt: 5, tag: 'a longsword slashing', weaponId: 'longsword' };

/** Savaşta etkisi olan SRD büyüsü mü (hasar, saldırı, iyileştirme ya da olumlu durum). */
export const combatRelevant = (s: SrdSpell): boolean => !!(s.damage.length || s.attack || s.heal || s.conditions.length);

/** Savaş dışı (motorda `offCombat`) ve uzun yapım süreli büyüler. */
export function offRows(sp: Spell, s: SrdSpell): Satir[] {
  const m = mechOf(sp);
  const geo = single(1);
  const long = s.cast === 'long';
  const base = { tur: 'büyü' as const, ad: sp.name, seviye: String(sp.level), siniflar: s.raw.classes.join(', '), mekanik: `${m.kind}${m.offCombat ? ' (savaş dışı)' : ''}`, baglam: 'savaşta yapım', kategori: 'yapım' };
  if (long) {
    // SRD: 1 dakika ve üstü yapım süresi; savaş turunda tek eylemle yapılamaz.
    const r = runCtx(sp, s, geo, { ad: 'savaşta yapım (SRD: yapım süresi 1 dakika+)', kategori: 'yapım', bPos: hex(A_ROW + 1, AX - 1), cmd: { targetId: 'B' }, p: {},
      bek: (g) => [alan('savaşta etki', 'yok', g.kabul && !m.offCombat ? 'etkili' : 'yok')] }, { ...(sp.level > 0 ? { slotLevel: sp.level } : {}) }, base.mekanik,
    (g) => (g.kabul && !m.offCombat ? { sonuc: 'karar bekliyor', not: `SRD yapım süresi "${s.raw.castingTime}"; motor savaş turunda tek eylemle yapıyor (sadeleştirme mi?).` } : { sonuc: 'doğru', not: '' }));
    // Motor reddettiyse (ritüel/kurulum/ön koşul) beklenen "savaşta yapılamaz" ile aynı.
    return [r.gercek.startsWith('red') ? { ...r, beklenen: 'savaşta yapılamaz ya da etkisiz', sonuc: 'doğru' } : r];
  }
  const relevant = combatRelevant(s) && !OZEL[s.id]?.savasDisi;
  return [{ ...base, beklenen: relevant ? 'savaşta etki (SRD: hasar/save/durum)' : 'savaş dışı (SRD: savaşta mekanik etkisi yok)', gercek: m.offCombat ? 'savaş dışı (Game Master notu)' : 'savaşta',
    sonuc: relevant && m.offCombat ? 'uygulanmıyor' : 'doğru', not: relevant && m.offCombat ? `Savaş dışı işaretli: ${(m.gmNote ?? '').slice(0, 120)}` : OZEL[s.id]?.savasDisi ?? '' }];
}

/** Tepki büyüleri: eylemle yapılamaz; Hellish Rebuke tepki olarak sınanır. */
export function reactionSpellRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(1);
  const rows: Satir[] = [runCtx(sp, s, geo, { ad: 'eylemle yapım (SRD: yalnız tepki)', kategori: 'tepki', refuse: true, cmd: { targetId: 'T' }, p: {},
    not: 'A0 bulgusu: tepki büyüsü eylemle yapılınca slot harcanıp etkisiz kalıyor.', bek: () => [] }, { ...(sp.level > 0 ? { slotLevel: sp.level } : {}) }, mech, cls('tepki'))];
  if (s.id === 'hellish-rebuke') {
    // T bitişikte; A'ya canavar saldırısı (isabet) → A Hellish Rebuke ile karşılık (T: DEX save başarısız → 2d10 fire).
    const club = { name: 'Club', bonus: 20, damageDice: '1d4', damageType: 'bludgeoning', repeat: 1, ranged: false, reachFt: 5 };
    const prep = (st: BattleState): BattleState => ({ ...st, turnIndex: st.order.indexOf('T') });
    const rebuke = { spellNames: ['Hellish Rebuke'], reactions: [{ id: 'spells:hellish-rebuke', name: 'Hellish Rebuke', spell: 'Hellish Rebuke', kind: 'rebuke' as const, save: 'dex' as const, rangeFt: 60 }] };
    for (const [ad, ok, prof] of [['tepki: Hellish Rebuke (saldıranın DEX save\'i başarısız)', false, {}], ['tepki: Hellish Rebuke, saldıran direnç (fire)', false, { res: ['fire'] }], ['tepki: Hellish Rebuke (save başarılı, yarı)', true, {}]] as Array<[string, boolean, { res?: string[] }]>) {
      const exp = adjust(ok ? Math.floor(exprTotal('2d10') / 2) : exprTotal('2d10'), 'fire', prof);
      rows.push(runCtx(sp, s, geo, { ad, kategori: 'tepki', casterX: rebuke, targetX: { attacks: [club] as never, resistances: prof.res ?? [] }, prep,
        main: { type: 'monster_attack', actorId: 'T', targetId: 'A', attackIndex: 0 }, p: { attack: D20_NORMAL, saves: { T: [ok ? SAVE_OK : SAVE_FAIL] }, react: kullan('A') },
        bek: (g) => [alan('tepki', ['A:Hellish Rebuke'], g.tepki.filter((x) => x.startsWith('A:'))), alan('slot', [1], g.slotBy.A ?? null), alan('saldıran hasarı', exp, g.hp.T ?? 0)] },
      {}, mech, cls('tepki')));
    }
  }
  return rows;
}

/** Smite: yakın dövüş isabetinden sonra bonus eylem; ek hasar (kritikte zar iki kat), Fiend/Undead'e Divine Smite +1d8. */
export function smiteRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(1);
  const dice: Record<string, { d: string; t: string; up: string }> = {
    'divine-smite': { d: '2d8', t: 'radiant', up: '1d8' }, 'searing-smite': { d: '1d6', t: 'fire', up: '1d6' }, 'shining-smite': { d: '2d6', t: 'radiant', up: '1d6' },
  };
  const e = dice[s.id];
  const hit = (crit: boolean) => ({ economy: { ...((): Combatant['economy'] => ({}) as Combatant['economy'])(), meleeHit: { targetId: 'T', critical: crit } } });
  const prep = (crit: boolean) => (st: BattleState): BattleState => {
    const a = st.combatants.A as Combatant;
    return { ...st, combatants: { ...st.combatants, A: { ...a, economy: { ...a.economy, ...hit(crit).economy } } } };
  };
  const cmdBase = { targetId: 'T', slotLevel: sp.level };
  const rows: Satir[] = [];
  const expDmg = (crit: boolean, extra: string | null, prof: { res?: string[]; vul?: string[]; imm?: string[] }, up = 0) => {
    if (!e) return 0;
    const m0 = /^(\d+)d(\d+)$/.exec(e.d) as RegExpExecArray;
    const n = Number(m0[1]) + up + (extra ? 1 : 0);
    let raw = 0;
    for (let i = 0; i < n * (crit ? 2 : 1); i++) raw += dieValue(Number(m0[2]), i);
    return adjust(raw, e.t, prof);
  };
  if (e) {
    rows.push(runCtx(sp, s, geo, { ad: 'yakın dövüş isabetinden sonra', kategori: 'yapım', prep: prep(false), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('ek hasar', expDmg(false, null, {}), g.hp.T ?? 0), alan('slot', slotOf(sp), g.slot.length ? g.slot : null), alan('kons', s.concentration ? sp.name : null, g.kons)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'kritik isabetten sonra (zar iki kat)', kategori: 'saldırı zarı', prep: prep(true), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('ek hasar', expDmg(true, null, {}), g.hp.T ?? 0)] }, cmdBase, mech, cls('saldırı zarı')));
    for (const [ad, prof] of [['direnç', { res: [e.t] }], ['zayıflık', { vul: [e.t] }], ['bağışıklık', { imm: [e.t] }]] as Array<[string, { res?: string[]; vul?: string[]; imm?: string[] }]>) {
      rows.push(runCtx(sp, s, geo, { ad: `hedef ${ad} (${e.t})`, kategori: 'hasar türü', prep: prep(false), targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] },
        p: { saves: { T: [SAVE_FAIL] } }, bek: (g) => [alan('ek hasar', expDmg(false, null, prof), g.hp.T ?? 0)] }, cmdBase, mech, cls('hasar türü')));
    }
    if (s.id === 'divine-smite') rows.push(runCtx(sp, s, geo, { ad: 'hedef Undead (+1d8)', kategori: 'hasar türü', prep: prep(false), targetX: { creatureType: 'undead' }, p: {},
      bek: (g) => [alan('ek hasar', expDmg(false, 'undead', {}), g.hp.T ?? 0)] }, cmdBase, mech, cls('hasar türü')));
    if (sp.level < 9) rows.push(runCtx(sp, s, geo, { ad: `yukarı slot ${sp.level + 1} (+${e.up})`, kategori: 'yukarı slot', prep: prep(false), cmd: { slotLevel: sp.level + 1 }, p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('ek hasar', expDmg(false, null, {}, 1), g.hp.T ?? 0), alan('slot', [sp.level + 1], g.slot)] }, cmdBase, mech, cls('yukarı slot')));
  }
  if (s.id === 'ensnaring-strike') {
    rows.push(runCtx(sp, s, geo, { ad: 'isabetten sonra (STR save başarısız → Restrained)', kategori: 'yapım', prep: prep(false), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('durum', ['Restrained'], g.durum.T ?? null), alan('slot', [1], g.slot.length ? g.slot : null), alan('kons', sp.name, g.kons)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'save başarılı (büyü biter)', kategori: 'save', prep: prep(false), p: { saves: { T: [SAVE_OK] } },
      bek: (g) => [alan('durum', null, g.durum.T ?? null)] }, cmdBase, mech, cls('save')));
    rows.push(runCtx(sp, s, geo, { ad: 'Large hedef (save avantajlı)', kategori: 'save', prep: prep(false), targetX: { size: 'L' }, p: { saves: { T: [{ one: 1, two: [1, 20] }] } },
      bek: (g) => [alan('kip', 'advantage', g.saveler.find((x) => x.hedef === 'T')?.kip), alan('durum', null, g.durum.T ?? null)] }, cmdBase, mech, cls('save')));
    rows.push(runCtx(sp, s, geo, { ad: 'tetik: Restrained hedefin tur başı 1d6 piercing', kategori: 'alan', prep: prep(false), post: [{ type: 'end_turn', actorId: 'A' }], p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('hasar', exprTotal('1d6'), g.hp.T ?? 0)] }, cmdBase, mech, cls('alan')));
  }
  if (s.id === 'searing-smite') {
    // Tur başı 1d6 fire, ardından CON save: başarısızsa sürer.
    rows.push(runCtx(sp, s, geo, { ad: 'tetik: hedefin tur başı 1d6 fire + CON save', kategori: 'alan', prep: prep(false), post: [{ type: 'end_turn', actorId: 'A' }], p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('toplam hasar', expDmg(false, null, {}) + exprTotal('1d6'), g.hp.T ?? 0)] }, cmdBase, mech, cls('alan')));
  }
  if (s.id === 'shining-smite') {
    rows.push(runCtx(sp, s, geo, { ad: 'parlayan hedefe sonraki saldırı avantajlı', kategori: 'durum', prep: prep(false),
      post: [{ type: 'attack', actorId: 'A', targetId: 'T', option: SWORD }], p: { attack: D20_NORMAL },
      bek: (g) => [alan('sonraki saldırı kipi', 'advantage', g.saldirilar.filter((x) => x.hedef === 'T').at(-1)?.kip)] }, cmdBase, mech, cls('durum')));
    rows.push(runCtx(sp, s, geo, { ad: 'parlayan hedefe saldırı avantajlı, Invisible yararı yok', kategori: 'durum', prep: prep(false), targetX: { conditions: ['Invisible'] },
      post: [{ type: 'attack', actorId: 'A', targetId: 'T', option: SWORD }], p: { attack: D20_NORMAL },
      bek: (g) => [alan('sonraki saldırı kipi', 'advantage', g.saldirilar.filter((x) => x.hedef === 'T').at(-1)?.kip)] }, cmdBase, mech, cls('durum')));
  }
  rows.push(runCtx(sp, s, geo, { ad: 'isabet olmadan (SRD: isabetten hemen sonra)', kategori: 'yapım', refuse: true, p: {}, bek: () => [] }, cmdBase, mech, cls('yapım')));
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, cls, [], undefined, undefined, prep(false)));
  return rows;
}

/** İşaret (Hunter's Mark, Hex): işaretli hedefe her isabette +1d6 (kritikte iki kat). */
export function markRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(1);
  const type = s.id === 'hex' ? 'necrotic' : 'force';
  const cmdBase = { targetId: 'T', slotLevel: sp.level, ...(s.id === 'hex' ? { choice: 'str' } : {}) };
  const atk: Command = { type: 'attack', actorId: 'A', targetId: 'T', option: SWORD };
  const sword = (crit: boolean) => exprTotal('1d8', crit) + 3;
  const mark = (crit: boolean, prof: { res?: string[]; vul?: string[]; imm?: string[] }) => adjust(exprTotal('1d6', crit), type, prof);
  const rows: Satir[] = [];
  rows.push(runCtx(sp, s, geo, { ad: 'işaret + silah isabeti', kategori: 'yapım', post: [atk], p: { attack: D20_NORMAL },
    bek: (g) => [alan('toplam hasar (silah + işaret)', sword(false) + mark(false, {}), g.hp.T ?? 0), alan('slot', slotOf(sp), g.slot.length ? g.slot : null), alan('kons', sp.name, g.kons)] }, cmdBase, mech, cls('yapım')));
  rows.push(runCtx(sp, s, geo, { ad: 'işaret + kritik isabet (zar iki kat)', kategori: 'saldırı zarı', post: [atk], p: { attack: D20_CRIT },
    bek: (g) => [alan('toplam hasar', sword(true) + mark(true, {}), g.hp.T ?? 0)] }, cmdBase, mech, cls('saldırı zarı')));
  for (const [ad, prof] of [['direnç', { res: [type] }], ['zayıflık', { vul: [type] }], ['bağışıklık', { imm: [type] }]] as Array<[string, { res?: string[]; vul?: string[]; imm?: string[] }]>) {
    rows.push(runCtx(sp, s, geo, { ad: `işaret + isabet, hedef ${ad} (${type})`, kategori: 'hasar türü', post: [atk], targetX: { resistances: prof.res ?? [], vulnerabilities: prof.vul ?? [], immunities: prof.imm ?? [] },
      p: { attack: D20_NORMAL }, bek: (g) => [alan('toplam hasar', sword(false) + mark(false, prof), g.hp.T ?? 0)] }, cmdBase, mech, cls('hasar türü')));
  }
  rows.push(runCtx(sp, s, geo, { ad: 'hedef Invisible (SRD: görebildiğin yaratık)', kategori: 'durum', targetX: { conditions: ['Invisible'] }, refuse: true, p: {}, bek: () => [] }, cmdBase, mech, cls('durum')));
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, cls));
  rows.push(concSwapRow(sp, s, geo, cmdBase, mech));
  return rows;
}

/** Işınlanma (Misty Step 30 ft, Dimension Door 500 ft): boş ve görülen altıgene; dolu altıgene ya da menzil dışına yapılamaz. */
export function teleportRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(4);
  const reach = s.id === 'misty-step' ? 6 : s.id === 'dimension-door' ? 20 : 6;
  const to = hex(A_ROW + Math.min(reach, 20), AX + 3);
  const rows: Satir[] = [];
  const pos = (g: Gozlem) => g.after?.combatants.A?.pos ?? null;
  const fmtP = (o: { col: number; row: number } | null) => (o ? `${o.col},${o.row}` : 'yok');
  if (s.id === 'tree-stride') {
    // SRD: büyücü 5 ft içindeki ağaca girer, 500 ft içindeki başka bir ağacın yanından çıkar. Sahnede iki ağaç (a).
    const tiles = flatTiles().map((r, i) => (i === A_ROW ? r.slice(0, AX - 1) + 'a' + r.slice(AX) : i === A_ROW + 8 ? r.slice(0, AX) + 'a' + r.slice(AX + 1) : r));
    const dest = hex(A_ROW + 7);
    rows.push(runCtx(sp, s, geo, { ad: 'ağaçtan ağaca (hedef ağacın yanı)', kategori: 'yapım', tiles, tPos: hex(A_ROW + 4, AX + 4), p: {},
      bek: (g) => [alan('yer', fmtP(dest), fmtP(pos(g))), alan('slot', [5], g.slot), alan('kons', sp.name, g.kons)] }, { targetHex: dest, slotLevel: 5 }, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'ağaç yanı olmayan altıgene', kategori: 'yapım', tiles, tPos: hex(A_ROW + 4, AX + 4), refuse: true, p: {}, bek: () => [] },
      { targetHex: hex(A_ROW + 5, AX - 5), slotLevel: 5 }, mech, cls('yapım')));
    rows.push(...counterRows(sp, s, { ...geo, t: hex(A_ROW + 4, AX + 4) }, { targetHex: dest, slotLevel: 5 }, mech, cls, [], hex(A_ROW + 4, AX + 4), undefined, (st) => ({ ...st, map: { ...(st.map as NonNullable<BattleState['map']>), tiles } })));
    return rows;
  }
  rows.push(runCtx(sp, s, geo, { ad: `boş altıgene (${reach * 5} ft içinde)`, kategori: 'yapım', cmd: { targetHex: hex(A_ROW + Math.min(reach, 6), AX) }, p: {},
    bek: (g) => [alan('yer', fmtP(hex(A_ROW + Math.min(reach, 6), AX)), fmtP(pos(g))), alan('slot', slotOf(sp), g.slot.length ? g.slot : null)] }, {}, mech, cls('yapım')));
  rows.push(runCtx(sp, s, geo, { ad: 'dolu altıgene', kategori: 'yapım', cmd: { targetHex: geo.t }, refuse: true, p: {}, bek: () => [] }, {}, mech, cls('yapım')));
  if (reach <= 12) rows.push(runCtx(sp, s, geo, { ad: 'menzil dışına', kategori: 'yapım', cmd: { targetHex: hex(Math.min(44, A_ROW + reach + 3), AX + 6) }, refuse: true, p: {}, bek: () => [] }, {}, mech, cls('yapım')));
  void to;
  rows.push(...counterRows(sp, s, geo, { targetHex: hex(A_ROW + 3, AX) }, mech, cls));
  return rows;
}

/** Onarım ve diriltme (Lesser/Greater Restoration, Spare the Dying, Revivify). */
export function restoreRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(1);
  const near = hex(A_ROW + 1, AX - 1);
  const cmdBase = { targetId: 'B', ...(sp.level > 0 ? { slotLevel: sp.level } : {}) };
  const rows: Satir[] = [];
  if (s.id === 'lesser-restoration') {
    for (const c of ['Poisoned', 'Blinded', 'Paralyzed', 'Deafened']) {
      rows.push(runCtx(sp, s, geo, { ad: `dostta ${c}`, kategori: 'yapım', bPos: near, bX: { conditions: [c] }, p: {},
        bek: (g) => [alan(`${c} kalktı`, true, !(g.after?.combatants.B?.conditions ?? []).includes(c)), alan('slot', [2], g.slot.length ? g.slot : null)] }, cmdBase, mech, cls('yapım')));
    }
  } else if (s.id === 'greater-restoration') {
    for (const c of ['Charmed', 'Petrified']) {
      rows.push(runCtx(sp, s, geo, { ad: `dostta ${c}`, kategori: 'yapım', bPos: near, bX: { conditions: [c] }, p: {},
        bek: (g) => [alan(`${c} kalktı`, true, !(g.after?.combatants.B?.conditions ?? []).includes(c))] }, { ...cmdBase, choice: c }, mech, cls('yapım')));
    }
    rows.push(runCtx(sp, s, geo, { ad: 'dostta 2 Exhaustion (1 azalır)', kategori: 'yapım', bPos: near, bX: { exhaustion: 2 }, p: {},
      bek: (g) => [alan('Exhaustion', 1, g.after?.combatants.B?.exhaustion ?? 0)] }, { ...cmdBase, choice: 'gr-exhaustion' }, mech, cls('yapım')));
  } else if (s.id === 'spare-the-dying') {
    rows.push(runCtx(sp, s, geo, { ad: '0 HP\'deki dost (15 ft)', kategori: 'yapım', bPos: hex(A_ROW + 3, AX - 1), bX: { hp: 0, life: 'dying', conditions: ['Unconscious'] }, p: {},
      bek: (g) => [alan('durum', 'stable', g.after?.combatants.B?.life ?? null)] }, cmdBase, mech, cls('yapım')));
  } else if (s.id === 'revivify') {
    rows.push(runCtx(sp, s, geo, { ad: 'son 1 dakikada ölen dost', kategori: 'yapım', bPos: near, bX: { hp: 0, life: 'dead', diedRound: 1 }, p: {},
      bek: (g) => [alan('HP', 1, g.after?.combatants.B?.hp ?? 0), alan('yaşam', 'alive', g.after?.combatants.B?.life ?? null), alan('slot', [3], g.slot.length ? g.slot : null)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: '1 dakikadan önce ölen dost', kategori: 'yapım', bPos: near, bX: { hp: 0, life: 'dead', diedRound: -20 }, refuse: true, p: {}, bek: () => [] }, cmdBase, mech, cls('yapım')));
  }
  // Sayaç bağlamı: büyünün ön koşulu (zehirli/ölmekte/ölü dost) kurulu.
  const pre: Record<string, Partial<Combatant>> = {
    'lesser-restoration': { conditions: ['Poisoned'] }, 'greater-restoration': { conditions: ['Charmed'] },
    'spare-the-dying': { hp: 0, life: 'dying', conditions: ['Unconscious'] }, revivify: { hp: 0, life: 'dead', diedRound: 1 },
  };
  rows.push(...counterRows(sp, s, geo, { ...cmdBase, ...(s.id === 'greater-restoration' ? { choice: 'Charmed' } : {}) }, mech, cls, [], undefined, s.id === 'spare-the-dying' ? hex(A_ROW + 3, AX - 1) : near, undefined, pre[s.id]));
  return rows;
}

/** Dispel Magic: 3. seviye ve altı büyü etkisi biter; Remove Curse: lanet biter. */
export function dispelRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(4);
  const rows: Satir[] = [];
  if (s.id === 'dispel-magic') {
    const haste: ActiveEffect = { id: 'spells:haste', name: 'Haste', sourceId: 'T', until: 9, concentration: 'Haste', ac: 2 } as ActiveEffect;
    const prep = (st: BattleState): BattleState => ({ ...st, combatants: { ...st.combatants, T: { ...(st.combatants.T as Combatant), effects: [haste], concentration: { spell: 'Haste', slotLevel: 3, turn: '0:0' } } } });
    rows.push(runCtx(sp, s, geo, { ad: 'hedefte 3. seviye büyü (Haste)', kategori: 'yapım', prep, p: {},
      bek: (g) => [alan('Haste bitti', true, !(g.after?.combatants.T?.effects ?? []).some((e) => e.id === 'spells:haste')), alan('slot', [3], g.slot.length ? g.slot : null)] }, { targetId: 'T', slotLevel: 3 }, mech, cls('yapım')));
  } else {
    const curse: ActiveEffect = { id: 'spells:bestow-curse', name: 'Bestow Curse', sourceId: 'T', until: 9, concentration: 'Bestow Curse', curse: true } as ActiveEffect;
    const prep = (st: BattleState): BattleState => ({ ...st, combatants: { ...st.combatants, B: { ...(st.combatants.B as Combatant), effects: [curse] } } });
    rows.push(runCtx(sp, s, geo, { ad: 'lanetli dost (Bestow Curse)', kategori: 'yapım', prep, bPos: hex(A_ROW + 1, AX - 1), p: {},
      bek: (g) => [alan('lanet bitti', true, !(g.after?.combatants.B?.effects ?? []).some((e) => e.id === 'spells:bestow-curse'))] }, { targetId: 'B', slotLevel: 3 }, mech, cls('yapım')));
  }
  return rows;
}

/** Çağırma (yaratık): yaratık belirir, konsantrasyon, slot; Counterspell. */
export function summonRows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(2);
  const cmdBase = { targetHex: hex(A_ROW + 2, AX - 2), ...(sp.level > 0 ? { slotLevel: sp.level } : {}) };
  const rows: Satir[] = [];
  rows.push(runCtx(sp, s, geo, { ad: 'çağırma', kategori: 'yapım', p: {},
    bek: (g) => [alan('yaratık belirdi', true, g.olaylar.some((e) => e.type === 'summoned')), alan('slot', slotOf(sp), g.slot.length ? g.slot : null), alan('kons', s.concentration ? sp.name : null, g.kons)] }, cmdBase, mech, cls('yapım')));
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, cls));
  if (s.concentration) rows.push(concSwapRow(sp, s, geo, cmdBase, mech));
  return rows;
}

/** 6–9. seviye özel büyüler (Power Word, Divine Word, Prismatic Spray, Mass Heal…). */
export function special69Rows(sp: Spell, s: SrdSpell): Satir[] {
  const { mech, cls } = meta(sp, s);
  const geo = single(4);
  const rows: Satir[] = [];
  const cmdBase = { targetId: 'T', slotLevel: sp.level };
  if (s.id === 'power-word-kill') {
    rows.push(runCtx(sp, s, geo, { ad: 'hedef 300 HP (>100): 12d12 psychic', kategori: 'yapım', p: {}, bek: (g) => [alan('hasar', exprTotal('12d12'), g.hp.T ?? 0), alan('slot', [9], g.slot)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'hedef 100 HP (≤100): ölür', kategori: 'yapım', targetX: { hp: 100 }, p: {}, bek: (g) => [alan('HP', 0, g.after?.combatants.T?.hp ?? -1)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'hedef 300 HP, psychic bağışıklık', kategori: 'hasar türü', targetX: { immunities: ['psychic'] }, p: {}, bek: (g) => [alan('hasar', 0, g.hp.T ?? 0)] }, cmdBase, mech, cls('hasar türü')));
    rows.push(runCtx(sp, s, geo, { ad: 'hedef Invisible (SRD: görebildiğin)', kategori: 'durum', targetX: { conditions: ['Invisible'] }, refuse: true, p: {}, bek: () => [] }, cmdBase, mech, cls('durum')));
  } else if (s.id === 'power-word-stun') {
    rows.push(runCtx(sp, s, geo, { ad: 'hedef 100 HP (≤150): Stunned', kategori: 'yapım', targetX: { hp: 100 }, p: {}, bek: (g) => [alan('durum', ['Stunned'], g.durum.T ?? null), alan('slot', [8], g.slot)] }, cmdBase, mech, cls('yapım')));
    rows.push(runCtx(sp, s, geo, { ad: 'hedef 300 HP (>150): yalnız hız 0', kategori: 'yapım', p: {}, bek: (g) => [alan('durum', null, g.durum.T ?? null),
      alan('hız 0 etkisi', true, !!g.olaylar.some((e) => e.type === 'effect_added' && e.targetId === 'T' && (e.effect as { speedZero?: boolean }).speedZero))] }, cmdBase, mech, cls('yapım')));
  } else if (s.id === 'divine-word') {
    for (const [hp, conds] of [[20, 'ölür'], [30, 'Blinded+Deafened+Stunned'], [40, 'Blinded+Deafened'], [50, 'Deafened'], [60, 'yok']] as Array<[number, string]>) {
      rows.push(runCtx(sp, s, geo, { ad: `hedef ${hp} HP (CHA save başarısız)`, kategori: 'yapım', targetX: { hp }, p: { saves: { T: [SAVE_FAIL] } },
        bek: (g) => [alan('sonuç', conds, (g.after?.combatants.T?.hp ?? 1) <= 0 ? 'ölür' : (['Blinded', 'Deafened', 'Stunned'].filter((c) => (g.durum.T ?? []).includes(c)).join('+') || 'yok'))] },
      { targetIds: ['T'], targetId: undefined, slotLevel: 7 }, mech, cls('yapım')));
    }
  } else if (s.id === 'prismatic-spray') {
    // Zar planında d8 = 5 → Blue: 12d6 Cold, DEX save; başarılıysa yarı (SRD Prismatic Rays tablosu).
    const acid = exprTotal('12d6');
    rows.push(runCtx(sp, s, geo, { ad: 'ışın d8=5 (Blue, 12d6 cold; save başarısız)', kategori: 'yapım', tPos: hex(A_ROW + 1), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('hasar', acid, g.hp.T ?? 0)] }, { targetHex: hex(A_ROW + 1), slotLevel: 7 }, mech, cls('yapım')));
    // Ölçüm düzeltmesi: ışın save'i `saveEffect` (maprules.ts) ile `kind: 'save'` etiketi olmadan atılır; kanca ona save
    // planı veremez (d20 = 10). Başarı bağlamı büyücünün DC'si 10 iken ölçülür (10 + 0 ≥ 10). Beklenen değişmedi (yarı).
    rows.push(runCtx(sp, s, geo, { ad: 'ışın d8=5 (Blue; save başarılı, SRD: yarı)', kategori: 'save', tPos: hex(A_ROW + 1), casterX: { spellSaveDc: 10 }, p: { saves: { T: [SAVE_OK] } },
      bek: (g) => [alan('hasar', Math.floor(acid / 2), g.hp.T ?? 0)] }, { targetHex: hex(A_ROW + 1), slotLevel: 7 }, mech, cls('save')));
  } else if (s.id === 'power-word-heal') {
    rows.push(runCtx(sp, s, geo, { ad: 'yaralı, Poisoned dost', kategori: 'yapım', bPos: hex(A_ROW + 2, AX - 2), bX: { hp: 10, conditions: ['Poisoned'] }, p: {},
      bek: (g) => [alan('HP', 200, g.after?.combatants.B?.hp ?? 0), alan('Poisoned kalktı', true, !(g.after?.combatants.B?.conditions ?? []).includes('Poisoned'))] }, { targetId: 'B', slotLevel: 9 }, mech, cls('yapım')));
  } else if (s.id === 'mass-heal') {
    rows.push(runCtx(sp, s, geo, { ad: 'yaralı dost (700 HP havuzu)', kategori: 'yapım', bPos: hex(A_ROW + 2, AX - 2), bX: { hp: 10 }, p: {},
      bek: (g) => [alan('HP', 200, g.after?.combatants.B?.hp ?? 0)] }, { targetIds: ['B'], targetId: undefined, slotLevel: 9 }, mech, cls('yapım')));
  } else if (s.id === 'plane-shift') {
    // SRD: büyücü ve el ele tutuşan en çok sekiz istekli yaratık başka düzleme gider.
    const left = (g: Gozlem) => ['A', 'B'].filter((id) => g.olaylar.some((e) => e.type === 'retreated' && ((e as { actorId?: string }).actorId === id || ((e as { ids?: string[] }).ids ?? []).includes(id))));
    rows.push(runCtx(sp, s, geo, { ad: 'büyücü + bitişik istekli dost', kategori: 'yapım', bPos: hex(A_ROW + 1, AX - 1), p: {},
      bek: (g) => [alan('ayrıldı', true, g.olaylar.some((e) => e.type === 'retreated')), alan('slot', [7], g.slot)] }, { targetIds: ['B'], slotLevel: 7 }, mech, cls('yapım')));
    void left;
    return rows;
  } else if (s.id === 'wish') {
    // SRD: 8. seviye ve altı bir büyüyü kopyalar (gereksinimsiz); 9. seviye slot harcanır. Bağlam: Fireball, hedef save başarısız.
    rows.push(runCtx(sp, s, { ...geo, t: hex(A_ROW + 10) }, { ad: 'Fireball kopyası (save başarısız)', kategori: 'yapım', tPos: hex(A_ROW + 10), p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('hasar', exprTotal('8d6'), g.hp.T ?? 0), alan('slot', [9], g.slot)] }, { choice: 'Fireball', targetHex: hex(A_ROW + 10), slotLevel: 9 }, mech, cls('yapım')));
    return rows;
  } else {
    rows.push(runCtx(sp, s, geo, { ad: 'yapım', kategori: 'yapım', p: { saves: { T: [SAVE_FAIL] } },
      bek: (g) => [alan('slot', slotOf(sp), g.slot.length ? g.slot : null), alan('kons', s.concentration ? sp.name : null, g.kons)] }, cmdBase, mech, cls('yapım')));
  }
  rows.push(...counterRows(sp, s, geo, cmdBase, mech, cls));
  return rows;
}

export { ally, enemy, shieldCaster };
