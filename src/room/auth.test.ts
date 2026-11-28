/**
 * Görev ODA-3 (O3) test 3 (tam): yetki matrisi (ODA-TASARIM.md §4.3). Saf `komutYetkisi` + host üstünden: izleyici,
 * yapay zekâya verilmiş karakter, GM komutları, başkasının/düşmanın savaşçısı, kendi çağrısı, yanıt sahipliği (başkasına
 * sorulmuş zar/tepki cevabı yok sayılır), yetkisiz komut sayacı (20'de Game Master'a olay).
 */
import { describe, it, expect } from 'vitest';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet, type Command } from '../battle';
import type { BattleState, Combatant } from '../battle/types';
import { getMonster } from '../data';
import { dispatch, type Session } from '../ui/session';
import { demoCharacters } from '../screens/fixtures';
import { bellekHub } from './adapters/memory';
import { OdaHost, type HostOlayi, type UzakKomut } from './host';
import { OdaIstemci, type IstemciOlayi } from './client';
import { komutYetkisi } from './auth';
import type { SurumBilgisi } from './protocol';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'auth-test', kuralSurumu: 108 };
const [C1, C2] = demoCharacters() as [ReturnType<typeof demoCharacters>[number], ReturnType<typeof demoCharacters>[number]];

function savas(): Session {
  const sc = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
  const party = [combatantFromSheet(C1.sheet, { id: 'pc1', ownerId: C1.id }), combatantFromSheet(C2.sheet, { id: 'pc2', ownerId: C2.id })];
  const foes = Object.entries(sc.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
  const s = createMapBattle([...party, ...foes], { ...(sc.map as NonNullable<typeof sc.map>), mirrored: false }, seeded(3));
  return dispatch(s, { type: 'start_battle' }, seeded(4));
}

const uye = (karakterler: string[], rol: 'oyuncu' | 'izleyici' = 'oyuncu') => ({ rol, karakterler: new Set(karakterler) });

describe('yetki matrisi (komutYetkisi)', () => {
  const s = savas().state;
  const dusman = Object.values(s.combatants).find((c) => c.side === 'enemies') as Combatant;
  const cagri: BattleState = { ...s, combatants: { ...s.combatants, fam: { ...(s.combatants.pc1 as Combatant), id: 'fam', summon: { ownerId: 'pc1' } as never } } };
  const et = (cmd: Command, u = uye([C1.id]), st: BattleState | null = s, yz: string[] = []) => komutYetkisi(st, cmd, u, new Set(yz));
  it('kendi karakteri: bağlam gönderenin karakterinden (isGm hep false)', () => {
    expect(et({ type: 'end_turn', actorId: 'pc1' })).toMatchObject({ ok: true, ctx: { playerId: C1.id, isGm: false } });
  });
  it('kendi çağrısını yönetir (sahibinin ownerId\'si), başkası yönetemez', () => {
    expect(et({ type: 'end_turn', actorId: 'fam' }, uye([C1.id]), cagri).ok).toBe(true);
    expect(et({ type: 'end_turn', actorId: 'fam' }, uye([C2.id]), cagri)).toMatchObject({ ok: false, neden: 'yetki' });
  });
  it('başkasının karakteri, düşman, masum: yetki', () => {
    expect(et({ type: 'end_turn', actorId: 'pc2' })).toMatchObject({ ok: false, neden: 'yetki' });
    expect(et({ type: 'end_turn', actorId: dusman.id })).toMatchObject({ ok: false, neden: 'yetki' });
    const masumlu: BattleState = { ...s, combatants: { ...s.combatants, pc1: { ...(s.combatants.pc1 as Combatant), civilian: true } } };
    expect(et({ type: 'end_turn', actorId: 'pc1' }, uye([C1.id]), masumlu)).toMatchObject({ ok: false, neden: 'yetki' });
  });
  it('GM komutları (actorId\'li GM aracı, actorId\'siz, gm bayraklı): yetki', () => {
    expect(et({ type: 'skill_check', actorId: 'pc1', skill: 'athletics', dc: 10 } as Command)).toMatchObject({ ok: false, neden: 'yetki' });
    expect(et({ type: 'set_exhaustion', targetId: 'pc1', level: 1 } as Command)).toMatchObject({ ok: false, neden: 'yetki' });
    expect(et({ type: 'start_battle' } as Command)).toMatchObject({ ok: false, neden: 'yetki' });
    expect(et({ type: 'end_turn', actorId: 'pc1', gm: true } as unknown as Command)).toMatchObject({ ok: false, neden: 'yetki' });
  });
  it('izleyici hiç komut gönderemez; yapay zekâya verilmiş karakter bekler; savaş yoksa bekle; bilinmeyen savaşçı geçersiz', () => {
    expect(et({ type: 'end_turn', actorId: 'pc1' }, uye([C1.id], 'izleyici'))).toMatchObject({ ok: false, neden: 'izleyici' });
    expect(et({ type: 'end_turn', actorId: 'pc1' }, uye([C1.id]), s, [C1.id])).toMatchObject({ ok: false, neden: 'bekle' });
    expect(et({ type: 'end_turn', actorId: 'pc1' }, uye([C1.id]), null)).toMatchObject({ ok: false, neden: 'bekle' });
    expect(et({ type: 'end_turn', actorId: 'yok' })).toMatchObject({ ok: false, neden: 'gecersiz' });
  });
});

describe('yetki matrisi (host üstünden)', () => {
  async function masa() {
    const hub = bellekHub();
    const olaylar: HostOlayi[] = [];
    const host = new OdaHost({ transport: hub.baglanti(), kod: '222222', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: { ad: 'M', gmAdi: 'G', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'players', yzKarakterler: [] }, olay: (o) => olaylar.push(o) });
    await host.baslat();
    const a = new OdaIstemci({ transport: hub.baglanti(), kod: '222222', istemciId: 'A', ad: 'A', surum: SURUM });
    const b = new OdaIstemci({ transport: hub.baglanti(), kod: '222222', istemciId: 'B', ad: 'B', surum: SURUM });
    await a.baglan(); await b.baglan(); hub.bosalt();
    a.karakterGonder(C1); b.karakterGonder(C2); hub.bosalt();
    host.yayinla(savas().events); hub.bosalt();
    const yurutulen: UzakKomut[] = [];
    host.yurutucu = (k) => yurutulen.push(k);
    const red = (c: OdaIstemci) => { const out: string[] = []; c.abone((o: IstemciOlayi) => { if (o.tur === 'komut_red') out.push(o.neden); }); return out; };
    return { hub, host, a, b, olaylar, yurutulen, red };
  }
  it('20. yetkisiz komutta Game Master\'a bir kez olay; geçen komut yürütücüye bağlamla gider', async () => {
    const m = await masa();
    const redA = m.red(m.a);
    for (let i = 0; i < 21; i++) m.a.komutGonder({ type: 'end_turn', actorId: 'pc2' });
    m.hub.bosalt();
    expect(redA.filter((x) => x === 'yetki')).toHaveLength(21);
    expect(m.olaylar.filter((o) => o.tur === 'yetkisiz')).toEqual([{ tur: 'yetkisiz', istemciId: 'A', sayi: 20 }]);
    m.a.komutGonder({ type: 'end_turn', actorId: 'pc1' }); m.hub.bosalt();
    expect(m.yurutulen.map((k) => [k.istemciId, k.ctx.playerId, k.ctx.isGm])).toEqual([['A', C1.id, false]]);
  });
  it('yapay zekâdaki karakterin komutu bekle; geç katılan izleyici komut gönderemez', async () => {
    const m = await masa();
    m.host.yzKarakterler.add(C1.id);
    const redA = m.red(m.a);
    m.a.komutGonder({ type: 'end_turn', actorId: 'pc1' }); m.hub.bosalt();
    expect(redA).toEqual(['bekle']);
    const v = new OdaIstemci({ transport: m.hub.baglanti(), kod: '222222', istemciId: 'V', ad: 'V', surum: SURUM });
    await v.baglan(); m.hub.bosalt();
    expect(v.rol).toBe('izleyici');
    const redV = m.red(v);
    v.komutGonder({ type: 'end_turn', actorId: 'pc1' }); m.hub.bosalt();
    expect(redV).toEqual(['izleyici']);
    expect(m.yurutulen).toEqual([]);
  });
  it('yanıt sahipliği: başkasına sorulmuş zar ve tepki cevabı yok sayılır, sahibinin cevabı kabul edilir', async () => {
    const m = await masa();
    const z = m.host.zarIste('A', { sides: 20, count: 1, by: 'pc1' } as never);
    m.hub.bosalt();
    const bozuk = m.host.bozuk;
    m.b.zarCevap(z.istekId, [20]); m.hub.bosalt();
    expect(m.host.bozuk).toBe(bozuk + 1);
    expect(m.host.acikIstemler().map((i) => i.istekId)).toEqual([z.istekId]);
    m.a.zarCevap(z.istekId, [7]); m.hub.bosalt();
    await expect(z.sonuc).resolves.toEqual([7]);
    const tp = m.host.tepkiSor('B', { reactorId: 'pc2', options: [{ id: 'x' }], suggested: null } as never, 60_000);
    m.hub.bosalt();
    m.a.tepkiCevap(tp.istekId, { option: 'x' }); m.hub.bosalt();
    expect(m.host.acikIstemler()).toHaveLength(1);
    m.b.tepkiCevap(tp.istekId, { option: 'x' }); m.hub.bosalt();
    await expect(tp.sonuc).resolves.toEqual({ option: 'x' });
  });
});
