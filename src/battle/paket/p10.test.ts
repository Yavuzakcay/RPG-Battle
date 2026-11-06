/**
 * Kuyruk P10: ilkel genişletme 4 (kurgusal fikstür `tests/fixtures/paket-p10.json`; kural sürümü 39). Her yeni olay, etki ve
 * alan: davranış (39) ve eski sürümde etkisizlik (38); uçtan uca komutlar baştan oynatılınca aynı durum.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import p10 from '../../../tests/fixtures/paket-p10.json';
import { validatePack } from '../../content/schema';
import { applyPackSubclasses } from '../../content/paket';
import { classData } from '../../data';
import { kitArena, o } from '../k54bKit';
import { replay } from '../reduce';
import { mk } from '../fixtures';
import { saveMode } from '../durations';
import { ilkelOzet } from '../../ui/ilkelOzet';
import type { AttackOption, BattleEvent, Combatant } from '../types';
import type { Rng } from '../../rules/dice';

const load = () => {
  const r = validatePack(p10, { taken: classData.subclasses.map((s) => s.id), packs: [] });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  applyPackSubclasses(r.pack.subclasses);
};
beforeEach(load);
afterEach(() => applyPackSubclasses([]));

type Run = ReturnType<typeof kitArena>;
const club: AttackOption = { label: 'Sopa', attackBonus: 9, damage: '2d6+2', damageType: 'slashing', ranged: false, spell: false, tag: 'y' };
const patch = (r: Run, id: string, p: Partial<Combatant>) => { r.state = { ...r.state, combatants: { ...r.state.combatants, [id]: { ...(r.state.combatants[id] as Combatant), ...p } } }; };
const only = (r: Run, id: string, ...feats: string[]) => { const c = r.c(id); patch(r, id, { paket: { ...(c.paket as NonNullable<Combatant['paket']>), ozellikler: (c.paket?.ozellikler ?? []).filter((f) => feats.some((x) => f.key.endsWith(`/${x}`))) } }); };
const rebase = (r: Run) => { r.events = [{ type: 'battle_started', state: r.state } as BattleEvent]; };
const turnOf = (r: Run, id: string) => { r.state = { ...r.state, turnIndex: r.state.order.indexOf(id) }; if (r.events.length === 1) rebase(r); };
const same = (r: Run) => expect(JSON.stringify(replay(r.events).combatants)).toBe(JSON.stringify(r.state.combatants));
const fixed = (v: number): Rng => () => v;
const seq = (vs: number[], rest: number): Rng => { let i = 0; return () => (i < vs.length ? vs[i++] as number : rest); };
const pk = (sub: string, feat: string, tetik: string) => `pk:${sub}/${feat}:${tetik}`;
const use = (key: string, targetId?: string, actorId = 'A') => ({ type: 'use_feature' as const, actorId, feature: key, ...(targetId ? { targetId } : {}) });
const atk = (evs: BattleEvent[], by = 'A') => evs.find((e) => e.type === 'attack_resolved' && e.actorId === by) as Extract<BattleEvent, { type: 'attack_resolved' }>;
const hasPk = (evs: BattleEvent[], label: string, target?: string) => evs.some((e) => e.type === 'map_effect' && e.rule === 'paket' && e.text.includes(label) && (!target || e.targetId === target));

function arena(cls: string, sub: string, feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}): Run {
  const r = kitArena({ cls, sub, level: 5, ...extra });
  only(r, 'A', ...feats);
  patch(r, 'A', { weaponOptions: [club] });
  patch(r, 'B', { weaponOptions: [club], hp: 200, maxHp: 200 });
  patch(r, 'C', { weaponOptions: [club] });
  rebase(r);
  return r;
}
const fighter = (feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}) => arena('fighter', 'denge-muhafizi', ['denge-havuz', ...feats], extra);
const wizard = (feats: string[], extra: Partial<Parameters<typeof kitArena>[0]> = {}) => arena('wizard', 'karsi-buyu', ['karsi-havuz', ...feats], extra);

describe('P10 şema ve özet', () => {
  it('fikstür geçerli; yeni birliktelikler denetlenir', () => {
    const bad = JSON.parse(JSON.stringify(p10));
    bad.id = 'p10-bozuk';
    bad.subclasses = [bad.subclasses[0]];
    bad.subclasses[0].id = 'denge-bozuk';
    bad.subclasses[0].features[1].ilkeller[0] = { tur: 'tepki', olay: 'banaIsabet', etki: 'avantajSifirla' };
    expect(validatePack(bad, { taken: [], packs: [] }).ok).toBe(false);
    const bad2 = JSON.parse(JSON.stringify(bad));
    bad2.subclasses[0].features[1].ilkeller[0] = { tur: 'tepki', olay: 'hedefAlindi', etki: 'avantajSifirla', geriTepme: '1d4' };
    expect(validatePack(bad2, { taken: [], packs: [] }).ok).toBe(false);
    const bad3 = JSON.parse(JSON.stringify(bad));
    bad3.subclasses[0].features[1].ilkeller[0] = { tur: 'hiz', hedef: 'dusman', artiFt: -10 }; // pasif başkasına
    expect(validatePack(bad3, { taken: [], packs: [] }).ok).toBe(false);
  });
  it('özet: tepkide etki adı parantezde', () => {
    expect(ilkelOzet([{ tur: 'tepki', etki: 'avantajSifirla' }, { tur: 'hiz' }])).toBe('tepki (avantaj sıfırlama) · hız');
    expect(ilkelOzet([{ tur: 'tepki', etki: 'acBonusu' }])).toBe('tepki');
  });
});

describe('hedefAlindi + avantajSifirla', () => {
  const go = (v?: number) => {
    const r = fighter(['denge-sozu'], v ? { kuralSurumu: v } : {});
    patch(r, 'A', { effects: [...(r.c('A').effects ?? []), { id: 'acik', name: 'Açık', sourceId: 'B', attackedAdv: true }] });
    turnOf(r, 'B');
    rebase(r);
    const evs = r.gm({ type: 'attack', actorId: 'B', targetId: 'A', option: club }, fixed(0.5));
    return { r, a: atk(evs, 'B') };
  };
  it('39: avantajlı saldırı normal zarla; etki komut sonunda kalkar; replay aynı', () => {
    const { r, a } = go();
    expect(a.mode).toBe('normal');
    expect(r.c('A').effects?.some((e) => e.id.startsWith('pk-denge:'))).toBe(false);
    expect(r.c('A').economy.reaction).toBe(true);
    same(r);
  });
  it('38: avantaj kalır', () => {
    expect(go(38).a.mode).toBe('advantage');
  });
});

describe('dusmanYaklasti + hareketEt', () => {
  const go = (v?: number) => {
    const r = fighter(['siyrilan-adim'], { ...(v ? { kuralSurumu: v } : {}), place: { A: o(3, 3), B: o(8, 3), C: o(0, 0) } });
    turnOf(r, 'B');
    const evs = r.gm({ type: 'move', actorId: 'B', to: o(4, 3) });
    return { r, evs };
  };
  it('39: düşman bitişik olunca uzaklaşır (ışınlanma girişi)', () => {
    const { r, evs } = go();
    expect(evs.some((e) => e.type === 'teleported' && e.actorId === 'A')).toBe(true);
    expect(r.c('A').pos).not.toEqual(o(3, 3));
    same(r);
  });
  it('38: kımıldamaz', () => {
    expect(go(38).evs.some((e) => e.type === 'teleported')).toBe(false);
  });
});

describe('firsatSaldirisi + hareketEt (yakin)', () => {
  it('39: fırsat saldırısı isabetinden sonra kaçana yaklaşır; 38\'de yok', () => {
    const go = (v?: number) => {
      const r = fighter(['av-takibi'], v ? { kuralSurumu: v } : {});
      turnOf(r, 'B');
      return r.gm({ type: 'move', actorId: 'B', to: o(8, 3) }, fixed(0.95));
    };
    const evs = go();
    expect(evs.some((e) => e.type === 'attack_resolved' && e.opportunity && e.hit)).toBe(true);
    expect(evs.some((e) => e.type === 'teleported' && e.actorId === 'A')).toBe(true);
    expect(go(38).some((e) => e.type === 'teleported')).toBe(false);
  });
});

describe('kurtulmaAttirildi + saldiriYap', () => {
  it('39: düşman kurtulmayı geçince karşı saldırı; 38\'de yok', () => {
    const go = (v?: number) => {
      const r = fighter(['bastirma', 'karsi-darbe'], v ? { kuralSurumu: v } : {});
      const evs = r.do(use(pk('denge-muhafizi', 'bastirma', 'eylem'), 'B'), fixed(0.99));
      return { r, evs };
    };
    const { r, evs } = go();
    expect(evs.some((e) => e.type === 'save_resolved' && e.success)).toBe(true);
    expect(atk(evs)).toBeTruthy();
    same(r);
    expect(atk(go(38).evs)).toBeFalsy();
  });
});

describe('ekHasar.yanHedef', () => {
  it('39: ek hasar bitişik başka düşmana; 38\'de vurulana', () => {
    const D = mk('D', { side: 'enemies', hp: 50, maxHp: 50 });
    const go = (v?: number) => {
      const r = fighter(['yan-vurus'], { ...(v ? { kuralSurumu: v } : {}), extra: [D], place: { A: o(3, 3), B: o(4, 3), D: o(5, 3) } });
      const evs = r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, fixed(0.6));
      return { r, evs };
    };
    const { r, evs } = go();
    expect(hasPk(evs, 'Yan Vurus', 'D')).toBe(true);
    expect(atk(evs).extra?.some((x) => x.label === 'Yan Vurus')).toBeFalsy();
    same(r);
    const old = go(38).evs;
    expect(hasPk(old, 'Yan Vurus', 'D')).toBe(false);
    expect(atk(old).extra?.some((x) => x.label === 'Yan Vurus')).toBe(true);
  });
});

describe('zarDegistir ikiAtSec', () => {
  it('39: düşük hasar zarları yeniden atılır, büyük toplam (fark ek hasar); 38\'de yok', () => {
    const go = (v?: number) => {
      const r = fighter(['ikili-zar'], v ? { kuralSurumu: v } : {});
      return atk(r.do({ type: 'attack', actorId: 'A', targetId: 'B', option: club }, seq([0.6, 0.01, 0.01], 0.99)));
    };
    const a = go();
    expect(a.damageRolls).toEqual([1, 1]);
    expect(a.extra?.find((x) => x.label === 'Ikili Zar')?.raw).toBe(10);
    expect(go(38).extra?.some((x) => x.label === 'Ikili Zar')).toBeFalsy();
  });
});

describe('isaret.kurtulmaAvantaji', () => {
  it('saveMode: işaretli kaynağa karşı avantaj', () => {
    const A = mk('A');
    const B = mk('B', { side: 'enemies', effects: [{ id: 'm', name: 'Av', sourceId: 'A', pkSaveAdvFor: 'A' }] });
    expect(saveMode('normal', A, 'wis', B)).toBe('advantage');
    expect(saveMode('normal', A, 'wis', mk('X', { side: 'enemies' }))).toBe('normal');
  });
  it('39: işaret etkisi alanı taşır, 38\'de taşımaz', () => {
    const go = (v?: number) => { const r = fighter(['av-isareti'], v ? { kuralSurumu: v } : {}); r.do(use(pk('denge-muhafizi', 'av-isareti', 'bonus'), 'B')); return r; };
    const r = go();
    expect(r.c('B').effects?.some((e) => e.pkSaveAdvFor === 'A')).toBe(true);
    same(r);
    expect(go(38).c('B').effects?.some((e) => e.pkSaveAdvFor)).toBeFalsy();
  });
});

describe('kontrolEt.kurtulmasiz', () => {
  it('39: Incapacitated hedefte kurtulma yok, doğrudan yönetilir; ayaktaki hedef kurtulma atar', () => {
    const r = fighter(['zincir']);
    patch(r, 'B', { conditions: ['Unconscious'], creatureType: 'humanoid' });
    rebase(r);
    const evs = r.do(use(pk('denge-muhafizi', 'zincir', 'eylem'), 'B'), fixed(0.99));
    expect(evs.some((e) => e.type === 'save_resolved')).toBe(false);
    expect(r.c('B').effects?.some((e) => e.dominate)).toBe(true);
    same(r);
    const r2 = fighter(['zincir']);
    expect(r2.do(use(pk('denge-muhafizi', 'zincir', 'eylem'), 'B'), fixed(0.99)).some((e) => e.type === 'save_resolved')).toBe(true);
  });
  it('38: Incapacitated hedefte de kurtulma', () => {
    const r = fighter(['zincir'], { kuralSurumu: 38 });
    patch(r, 'B', { conditions: ['Unconscious'] });
    expect(r.do(use(pk('denge-muhafizi', 'zincir', 'eylem'), 'B'), fixed(0.99)).some((e) => e.type === 'save_resolved')).toBe(true);
  });
});

describe('hiz dosta/düşmana', () => {
  it('39: düşmanın hızı −10 ft (süreli); 38\'de etkisiz (kendine de uygulanmaz)', () => {
    const r = fighter(['agirlik']);
    r.do(use(pk('denge-muhafizi', 'agirlik', 'bonus'), 'B'));
    expect(r.c('B').effects?.some((e) => e.speedFt === -10)).toBe(true);
    same(r);
    const old = fighter(['agirlik'], { kuralSurumu: 38 });
    old.do(use(pk('denge-muhafizi', 'agirlik', 'bonus'), 'B'));
    expect(old.c('B').effects?.some((e) => e.speedFt === -10)).toBeFalsy();
    expect(old.c('A').effects?.some((e) => e.speedFt === -10)).toBeFalsy();
  });
});

describe('ortakCan.direncler', () => {
  it('39: havuz üyelerine direnç; 38\'de yok', () => {
    const go = (v?: number) => { const r = fighter(['birlik'], { ...(v ? { kuralSurumu: v } : {}), place: { A: o(3, 3), B: o(10, 3), C: o(4, 4) } }); r.do(use(pk('denge-muhafizi', 'birlik', 'eylem'))); return r; };
    const r = go();
    expect(r.state.hpPools && Object.keys(r.state.hpPools).length).toBe(1);
    for (const id of ['A', 'C']) expect(r.c(id).effects?.some((e) => e.resist?.includes('slashing'))).toBe(true);
    same(r);
    expect(go(38).c('C').effects?.some((e) => e.id.startsWith('pk-havuz-direnc'))).toBeFalsy();
  });
});

describe('büyü olayları: geriTepme ve buyuBasardi', () => {
  it('dusmanBuyuAtiyor + buyuIptal + geriTepme: büyü boşa, büyücüye hasar (39); 38\'de hasar yok', () => {
    const go = (v?: number) => {
      const r = wizard(['geri-tepen'], v ? { kuralSurumu: v } : {});
      patch(r, 'B', { spellNames: ['Fire Bolt'], spellAttack: 5, spellSaveDc: 13, spellMod: 3 });
      turnOf(r, 'B');
      rebase(r);
      return { r, evs: r.gm({ type: 'cast_spell', actorId: 'B', spellName: 'Fire Bolt', targetId: 'A' }, fixed(0.5)) };
    };
    const { r, evs } = go();
    expect(atk(evs, 'B')).toBeFalsy();
    expect(hasPk(evs, 'Geri Tepen', 'B')).toBe(true);
    same(r);
    const old = go(38).evs;
    expect(atk(old, 'B')).toBeFalsy();
    expect(hasPk(old, 'Geri Tepen', 'B')).toBe(false);
  });
  it('buyuBasardi + hasarEkle: büyü isabet edince ek hasar (39); 38\'de yok', () => {
    const go = (v?: number) => {
      const r = wizard(['basarili-buyu'], v ? { kuralSurumu: v } : {});
      patch(r, 'A', { spellNames: ['Fire Bolt'], spellAttack: 9 });
      rebase(r);
      return { r, evs: r.do({ type: 'cast_spell', actorId: 'A', spellName: 'Fire Bolt', targetId: 'B' }, fixed(0.9)) };
    };
    const { r, evs } = go();
    expect(atk(evs)?.hit).toBe(true);
    expect(hasPk(evs, 'Basarili Buyu', 'B')).toBe(true);
    same(r);
    expect(hasPk(go(38).evs, 'Basarili Buyu')).toBe(false);
  });
});
