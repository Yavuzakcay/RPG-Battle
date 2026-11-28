/**
 * Görev ODA-4 (O4) test 6: kopma ve yeniden bağlanma (ODA-TASARIM.md §3 akışı). A savaş ortasında kopar; Game Master
 * "Yapay zekâ oynasın" der, host komut işlemeyi sürdürür (A'nın turlarını yapay zekâ oynar). A doğru anahtarla döner:
 * yalnız eksik olaylar gelir (tam anlık değil), durum eşit; karar sıra A'dan çıkınca kalkar. Yanlış anahtar reddedilir.
 * Host sayfası yenilenince oda aynı kodla, kayıtlı üyelerle dirilir (farklı dönem: tam anlık). Savaş sonu sonucu
 * (madde 8) sahibine gider; kopuksa döndüğünde.
 */
import { describe, it, expect } from 'vitest';
import { SCENARIOS, seeded } from '../sim/balance';
import { createMapBattle } from '../app/setup';
import { combatantFromMonster, combatantFromSheet, replay } from '../battle';
import type { BattleEvent } from '../battle/types';
import { chooseCommand } from '../battle/ai';
import { getMonster } from '../data';
import { dispatch, type Session } from '../ui/session';
import { autoplayPartyTurn } from '../ui/autoplay';
import { applyBattleResult } from '../app/partyStatus';
import { currentActorId } from '../battle/common';
import { demoCharacters } from '../screens/fixtures';
import { bellekHub, type BellekHub } from './adapters/memory';
import { OdaHost } from './host';
import { OdaIstemci, type IstemciOlayi } from './client';
import type { SurumBilgisi } from './protocol';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'o4-test', kuralSurumu: 108 };
const ODA = { ad: 'M', gmAdi: 'G', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] };
const [C1, C2] = demoCharacters() as [ReturnType<typeof demoCharacters>[number], ReturnType<typeof demoCharacters>[number]];

function savas(): Session {
  const sc = SCENARIOS.find((x) => x.id === 'volkan-ejder') as (typeof SCENARIOS)[number];
  const party = [combatantFromSheet(C1.sheet, { id: 'pc1', ownerId: C1.id }), combatantFromSheet(C2.sheet, { id: 'pc2', ownerId: C2.id })];
  const foes = Object.entries(sc.enemies).flatMap(([id, n]) => Array.from({ length: n }, (_, k) => combatantFromMonster(getMonster(id), { id: `${id}-${k}` })));
  const s = createMapBattle([...party, ...foes], { ...(sc.map as NonNullable<typeof sc.map>), mirrored: false }, seeded(3));
  return dispatch(s, { type: 'start_battle' }, seeded(4));
}

interface Masa { hub: BellekHub; host: OdaHost; a: OdaIstemci; b: OdaIstemci; olaylarA: IstemciOlayi[] }
const sonuc = (k: typeof C1, st: Parameters<typeof applyBattleResult>[1]) => applyBattleResult([k], st)[0]?.status ?? null;

async function masa(hub = bellekHub()): Promise<Masa> {
  const host = new OdaHost({ transport: hub.baglanti(), kod: '333333', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA, sonuc });
  await host.baslat();
  const a = new OdaIstemci({ transport: hub.baglanti(), kod: '333333', istemciId: 'A', ad: 'A', surum: SURUM, yeniBaglanti: () => hub.baglanti() });
  const b = new OdaIstemci({ transport: hub.baglanti(), kod: '333333', istemciId: 'B', ad: 'B', surum: SURUM });
  const olaylarA: IstemciOlayi[] = [];
  a.abone((o) => olaylarA.push(o));
  await a.baglan(); await b.baglan(); hub.bosalt();
  a.karakterGonder(C1); b.karakterGonder(C2); hub.bosalt();
  return { hub, host, a, b, olaylarA };
}

/** GM'in savaş ekranı: yapay zekâya verilmiş karakterin turu `autoplayPartyTurn`, ötekiler `chooseCommand`. */
function ilerle(m: Masa, s: Session, komut: number, rng = seeded(9)): Session {
  for (let i = 0; i < komut && s.state.status === 'active'; i++) {
    const sahip = s.state.combatants[currentActorId(s.state)]?.ownerId;
    if (sahip && m.host.yzKarakterler.has(sahip)) s = autoplayPartyTurn(s, rng);
    else {
      const cmd = chooseCommand(s.state);
      const next = dispatch(s, cmd, rng);
      s = next.error && 'actorId' in cmd ? dispatch(s, { type: 'end_turn', actorId: cmd.actorId }, rng) : next;
    }
    m.host.yayinla(s.events); m.hub.bosalt();
  }
  return s;
}

