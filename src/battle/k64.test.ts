/**
 * Kuyruk K64a (kural sürümü 48, Game Master anahtarı `possession`): ele geçirme çekirdeği (Ghost Possession,
 * Protection from Evil and Good engeli, Dispel Evil and Good Break Enchantment). Başarı yolları, kenar durumları,
 * eski sürüm (47) ve anahtar kapalı; her komutta replay denetlenir.
 */
import { describe, expect, it } from 'vitest';
import { getMonster } from '../data';
import { seededRng } from '../rules/dice';
import { chooseCommand } from './ai';
import { homeSide } from './allegiance';
import { isTargetable, winnerOf } from './common';
import { combatantFromMonster } from './create';
import { GM, mk, P1 } from './fixtures';
import { execute, replay } from './index';
import { field } from './k19spells.test';
import { possessedEffect } from './possession';
import { serializeSession, restoreSession } from '../app/battleSave';
import type { BattleEvent, BattleState, Combatant, Command, CommandContext } from './types';

const LOW = { str: -10, dex: -10, con: -10, int: -10, wis: -10, cha: -10 };
const HIGH = { str: 30, dex: 30, con: 30, int: 30, wis: 30, cha: 30 };
const ghost = (): Combatant => ({ ...combatantFromMonster(getMonster('ghost'), { id: 'G' }), side: 'enemies', ownerId: null });
const host = (p: Partial<Combatant> = {}) => mk('H', { ownerId: 'p1', hp: 40, maxHp: 40, ac: 17, speed: 25, saves: LOW, modifiers: { str: 4, dex: 1, con: 3, int: 0, wis: 0, cha: 0 }, ...p });
const ally = (p: Partial<Combatant> = {}) => mk('P', { ownerId: 'p1', hp: 40, maxHp: 40, ...p });
const POS = { G: { col: 5, row: 3 }, H: { col: 6, row: 3 }, P: { col: 7, row: 3 } };

function go(s: BattleState, cmd: Command, ctx: CommandContext = GM, seed = 3) {
  const r = execute(s, cmd, ctx, seededRng(seed));
  if (!r.ok) throw new Error(r.error);
  expect(replay([{ type: 'battle_started', state: s }, ...r.events] as BattleEvent[])).toEqual(r.state);
  return r;
}
const turnOf = (s: BattleState, id: string): BattleState => ({ ...s, turnIndex: s.order.indexOf(id) });
const possIdx = (s: BattleState) => (s.combatants.G as Combatant).attacks.findIndex((a) => a.name === 'Possession');
const possess = (s: BattleState, target = 'H'): Command => ({ type: 'monster_attack', actorId: 'G', targetId: target, attackIndex: possIdx(s) });
const setup = (ver = 48, parts: Combatant[] = [ghost(), host(), ally()], toggles?: Record<string, boolean>) => field(parts, POS, ver, toggles);
const possessed = () => go(setup(), possess(setup())).state;

