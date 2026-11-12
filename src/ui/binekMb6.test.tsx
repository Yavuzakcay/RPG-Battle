/**
 * Kuyruk MB6 (yalnız arayüz): binek arayüzü. Havada inme irtifa seçenekleri ve seçici, binek ret nedenleri TR/EN
 * (motor metniyle bire bir kalıp), jeton rozeti ve rozet bütçesi, kurulum ritüel notu. Kural değişmez.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { startBattle } from '../battle/create';
import { GM, P1, mk } from '../battle/fixtures';
import { execute } from '../battle/commands';
import { mountProblem } from '../battle/mounted';
import { summonDef } from '../battle/summons';
import { mechanicsAt } from '../battle/spellVersion';
import { spells } from '../data';
import { setLang } from '../i18n';
import { t } from '../i18n';
import DismountPicker from './DismountPicker';
import { dismountOptions } from './dismountOptions';
import { limitBadges } from './statusFx';
import { statusIcons } from './damageFloats';
import { hasPattern, reasonText } from './reasons';
import type { Offset } from '../rules/hex';
import type { BattleState, Combatant, Command } from '../battle/types';

const o = (col: number, row = 3): Offset => ({ col, row });
const flat = Array.from({ length: 7 }, () => '.'.repeat(15));

/** A binici (4,3), H binek (5,3, Large), B düşman. Sıra A, H, B. */
function scene(v: number, a: Partial<Combatant> = {}, h: Partial<Combatant> = {}): BattleState {
  const parts = [
    mk('A', { ownerId: 'p1', size: 'M', speed: 30, hp: 40, maxHp: 40, ...a }),
    mk('H', { ownerId: 'p1', size: 'L', speed: 60, hp: 40, maxHp: 40, ...h }),
    mk('B', { side: 'enemies', hp: 50, maxHp: 50 }),
  ];
  const s0 = startBattle('b', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: v, map: { id: 'col', variantId: 'gunduz', ruleToggles: { darkness: false, trap: false } } } as never).state;
  const cs = { ...s0.combatants };
  for (const [id, p] of Object.entries({ A: o(4), H: o(5), B: o(10) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
  return { ...s0, kuralSurumu: v, status: 'active', round: 1, order: ['A', 'H', 'B'], turnIndex: 0, combatants: cs,
    map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat, objects: [] } };
}
const ctx = (s: BattleState, id: string) => (s.combatants[id]?.ownerId === 'p1' ? P1 : GM);
const mounted = (s: BattleState): BattleState => { const r = execute(s, { type: 'mount', actorId: 'A', mountId: 'H' }, ctx(s, 'A'), () => 0.5); if (!r.ok) throw new Error(r.error); return r.state; };
const rise = (s: BattleState, id: string, ft: number): BattleState => { const r = execute({ ...s, turnIndex: s.order.indexOf(id) }, { type: 'vertical_move', actorId: id, toFt: ft } as Command, ctx(s, id), () => 0.5); if (!r.ok) throw new Error(r.error); return r.state; };

describe('MB6 havada inme irtifa seçenekleri', () => {
  it('uçabilen binici 5 ft adımlı irtifa seçer: bineğin bandının 5 ft yakınında, yukarıdan aşağı, bineğin irtifası varsayılan', () => {
    const s = rise(mounted(scene(70, { fly: 30 }, { fly: 60 })), 'H', 20);
    const opt = dismountOptions(s, s.combatants.A as Combatant);
    expect(opt.picker).toBe(true);
    expect(opt.defaultFt).toBe(20);
    expect(opt.levels).toEqual([30, 25, 20, 15]);
    expect(opt.fallWarning).toBe(false);
  });
  it('seçenekler motorun kabul ettiği irtifalarla bire bir (her seçenek geçerli komut, dışındakiler reddedilir)', () => {
    const s = rise(mounted(scene(70, { fly: 30 }, { fly: 60 })), 'H', 20);
    const opt = dismountOptions(s, s.combatants.A as Combatant);
    const ok = (ft: number) => execute({ ...s, turnIndex: 0 }, { type: 'dismount', actorId: 'A', to: o(6), toFt: ft } as Command, P1, () => 0.5).ok;
    for (const ft of opt.levels) expect(ok(ft), `${ft} ft`).toBe(true);
    expect(ok(10)).toBe(false);
    expect(ok(40)).toBe(false);
  });
  it('uçamayan binici için seçici yok; havadaysa kısa düşme uyarısı, yerdeyse uyarı da yok', () => {
    const air = rise(mounted(scene(70, {}, { fly: 60 })), 'H', 20);
    expect(dismountOptions(air, air.combatants.A as Combatant)).toMatchObject({ picker: false, fallWarning: true, levels: [] });
    const ground = mounted(scene(70));
    expect(dismountOptions(ground, ground.combatants.A as Combatant)).toMatchObject({ picker: false, fallWarning: false });
  });
  it('68 ve altında seçici yok (MB3 öncesi `toFt` yok)', () => {
    const s = mounted(scene(68, { fly: 30 }, { fly: 60 }));
    expect(dismountOptions(s, s.combatants.A as Combatant).picker).toBe(false);
  });
  it('seçici TR ve EN çizilir: düğmeler, seçili işareti, bineğin irtifası notu; uçamayanda yalnız uyarı', () => {
    const s = rise(mounted(scene(70, { fly: 30 }, { fly: 60 })), 'H', 20);
    const opt = dismountOptions(s, s.combatants.A as Combatant);
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const html = renderToStaticMarkup(<DismountPicker options={opt} value={25} onPick={() => undefined} />);
      expect(html).toContain('role="listbox"');
      expect(html).toContain('slot-picker');
      expect(html.match(/role="option"/g)?.length).toBe(4);
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain(lang === 'tr' ? 'bineğin irtifası' : "mount&#x27;s altitude");
    }
    const air = rise(mounted(scene(70, {}, { fly: 60 })), 'H', 20);
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const html = renderToStaticMarkup(<DismountPicker options={dismountOptions(air, air.combatants.A as Combatant)} value={20} onPick={() => undefined} />);
      expect(html).not.toContain('role="listbox"');
      expect(html).toContain(t().battle.mb6.fallWarning);
    }
    setLang('tr');
  });
});

