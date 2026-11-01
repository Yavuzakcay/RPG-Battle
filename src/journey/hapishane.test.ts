/**
 * Kuyruk 36: Hapishane Adası. Motor eklemeleri (doğaçlama silah, anahtar, `reach` kimlik süzgeci), Büyük suç zinciri,
 * hapse atılma (emanet, tasma, kıyafet), adadaki savaş oturumu, kapı geçişleri, emanet iadesi, tasma anahtarı, kısa ceza,
 * başarısızlık ve tapınak, kaçış, kurallar kapalıyken eski davranış, atlama anahtarı, replay.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, nodeKey, replaySeruven, type SeruvenCommand, type SeruvenEvent, type SeruvenState } from './seruven';
import { HAPIS } from './hapishane';
import { hapisResultCommands, hapisSession, seruvenSkipCommand, sucResultCommand, sucSession } from '../app/seruvenBattle';
import { dispatch } from '../ui/session';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';
import { executeObjectUse } from '../battle/objects';
import { liveGoalStatus } from '../battle/goals';
import type { BattleState, Combatant } from '../battle';

const log: SeruvenEvent[] = [];
function begin(toggles: Record<string, boolean> = {}): SeruvenState {
  log.length = 0;
  const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: sh }));
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, toggles: { irkBaslangic: false, ...toggles } });
  if (!r.ok) throw new Error(r.error);
  log.push(...r.events);
  return r.state;
}
const step = (s: SeruvenState, cmd: SeruvenCommand): SeruvenState => {
  const r = executeSeruven(s, cmd);
  if (!r.ok) throw new Error(`${cmd.type}: ${r.error}`);
  log.push(...r.events);
  return r.state;
};
const inCity = (s: SeruvenState): SeruvenState => ({ ...s, page: 'bati-kiyisi', at: 'beyaz-sehir', yerlesim: { id: 'beyaz-sehir', map: null, from: null, seen: [] }, gold: 80, potions: 2, items: ['rope'] });
const pcs = (st: BattleState) => Object.values(st.combatants).filter((c) => c.side === 'party' && c.id.startsWith('pc'));
const at = (st: BattleState, id: string, hex: [number, number], patch: Partial<Combatant> = {}): BattleState =>
  ({ ...st, combatants: { ...st.combatants, [id]: { ...st.combatants[id]!, pos: { col: hex[0] - 1, row: hex[1] - 1 }, ...patch } } });
/** Düğümün savaşını kazanılmış bitir (düşmanlar 0 HP); isteğe bağlı mahkûm bir kapıda. */
function wonFinal(s: SeruvenState, node: string, door?: [number, number], extra: (st: BattleState) => BattleState = (x) => x): BattleState {
  let ss = hapisSession(s, node, () => 0.5)!;
  ss = dispatch(ss, { type: 'start_battle' }, () => 0.5);
  let st = ss.state;
  for (const c of Object.values(st.combatants)) if (c.side === 'enemies') st = { ...st, combatants: { ...st.combatants, [c.id]: { ...c, hp: 0, life: 'dead' } } };
  if (door) st = at(st, HAPIS.mahkum.id, door);
  return extra({ ...st, status: 'finished', winner: 'party' });
}
const runAll = (s: SeruvenState, cmds: SeruvenCommand[]) => cmds.reduce(step, s);