describe('oda O4: kopma ve yeniden bağlanma', () => {
  it('kopan oyuncu: GM "yapay zekâ" der, savaş sürer; dönünce yalnız eksik olaylar, durum eşit; karar kalkar', async () => {
    const m = await masa();
    let s = savas();
    m.host.yayinla(s.events); m.hub.bosalt();
    s = ilerle(m, s, 6);
    m.hub.kopar('A'); m.hub.bosalt();
    expect(m.host.uyeler.get('A')?.bagli).toBe(false);
    m.host.kararVer('A', 'yz'); m.hub.bosalt();
    expect(m.host.yzKarakterler.has(C1.id)).toBe(true);
    expect(m.b.oda?.uyeler.find((u) => u.istemciId === 'A')).toMatchObject({ bagli: false, karar: 'yz' });
    expect(m.b.oda?.yzKarakterler).toEqual([C1.id]);
    const once = m.a.sonrakiSeq;
    // A'nın turu en az bir kez gelsin diye yeterince komut.
    s = ilerle(m, s, 30);
    expect(m.host.seq).toBeGreaterThan(once);
    expect(s.events.some((e: BattleEvent) => 'actorId' in e && e.actorId === 'pc1' && m.host.seq > once)).toBe(true);
    const anlikOnce = m.a.sayac.anlik;
    m.hub.bagla('A');
    m.a.katilGonder(); m.hub.bosalt();
    expect(m.a.sayac.anlik).toBe(anlikOnce); // tam anlık değil: eksik olaylar
    expect(m.a.durum).toEqual(m.host.durum);
    expect(m.a.durum).toEqual(replay(m.host.olaylar as BattleEvent[]));
    // Sıra A'nın değilse karar hemen; A'nınsa sıra geçince kalkar.
    s = ilerle(m, s, 8);
    expect(m.host.uyeler.get('A')?.karar).toBeUndefined();
    expect(m.host.yzKarakterler.has(C1.id)).toBe(false);
  });
  it('"bekle" ve "GM oynasın" kararı oyuncu dönünce kalkar; yanlış anahtar reddedilir', async () => {
    const m = await masa();
    const s = savas();
    m.host.yayinla(s.events); m.hub.bosalt();
    m.hub.kopar('B'); m.hub.bosalt();
    m.host.kararVer('B', 'gm'); m.hub.bosalt();
    expect(m.a.oda?.uyeler.find((u) => u.istemciId === 'B')?.karar).toBe('gm');
    const sahte = new OdaIstemci({ transport: m.hub.baglanti(), kod: '333333', istemciId: 'B', ad: 'B', surum: SURUM, anahtar: 'yanlis' });
    const red: string[] = [];
    sahte.abone((o) => { if (o.tur === 'red') red.push(o.neden); });
    await sahte.baglan(); m.hub.bosalt();
    expect(red).toEqual(['anahtar']);
    m.hub.bagla('B'); m.b.katilGonder(); m.hub.bosalt();
    expect(m.host.uyeler.get('B')).toMatchObject({ bagli: true });
    expect(m.host.uyeler.get('B')?.karar).toBeUndefined();
  });
  it('host sayfası yenilenir: aynı kodla, kayıtlı üyelerle dirilir; istemciler kendiliğinden yeniden bağlanır (tam anlık)', async () => {
    const hub = bellekHub();
    const m = await masa(hub);
    let s = savas();
    m.host.yayinla(s.events); hub.bosalt();
    s = ilerle(m, s, 5);
    const uyeler = m.host.kayitliUyeler();
    expect(uyeler.map((u) => [u.istemciId, u.kopyalar.map((k) => k.id)])).toEqual([['A', [C1.id]], ['B', [C2.id]]]);
    await m.host.kapat('yenile');
    hub.bosalt();
    const host2 = new OdaHost({ transport: hub.baglanti(), kod: '333333', hostId: 'gm2', surum: SURUM, rng: seeded(2), oda: ODA, oncekiUyeler: uyeler, donemTabani: 1000 });
    await host2.baslat();
    expect(host2.uyeler.get('A')).toMatchObject({ bagli: false });
    host2.yayinla(s.events); hub.bosalt(); // GM'in savaş ekranı kayıttan
    const anlikOnce = m.a.sayac.anlik;
    expect(await m.a.yenidenBaglan()).toBe(true);
    hub.bosalt();
    expect(m.a.rol).toBe('oyuncu');
    expect(m.a.sayac.anlik).toBe(anlikOnce + 1);
    expect(m.a.durum).toEqual(host2.durum);
    expect(host2.uyeler.get('A')?.bagli).toBe(true);
  });
  it('madde 8: savaş bitince sonuç sahibine gider; kopuk üyeye döndüğünde', async () => {
    const m = await masa();
    const s = savas();
    m.host.yayinla(s.events); m.hub.bosalt();
    m.hub.kopar('B'); m.hub.bosalt();
    const sonuclarB: string[] = [];
    m.b.abone((o) => { if (o.tur === 'karakter_sonuc') sonuclarB.push(o.karakterId); });
    // Yapay bitiş: savaş olayı günlüğüne `battle_finished`.
    const bitti: BattleEvent[] = [...s.events, { type: 'battle_finished', winner: 'party' }];
    m.host.yayinla(bitti); m.hub.bosalt();
    expect(m.host.asama).toBe('bitti');
    const a = m.olaylarA.filter((o): o is Extract<IstemciOlayi, { tur: 'karakter_sonuc' }> => o.tur === 'karakter_sonuc');
    expect(a.map((x) => x.karakterId)).toEqual([C1.id]);
    expect(a[0]?.durum).toMatchObject({ hp: expect.any(Number) });
    expect(sonuclarB).toEqual([]);
    m.hub.bagla('B'); m.b.katilGonder(); m.hub.bosalt();
    expect(sonuclarB).toEqual([C2.id]);
    // İkinci kez gönderilmez.
    m.b.katilGonder(); m.hub.bosalt();
    expect(sonuclarB).toEqual([C2.id]);
  });
});