describe('MB6 ret nedenleri TR/EN', () => {
  it('motorun binek reddi gerekçelerinin hepsi kalıplı (mounted.ts, commands.ts, movement.ts kaynak metinleri)', () => {
    const read = (g: string) => Object.values(import.meta.glob('../battle/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>);
    const srcs = read('');
    const names = ['mounted.ts', 'commands.ts', 'movement.ts'];
    const files = Object.entries(import.meta.glob('../battle/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>).filter(([k]) => names.some((n) => k.endsWith(`/${n}`)));
    expect(files.length).toBe(3);
    expect(srcs.length).toBeGreaterThan(3);
    const msgs: string[] = [];
    for (const [, src] of files) for (const m of src.matchAll(/(?:fail\(|return )[`'"]([^`'"\n]*(?:[Bb]inek|[Bb]inici|binil|Bineğ|inilmez|inilir|[Ii]nmek)[^`'"\n]*)[`'"]/g)) msgs.push((m[1] as string).replace(/\\'/g, "'"));
    expect(msgs.length).toBeGreaterThan(15);
    // Şablon parçaları örnek değerle doldurulur.
    const fill = (m: string) => m.replace(/\$\{[^}]*ceil[^}]*\}/g, '10').replace(/\$\{[^}]*slab[^}]*\}|\$\{f\}/g, '10').replace(/\$\{rule\.maxRider\}/g, 'M').replace(/\$\{rule\.minLevel\}/g, '14')
      .replace(/\$\{hexLabel\(at\)\}/g, 'F4').replace(/\$\{[^}]*label\}/g, 'Lance').replace(/\$\{[^}]*name\}/g, 'At');
    const missing = msgs.map(fill).filter((m) => !hasPattern(m));
    expect(missing).toEqual([]);
  });
  it('gerçek reddin çevirisi: kalıp yakalanan parçaları doldurur, TR değişmez', () => {
    const s = scene(70, {}, { fly: 60 });
    const why = mountProblem({ ...s, combatants: { ...s.combatants, H: { ...(s.combatants.H as Combatant), pos: o(9) } } }, s.combatants.A as Combatant, 'H') ?? '';
    expect(reasonText(why, 'tr')).toBe(why);
    expect(reasonText(why, 'en')).toBe('You must be adjacent to the mount (an airborne mount is boarded from the air).');
    expect(reasonText('Tavan alçak (10 ft): At binicisiyle F4 altıgenine sığmaz.', 'en')).toBe('The ceiling is too low (10 ft): At and its rider do not fit into hex F4.');
    expect(reasonText('Uzak bir ret', 'en')).toBe('Uzak bir ret');
  });
});

describe('MB6 jeton rozeti ve hedef bilgisi', () => {
  it('biniciye ve binekli bineğe tek rozet; TR/EN başlık; rozet bütçesinde en sona düşer', () => {
    const s = mounted(scene(70));
    const A = s.combatants.A as Combatant, H = s.combatants.H as Combatant;
    const ra = statusIcons(A).find((x) => x.key === 'mounted');
    const rh = statusIcons(H).find((x) => x.key === 'ridden');
    expect(ra?.icon).toBe('🐎');
    expect(rh?.icon).toBe('🐎');
    expect(statusIcons(A).filter((x) => x.key === 'mounted' || x.key === 'ridden').length).toBe(1);
    for (const lang of ['tr', 'en'] as const) { setLang(lang); expect(t().view.status.mounted.length).toBeGreaterThan(3); expect(t().view.status.ridden.length).toBeGreaterThan(3); }
    setLang('tr');
    // 3 rozet bütçesi: üç ağır durum varken 🐎 taşar ("+N"), yerli rozet bütçeyi aşmaz.
    const four = [{ key: 'paralyzed' }, { key: 'burning' }, { key: 'poison' }, { key: 'mounted' }];
    const lim = limitBadges(four);
    expect(lim.shown.map((x) => x.key)).toEqual(['paralyzed', 'burning', 'poison']);
    expect(lim.more).toBe(1);
    expect(limitBadges([{ key: 'mounted' }, { key: 'flying' }]).shown.map((x) => x.key)).toEqual(['flying', 'mounted']);
  });
  it('hedef bilgisi satırı: bineğin binicisi ve binicinin bineği TR/EN', () => {
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const M = t().battle.mb6;
      expect(M.ridden('Arya')).toContain('Arya');
      expect(M.riding('Boran')).toContain('Boran');
      expect(M.ridden('Arya')).not.toBe(M.riding('Arya'));
    }
    setLang('tr');
  });
});

