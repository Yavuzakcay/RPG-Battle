/**
 * Mekanik matris: silah (karakter) ve canavar saldırıları × bağlam.
 *  - Silah: SRD Weapons tablosundaki her silah (ve fırlatma biçimi) oyunun kendi seçenek üreticisiyle (`weaponAttackOptions`)
 *    5. seviye Fighter'da (STR 16, DEX 14, yetkinlik +3, ustalık seçilmemiş). Beklenen: SRD özelliklerinden (Finesse →
 *    STR/DEX'in büyüğü, menzilli → DEX, Versatile iki elle, Thrown aynı yetenek), saldırı ve hasar kuralları.
 *  - Canavar: data/monsters.json'daki her saldırı (temel isabet, zar, tür, kritik, direnç, avantaj/dezavantaj, siper,
 *    Shield; save'li saldırıda save ve yarı hasar). Ek etkiler (rider) burada ölçülmez (A2 envanteri).
 */
import { getMonster, monsters, weapons as gameWeapons } from '../../data';
import { combatantFromMonster } from '../../battle/create';
import { weaponAttackOptions, unarmedStrikeOption } from '../../battle/weapons';
import { deriveStats, type CharacterSheet } from '../../rules/stats';
import type { AttackOption, BattleState, Combatant, Command } from '../../battle/types';
import type { Offset } from '../../rules/hex';
import { SRD_WEAPONS, type SrdWeapon } from './srd';
import { A_ROW, AX, ally, band, caster, charmedBy, enemy, flatTiles, frightenedBy, hex, scene, shieldCaster } from './kurulum';
import { SAVE_DIS_PROBE, SAVE_FAIL, SAVE_OK, exprTotal, kullan, plan, type D20, type Plan } from './zar';
import { adjust, alan, kanon, kanonExpr, mode as modeOf, run, type Alan, type Gozlem, type Mode, type Satir, type Sonuc } from './ortak';

const AC = 15;
/** Saldırı zarı: tek zarda 19 (kritik değil, çoğu bonusla isabet), çiftte 5/19 (avantaj 19, dezavantaj 5). */
const D_HIT: D20 = { one: 19, two: [5, 19] };
const D_CRIT: D20 = { one: 20, two: [20, 20] };
const D_MISS: D20 = { one: 1, two: [1, 1] };

const SHEET: CharacterSheet = {
  name: 'Matris', raceId: 'human', classId: 'fighter', level: 5, baseScores: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  armorName: 'Zırhsız', shield: false, itemNames: [], weaponMasteries: [],
} as CharacterSheet;

interface Exp { kip: Mode; dogal: number; isabet: boolean; kritik: boolean; ac: number }
function expAtk(m: Mode, d: D20, bonus: number, ac: number): Exp {
  const dogal = m === 'normal' ? d.one : m === 'advantage' ? Math.max(...d.two) : Math.min(...d.two);
  return { kip: m, dogal, isabet: dogal === 20 || (dogal !== 1 && dogal + bonus >= ac), kritik: dogal === 20, ac };
}
const critExpr = (e: string, crit: boolean) => {
  const m = /^(\d+)d(\d+)(.*)$/.exec(e);
  return m && crit ? `${Number(m[1]) * 2}d${m[2]}${m[3]}` : e;
};

interface Ctx {
  ad: string; kategori: string;
  aX?: Partial<Combatant>; tX?: Partial<Combatant>; tPos?: Offset; extra?: Combatant[]; tiles?: string[];
  p: Partial<Plan>; refuse?: boolean; not?: string;
  bek: (g: Gozlem) => Alan[];
}

function row(base: Omit<Satir, 'beklenen' | 'gercek' | 'sonuc' | 'not' | 'baglam' | 'kategori'>, c: Ctx, g: Gozlem, approx?: string): Satir {
  const head = { ...base, baglam: c.ad, kategori: c.kategori };
  if (g.cokme) return { ...head, beklenen: c.refuse ? 'red' : 'kabul', gercek: `istisna: ${g.cokme}`, sonuc: 'çökme', not: 'Komut istisna fırlattı.' };
  if (c.refuse) return { ...head, beklenen: 'red (yapılamaz)', gercek: g.kabul ? 'kabul edildi' : `red: ${g.hata}`, sonuc: g.kabul ? 'yanlış' : 'doğru', not: g.kabul ? c.not ?? '' : '' };
  if (!g.kabul) return { ...head, beklenen: 'kabul', gercek: `red: ${g.hata}`, sonuc: 'yanlış', not: `Motor reddetti: ${g.hata}` };
  const want = c.bek(g);
  const diff = want.filter((a) => a.b !== a.g);
  const sonuc: Sonuc = diff.length ? 'yanlış' : 'doğru';
  return { ...head, beklenen: want.map((a) => `${a.k}=${a.b}`).join('; '), gercek: want.map((a) => `${a.k}=${a.g}`).join('; '), sonuc,
    not: [diff.length ? `fark: ${diff.map((a) => a.k).join(', ')}` : '', diff.length && approx ? `Veride yaklaşık: ${approx}` : '', c.not ?? ''].filter(Boolean).join(' — ') };
}

