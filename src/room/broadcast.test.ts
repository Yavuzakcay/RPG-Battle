/**
 * Görev ODA-1 (O1) test 10 (sekme): node 22'de `BroadcastChannel` global; aynı süreçteki iki örnek iki sekme gibi
 * davranır. Host kodu sahiplenir, oyuncu kodla bulur, olaylar ve anahtar akar; kod çakışması ve olmayan oda.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { sekmeBaglantisi } from './adapters/broadcast';
import { OdaHost, type OdaBilgisi } from './host';
import { OdaIstemci } from './client';
import { seeded } from '../sim/balance';
import { createDemoSession } from '../demo';
import { dispatch } from '../ui/session';
import { chooseCommand } from '../battle/ai';
import type { SurumBilgisi } from './protocol';
import type { RoomTransport } from './transport';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'b', kuralSurumu: 108, icerik: 'yok' };
const ODA: OdaBilgisi = { ad: 'Sekme', gmAdi: '', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] };
const HIZLI = { sahiplenmeMs: 40, bulmaMs: 200, nabizMs: 30, kopmaMs: 150 };
const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function kadar(f: () => boolean, ms = 2000): Promise<void> {
  const son = Date.now() + ms;
  while (!f()) { if (Date.now() > son) throw new Error('zaman aşımı'); await bekle(10); }
}

const acik: RoomTransport[] = [];
const yeni = () => { const t = sekmeBaglantisi(HIZLI); acik.push(t); return t; };
afterEach(async () => { await Promise.all(acik.splice(0).map((t) => t.ayril())); });

describe('sekme bağdaştırıcısı (BroadcastChannel)', () => {
  it('host kodu sahiplenir, oyuncu katılır, olaylar akar; ikinci host ve olmayan oda reddedilir', async () => {
    const host = new OdaHost({ transport: yeni(), kod: '424242', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA });
    await host.baslat();
    const rakip = new OdaHost({ transport: yeni(), kod: '424242', hostId: 'gm2', surum: SURUM, rng: seeded(1), oda: ODA });
    await expect(rakip.baslat()).rejects.toMatchObject({ neden: 'kod_dolu' });
    const yok = new OdaIstemci({ transport: yeni(), kod: '111111', istemciId: 'Y', ad: 'Y', surum: SURUM });
    await expect(yok.baglan()).rejects.toMatchObject({ neden: 'oda_yok' });

    const a = new OdaIstemci({ transport: yeni(), kod: '424242', istemciId: 'A', ad: 'Ada', surum: SURUM });
    await a.baglan();
    await kadar(() => a.rol === 'oyuncu');
    expect(a.anahtar).toMatch(/^[0-9a-f]{32}$/);
    await kadar(() => a.oda?.uyeler.length === 1);

    const rng = seeded(3);
    let s = createDemoSession(rng);
    host.yayinla(s.events);
    for (let i = 0; i < 12 && s.state.status === 'active'; i++) { s = dispatch(s, chooseCommand(s.state), rng); host.yayinla(s.events); }
    await kadar(() => a.sonrakiSeq === s.events.length);
    expect(a.durum).toEqual(s.state);

    // Yanlış anahtar: aynı kimlikle başka sekme.
    const sahte = new OdaIstemci({ transport: yeni(), kod: '424242', istemciId: 'A', ad: 'X', surum: SURUM, anahtar: 'f'.repeat(32) });
    const red: string[] = [];
    sahte.abone((o) => { if (o.tur === 'red') red.push(o.neden); });
    await sahte.baglan();
    await kadar(() => red.length > 0);
    expect(red).toEqual(['anahtar']);
  });
  it('kapanan sekme (gitti) host\'ta kopuk görünür; nabızsız sekme zaman aşımıyla düşer', async () => {
    const host = new OdaHost({ transport: yeni(), kod: '515151', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA });
    await host.baslat();
    const a = new OdaIstemci({ transport: yeni(), kod: '515151', istemciId: 'A', ad: 'Ada', surum: SURUM });
    await a.baglan();
    await kadar(() => host.uyeler.get('A')?.bagli === true);
    await a.ayril();
    await kadar(() => !host.uyeler.has('A'));
    // Sessizce ölen sekme: kanal kapanır, `gitti` gönderilmez; nabız kesilince host kopuk sayar.
    let kanal: BroadcastChannel | null = null;
    const tb = sekmeBaglantisi({ ...HIZLI, kanal: (ad) => (kanal = new BroadcastChannel(ad)) as never });
    acik.push(tb);
    const b = new OdaIstemci({ transport: tb, kod: '515151', istemciId: 'B', ad: 'Bora', surum: SURUM });
    await b.baglan();
    await kadar(() => host.uyeler.get('B')?.bagli === true);
    (kanal as BroadcastChannel | null)?.close();
    await kadar(() => host.uyeler.get('B')?.bagli === false);
  });
});
