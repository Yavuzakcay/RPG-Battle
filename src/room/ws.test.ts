/**
 * Görev ODA-2 (O2): gerçek `ws` aktarıcısı (localhost, rastgele port) + node `WebSocket` istemcileri. GM (host) +
 * iki oyuncu: oyuncular kendi karakterlerinin komutunu gönderir, GM düşmanları oynar; sonuç tek cihazla bire bir aynı.
 * Yetkisiz komut reddi, aynı kimlikle ikinci bağlantı (doğru anahtar değiştirir, yanlış reddedilir), kopup geri gelme,
 * uzak zar ve tepki istemleri.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { createServer, type Server } from 'node:http';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet, replay, type Command, type CommandContext } from '../battle';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { dispatch, GM_CONTEXT, type Session } from '../ui/session';
import { demoCharacters } from '../screens/fixtures';
import { odaAktarici, type NodeAktarici } from './aktariciNode';
import { agBaglantisi } from './adapters/websocket';
import { OdaHost, type UzakKomut } from './host';
import { OdaIstemci, type IstemciOlayi } from './client';
import type { SurumBilgisi } from './protocol';
import type { BaglantiDurumu, RoomTransport } from './transport';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'ws-test', kuralSurumu: 108 };
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function kadar(f: () => boolean, ms = 4000): Promise<void> {
  const son = Date.now() + ms;
  while (!f()) { if (Date.now() > son) throw new Error('zaman aşımı'); await bekle(5); }
}

let server: Server | null = null;
let aktarici: NodeAktarici | null = null;
let url = '';
const acik: RoomTransport[] = [];
const ag = () => { const t = agBaglantisi({ url }); acik.push(t); return t; };

async function sunucu(): Promise<void> {
  server = createServer((_q, r) => { r.statusCode = 404; r.end(); });
  aktarici = odaAktarici(server, { nabizMs: 60_000 });
  await new Promise<void>((r) => server!.listen(0, '127.0.0.1', () => r()));
  const adr = server.address();
  url = `ws://127.0.0.1:${typeof adr === 'object' && adr ? adr.port : 0}/oda`;
}

afterEach(async () => {
  await Promise.all(acik.splice(0).map((t) => t.ayril().catch(() => {})));
  await aktarici?.kapat();
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  server = null; aktarici = null;
});

const [C1, C2] = demoCharacters() as [ReturnType<typeof demoCharacters>[number], ReturnType<typeof demoCharacters>[number]];

/** GM'in savaş oturumu (pc1 = A'nın, pc2 = B'nin karakteri; ownerId = karakter kimliği). */
function kurulum(): Session {
  const sc = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
  const party = [combatantFromSheet(C1.sheet, { id: 'pc1', ownerId: C1.id }), combatantFromSheet(C2.sheet, { id: 'pc2', ownerId: C2.id })];
  const foes = Object.entries(sc.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
  return createMapBattle([...party, ...foes], { ...(sc.map as NonNullable<typeof sc.map>), mirrored: false }, seeded(3));
}

interface Masa { host: OdaHost; a: OdaIstemci; b: OdaIstemci; gm: { s: Session; calisan: Array<{ cmd: Command; ctx: CommandContext }> } }

/** Host + A + B; kopyalar gönderilmiş; GM savaş ekranı (yürütücü) host'a bağlı; savaş başlamış. */
async function masa(): Promise<Masa> {
  await sunucu();
  const host = new OdaHost({ transport: ag(), kod: '246810', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: { ad: 'Ağ', gmAdi: '', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] } });
  await host.baslat();
  const a = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'A', ad: 'Ada', surum: SURUM });
  const b = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'B', ad: 'Bora', surum: SURUM });
  await a.baglan(); await b.baglan();
  await kadar(() => a.rol === 'oyuncu' && b.rol === 'oyuncu');
  a.karakterGonder(C1); b.karakterGonder(C2);
  await kadar(() => host.kopyalar().length === 2);
  const rng = seeded(11);
  const gm = { s: kurulum(), calisan: [] as Array<{ cmd: Command; ctx: CommandContext }> };
  const calistir = (cmd: Command, ctx: CommandContext): string | null => {
    const n = dispatch(gm.s, cmd, rng, ctx);
    if (n.error) return n.error;
    gm.calisan.push({ cmd, ctx }); gm.s = n; host.yayinla(n.events);
    return null;
  };
  host.yurutucu = (k: UzakKomut) => host.komutSonucu(k.istemciId, k.istekId, calistir(k.cmd, k.ctx));
  host.yayinla(gm.s.events);
  calistir({ type: 'start_battle' }, GM_CONTEXT);
  await kadar(() => a.sonrakiSeq === gm.s.events.length && b.sonrakiSeq === gm.s.events.length);
  (masaGm as { calistir?: typeof calistir }).calistir = calistir;
  return { host, a, b, gm };
}
const masaGm: { calistir?: (cmd: Command, ctx: CommandContext) => string | null } = {};

