/**
 * Görev ODA-1 (O1): bellek içi hub + host + iki sanal istemci (ODA-TASARIM.md §6 testleri 2 (izleme), 5, 7, 8 ve
 * katılım: oturum anahtarı, sürüm el sıkışması, karakter kopyası).
 */
import { describe, it, expect } from 'vitest';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet, replay } from '../battle';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { DEMO_SHEETS } from '../demo';
import { dispatch, type Session } from '../ui/session';
import { demoCharacters } from '../screens/fixtures';
import { bellekHub, type BellekHub } from './adapters/memory';
import { OdaHost, type OdaBilgisi } from './host';
import { OdaIstemci } from './client';
import { BaglantiHatasi } from './transport';
import type { SurumBilgisi } from './protocol';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'test-build', kuralSurumu: 108, icerik: 'yok' };
const ODA: OdaBilgisi = { ad: 'Masa', gmAdi: 'Ayşe', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] };

/** Yapay zekâyla oynanan savaş: her komuttan sonra `adim(oturum)` çağrılır (GM'in savaş ekranı). */
function oyna(adim: (s: Session) => void, komut = 60, tohum = 7): Session {
  const sc = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
  const party = Object.values(DEMO_SHEETS).map((sheet, i) => combatantFromSheet(sheet, { id: `pc${i}`, ownerId: `p${i}` }));
  const foes = Object.entries(sc.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
  const rng = seeded(tohum);
  let s = createMapBattle([...party, ...foes], { ...(sc.map as NonNullable<typeof sc.map>), mirrored: false }, rng);
  adim(s);
  s = dispatch(s, { type: 'start_battle' }, rng);
  adim(s);
  for (let i = 0; i < komut && s.state.status === 'active'; i++) {
    const cmd = chooseCommand(s.state);
    const next = dispatch(s, cmd, rng);
    s = next.error && 'actorId' in cmd ? dispatch(s, { type: 'end_turn', actorId: cmd.actorId }, rng) : next;
    adim(s);
  }
  return s;
}

interface Masa { hub: BellekHub; host: OdaHost; a: OdaIstemci; b: OdaIstemci }

async function masa(opts: Partial<ConstructorParameters<typeof OdaHost>[0]> = {}): Promise<Masa> {
  const hub = bellekHub();
  const host = new OdaHost({ transport: hub.baglanti(), kod: '123456', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA, ...opts });
  await host.baslat();
  const a = new OdaIstemci({ transport: hub.baglanti(), kod: '123456', istemciId: 'A', ad: 'Ada', surum: SURUM });
  const b = new OdaIstemci({ transport: hub.baglanti(), kod: '123456', istemciId: 'B', ad: 'Bora', surum: SURUM });
  await a.baglan(); await b.baglan();
  hub.bosalt();
  return { hub, host, a, b };
}

const yayinci = (m: Masa) => (s: Session) => { m.host.yayinla(s.events); m.hub.bosalt(); };

describe('oda: katılım', () => {
  it('kabul: anahtar verilir, üyeler oda_durumu ile görünür', async () => {
    const m = await masa();
    expect(m.a.anahtar).toMatch(/^[0-9a-f]{32}$/);
    expect(m.b.anahtar).not.toBe(m.a.anahtar);
    expect(m.a.rol).toBe('oyuncu');
    expect(m.b.oda?.uyeler.map((u) => u.istemciId)).toEqual(['A', 'B']);
    expect(m.a.oda?.ad).toBe('Masa');
    expect(m.host.asama).toBe('lobi');
  });
  it('oda yoksa bağlanılamaz; aynı koda ikinci host alınamaz', async () => {
    const hub = bellekHub();
    const c = new OdaIstemci({ transport: hub.baglanti(), kod: '999999', istemciId: 'X', ad: 'X', surum: SURUM });
    await expect(c.baglan()).rejects.toBeInstanceOf(BaglantiHatasi);
    const h1 = new OdaHost({ transport: hub.baglanti(), kod: '555555', hostId: 'g1', surum: SURUM, rng: seeded(1), oda: ODA });
    await h1.baslat();
    const h2 = new OdaHost({ transport: hub.baglanti(), kod: '555555', hostId: 'g2', surum: SURUM, rng: seeded(1), oda: ODA });
    await expect(h2.baslat()).rejects.toMatchObject({ neden: 'kod_dolu' });
  });
  it('yanlış anahtarla (ya da anahtarsız) yeniden katılma reddedilir; doğru anahtarla kabul', async () => {
    const m = await masa();
    const dogru = m.a.anahtar as string;
    const reds: string[] = [];
    for (const anahtar of ['0'.repeat(32), undefined]) {
      const sahte = new OdaIstemci({ transport: m.hub.baglanti(), kod: '123456', istemciId: 'A', ad: 'Sahte', surum: SURUM, ...(anahtar ? { anahtar } : {}) });
      sahte.abone((o) => { if (o.tur === 'red') reds.push(o.neden); });
      await sahte.baglan();
      m.hub.bosalt();
      expect(sahte.rol).toBe(null);
      expect(sahte.anahtar).toBe(anahtar);
    }
    expect(reds).toEqual(['anahtar', 'anahtar']);
    expect(m.host.uyeler.get('A')?.ad).toBe('Ada');
    const geri = new OdaIstemci({ transport: m.hub.baglanti(), kod: '123456', istemciId: 'A', ad: 'Ada', surum: SURUM, anahtar: dogru });
    await geri.baglan();
    m.hub.bosalt();
    expect(geri.rol).toBe('oyuncu');
    expect(geri.anahtar).toBe(dogru);
  });
  it('sürüm uyuşmazlığı (build, kural sürümü, içerik, protokol) reddedilir', async () => {
    const m = await masa();
    for (const [alan, deger] of [['uygulama', 'baska-build'], ['kuralSurumu', 107], ['icerik', 'farkli'], ['protokol', 2]] as const) {
      const c = new OdaIstemci({ transport: m.hub.baglanti(), kod: '123456', istemciId: `V-${alan}`, ad: 'V', surum: { ...SURUM, [alan]: deger } });
      const red: string[] = [];
      c.abone((o) => { if (o.tur === 'red') red.push(`${o.neden}:${o.ayrinti}`); });
      await c.baglan();
      m.hub.bosalt();
      expect(red).toEqual([`surum:${alan}`]);
      expect(m.host.uyeler.has(`V-${alan}`)).toBe(false);
    }
  });
  it('karakter kopyası gönder/geri al; savaşta kilitli; doğrulama kancası', async () => {
    const [c1, c2] = demoCharacters();
    const m = await masa({ karakterKabul: (_i, k) => (k.id === c2?.id ? { neden: 'dolu' } : null) });
    const red: string[] = [];
    m.a.abone((o) => { if (o.tur === 'karakter_red') red.push(o.neden); });
    m.a.karakterGonder(c1!); m.a.karakterGonder(c2!);
    m.hub.bosalt();
    expect(m.host.kopyalar().map((x) => [x.istemciId, x.kopya.id])).toEqual([['A', c1!.id]]);
    expect(m.b.oda?.uyeler.find((u) => u.istemciId === 'A')?.karakterler).toEqual([c1!.id]);
    expect(red).toEqual(['dolu']);
    // B aynı kimliği gönderemez.
    m.b.karakterGonder(c1!); m.hub.bosalt();
    expect(m.host.kopyalar()).toHaveLength(1);
    m.a.karakterGeriAl(c1!.id); m.hub.bosalt();
    expect(m.host.kopyalar()).toEqual([]);
    oyna(yayinci(m), 2);
    m.a.karakterGonder(c1!); m.hub.bosalt();
    expect(red).toEqual(['dolu', 'kilitli']);
  });
  it('O1 salt izleme: komut geri çevrilir, olay üretilmez', async () => {
    const m = await masa();
    oyna(yayinci(m), 1);
    const seq = m.host.seq;
    m.hub.baglanti(); // gürültü
    const t = (m.a as unknown as { s: { transport: { gonder: (x: unknown) => void } } }).s.transport;
    t.gonder({ t: 'komut', istekId: 'r1', cmd: { type: 'end_turn', actorId: 'pc0' }, tabanSeq: seq });
    m.hub.bosalt();
    expect(m.host.seq).toBe(seq);
  });
});

describe('oda: izleme eşitlemesi (bire bir replay)', () => {
  it('GM komutları → host ≡ tek cihaz ≡ A ≡ B ≡ replay(host günlüğü)', async () => {
    const m = await masa();
    let olaySayisi = 0;
    m.a.abone((o) => { if (o.tur === 'savas') olaySayisi++; });
    const son = oyna(yayinci(m));
    expect(son.state.round).toBeGreaterThan(1);
    expect(m.host.olaylar).toEqual(son.events);
    expect(m.host.durum).toEqual(son.state);
    expect(replay([...m.host.olaylar])).toEqual(son.state);
    expect(m.a.durum).toEqual(son.state);
    expect(m.b.durum).toEqual(m.a.durum);
    expect(m.a.olaylar).toEqual(son.events);
    expect(m.b.olaylar).toEqual(son.events);
    expect(m.a.sonrakiSeq).toBe(son.events.length);
    expect(olaySayisi).toBeGreaterThan(10);
    expect(m.a.sayac).toMatchObject({ bozuk: 0, ozetTutmadi: 0, bosluk: 0 });
    // Aynı komutlar, aynı tohum: ikinci oynatma bire bir aynı günlük.
    expect(oyna(() => {}).events).toEqual(son.events);
  });
  it('yeni savaş (farklı günlük) dönemi artırır, herkes tam anlık alır', async () => {
    const m = await masa();
    oyna(yayinci(m), 20, 7);
    const ikinci = oyna(yayinci(m), 20, 11);
    expect(m.a.durum).toEqual(ikinci.state);
    expect(m.a.olaylar).toEqual(ikinci.events);
    expect(m.a.donem).toBe(2);
  });
});

describe('oda: ağ hataları, geç katılan, özet', () => {
  it('düşen yayın: boşluk fark edilir, yakala ile tamamlanır; son yayın düşerse özet kurtarır', async () => {
    const m = await masa();
    let n = 0;
    m.hub.hata.dusur = (z) => z.kimden === 'gm' && z.m.t === 'olaylar' && !z.kime && (++n === 3 || n === 9);
    const son = oyna(yayinci(m), 40);
    m.host.ozetGonder(); m.hub.bosalt();
    expect(m.a.sayac.bosluk).toBeGreaterThan(0);
    expect(m.a.durum).toEqual(son.state);
    expect(m.b.durum).toEqual(son.state);
    // Son yayını düşür: özet geride kaldığını söyler.
    m.hub.hata.dusur = (z) => z.m.t === 'olaylar' && !z.kime;
    const devam = dispatch(son, chooseCommand(son.state), seeded(5));
    m.host.yayinla(devam.events); m.hub.bosalt();
    expect(m.a.sonrakiSeq).toBeLessThan(devam.events.length);
    m.hub.hata.dusur = undefined;
    m.host.ozetGonder(); m.hub.bosalt();
    expect(m.a.durum).toEqual(devam.state);
  });
  it('çoğaltılan ve geciken mesajlar: yinelenen atlanır, sıra bozulsa da durum aynı', async () => {
    const m = await masa();
    let n = 0;
    m.hub.hata.cogalt = (z) => z.m.t === 'olaylar' && n++ % 2 === 0;
    let g = 0;
    m.hub.hata.geciktir = (z) => z.m.t === 'olaylar' && !z.kime && g++ % 5 === 1;
    const s0 = oyna(() => {}, 0);
    m.host.yayinla(s0.events);
    // Birkaç komutu tek boşaltmada teslim et (gecikme sırayı bozar).
    const rng = seeded(9);
    let s = dispatch(s0, { type: 'start_battle' }, rng);
    for (let i = 0; i < 30 && s.state.status === 'active'; i++) {
      const cmd = chooseCommand(s.state);
      const next = dispatch(s, cmd, rng);
      s = next.error && 'actorId' in cmd ? dispatch(s, { type: 'end_turn', actorId: cmd.actorId }, rng) : next;
      m.host.yayinla(s.events);
      if (i % 4 === 3) m.hub.bosalt();
    }
    m.hub.bosalt();
    m.host.ozetGonder(); m.hub.bosalt();
    expect(m.a.sayac.yinelenen).toBeGreaterThan(0);
    expect(m.a.durum).toEqual(s.state);
    expect(m.b.durum).toEqual(s.state);
    expect(m.a.olaylar).toEqual(s.events);
  });
  it('geç katılan izleyici anlık ile kurar (tam günlük ve durum tabanı)', async () => {
    for (const anlikEsik of [undefined, 1]) {
      const m = await masa({ ...(anlikEsik ? { anlikEsik, tabanAraligi: 25 } : {}) });
      const son = oyna(yayinci(m));
      expect(son.events.length).toBeGreaterThan(30);
      const c = new OdaIstemci({ transport: m.hub.baglanti(), kod: '123456', istemciId: 'C', ad: 'Cem', surum: SURUM });
      await c.baglan(); m.hub.bosalt();
      expect(c.rol).toBe(son.state.status === 'active' ? 'izleyici' : 'oyuncu');
      expect(c.durum).toEqual(son.state);
      expect(c.sonrakiSeq).toBe(son.events.length);
      if (anlikEsik) { expect(c.taban).toBeGreaterThan(0); expect(c.olaylar.length).toBeLessThan(son.events.length); } else expect(c.olaylar).toEqual(son.events);
      const devam = dispatch(son, son.state.status === 'active' ? chooseCommand(son.state) : { type: 'start_battle' }, seeded(2));
      m.host.yayinla(devam.events); m.hub.bosalt();
      expect(c.durum).toEqual(devam.error ? son.state : devam.state);
    }
  });
  it('bozulan istemci durumu özet tutmazlığıyla fark edilir, tam anlıkla düzelir', async () => {
    const m = await masa();
    const son = oyna(yayinci(m), 20);
    m.a.durum = { ...(m.a.durum as NonNullable<typeof m.a.durum>), round: 99 };
    const uyari: string[] = [];
    (m.a as unknown as { s: { uyar: (x: string) => void } }).s.uyar = (x) => uyari.push(x);
    m.host.ozetGonder(); m.hub.bosalt();
    expect(m.a.sayac.ozetTutmadi).toBe(1);
    expect(uyari).toHaveLength(1);
    expect(m.a.durum).toEqual(son.state);
    expect(m.b.sayac.ozetTutmadi).toBe(0);
  });
  it('kopan istemci host\'ta kopuk görünür; döndüğünde (aynı anahtar) eşitlenir', async () => {
    const m = await masa();
    const s1 = oyna(yayinci(m), 10);
    m.hub.kopar('B'); m.hub.bosalt();
    expect(m.host.uyeler.get('B')?.bagli).toBe(false);
    expect(m.a.oda?.uyeler.find((u) => u.istemciId === 'B')?.bagli).toBe(false);
    const rng = seeded(4);
    let s = s1;
    for (let i = 0; i < 10 && s.state.status === 'active'; i++) { s = dispatch(s, chooseCommand(s.state), rng); m.host.yayinla(s.events); m.hub.bosalt(); }
    m.hub.bagla('B');
    m.b.katilGonder(); m.hub.bosalt();
    expect(m.host.uyeler.get('B')?.bagli).toBe(true);
    expect(m.b.durum).toEqual(s.state);
  });
});

describe('oda: günlük boyutu ölçümü', () => {
  it('60 komutluk savaşın günlüğü 2 MB eşiğinin çok altında', async () => {
    const m = await masa();
    const son = oyna(yayinci(m), 60);
    const bayt = m.host.gunlukBoyutu();
    const komut = son.events.length;
    // Ölçüm (DECISIONS ODA-1): bayt/olay; eşik 2 MB ≈ uzun savaş.
    console.info(`oda günlük ölçümü: ${komut} olay, ${(bayt / 1000).toFixed(1)} kB (${(bayt / komut / 1000).toFixed(2)} kB/olay; battle_started ${(JSON.stringify(son.events[0]).length / 1000).toFixed(1)} kB)`);
    expect(bayt).toBeLessThan(2_000_000);
  });
});