describe('K64a Ghost Possession', () => {
  it('başarısız CHA save: beden ele geçirilir, ele geçiren haritadan çekilir, değerler planda yazıldığı gibi', () => {
    const r = go(setup(), possess(setup()));
    expect(r.events.map((e) => e.type)).toEqual(expect.arrayContaining(['save_resolved', 'possessed', 'shape_changed']));
    const h = r.state.combatants.H as Combatant;
    const g = r.state.combatants.G as Combatant;
    expect(possessedEffect(h)?.sourceId).toBe('G');
    expect(h.conditions).toContain('Incapacitated');
    expect(h.side).toBe('enemies');
    expect(homeSide(h)).toBe('party');
    expect(h.ownerId).toBeNull();
    expect(g).toMatchObject({ pos: null, offFloor: 'beden', possessing: 'H' });
    expect(isTargetable(g)).toBe(false);
    // Ev sahibinin hızı, STR/DEX/CON'u, AC'si ve HP'si; ele geçirenin saldırıları ve INT/WIS/CHA'sı.
    const gm = getMonster('ghost');
    expect(h.speed).toBe(25); expect(h.ac).toBe(17); expect(h.hp).toBe(40);
    expect(h.modifiers.str).toBe(4); expect(h.modifiers.con).toBe(3);
    expect(h.modifiers.cha).toBe(Math.floor((gm.abilities.cha - 10) / 2));
    expect(h.weaponOptions.map((o) => o.label).join()).toMatch(/Withering Touch/);
    expect(h.attacks.some((a) => a.name === 'Possession')).toBe(false);
  });

  it('başarılı save: savaş sonuna dek bağışık; ikinci deneme save atmadan reddedilir', () => {
    const s = setup(48, [ghost(), host({ saves: HIGH }), ally()]);
    const r = go(s, possess(s));
    expect(r.events.some((e) => e.type === 'possession_resisted')).toBe(true);
    expect(r.state.combatants.H?.possessionImmune).toEqual(['G']);
    const again = { ...r.state, combatants: { ...r.state.combatants, G: { ...(r.state.combatants.G as Combatant), rechargeUsed: [], economy: { ...(r.state.combatants.G as Combatant).economy, action: false } } } };
    const r2 = execute(again, possess(again), GM, seededRng(3));
    expect(r2.ok).toBe(false);
    expect(!r2.ok && r2.error).toMatch(/bağışık/);
  });

  it('beden kendi sırasında ele geçirenin saldırısıyla eski dostuna vurur; ev sahibinin büyüsü yapılamaz', () => {
    const s = turnOf(possessed(), 'H');
    const h = s.combatants.H as Combatant;
    const opt = h.weaponOptions.find((o) => /Withering Touch/.test(o.label));
    const r = go(s, { type: 'attack', actorId: 'H', targetId: 'P', option: opt } as Command);
    expect(r.events.some((e) => e.type === 'attack_resolved' && e.targetId === 'P')).toBe(true);
    // Oyuncu (ev sahibinin sahibi) artık bedeni yönetemez.
    expect(execute(s, { type: 'attack', actorId: 'H', targetId: 'P', option: opt } as Command, P1, seededRng(1)).ok).toBe(false);
    const cast = execute({ ...s, combatants: { ...s.combatants, H: { ...h, spellNames: ['Fire Bolt'] } } }, { type: 'cast_spell', actorId: 'H', spellName: 'Fire Bolt', targetIds: ['P'] }, GM, seededRng(1));
    expect(cast.ok).toBe(false);
  });

  it('"Bedeni bırak" (bonus eylem): ele geçiren 5 ft içinde belirir, beden asıl tarafa döner, bağışıklık yazılır', () => {
    const s = turnOf(possessed(), 'H');
    const r = go(s, { type: 'possession_leave', actorId: 'H' });
    const h = r.state.combatants.H as Combatant;
    const g = r.state.combatants.G as Combatant;
    expect(h.economy.bonus).toBe(true);
    expect(possessedEffect(h)).toBeUndefined();
    expect(h.conditions).not.toContain('Incapacitated');
    expect(h.side).toBe('party'); expect(h.ownerId).toBe('p1'); expect(h.shape).toBeUndefined(); expect(h.ac).toBe(17);
    expect(h.possessionImmune).toEqual(['G']);
    expect(g.offFloor).toBeUndefined(); expect(g.possessing).toBeUndefined();
    expect(g.pos).not.toBeNull();
    const d = Math.abs((g.pos?.col ?? 0) - 6) + Math.abs((g.pos?.row ?? 0) - 3);
    expect(d).toBeLessThanOrEqual(2);
    expect(r.state.combatants.P?.pos).not.toEqual(g.pos);
  });

  it('beden 0 HP: ele geçirme biter, ev sahibi kendi kurallarıyla düşer (ölüm save\'i), ele geçiren belirir', () => {
    const r = go(possessed(), { type: 'adjust_hp', targetId: 'H', hp: 0 });
    const end = r.events.find((e) => e.type === 'possession_ended');
    expect(end?.type === 'possession_ended' && end.reason).toBe('hp0');
    const h = r.state.combatants.H as Combatant;
    expect(h.side).toBe('party'); expect(h.hp).toBe(0); expect(h.life).not.toBe('dead'); expect(h.shape).toBeUndefined();
    expect(r.state.combatants.G?.pos).not.toBeNull();
  });

  it('Game Master ele geçirmeyi her an bitirir; oyuncu bağlamı bitiremez', () => {
    const s = possessed();
    expect(execute(s, { type: 'possession_leave', actorId: 'H', gm: true }, P1, seededRng(1)).ok).toBe(false);
    const r = go(s, { type: 'possession_leave', actorId: 'H', gm: true });
    expect(r.events.find((e) => e.type === 'possession_ended')).toMatchObject({ reason: 'gm' });
  });

  it('kayıt/yükleme ve replay: ele geçirme sürer', () => {
    const s0 = setup();
    const r = go(s0, possess(s0));
    const events = [{ type: 'battle_started', state: s0 } as BattleEvent, ...r.events];
    const back = restoreSession(serializeSession({ state: r.state, events } as never));
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.session.state).toEqual(r.state);
  });
});