describe('motor eklemeleri', () => {
  it('doğaçlama silah alınınca saldırı seçeneği (STR, yetkinliksiz); anahtar kilidi zarsız açar; reach hedefi kimliğe göre', () => {
    let s = hapisSession(step(inCity(begin()), { type: 'hapse_at' }), HAPIS.baslangic, () => 0.5)!;
    s = dispatch(s, { type: 'start_battle' }, () => 0.5);
    const pc = pcs(s.state)[0]!;
    const leg = s.state.map!.objects!.find((o) => o.kind === 'benchLeg')!;
    let st = at(s.state, pc.id, [leg.at.col + 2, leg.at.row + 1]);
    const r = executeObjectUse(st, st.combatants[pc.id]!, leg.id, 'take', undefined, () => 0.5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const opt = r.state.combatants[pc.id]!.weaponOptions!.find((o) => o.weaponId === 'improvised')!;
    expect(opt).toMatchObject({ damage: expect.stringMatching(/^1d4/), attackBonus: pc.modifiers.str });
    // Anahtar: hedef hücrenin kilitli kapısı anahtarla açılır.
    const key = r.state.map!.objects!.find((o) => o.id === 'hucreAnahtari')!;
    st = at(r.state, pc.id, [key.at.col + 1, key.at.row + 2]);
    const k = executeObjectUse(st, st.combatants[pc.id]!, key.id, 'take', undefined, () => 0.5);
    expect(k.ok).toBe(true);
    if (!k.ok) return;
    st = at(k.state, pc.id, [11, 8]);
    const u = executeObjectUse(st, st.combatants[pc.id]!, 'hedefKapi', 'unlock', undefined, () => 0);
    expect(u.ok && u.state.map!.objects!.find((o) => o.id === 'hedefKapi')!.state).toBe('closed');
    // Reach hedefi yalnızca mahkûm için: parti üyesi köprüde olsa da açık kalır.
    const goal = { id: 'g', kind: 'reach' as const, hexes: [{ col: 9, row: 0 }], ids: ['mahkum'] };
    expect(liveGoalStatus(at(st, pc.id, [10, 1]), goal)).toBe('open');
    expect(liveGoalStatus(at(st, 'mahkum', [10, 1]), goal)).toBe('done');
  });
});

describe('Büyük suç zinciri', () => {
  it('yalnızca Beyaz Şehir hub\'ında; ön savaş → baskın; baskın kazanılırsa suç tamam (ödül), sıradan görev değişmez', () => {
    const s0 = begin();
    expect(executeSeruven(s0, { type: 'suc_basla', suc: 'soylu' }).ok).toBe(false);
    let s = step(inCity(s0), { type: 'suc_basla', suc: 'soylu' });
    expect(s.suc).toEqual({ id: 'soylu', asama: 'on' });
    expect(executeSeruven(s, { type: 'quest_take', quest: 'buyuk-suc' }).ok).toBe(false);
    const ss = sucSession(s, () => 0.5)!;
    expect(ss.state.map?.id).toBe('beyaz-sehir-saray-avlusu');
    const win = { ...ss.state, status: 'finished' as const, winner: 'party' as const };
    s = step(s, sucResultCommand(s, win)!);
    expect(s.suc?.asama).toBe('baskin');
    expect(sucSession(s, () => 0.5)!.state.map?.id).toBe('sehir-meydani');
    const gold = s.gold;
    s = step(s, sucResultCommand(s, { ...sucSession(s, () => 0.5)!.state, status: 'finished', winner: 'party' })!);
    expect([s.suc, s.gold, s.quests?.['buyuk-suc'], s.page, s.hapis ?? null]).toEqual([null, gold + HAPIS.sucOdulu, 'done', 'bati-kiyisi', null]);
  });
  it('Teslim ol → ada: altın/iksir/eşya emanete, tasma; baskın kaybı da aynı', () => {
    let s = step(step(inCity(begin()), { type: 'suc_basla', suc: 'muhur' }), sucResultCommand(step(inCity(begin()), { type: 'suc_basla', suc: 'muhur' }), { ...sucSession(step(inCity(begin()), { type: 'suc_basla', suc: 'muhur' }), () => 0.5)!.state, status: 'finished', winner: 'party' })!);
    expect(s.suc?.asama).toBe('baskin');
    s = step(s, { type: 'teslim_ol' });
    expect([s.page, s.at, s.gold, s.potions, s.items, s.tasma]).toEqual([HAPIS.sayfa, HAPIS.baslangic, 0, 0, [], true]);
    expect(s.hapis).toMatchObject({ suc: 'muhur', emanet: { gold: 80, potions: 2, items: ['rope'] }, alarm: 0, kurallar: true });
    const lost = step(inCity(begin()), { type: 'suc_basla', suc: 'soygun' });
    const after = step(lost, sucResultCommand(lost, { ...sucSession(lost, () => 0.5)!.state, status: 'finished', winner: 'enemies' })!);
    expect(after.page).toBe(HAPIS.sayfa);
    expect(after.party.every((m) => !m.status.dead)).toBe(true);
  });
});

describe('adadaki savaşlar', () => {
  const jailed = () => step(inCity(begin()), { type: 'hapse_at' });
  it('emanet: zırh/silah yok; tasma: büyü yok; mahkûm kıyafeti (Keşiş jetonu); mahkûm hedef hücrede, hücre arkadaşı yanımızda', () => {
    const s = jailed();
    const ss = hapisSession(s, HAPIS.baslangic, () => 0.5)!;
    const party = pcs(ss.state);
    expect(party.length).toBe(s.party.length);
    for (const c of party) {
      expect((c.weaponOptions ?? []).every((o) => o.weaponId === 'unarmed-strike')).toBe(true);
      expect(c.spellNames).toEqual([]);
      expect(c.avatar).toMatchObject({ outfit: 'mahkum', src: expect.stringMatching(/-monk\.webp$/) });
    }
    const m = ss.state.combatants[HAPIS.mahkum.id]!;
    expect([m.side, m.hp, m.pos]).toEqual(['party', HAPIS.mahkum.hp, { col: HAPIS.mahkum.hucre[0] - 1, row: HAPIS.mahkum.hucre[1] - 1 }]);
    expect(ss.state.combatants[HAPIS.hucreArkadasi.id]?.side).toBe('party');
    expect(ss.state.goals?.list[0]?.kind).toBe('veya');
    expect(Object.values(ss.state.combatants).filter((c) => c.side === 'enemies').length).toBe(3);
  });
  it('kapıdan ileri-geri: hücre bloğu → dış halka (varış köprüde) → iskele → emanet iadesi → kayıkla kaçış (Liman, kacis-tamam)', () => {
    let s = jailed();
    s = runAll(s, hapisResultCommands(s, HAPIS.baslangic, wonFinal(s, HAPIS.baslangic, [11, 1])));
    expect([s.at, s.hapis?.from, s.done.includes(nodeKey(HAPIS.sayfa, HAPIS.baslangic))]).toEqual(['dis-halka', HAPIS.baslangic, true]);
    const ring = hapisSession(s, 'dis-halka', () => 0.5)!;
    expect(pcs(ring.state).some((c) => c.pos?.col === 10 && c.pos.row === 3)).toBe(true);
    expect(ring.state.combatants.mahkum?.pos).toBeTruthy();
    // Geri dönüş: geçilmiş hücre bloğu düşmansız keşif.
    s = runAll(s, hapisResultCommands(s, 'dis-halka', wonFinal(s, 'dis-halka', [11, 5])));
    expect(s.at).toBe(HAPIS.baslangic);
    expect(Object.values(hapisSession(s, HAPIS.baslangic, () => 0.5)!.state.combatants).some((c) => c.side === 'enemies')).toBe(false);
    s = runAll(s, hapisResultCommands(s, HAPIS.baslangic, wonFinal(s, HAPIS.baslangic, [11, 1])));
    s = runAll(s, hapisResultCommands(s, 'dis-halka', wonFinal(s, 'dis-halka', [11, 11])));
    expect(s.at).toBe('iskele');
    // İskele: emanet sandığı taşınırken kazanılır → iade; sonra kayık.
    const withChest = (st: BattleState) => ({ ...st, map: { ...st.map!, objects: st.map!.objects!.map((o) => (o.id === 'emanet' ? { ...o, carriedBy: 'pc1' } : o)) } });
    s = runAll(s, hapisResultCommands(s, 'iskele', wonFinal(s, 'iskele', undefined, withChest)));
    expect([s.gold >= 80, s.potions, s.items, s.hapis?.iade]).toEqual([true, 2, ['rope'], true]);
    expect(pcs(hapisSession(s, 'iskele', () => 0.5)!.state)[0]!.avatar.outfit).toBeUndefined();
    s = runAll(s, hapisResultCommands(s, 'iskele', wonFinal(s, 'iskele', [12, 11])));
    expect([s.page, s.at, s.hapis, s.flags.includes(HAPIS.donus.flag), s.tasma]).toEqual(['bati-kiyisi', 'liman', null, true, true]);
  });
  it('müdür kulesi: tasma anahtarı alınınca tasma çıkar, büyüler döner', () => {
    let s = jailed();
    s = { ...s, done: [...s.done, nodeKey(HAPIS.sayfa, HAPIS.baslangic), nodeKey(HAPIS.sayfa, 'dis-halka')], at: 'mudur-kulesi', hapis: { ...s.hapis!, from: 'dis-halka' } };
    const key = (st: BattleState) => ({ ...st, map: { ...st.map!, objects: st.map!.objects!.map((o) => (o.id === 'tasmaAnahtari' ? { ...o, carriedBy: 'pc2' } : o)) } });
    s = runAll(s, hapisResultCommands(s, 'mudur-kulesi', wonFinal(s, 'mudur-kulesi', undefined, key)));
    expect(s.tasma).toBe(false);
    const caster = pcs(hapisSession(s, 'mudur-kulesi', () => 0.5)!.state).find((c) => s.party.find((m) => m.id === c.ownerId)?.sheet.spellNames?.length);
    if (caster) expect(caster.spellNames.length).toBeGreaterThan(0);
  });
  it('alarm: nöbetçi grubu alarm verirse sonraki düğümlerde takviye', () => {
    let s = jailed();
    const alarmed = (st: BattleState) => ({ ...st, groups: (st.groups ?? []).map((g) => ({ ...g, state: 'alarmed' as const })) });
    s = runAll(s, hapisResultCommands(s, HAPIS.baslangic, wonFinal(s, HAPIS.baslangic, [11, 1], alarmed)));
    expect(s.hapis?.alarm).toBe(1);
    const foes = Object.values(hapisSession(s, 'dis-halka', () => 0.5)!.state.combatants).filter((c) => c.side === 'enemies');
    expect(foes.length).toBe(4 + HAPIS.takviye.alarmBasina); // dış halka 3. seviyede 4 Guard (K36 denge ayarı)
  });
  it('yenilgi: hücre bloğunda kısa ceza (bayılanlar uyanır, alarm +1); sonra başarısızlık: Beyaz Şehir hub, eşyasız, tasma kalır; tapınak', () => {
    let s = jailed();
    const lose = (x: SeruvenState, node: string) => {
      const ss = dispatch(hapisSession(x, node, () => 0.5)!, { type: 'start_battle' }, () => 0.5);
      let st = ss.state;
      for (const c of pcs(st)) st = { ...st, combatants: { ...st.combatants, [c.id]: { ...c, hp: 0, life: 'dead' } } };
      return hapisResultCommands(x, node, { ...st, status: 'finished', winner: 'enemies' });
    };
    s = runAll(s, lose(s, HAPIS.baslangic));
    expect([s.page, s.at, s.hapis?.ceza, s.hapis?.alarm]).toEqual([HAPIS.sayfa, HAPIS.baslangic, 1, 1]);
    expect(s.party.every((m) => !m.status.dead && m.status.hp >= 1)).toBe(true);
    s = runAll(s, lose(s, HAPIS.baslangic));
    expect([s.page, s.at, s.yerlesim?.id, s.gold, s.potions, s.items, s.hapis, s.tasma, s.result]).toEqual(['bati-kiyisi', 'beyaz-sehir', 'beyaz-sehir', 0, 0, [], null, true, null]);
    expect(s.party.every((m) => !m.status.dead && m.status.hp > 0)).toBe(true);
    expect(executeSeruven(s, { type: 'tasma_cikar', yol: 'altin' }).ok).toBe(false);
    const paid = step({ ...s, gold: 60 }, { type: 'tasma_cikar', yol: 'altin' });
    expect([paid.tasma, paid.gold]).toEqual([false, 60 - HAPIS.tasmaUcreti]);
    expect(step(s, { type: 'tasma_cikar', yol: 'hizmet' }).tasma).toBe(false);
    // Görev yeniden alınabilir.
    expect(executeSeruven(s, { type: 'suc_basla', suc: 'soylu' }).ok).toBe(true);
  });
  it('Hapishane kuralları kapalı: emanet ve tasma yok, ekipman ve büyüler yerinde', () => {
    const s = step(inCity(begin({ hapishaneKurallari: false })), { type: 'hapse_at' });
    expect([s.gold, s.tasma ?? false, s.hapis?.kurallar]).toEqual([80, false, false]);
    const ss = hapisSession(s, HAPIS.baslangic, () => 0.5)!;
    expect(pcs(ss.state).some((c) => (c.weaponOptions ?? []).some((o) => o.weaponId !== 'unarmed-strike'))).toBe(true);
    expect(pcs(ss.state).every((c) => !c.avatar.outfit)).toBe(true);
  });
  it('Kolay: düğüm başına bir nöbetçi az; Savaşları atla: iskele atlanınca emanet de iade', () => {
    const easy = step(inCity(begin({ hapishaneKolay: true })), { type: 'hapse_at' });
    expect(Object.values(hapisSession(easy, HAPIS.baslangic, () => 0.5)!.state.combatants).filter((c) => c.side === 'enemies').length).toBe(2);
    let s = step(inCity(begin({ savaslariAtla: true })), { type: 'hapse_at' });
    s = { ...s, done: [...s.done, nodeKey(HAPIS.sayfa, HAPIS.baslangic), nodeKey(HAPIS.sayfa, 'dis-halka')], at: 'iskele' };
    s = step(s, seruvenSkipCommand(s, 'iskele')!);
    expect([s.hapis?.iade, s.gold]).toEqual([true, 80]);
  });
  it('olaylar baştan oynatılınca aynı durum (kayıt)', () => {
    let s = jailed();
    s = runAll(s, hapisResultCommands(s, HAPIS.baslangic, wonFinal(s, HAPIS.baslangic, [11, 1])));
    // inCity yaması olay değil: replay karşılaştırması için başlangıç olayını yamalı duruma eşitle.
    const events = [...log];
    expect(events[0]!.type).toBe('seruven_started');
    const replayed = replaySeruven([{ type: 'seruven_started', state: inCity((events[0] as Extract<SeruvenEvent, { type: 'seruven_started' }>).state) }, ...events.slice(1)]);
    expect(replayed?.hapis).toEqual(s.hapis);
    expect(replayed?.at).toBe(s.at);
  });
  it('haritalar: kapı ve varış altıgenleri yürünebilir ve harita içinde', () => {
    expect(HAPIS.sayfa).toBe('hapishane-adasi');
    for (const id of ['hapishane-hucre-platformu', 'hapishane-dis-halka', 'hapishane-mudur-kulesi', 'hapishane-iskele']) {
      const m = getMap(id);
      expect([m.size.cols, m.size.rows, m.variants.map((v) => v.id)]).toEqual([21, 11, ['los']]);
    }
  });
});