describe('MB6 kurulum ritüel notu', () => {
  it('Phantom Steed 70+ kurulum çağırması (kurulum kutusu setup bayrağından), Find Steed kurulumda değil; binek notu her iki dilde', () => {
    const phantom = spells.find((x) => x.id === 'phantom-steed')!;
    const steed = spells.find((x) => x.id === 'find-steed')!;
    expect(summonDef('phantom-steed')?.setup).toBe(true);
    expect(mechanicsAt({ kuralSurumu: 70 }, phantom).kind).toBe('summon');
    expect(mechanicsAt({ kuralSurumu: 69 }, phantom).kind).not.toBe('summon');
    expect(summonDef('find-steed')?.setup).toBeFalsy();
    expect(mechanicsAt({ kuralSurumu: 70 }, steed).kind).toBe('summon');
    expect(summonDef('phantom-steed')?.mount).toBeTruthy();
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      const F = t().summons.familiar;
      expect(F.noteMount.length).toBeGreaterThan(20);
      expect(F.noteMount).not.toBe(F.note);
    }
    setLang('tr');
  });
});

describe('MB6 menü neden satırı', () => {
  it('"Binemezsin" ve "Binekten in" açıklamaları TR/EN var; devre dışı öğe nedenini gösterir', async () => {
    const { actionTip } = await import('./actionHints');
    for (const lang of ['tr', 'en'] as const) {
      setLang(lang);
      expect(actionTip('mountWhy', { reason: 'x' })).toContain('x');
      expect((t().hints as Record<string, unknown>).mountWhy).toBeTruthy();
      expect((t().hints as Record<string, unknown>).dismount).toBeTruthy();
      expect(t().battle.mb6.whyMount.length).toBeGreaterThan(3);
    }
    setLang('tr');
  });
});

describe('MB6 tur sırası (arayüz yalnız okur)', () => {
  it('Phantom Steed ve Find Steed çağırdıktan sonra sahibinin hemen ardında (after-owner); rozet bu sırayı değiştirmez', () => {
    for (const [spell, setup] of [['Phantom Steed', true], ['Find Steed', false]] as const) {
      const parts = [
        mk('A', { name: 'Arya', ownerId: 'p1', hp: 30, maxHp: 30, initiative: 15, level: 9, spellNames: [spell], spellSlots: [4, 3, 3, 3, 2, 0, 0, 0, 0], spellAttack: 5, spellSaveDc: 13, spellMod: 3, proficiency: 3 }),
        mk('B', { name: 'Haydut', side: 'enemies', hp: 40, maxHp: 40, initiative: 10 }),
        mk('C', { name: 'Can', ownerId: 'p2', initiative: 5 }),
      ];
      const s0 = startBattle('s', 'd-z-zemin', parts, () => 0.5, { kuralSurumu: 70, map: { id: 'col' } }).state;
      const cs = { ...s0.combatants };
      for (const [id, p] of Object.entries({ A: o(3), B: o(10), C: o(2) })) cs[id] = { ...(cs[id] as Combatant), pos: p };
      const st: BattleState = { ...s0, status: setup ? 'setup' : 'active', turnIndex: 0, combatants: cs, map: { ...(s0.map as NonNullable<BattleState['map']>), tiles: flat } };
      const r = execute(st, { type: 'cast_spell', actorId: 'A', spellName: spell, targetHex: o(4), ...(spell === 'Find Steed' ? { choice: 'celestial' } : {}) }, P1, () => 0.5);
      if (!r.ok) throw new Error(`${spell}: ${r.error}`);
      const steed = Object.values(r.state.combatants).find((c) => c.summon?.by === 'A') as Combatant;
      const order = r.state.order;
      expect(order[order.indexOf('A') + 1], spell).toBe(steed.id);
      const withRider = mounted2(r.state, steed.id);
      expect(withRider.order, `${spell} sıra`).toEqual(order);
      expect(statusIcons(withRider.combatants[steed.id] as Combatant).some((x) => x.key === 'ridden')).toBe(true);
      expect(statusIcons(withRider.combatants.A as Combatant).some((x) => x.key === 'mounted')).toBe(true);
    }
  });
});
function mounted2(s: BattleState, mountId: string): BattleState {
  const r = execute({ ...s, status: 'active', turnIndex: s.order.indexOf('A') }, { type: 'mount', actorId: 'A', mountId }, P1, () => 0.5);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