const atk = (g: Gozlem, by: string, t: string) => g.saldirilar.filter((x) => x.hedef === t);

/** Silah saldırıları. */
function weaponRows(only?: string[]): Satir[] {
  const out: Satir[] = [];
  const d = deriveStats(SHEET);
  const mods = d.modifiers;
  const prof = d.proficiency;
  const list: Array<{ w: SrdWeapon; opt: AttackOption; thrown: boolean }> = [];
  for (const w of SRD_WEAPONS) {
    if (only && !only.includes(w.name)) continue;
    let opts: AttackOption[] = [];
    // Oyunun silah adı SRD kimliğiyle (ör. "Hand crossbow").
    const gName = gameWeapons.find((x) => x.srd === `weapons:${w.id}`)?.name ?? w.name;
    try { opts = weaponAttackOptions(SHEET, gName); } catch (e) {
      out.push({ tur: 'silah', ad: w.name, seviye: '', siniflar: 'silah', mekanik: 'saldırı', baglam: 'seçenek üretimi', kategori: 'yapım', beklenen: 'seçenek', gercek: `istisna: ${String(e)}`, sonuc: 'çökme', not: '' });
      continue;
    }
    opts.forEach((o, i) => list.push({ w, opt: o, thrown: i > 0 }));
  }
  const unarmed = unarmedStrikeOption(SHEET);
  for (const { w, opt, thrown } of list) {
    const ranged = w.ranged || thrown;
    const ability = w.finesse ? Math.max(mods.str, mods.dex) : w.ranged ? mods.dex : mods.str;
    const bonus = ability + prof;
    const die = !ranged && w.versatileDie ? w.versatileDie : w.die;
    const dmgExpr = ability === 0 ? die : `${die}${ability > 0 ? '+' : ''}${ability}`;
    const name = `${w.name}${thrown ? ' (fırlatma)' : ''}`;
    const base = { tur: 'silah' as const, ad: name, seviye: '', siniflar: 'silah', mekanik: `${ranged ? 'menzilli' : 'yakın'}${w.finesse ? ', Finesse' : ''}${w.versatileDie ? ', Versatile' : ''}${w.heavy ? ', Heavy' : ''}${w.reach ? ', Reach' : ''}` };
    // Seçenek üretimi: SRD'den saldırı bonusu, hasar ifadesi, tür, erişim/menzil.
    const reach = w.reach && !ranged ? 10 : 5;
    const rangeExp = ranged ? (w.range ? w.range.join('/') : '—') : `${reach} ft`;
    const rangeAct = opt.ranged ? (opt.range ? opt.range.join('/') : '—') : `${opt.reachFt ?? 5} ft`;
    const optAl = [alan('saldırı bonusu', bonus, opt.attackBonus), alan('hasar', dmgExpr, opt.damage), alan('tür', w.type, (opt.damageType ?? '').toLowerCase()), alan('erişim/menzil', rangeExp, rangeAct)];
    const odiff = optAl.filter((a) => a.b !== a.g);
    out.push({ ...base, baglam: 'seçenek üretimi (SRD özellikleri)', kategori: 'yapım', beklenen: optAl.map((a) => `${a.k}=${a.b}`).join('; '), gercek: optAl.map((a) => `${a.k}=${a.g}`).join('; '),
      sonuc: odiff.length ? 'yanlış' : 'doğru', not: odiff.length ? `fark: ${odiff.map((a) => a.k).join(', ')}` : '' });
    const dist = ranged ? 4 : 1;
    const tPos = hex(A_ROW + dist);
    const go = (c: Ctx): Satir => {
      const A = caster({ weaponOptions: [opt], spellNames: [], ...c.aX });
      const st = scene([A, enemy('T', c.tPos ?? tPos, c.tX), ally('B', hex(A_ROW, AX - 6)), ...(c.extra ?? [])], c.tiles ?? flatTiles());
      const g = run(st, { type: 'attack', actorId: 'A', targetId: 'T', option: opt } as Command, { playerId: 'p1', isGm: false }, plan(c.p));
      return row(base, c, g);
    };
    const fields = (g: Gozlem, e: Exp, prof2: { res?: string[]; vul?: string[]; imm?: string[] } = {}, zar = false): Alan[] => {
      const a = atk(g, 'A', 'T')[0];
      const raw = e.isabet ? exprTotal(critExpr(dmgExpr, e.kritik)) : 0;
      return [alan('kip', e.kip, a?.kip), alan('doğal', e.dogal, a?.dogal), alan('toplam', e.dogal + bonus, a?.toplam), alan('AC', e.ac, a?.ac), alan('isabet', e.isabet, a?.isabet), alan('kritik', e.kritik, a?.kritik),
        ...(zar ? [alan('zar', e.isabet ? kanonExpr([critExpr(dmgExpr, e.kritik)]) : 'yok', kanon(g.zarlar.filter((z) => z.kind === 'damage')))] : []),
        alan('hasar', e.isabet ? adjust(raw, w.type, prof2) : 0, g.hp.T ?? 0)];
    };
    out.push(go({ ad: 'normal (isabet)', kategori: 'yapım', p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('normal', D_HIT, bonus, AC), {}, true) }));
    out.push(go({ ad: 'ıska (doğal 1)', kategori: 'saldırı zarı', p: { attack: D_MISS }, bek: (g) => fields(g, expAtk('normal', D_MISS, bonus, AC)) }));
    out.push(go({ ad: 'kritik (doğal 20; zar iki kat, değiştirici bir kez)', kategori: 'saldırı zarı', p: { attack: D_CRIT }, bek: (g) => fields(g, expAtk('normal', D_CRIT, bonus, AC), {}, true) }));
    for (const [ad, pr] of [['direnç', { res: [w.type] }], ['zayıflık', { vul: [w.type] }], ['bağışıklık', { imm: [w.type] }]] as Array<[string, { res?: string[]; vul?: string[]; imm?: string[] }]>) {
      out.push(go({ ad: `hedef ${ad} (${w.type})`, kategori: 'hasar türü', tX: { resistances: pr.res ?? [], vulnerabilities: pr.vul ?? [], immunities: pr.imm ?? [] }, p: { attack: D_HIT },
        bek: (g) => fields(g, expAtk('normal', D_HIT, bonus, AC), pr) }));
    }
    out.push(go({ ad: 'hedef Restrained (avantaj)', kategori: 'durum', tX: { conditions: ['Restrained'] }, p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('advantage', D_HIT, bonus, AC)) }));
    out.push(go({ ad: `hedef Prone (${ranged ? 'uzaktan: dezavantaj' : '5 ft: avantaj'})`, kategori: 'durum', tX: { conditions: ['Prone'] }, p: { attack: D_HIT },
      bek: (g) => fields(g, expAtk(ranged ? 'disadvantage' : 'advantage', D_HIT, bonus, AC)) }));
    out.push(go({ ad: 'hedef Invisible (dezavantaj)', kategori: 'durum', tX: { conditions: ['Invisible'] }, p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('disadvantage', D_HIT, bonus, AC)) }));
    out.push(go({ ad: 'saldıran Frightened (kaynak görüşte)', kategori: 'durum', aX: frightenedBy('F'), extra: [enemy('F', hex(A_ROW, AX + 8))], p: { attack: D_HIT },
      bek: (g) => fields(g, expAtk('disadvantage', D_HIT, bonus, AC)) }));
    out.push(go({ ad: 'saldıran Charmed (hedef büyüleyen)', kategori: 'durum', aX: charmedBy('T'), p: { attack: D_HIT }, refuse: true, not: 'SRD 5.2.1 Charmed: büyüleyene saldırılamaz.', bek: () => [] }));
    out.push(go({ ad: 'hedefte Shield (+5 AC)', kategori: 'tepki', tX: shieldCaster(), p: { attack: D_HIT, react: kullan('T') },
      bek: (g) => { const e = expAtk('normal', D_HIT, bonus, AC + 5); const a = atk(g, 'A', 'T')[0]; return [alan('tepki', ['T:Shield'], g.tepki.filter((x) => x.startsWith('T:'))), alan('AC', e.ac, a?.ac), alan('isabet', e.isabet, a?.isabet), alan('hasar', e.isabet ? exprTotal(dmgExpr) : 0, g.hp.T ?? 0)]; } }));
    if (ranged) {
      out.push(go({ ad: 'yanında düşman (menzilli: dezavantaj)', kategori: 'saldırı zarı', extra: [enemy('M', hex(A_ROW, AX + 1))], p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('disadvantage', D_HIT, bonus, AC)) }));
      out.push(go({ ad: 'yarım siper (+2 AC)', kategori: 'siper', tiles: band(flatTiles(), A_ROW + 1, A_ROW + dist - 1, 'd'), p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('normal', D_HIT, bonus, AC + 2)) }));
      out.push(go({ ad: '3/4 siper (+5 AC)', kategori: 'siper', tiles: band(flatTiles(), A_ROW + 1, A_ROW + dist - 1, 'c'), p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('normal', D_HIT, bonus, AC + 5)) }));
      const range = opt.range ?? w.range;
      if (range && range[0] / 5 + 1 <= range[1] / 5 && A_ROW + range[0] / 5 + 1 < 44) {
        const far = range[0] / 5 + 1;
        out.push(go({ ad: `uzun menzil (${far * 5} ft; dezavantaj)`, kategori: 'saldırı zarı', tPos: hex(A_ROW + far), p: { attack: D_HIT }, bek: (g) => fields(g, expAtk('disadvantage', D_HIT, bonus, AC)) }));
      }
    } else if (w.reach) {
      out.push(go({ ad: 'Reach: 10 ft, hedef Prone (5 ft dışı: dezavantaj)', kategori: 'durum', tPos: hex(A_ROW + 2), tX: { conditions: ['Prone'] }, p: { attack: D_HIT },
        bek: (g) => fields(g, expAtk('disadvantage', D_HIT, bonus, AC)) }));
    }
    if (w.heavy) {
      // SRD Heavy: STR (yakın) ya da DEX (menzilli) 13'ten azsa saldırı dezavantajlı.
      const weak: CharacterSheet = { ...SHEET, baseScores: { ...SHEET.baseScores, ...(ranged ? { dex: 12 } : { str: 12 }) } };
      const wopt = weaponAttackOptions(weak, gameWeapons.find((x) => x.srd === `weapons:${w.id}`)?.name ?? w.name)[thrown ? 1 : 0] as AttackOption;
      const wb = (w.finesse ? Math.max(deriveStats(weak).modifiers.str, deriveStats(weak).modifiers.dex) : w.ranged ? deriveStats(weak).modifiers.dex : deriveStats(weak).modifiers.str) + prof;
      const A = caster({ weaponOptions: [wopt] });
      const st = scene([A, enemy('T', tPos), ally('B', hex(A_ROW, AX - 6))]);
      const g = run(st, { type: 'attack', actorId: 'A', targetId: 'T', option: wopt } as Command, { playerId: 'p1', isGm: false }, plan({ attack: D_HIT }));
      out.push(row(base, { ad: `Heavy, ${ranged ? 'DEX' : 'STR'} 12 (dezavantaj)`, kategori: 'saldırı zarı', p: {}, bek: (x) => {
        const e = expAtk('disadvantage', D_HIT, wb, AC); const a = atk(x, 'A', 'T')[0]; return [alan('kip', e.kip, a?.kip), alan('isabet', e.isabet, a?.isabet)];
      } }, g));
    }
  }
  // Unarmed Strike: STR + yetkinlik, 1 + STR bludgeoning.
  if (unarmed && (!only || only.includes('Unarmed Strike'))) {
    const base = { tur: 'silah' as const, ad: 'Unarmed Strike', seviye: '', siniflar: 'silah', mekanik: 'yakın' };
    const bonus = mods.str + prof;
    const dmg = 1 + mods.str;
    const optAl = [alan('saldırı bonusu', bonus, unarmed.attackBonus), alan('hasar', String(dmg), unarmed.damage), alan('tür', 'bludgeoning', unarmed.damageType ?? '')];
    const od = optAl.filter((a) => a.b !== a.g);
    out.push({ ...base, baglam: 'seçenek üretimi (SRD: 1 + STR)', kategori: 'yapım', beklenen: optAl.map((a) => `${a.k}=${a.b}`).join('; '), gercek: optAl.map((a) => `${a.k}=${a.g}`).join('; '), sonuc: od.length ? 'yanlış' : 'doğru', not: '' });
    for (const [ad, d, crit] of [['normal (isabet)', D_HIT, false], ['kritik (sabit hasar, zar yok)', D_CRIT, true]] as Array<[string, D20, boolean]>) {
      const A = caster({ weaponOptions: [unarmed] });
      const st = scene([A, enemy('T', hex(A_ROW + 1)), ally('B', hex(A_ROW, AX - 6))]);
      const g = run(st, { type: 'attack', actorId: 'A', targetId: 'T', option: unarmed } as Command, { playerId: 'p1', isGm: false }, plan({ attack: d }));
      out.push(row(base, { ad, kategori: crit ? 'saldırı zarı' : 'yapım', p: {}, bek: (x) => [alan('hasar', dmg, x.hp.T ?? 0)] }, g));
    }
  }
  return out;
}