const olaylar = (c: OdaIstemci) => { const l: IstemciOlayi[] = []; c.abone((o) => l.push(o)); return l; };

describe('oda O2: ws aktarıcısı, canlı savaş', () => {
  it('oyuncular kendi komutlarını gönderir: host ≡ A ≡ B ≡ replay ≡ tek cihaz', async () => {
    const m = await masa();
    const la = olaylar(m.a), lb = olaylar(m.b);
    const redler = (k: OdaIstemci) => (k === m.a ? la : lb).filter((o) => o.tur === 'komut_red');
    let uzak = 0;
    for (let i = 0; i < 80 && m.gm.s.state.status === 'active'; i++) {
      const st = m.gm.s.state;
      const actorId = st.order[st.turnIndex] as string;
      const c = st.combatants[actorId];
      const cmd = chooseCommand(st);
      const kim = c?.ownerId === C1.id ? m.a : c?.ownerId === C2.id ? m.b : null;
      if (!kim) {
        if (masaGm.calistir!(cmd, c?.side === 'party' ? { playerId: c.ownerId, isGm: false } : GM_CONTEXT) && 'actorId' in cmd) masaGm.calistir!({ type: 'end_turn', actorId: cmd.actorId }, GM_CONTEXT);
        continue;
      }
      uzak++;
      const once = m.gm.s.events.length;
      const reds = redler(kim).length;
      kim.komutGonder(cmd);
      await kadar(() => m.gm.s.events.length > once || redler(kim).length > reds);
      if (m.gm.s.events.length === once) {
        expect(redler(kim).at(-1)).toMatchObject({ tur: 'komut_red', neden: 'gecersiz' });
        if ('actorId' in cmd) { kim.komutGonder({ type: 'end_turn', actorId: cmd.actorId }); await kadar(() => m.gm.s.events.length > once); }
      }
    }
    const n = m.gm.s.events.length;
    await kadar(() => m.a.sonrakiSeq === n && m.b.sonrakiSeq === n);
    expect(uzak).toBeGreaterThan(5);
    expect(m.host.durum).toEqual(m.gm.s.state);
    expect(m.a.durum).toEqual(m.gm.s.state);
    expect(m.b.durum).toEqual(m.gm.s.state);
    expect(replay([...m.host.olaylar])).toEqual(m.gm.s.state);
    expect(m.a.olaylar).toEqual(m.gm.s.events);
    // Tek cihaz: aynı komutlar aynı bağlamla, aynı tohumla.
    const rng = seeded(11);
    let tek = kurulum();
    for (const k of m.gm.calisan) tek = dispatch(tek, k.cmd, rng, k.ctx);
    expect(tek.state).toEqual(m.gm.s.state);
    expect(tek.events).toEqual(m.gm.s.events);
  });

  it('yetkisiz komut reddedilir: başkasının karakteri, düşman, GM komutu, izleyici', async () => {
    const m = await masa();
    const la = olaylar(m.a);
    const seq = m.host.seq;
    m.a.komutGonder({ type: 'end_turn', actorId: 'pc2' });
    const dusman = Object.values(m.gm.s.state.combatants).find((c) => c.side === 'enemies')!;
    m.a.komutGonder({ type: 'end_turn', actorId: dusman.id });
    m.a.komutGonder({ type: 'set_exhaustion', targetId: 'pc1', level: 3 } as Command);
    m.a.komutGonder({ type: 'start_battle' });
    await kadar(() => la.filter((o) => o.tur === 'komut_red').length === 4);
    expect(la.filter((o) => o.tur === 'komut_red').map((o) => (o as { neden: string }).neden)).toEqual(['yetki', 'yetki', 'yetki', 'yetki']);
    // Savaş sürerken katılan izleyici komut gönderemez.
    const c = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'C', ad: 'Cem', surum: SURUM });
    const lc = olaylar(c);
    await c.baglan();
    await kadar(() => c.rol === 'izleyici' && !!c.durum);
    c.komutGonder({ type: 'end_turn', actorId: 'pc1' });
    await kadar(() => lc.some((o) => o.tur === 'komut_red'));
    expect((lc.find((o) => o.tur === 'komut_red') as { neden: string }).neden).toBe('izleyici');
    expect(m.host.seq).toBe(seq);
    expect(m.gm.calisan.length).toBe(1); // yalnız start_battle
  });

  it('aynı kimlikle ikinci bağlantı: doğru anahtar eskinin yerini alır, yanlış anahtar reddedilir', async () => {
    const m = await masa();
    const anahtar = m.a.anahtar as string;
    // Yanlış anahtar: reddedilir, A çalışmaya devam eder.
    const sahte = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'A', ad: 'X', surum: SURUM, anahtar: 'f'.repeat(32) });
    const ls = olaylar(sahte);
    await sahte.baglan();
    await kadar(() => ls.some((o) => o.tur === 'red'));
    expect(ls.filter((o) => o.tur === 'red').map((o) => (o as { neden: string }).neden)).toEqual(['anahtar']);
    expect(sahte.durum).toBe(null);
    expect(aktarici!.core.uyeler('246810').sort()).toEqual(['A', 'B']);
    // Doğru anahtar: yeni bağlantı A'nın yerine geçer, eski bağlantı "değişti" ile düşer.
    const eskiDurum: BaglantiDurumu[] = [];
    (m.a as unknown as { s: { transport: RoomTransport } }).s.transport.durum((d) => eskiDurum.push(d));
    const yeni = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'A', ad: 'Ada', surum: SURUM, anahtar });
    await yeni.baglan();
    await kadar(() => yeni.rol === 'oyuncu' && !!yeni.durum);
    await kadar(() => eskiDurum.some((d) => d.tur === 'koptu'));
    expect(eskiDurum.find((d) => d.tur === 'koptu')).toEqual({ tur: 'koptu', neden: 'degisti' });
    expect(m.host.uyeler.get('A')?.bagli).toBe(true);
    // Yeni bağlantı A'nın karakterini oynar; eski bağlantı artık yayın almaz.
    const eskiSeq = m.a.sonrakiSeq;
    const once = m.gm.s.events.length;
    const actor = m.gm.s.state.order[m.gm.s.state.turnIndex] as string;
    if (m.gm.s.state.combatants[actor]?.ownerId === C1.id) { yeni.komutGonder({ type: 'end_turn', actorId: actor }); }
    else masaGm.calistir!({ type: 'end_turn', actorId: actor }, m.gm.s.state.combatants[actor]?.side === 'enemies' ? GM_CONTEXT : { playerId: m.gm.s.state.combatants[actor]?.ownerId ?? null, isGm: false });
    await kadar(() => m.gm.s.events.length > once && yeni.sonrakiSeq === m.gm.s.events.length);
    await bekle(50);
    expect(m.a.sonrakiSeq).toBe(eskiSeq);
    expect(yeni.durum).toEqual(m.gm.s.state);
  });

  it('Görev ODA-4: aynı bağlantıda yeniden giriş yalnız eksik olayları alır; host yenilenince aynı kodla dirilir, istemci yeniden bağlanır', async () => {
    const m = await masa();
    const yeniA = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'A2', ad: 'Ada', surum: SURUM, yeniBaglanti: ag });
    await yeniA.baglan();
    await kadar(() => yeniA.sonrakiSeq === m.gm.s.events.length);
    const anlik = yeniA.sayac.anlik;
    // Kopma: host günlüğü ilerler; aynı dönemde yeniden giriş → eksik olaylar (tam anlık değil).
    await (yeniA as unknown as { s: { transport: RoomTransport } }).s.transport.ayril();
    await kadar(() => m.host.uyeler.get('A2')?.bagli === false);
    const st = m.gm.s.state;
    const c = st.combatants[st.order[st.turnIndex] as string];
    masaGm.calistir?.({ type: 'end_turn', actorId: c?.id ?? '' }, c?.side === 'party' ? { playerId: c.ownerId, isGm: false } : GM_CONTEXT);
    expect(await yeniA.yenidenBaglan()).toBe(true);
    await kadar(() => yeniA.sonrakiSeq === m.gm.s.events.length);
    expect(yeniA.sayac.anlik).toBe(anlik);
    expect(yeniA.durum).toEqual(m.gm.s.state);
    // Host sayfası yenilendi: oda kapanır (aktarıcı istemcileri düşürür), aynı kodla kayıtlı üyelerle geri açılır.
    const uyeler = m.host.kayitliUyeler();
    await (m.host as unknown as { s: { transport: RoomTransport } }).s.transport.ayril();
    await bekle(50);
    expect(await yeniA.yenidenBaglan()).toBe(false); // host henüz yok
    const host2 = new OdaHost({ transport: ag(), kod: '246810', hostId: 'gm2', surum: SURUM, rng: seeded(2), oda: { ad: 'Ağ', gmAdi: '', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] }, oncekiUyeler: uyeler, donemTabani: 500 });
    await host2.baslat();
    host2.yayinla(m.gm.s.events);
    expect(await yeniA.yenidenBaglan()).toBe(true);
    await kadar(() => yeniA.donem === 501 && yeniA.sonrakiSeq === m.gm.s.events.length);
    expect(yeniA.sayac.anlik).toBe(anlik + 1);
    expect(host2.uyeler.get('A2')?.bagli).toBe(true);
    expect(yeniA.durum).toEqual(m.gm.s.state);
  });
  it('kopup geri gelen oyuncu (aynı anahtar) eşitlenir; kopukken host onu kopuk görür', async () => {
    const m = await masa();
    const anahtar = m.b.anahtar as string;
    await (m.b as unknown as { s: { transport: RoomTransport } }).s.transport.ayril();
    await kadar(() => m.host.uyeler.get('B')?.bagli === false);
    expect(m.a.oda?.uyeler.find((u) => u.istemciId === 'B')?.bagli).toBe(false);
    const rng = seeded(5);
    for (let i = 0; i < 12 && m.gm.s.state.status === 'active'; i++) {
      const st = m.gm.s.state;
      const c = st.combatants[st.order[st.turnIndex] as string];
      const ctx = c?.side === 'party' ? { playerId: c.ownerId, isGm: false } : GM_CONTEXT;
      const n = dispatch(m.gm.s, chooseCommand(st), rng, ctx);
      m.gm.s = n.error ? dispatch(m.gm.s, { type: 'end_turn', actorId: c?.id ?? '' }, rng, ctx) : n;
      m.host.yayinla(m.gm.s.events);
    }
    const geri = new OdaIstemci({ transport: ag(), kod: '246810', istemciId: 'B', ad: 'Bora', surum: SURUM, anahtar });
    await geri.baglan();
    await kadar(() => geri.sonrakiSeq === m.gm.s.events.length);
    expect(m.host.uyeler.get('B')?.bagli).toBe(true);
    expect(geri.durum).toEqual(m.gm.s.state);
    expect(m.host.kopyalar().map((x) => x.istemciId).sort()).toEqual(['A', 'B']);
  });

  it('uzak zar ve tepki istemleri: sahibine gider, cevap döner; GM kapatabilir; tepki süre dolunca öneri', async () => {
    const m = await masa();
    const la = olaylar(m.a), lb = olaylar(m.b);
    expect(m.host.sahibi(C1.id)).toBe('A');
    expect(m.host.sahibi('yok')).toBe(null);
    const z = m.host.zarIste('A', { sides: 20, count: 1, by: 'pc1', kind: 'attack' } as never);
    await kadar(() => la.some((o) => o.tur === 'zar_iste'));
    expect(lb.some((o) => o.tur === 'zar_iste')).toBe(false);
    await kadar(() => lb.some((o) => o.tur === 'bekleniyor'));
    const istem = la.find((o) => o.tur === 'zar_iste') as { istekId: string };
    m.b.zarCevap(istem.istekId, [20]); // başkasının cevabı yok sayılır
    m.a.zarCevap(istem.istekId, [17]);
    expect(await z.sonuc).toEqual([17]);
    // GM kapatır: oyuncunun istemi kalkar, sonuç otomatik (null).
    const z2 = m.host.zarIste('A', { sides: 6, count: 2, by: 'pc1' } as never);
    await kadar(() => la.filter((o) => o.tur === 'zar_iste').length === 2);
    m.host.istemKapat(z2.istekId);
    expect(await z2.sonuc).toBe(null);
    await kadar(() => la.some((o) => o.tur === 'istem_iptal'));
    // Tepki: cevap gelmezse süre dolunca öneri.
    const oneri = { option: 'shield' };
    const t = m.host.tepkiSor('B', { reactorId: 'pc2', trigger: 'hit', options: [{ id: 'shield', label: 'Shield' }], suggested: oneri } as never, 60);
    await kadar(() => lb.some((o) => o.tur === 'tepki_sor'));
    expect(await t.sonuc).toEqual(oneri);
    const t2 = m.host.tepkiSor('B', { reactorId: 'pc2', trigger: 'hit', options: [{ id: 'shield', label: 'Shield' }], suggested: oneri } as never, 5000);
    await kadar(() => lb.filter((o) => o.tur === 'tepki_sor').length === 2);
    m.b.tepkiCevap(t2.istekId, null);
    expect(await t2.sonuc).toBe(null);
    expect(m.host.acikIstemler()).toEqual([]);
  });
});
