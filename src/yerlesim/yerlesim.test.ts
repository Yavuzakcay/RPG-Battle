/**
 * Kuyruk 34b: yerleşim sistemi. Veri geçerliliği (haritalar, kapı ve varış altıgenleri yürünebilir), kale zinciri
 * ileri-geri (durum korunur), hub (dükkân, han, görev), anahtarlar kapalıyken eski davranış, ırka göre başlangıç.
 */
import { describe, expect, it } from 'vitest';
import { executeSeruven, gateOpen, pageById, prevPage, type SeruvenCommand, type SeruvenState } from '../journey/seruven';
import { yerlesimCrossCommand, yerlesimSession } from '../app/seruvenBattle';
import { dispatch } from '../ui/session';
import { partyAt } from '../sim/balance';
import { getMap } from '../map/maps';
import { terrainOf } from '../map/terrain';
import { YERLESIM, yerlesimById } from './yerlesim';

function begin(opts: { race?: string; toggles?: Record<string, boolean> } = {}): SeruvenState {
  const party = partyAt(3).map((sh, i) => ({ id: `p${i + 1}`, name: sh.name, sheet: i === 0 && opts.race ? { ...sh, raceId: opts.race } : sh }));
  const r = executeSeruven(null, { type: 'start', id: 's', seed: 1, party, ...(opts.toggles ? { toggles: opts.toggles } : {}) });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
const step = (s: SeruvenState, cmd: SeruvenCommand): SeruvenState => {
  const r = executeSeruven(s, cmd);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
/** Parti üyesini haritadaki kapı altıgenine koyup oturumdan dönüş komutunu üretir. */
function walkTo(s: SeruvenState, hex: [number, number], hp?: number) {
  let ss = yerlesimSession(s, () => 0.5)!;
  ss = dispatch(ss, { type: 'start_battle' }, () => 0.5);
  const pc = Object.values(ss.state.combatants).find((c) => c.side === 'party' && c.ownerId === 'p1')!;
  const there = { ...ss.state, combatants: { ...ss.state.combatants, [pc.id]: { ...pc, pos: { col: hex[0] - 1, row: hex[1] - 1 }, ...(hp ? { hp } : {}) } } };
  return yerlesimCrossCommand(s, there)!;
}

describe('yerleşim verisi', () => {
  it('üç yerleşim, şablonlar; haritalar var; kapı ve varış altıgenleri harita içinde ve yürünebilir', () => {
    expect(YERLESIM.yerlesimler.map((y) => [y.id, y.sablon])).toEqual([['kral-kalesi', 'kale'], ['beyaz-sehir', 'sehir'], ['kasaba-ornek', 'kasaba']]);
    for (const y of YERLESIM.yerlesimler) {
      for (const h of y.haritalar) {
        const m = getMap(h.mapId, { variantId: h.variantId });
        expect(m.variants.some((v) => v.id === h.variantId), `${y.id}/${h.id}`).toBe(true);
        const hexes = [...h.kapilar.flatMap((k) => k.hexes), ...Object.values(h.girisler ?? {}).flat()];
        for (const [c, r] of hexes) {
          const ch = m.tiles[r - 1]?.[c - 1];
          expect(ch, `${h.id} ${c},${r}`).toBeDefined();
          expect(['blocked', 'deadly'].includes(terrainOf(ch as string).movement), `${h.id} ${c},${r} '${ch}'`).toBe(false);
        }
        for (const k of h.kapilar) if (k.to) expect(y.haritalar.some((x) => x.id === k.to), `${h.id} → ${k.to}`).toBe(true);
      }
    }
    // Kale zinciri: Kale Önü → Kale Avlusu (yeni kimlik kale-ic-avlu) → Taht Salonu; avlu kapısı donjon-kapi nesnesinde.
    const k = yerlesimById('kral-kalesi')!;
    expect(k.haritalar.map((h) => h.mapId)).toEqual(['kale-onu', 'kale-ic-avlu', 'kale-taht-salonu']);
    expect(k.haritalar[1]!.kapilar.find((d) => d.to === 'kale-taht-salonu')?.nesne).toBe('donjon-kapi');
    expect(getMap('kale-ic-avlu').objects?.some((o) => o.id === 'donjon-kapi')).toBe(true);
  });
});

describe('kale zinciri ve hub', () => {
  const atCastle = () => step(step(begin({ race: 'human' }), { type: 'move', to: 'kral-kalesi' }), { type: 'yerlesim_enter' });
  it('ileri-geri geçiş: kapı altıgenine varınca sonraki harita; HP korunur; geri dönüş ve hub', () => {
    let s = atCastle();
    expect(s.yerlesim).toEqual({ id: 'kral-kalesi', map: null, from: null, seen: [] });
    // Kapı geçişi açıkken hub'dan yalnızca başlangıç haritası.
    expect(executeSeruven(s, { type: 'yerlesim_map', map: 'kale-taht-salonu', via: 'hub' }).ok).toBe(false);
    s = step(s, { type: 'yerlesim_map', map: 'kale-onu', via: 'hub' });
    const sess = yerlesimSession(s, () => 0.5)!;
    expect(Object.values(sess.state.combatants).every((c) => c.side === 'party')).toBe(true);
    expect(sess.state.explore?.exits.length).toBe(5);
    const hurt = s.party[0]!.status.hp - 3;
    let cmd = walkTo(s, [11, 1], hurt);
    expect(cmd).toMatchObject({ type: 'yerlesim_map', map: 'kale-ic-avlu', via: 'kapi' });
    s = step(s, cmd);
    expect(s.yerlesim).toMatchObject({ map: 'kale-ic-avlu', from: 'kale-onu' });
    expect(s.party[0]!.status.hp).toBe(hurt);
    // Varış: avlunun güney kapısı yanındaki altıgenler.
    const avlu = yerlesimSession(s, () => 0.5)!;
    expect(Object.values(avlu.state.combatants).some((c) => c.pos?.col === 10 && c.pos.row === 7)).toBe(true);
    s = step(s, walkTo(s, [11, 5]));
    expect(s.yerlesim?.map).toBe('kale-taht-salonu');
    s = step(s, walkTo(s, [8, 7]));
    expect(s.yerlesim).toMatchObject({ map: 'kale-ic-avlu', from: 'kale-taht-salonu' });
    s = step(s, walkTo(s, [11, 11]));
    expect(s.yerlesim?.map).toBe('kale-onu');
    // Kapıya varmadan dönüş: hub; görülen haritalar hub'da açık.
    s = step(s, walkTo(s, [11, 10]));
    expect(s.yerlesim).toMatchObject({ map: null, seen: ['kale-onu', 'kale-ic-avlu', 'kale-taht-salonu'] });
    expect(step(s, { type: 'yerlesim_map', map: 'kale-taht-salonu', via: 'hub' }).yerlesim?.map).toBe('kale-taht-salonu');
    expect(step(s, { type: 'yerlesim_leave' }).yerlesim).toBeNull();
  });
  it('hub: dükkân (sabit fiyat), han (uzun dinlenme), görev al ve ödül', () => {
    let s = { ...atCastle(), gold: 120 };
    expect(executeSeruven({ ...s, gold: 10 }, { type: 'shop_buy', item: 'iksir' }).ok).toBe(false);
    s = step(s, { type: 'shop_buy', item: 'iksir' });
    expect([s.gold, s.potions]).toEqual([70, 1]);
    s = step(s, { type: 'shop_buy', item: 'rope' });
    expect([s.gold, s.items]).toEqual([69, ['rope']]);
    s = step(s, { type: 'shop_sell', item: 'iksir' });
    expect([s.gold, s.potions]).toEqual([94, 0]);
    expect(executeSeruven(s, { type: 'shop_sell', item: 'iksir' }).ok).toBe(false);
    const tired = { ...s, party: s.party.map((m) => ({ ...m, status: { ...m.status, hp: 1 } })) };
    s = step(tired, { type: 'inn_rest' });
    expect(s.party.every((m) => m.status.hp > 1)).toBe(true);
    expect(s.rests).toBe(1);
    s = step(s, { type: 'quest_take', quest: 'ejder-tehdidi' });
    expect(executeSeruven(s, { type: 'quest_claim', quest: 'ejder-tehdidi' }).ok).toBe(false);
    s = step({ ...s, done: [...s.done, 'volkan/ejder'] }, { type: 'quest_claim', quest: 'ejder-tehdidi' });
    expect([s.quests?.['ejder-tehdidi'], s.gold]).toEqual(['done', 294]);
    expect(executeSeruven(s, { type: 'quest_take', quest: 'kayip-kervan' }).ok).toBe(false); // kalede yok
  });
  it('Liman "Yakında" kalır; anahtarlar kapalıyken: yerleşim yok, kapı geçişi yok (haritalar hub\'dan)', () => {
    const s = step(begin({ race: 'human' }), { type: 'move', to: 'liman' });
    expect(executeSeruven(s, { type: 'yerlesim_enter' }).ok).toBe(false);
    const off = step(step(begin({ race: 'human' }), { type: 'set_toggle', key: 'yerlesimler', on: false }), { type: 'move', to: 'kral-kalesi' });
    expect(executeSeruven(off, { type: 'yerlesim_enter' }).ok).toBe(false);
    let noDoor = step(atCastle(), { type: 'set_toggle', key: 'yerlesimKapi', on: false });
    noDoor = step(noDoor, { type: 'yerlesim_map', map: 'kale-taht-salonu', via: 'hub' });
    const sess = yerlesimSession(noDoor, () => 0.5)!;
    const starts = getMap('kale-taht-salonu').startZones.players.length;
    expect(sess.state.explore?.exits.length).toBe(starts);
    expect(walkTo(noDoor, [8, 7])).toMatchObject({ map: null });
  });
});

describe('ırka göre başlangıç', () => {
  const want: Record<string, [string, string]> = {
    human: ['bati-kiyisi', 'beyaz-sehir'], dwarf: ['dag', 'giris'], elf: ['orman', 'giris'], halfling: ['orman', 'giris'], orc: ['orman', 'giris'],
    gnome: ['bataklik', 'giris'], goliath: ['buzul', 'giris'], dragonborn: ['volkan', 'giris'], tiefling: ['derinlikler', 'giris'],
  };
  it('9 ırk için başlangıç sayfası ve düğümü; kayda yazılır; Volkan girişi 0,97/0,27', () => {
    for (const [race, [page, at]] of Object.entries(want)) {
      const s = begin({ race });
      expect([s.page, s.at, s.startPage], race).toEqual([page, at, page]);
    }
    expect(pageById('volkan')?.entry).toEqual({ x: 0.97, y: 0.27 });
  });
  it('anahtar kapalı (ya da yurdu olmayan tür): eski başlangıç Buzul girişi, sayfa sırası eski kural', () => {
    for (const s of [begin({ race: 'human', toggles: { irkBaslangic: false } }), begin({ race: 'celestial' })]) {
      expect([s.page, s.at, s.startPage]).toEqual(['buzul', 'giris', undefined]);
      expect(gateOpen(s, pageById('buzul')!, pageById('buzul')!.exit)).toBe(false);
      expect(prevPage(s, pageById('dag')!)).toBeUndefined();
    }
  });
  it('yurttan başlayınca sayfa çıkışları ve geri dönüş açık; Volkan portalı ve boss koşulları aynı', () => {
    let s = begin({ race: 'elf' });
    const orman = pageById('orman')!;
    expect(gateOpen(s, orman, orman.exit)).toBe(true);
    s = step(s, { type: 'move', to: 'geri' });
    expect([s.page, s.at]).toEqual(['dag', 'cikis']);
    s = step(s, { type: 'move', to: 'cikis' });
    expect(s.page).toBe('orman');
    expect(prevPage(s, pageById('buzul')!)).toBeUndefined();
    const der = pageById('derinlikler')!;
    expect(gateOpen(s, der, der.portal)).toBe(false);
  });
});