describe('K64a engeller ve kenar durumlar', () => {
  it('Humanoid olmayan, biçim değiştirmiş, 5 ft dışı ve görünmeyen hedef reddedilir (save yok)', () => {
    const tries: Array<[Partial<Combatant>, Record<string, { col: number; row: number }>, RegExp]> = [
      [{ creatureType: 'beast' }, POS, /Humanoid|humanoid/],
      [{ conditions: ['Invisible'] }, POS, /görmüyor/],
      [{}, { ...POS, H: { col: 8, row: 5 }, P: { col: 9, row: 3 } }, /5 ft/],
    ];
    for (const [p, pos, re] of tries) {
      const s = field([ghost(), host(p), ally()], pos, 48);
      const r = execute(s, possess(s), GM, seededRng(1));
      expect(r.ok).toBe(false);
      expect(!r.ok && r.error).toMatch(re);
    }
  });

  it('Protection from Evil and Good: korunan ele geçirilemez (save yok); yapay zekâ da denemez', () => {
    const s = setup(48, [ghost(), host(), ally({ concentration: { spell: 'Protection from Evil and Good', targetId: 'H', turn: '' } as never })]);
    const r = execute(s, possess(s), GM, seededRng(1));
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toMatch(/Protection from Evil and Good/);
    const ai = chooseCommand(s);
    expect(ai.type === 'monster_attack' && ai.attackIndex === possIdx(s)).toBe(false);
  });

  it('PfEG sonradan ele geçirilmiş bedene: SRD yalnızca yeni save\'e avantaj verir, Ghost\'ta yeni save yok: ele geçirme sürer', () => {
    const s = possessed();
    const warded = { ...s, combatants: { ...s.combatants, P: { ...(s.combatants.P as Combatant), concentration: { spell: 'Protection from Evil and Good', targetId: 'H', turn: '' } as never } } };
    const r = go(turnOf(warded, 'P'), { type: 'end_turn', actorId: 'P' }, P1);
    expect(possessedEffect(r.state.combatants.H)).toBeDefined();
  });

  it('Dispel Evil and Good Break Enchantment: dokunulan dostun ele geçirmesi biter, büyü biter', () => {
    const s = possessed();
    const caster = { ...(s.combatants.P as Combatant), concentration: { spell: 'Dispel Evil and Good', slotLevel: 5, turn: '' } as never };
    const s2 = turnOf({ ...s, combatants: { ...s.combatants, P: caster } }, 'P');
    const r = go(s2, { type: 'spell_followup', actorId: 'P', targetId: 'H' } as Command, P1);
    expect(r.events.find((e) => e.type === 'possession_ended')).toMatchObject({ reason: 'dispel' });
    expect(r.state.combatants.P?.concentration).toBeNull();
    expect(r.state.combatants.H?.side).toBe('party');
  });

  it('Dominate\'li hedef: ele geçirme baskın, bitince Dominate kaldığı yerden sürer', () => {
    const dom = mk('D', { side: 'enemies', ownerId: 'p2', hp: 30, maxHp: 30 });
    const h = host({ effects: [{ id: 'dom', name: 'Dominate Person', sourceId: 'D', dominate: true, until: 99 }] as never });
    const s = field([ghost(), h, ally(), dom], { ...POS, D: { col: 2, row: 1 } }, 48);
    const r = go(s, possess(s));
    expect(r.state.combatants.H?.ownerId).toBeNull();
    const r2 = go(r.state, { type: 'possession_leave', actorId: 'H', gm: true });
    expect(r2.state.combatants.H).toMatchObject({ ownerId: 'p2', side: 'enemies' });
  });

  it('yalnızca ele geçirilmiş üyesi kalan taraf yenilir', () => {
    const s = field([ghost(), host()], { G: POS.G, H: POS.H }, 48);
    const r = go(s, possess(s));
    expect(winnerOf(r.state)).toBe('enemies');
    expect(r.state.status).toBe('finished');
  });

  it('yapay zekâ: şarjlı Possession\'ı 5 ft içindeki geçerli hedefe kullanır', () => {
    const cmd = chooseCommand(setup());
    expect(cmd).toMatchObject({ type: 'monster_attack', actorId: 'G', targetId: 'H', attackIndex: possIdx(setup()) });
  });

  it('beden yapay zekâyla oynar (Incapacitated bedeni durdurmaz); bedendeki ele geçiren turunu bitirir', () => {
    const s = turnOf(possessed(), 'H');
    expect(chooseCommand(s).type).not.toBe('end_turn');
    expect(chooseCommand(turnOf(possessed(), 'G')).type).toBe('end_turn');
  });

  it('sürüm 47 ve anahtar kapalı: bugünkü davranış (hasarsız save, ele geçirme yok)', () => {
    for (const s of [setup(47), setup(48, undefined, { possession: false })]) {
      const r = go(s, possess(s));
      expect(r.events.some((e) => e.type === 'possessed' || e.type === 'possession_resisted')).toBe(false);
      expect(r.state.combatants.H?.side).toBe('party');
      expect(r.state.combatants.G?.offFloor).toBeUndefined();
    }
  });
});