/** Canavar saldırıları (data/monsters.json). */
function monsterRows(only?: string[]): Satir[] {
  const out: Satir[] = [];
  for (const m0 of monsters) {
    if (only && !only.includes(m0.name) && !only.includes(m0.id)) continue;
    const m = getMonster(m0.id);
    m.attacks.forEach((a, i) => {
      const base = { tur: 'canavar' as const, ad: `${m.name}: ${a.name}`, seviye: `CR ${m.cr}`, siniflar: 'canavar', mekanik: a.save ? `save (${a.save.ability.toUpperCase()} ${a.save.dc})` : a.ranged ? 'menzilli saldırı' : 'yakın saldırı' };
      const M = combatantFromMonster(m, { id: 'M' });
      const reachFt = a.reachFt ?? 5;
      const dist = a.save ? 1 : a.ranged ? Math.min(4, Math.max(1, Math.floor((a.range?.[0] ?? 20) / 5))) : Math.max(1, Math.floor(reachFt / 5));
      const mPos = hex(A_ROW);
      const pPos = hex(A_ROW + dist);
      const go = (c: Ctx): Satir => {
        const P = ally('P', c.tPos ?? pPos, { hp: 999, maxHp: 999, ac: AC, saves: { str: 5, dex: 5, con: 5, int: 5, wis: 5, cha: 5 }, ...c.tX });
        const st0 = scene([{ ...M, pos: mPos, ...c.aX } as Combatant, P, ...(c.extra ?? [])], c.tiles ?? flatTiles());
        const st: BattleState = st0;
        const cmd = { type: 'monster_attack', actorId: 'M', targetId: 'P', attackIndex: i, ...(M.attacks[i]?.area ? { targetHex: c.tPos ?? pPos } : {}) } as Command;
        const g = run(st, cmd, { playerId: 'gm', isGm: true }, plan(c.p));
        return row(base, c, g);
      };
      if (!a.damageDice && !a.save) {
        out.push(go({ ad: 'yapım', kategori: 'yapım', p: { attack: D_HIT }, bek: (g) => [alan('saldırı', 'kabul', g.kabul ? 'kabul' : 'red')] }));
        return;
      }
      // SRD sabit hasar ("1 Piercing damage"): zar yok; veri alanındaki 1d2 yaklaşıklığı beklenen sayılmaz.
      const constant = /^\s*(\d+)\s+[A-Za-z]/.exec(a.damage ?? '');
      const dice = constant ? String(constant[1]) : a.damageDice ?? '';
      const type = (a.damageType ?? '').toLowerCase();
      // Güneş ışığına duyarlı canavar gündüz haritasında saldırıda dezavantajlı (SRD Sunlight Sensitivity).
      // Gün ışığında saldırı dezavantajı: Sunlight Sensitivity, Sunlight Weakness (Shadow), Sunlight Hypersensitivity (Vampire),
      // Light Sensitivity (Cloaker). Transparent (Gelatinous Cube): fark edilmeden saldırır, ilk saldırı avantajlı.
      const traitText = `${m.traits ?? ''} ${(m as { unsupported?: string }).unsupported ?? ''}`;
      const sun = /Sunlight Sensitivity|Sunlight Weakness|Sunlight Hypersensitivity|Light Sensitivity|Vampire Weakness/i.test(traitText)
        || ['shadow', 'vampire', 'vampire-spawn', 'cloaker'].includes(m.id);
      const hiddenStart = /Transparent/.test(traitText);
      const baseMode = (adv: boolean, dis: boolean): Mode => modeOf(adv || hiddenStart, dis || sun);
      // "… or N (XdY + Z) … if the <canavar> had Advantage on the attack roll" (Chimera Bite).
      const advDice = /or \d+ \((\d+d\d+(?:\s*\+\s*\d+)?)\)[^.]*if the [\w ]+ had Advantage/.exec(a.damage ?? '')?.[1]?.replace(/\s+/g, '');
      if (/^(Second|Third) Roar$/.test(a.name)) {
        out.push(go({ ad: 'sırasız kullanım (SRD: kükremeler sırayla)', kategori: 'yapım', p: {}, refuse: true, bek: () => [] }));
        return;
      }
      if (/targets one nonmagical metal object/i.test(a.damage ?? '')) {
        out.push(go({ ad: 'metal nesnesi olmayan hedef (SRD: nesne hedefli)', kategori: 'yapım', p: {}, bek: (g) => [alan('hedef save', 0, g.saveler.filter((x) => x.hedef === 'P').length), alan('hasar', 0, g.hp.P ?? 0)] }));
        return;
      }
      if (a.save) {
        const half = !!a.save.halfOnSave;
        const sv = (g: Gozlem) => g.saveler.find((x) => x.hedef === 'P');
        const base2 = (g: Gozlem, d: D20, pr: { res?: string[]; vul?: string[]; imm?: string[] } = {}) => {
          // Başarı formülle: doğal zar + 5 (hedefin save değiştiricisi) ≥ DC.
          const ok = d.one + 5 >= (a.save?.dc ?? 99);
          const raw = dice ? exprTotal(dice) : 0;
          const exp = dice ? adjust(ok ? (half ? Math.floor(raw / 2) : 0) : raw, type, pr) : 0;
          const v = sv(g);
          // Taban hasar (save olayının ana parçası; ek parçalar ayrı olay).
          return [alan('save', `${a.save?.ability}/${a.save?.dc}`, v ? `${v.yetenek}/${v.dc}` : 'yok'), alan('başarı', ok, v?.basari), ...(dice ? [alan('taban hasar', exp, v?.uygulanan), alan('tür', type, v?.tur || 'yok')] : [])];
        };
        out.push(go({ ad: 'save başarısız', kategori: 'yapım', p: { saves: { P: [SAVE_FAIL] } }, bek: (g) => base2(g, SAVE_FAIL) }));
        out.push(go({ ad: `save başarılı (${half ? 'yarı' : 'hasar yok'})`, kategori: 'save', p: { saves: { P: [SAVE_OK] } }, bek: (g) => base2(g, SAVE_OK) }));
        if (dice) out.push(go({ ad: `hedef direnç (${type})`, kategori: 'hasar türü', tX: { resistances: [type] }, p: { saves: { P: [SAVE_FAIL] } }, bek: (g) => base2(g, SAVE_FAIL, { res: [type] }) }));
        if (a.save.ability === 'dex') out.push(go({ ad: 'hedef Restrained (DEX save dezavantajı)', kategori: 'durum', tX: { conditions: ['Restrained'] }, p: { saves: { P: [SAVE_DIS_PROBE] } },
          bek: (g) => { const v = sv(g); return [alan('kip', 'disadvantage', v?.kip)]; } }));
        return;
      }
      const bonus = a.bonus;
      const fields = (g: Gozlem, e: Exp, pr: { res?: string[]; vul?: string[]; imm?: string[] } = {}, zar = false): Alan[] => {
        const x = atk(g, 'M', 'P')[0];
        const d0 = e.kip === 'advantage' && advDice ? advDice : dice;
        // Eksi toplam hasar 0 sayılır.
        const raw = e.isabet ? Math.max(0, exprTotal(critExpr(d0, e.kritik))) : 0;
        const extra = (g.olaylar.find((ev) => ev.type === 'attack_resolved' && ev.targetId === 'P') as { extra?: Array<{ applied: number }> } | undefined)?.extra ?? [];
        const baseApplied = x ? x.uygulanan - extra.reduce((n, y) => n + y.applied, 0) : 0;
        return [alan('kip', e.kip, x?.kip), alan('toplam', e.dogal + bonus, x?.toplam), alan('AC', e.ac, x?.ac), alan('isabet', e.isabet, x?.isabet), alan('kritik', e.kritik, x?.kritik),
          ...(zar && !constant ? [alan('taban zar', e.isabet ? kanonExpr([critExpr(d0, e.kritik)]) : 'yok', kanon(g.zarlar.filter((z) => z.kind === 'damage').slice(0, 1)))] : []),
          alan('taban ham', e.isabet ? exprTotal(critExpr(d0, e.kritik)) : 0, x?.ham ?? 0), alan('taban uygulanan', e.isabet ? adjust(raw, type, pr) : 0, baseApplied), alan('tür', e.isabet ? type : '—', e.isabet ? (x?.tur ?? 'yok').toLowerCase() : '—')];
      };
      out.push(go({ ad: 'normal (isabet)', kategori: 'yapım', p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_HIT, bonus, AC), {}, true) }));
      out.push(go({ ad: 'kritik (doğal 20)', kategori: 'saldırı zarı', p: { attack: D_CRIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_CRIT, bonus, AC), {}, true) }));
      if (type) {
        out.push(go({ ad: `hedef direnç (${type})`, kategori: 'hasar türü', tX: { resistances: [type] }, p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_HIT, bonus, AC), { res: [type] }) }));
        out.push(go({ ad: `hedef bağışıklık (${type})`, kategori: 'hasar türü', tX: { immunities: [type] }, p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_HIT, bonus, AC), { imm: [type] }) }));
      }
      out.push(go({ ad: 'hedef Restrained (avantaj)', kategori: 'durum', tX: { conditions: ['Restrained'] }, p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(true, false), D_HIT, bonus, AC)) }));
      out.push(go({ ad: `hedef Prone (${a.ranged ? 'uzaktan: dezavantaj' : dist > 1 ? '10 ft: dezavantaj' : '5 ft: avantaj'})`, kategori: 'durum', tX: { conditions: ['Prone'] }, p: { attack: D_HIT },
        bek: (g) => fields(g, expAtk(baseMode(!(a.ranged || dist > 1), a.ranged || dist > 1), D_HIT, bonus, AC)) }));
      // Blindsight/Truesight menzilindeki görünmez hedef görülür (SRD): dezavantaj yok.
      const sees = Math.max(M.senses?.blindsight ?? 0, M.senses?.truesight ?? 0) >= dist * 5;
      out.push(go({ ad: `hedef Invisible (${sees ? 'Blindsight/Truesight: normal' : 'dezavantaj'})`, kategori: 'durum', tX: { conditions: ['Invisible'] }, p: { attack: D_HIT },
        bek: (g) => fields(g, expAtk(baseMode(false, !sees), D_HIT, bonus, AC)) }));
      out.push(go({ ad: 'hedefte Shield (+5 AC)', kategori: 'tepki', tX: shieldCaster(), p: { attack: D_HIT, react: kullan('P') },
        bek: (g) => {
          // Shield yalnız isabet eden saldırıya (SRD: "when you are hit by an attack roll").
          const hits = expAtk(baseMode(false, false), D_HIT, bonus, AC).isabet;
          const e = expAtk(baseMode(false, false), D_HIT, bonus, hits ? AC + 5 : AC); const x = atk(g, 'M', 'P')[0];
          return [alan('tepki', hits ? ['P:Shield'] : null, g.tepki.filter((y) => y.startsWith('P:'))), alan('AC', e.ac, x?.ac), alan('isabet', e.isabet, x?.isabet)];
        } }));
      if (a.ranged && dist > 1) {
        out.push(go({ ad: 'yarım siper (+2 AC)', kategori: 'siper', tiles: band(flatTiles(), A_ROW + 1, A_ROW + dist - 1, 'd'), p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_HIT, bonus, AC + 2)) }));
        out.push(go({ ad: '3/4 siper (+5 AC)', kategori: 'siper', tiles: band(flatTiles(), A_ROW + 1, A_ROW + dist - 1, 'c'), p: { attack: D_HIT }, bek: (g) => fields(g, expAtk(baseMode(false, false), D_HIT, bonus, AC + 5)) }));
      }
    });
  }
  return out;
}

export function saldiriSatirlari(only?: string[]): Satir[] {
  return [...weaponRows(only), ...monsterRows(only)];
}

export { modeOf };
