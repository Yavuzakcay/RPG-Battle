/**
 * Görev ODA-5 hazırlığı: aktarıcı hız sınırı (madde 7), Game Master katılım onayı (madde 7), Supabase yer tutucusu
 * (arayüz hazır, bağlanmaz) ve protokolün yeni mesajları.
 */
import { describe, it, expect } from 'vitest';
import { seeded } from '../sim/balance';
import { Aktarici, type AktariciSoket, type SunucuCercevesi } from './aktarici';
import { bellekHub } from './adapters/memory';
import { supabaseBaglantisi, supabaseHazir } from './adapters/supabase';
import { OdaHost, type HostOlayi } from './host';
import { OdaIstemci, type IstemciOlayi } from './client';
import { BaglantiHatasi } from './transport';
import { mesajMi, type SurumBilgisi } from './protocol';

const SURUM: SurumBilgisi = { protokol: 1, uygulama: 'o5', kuralSurumu: 108 };
const ODA = { ad: 'M', gmAdi: 'G', kurallarOzeti: [], hpGorunurluk: 'tam', zarModu: 'auto', yzKarakterler: [] };

function soket(id: string, kaynak?: string): AktariciSoket & { gelen: SunucuCercevesi[]; kapandi: boolean } {
  const s = { id, ...(kaynak ? { kaynak } : {}), gelen: [] as SunucuCercevesi[], kapandi: false, gonder(v: string) { s.gelen.push(JSON.parse(v) as SunucuCercevesi); }, kapat() { s.kapandi = true; } };
  return s;
}

describe('aktarıcı hız sınırı', () => {
  it('aynı kaynaktan dakikada en çok katilDk katılım denemesi; fazlası hiz + kapanış; bir dakika sonra açılır', () => {
    let t = 0;
    const ak = new Aktarici(undefined, { katilDk: 3, mesajSn: 60 }, () => t);
    const sonuc: string[] = [];
    for (let i = 0; i < 5; i++) {
      const s = soket(`s${i}`, '10.0.0.9');
      ak.baglandi(s);
      ak.mesaj(s, JSON.stringify({ k: 'katil', kod: '123456', uye: { istemciId: `x${i}`, rol: 'oyuncu' } }));
      sonuc.push(s.gelen[0]?.k ?? '');
    }
    expect(sonuc).toEqual(['oda_yok', 'oda_yok', 'oda_yok', 'hiz', 'hiz']);
    expect(ak.sayac.hiz).toBe(2);
    // Başka kaynak etkilenmez; host açılışı sınırsız.
    const b = soket('b', '10.0.0.10'); ak.baglandi(b);
    ak.mesaj(b, JSON.stringify({ k: 'katil', kod: '123456', uye: { istemciId: 'y', rol: 'oyuncu' } }));
    expect(b.gelen[0]?.k).toBe('oda_yok');
    t += 61_000;
    const c = soket('c', '10.0.0.9'); ak.baglandi(c);
    ak.mesaj(c, JSON.stringify({ k: 'katil', kod: '123456', uye: { istemciId: 'z', rol: 'oyuncu' } }));
    expect(c.gelen[0]?.k).toBe('oda_yok');
  });
  it('oyuncu bağlantısının mesaj kovası taşınca mesaj atılır; host sınırsız', () => {
    const t = 0;
    const ak = new Aktarici(undefined, { katilDk: 20, mesajSn: 2 }, () => t);
    const h = soket('h', 'gm'); ak.baglandi(h);
    ak.mesaj(h, JSON.stringify({ k: 'katil', kod: '123456', uye: { istemciId: 'gm', rol: 'host' } }));
    const o = soket('o', 'p'); ak.baglandi(o);
    ak.mesaj(o, JSON.stringify({ k: 'katil', kod: '123456', uye: { istemciId: 'A', rol: 'oyuncu' } }));
    // Kova 6: katil bir tane harcadı; 5 mesaj daha geçer, sonrakiler atılır.
    for (let i = 0; i < 9; i++) ak.mesaj(o, JSON.stringify({ k: 'z', m: { t: 'katil', istemciId: 'A', ad: 'A', ...SURUM } }));
    const hostaGelen = h.gelen.filter((f) => f.k === 'z').length;
    expect(hostaGelen).toBe(5);
    expect(ak.sayac.hiz).toBe(4);
    // Host'un yayını sınırsız (oyuncu aday olduğu için yalnız sayılır, iletilmez).
    const once = ak.sayac.hiz;
    for (let i = 0; i < 50; i++) ak.mesaj(h, JSON.stringify({ k: 'z', m: { t: 'ozet', donem: 0, seq: i, hash: 'x' } }));
    expect(ak.sayac.hiz).toBe(once);
  });
});

describe('katılım onayı (Game Master)', () => {
  it('açıkken yeni üye onay bekler; kabul → üye; ret → red{onay}; anahtarıyla dönen eski üye onaysız', async () => {
    const hub = bellekHub();
    const ol: HostOlayi[] = [];
    const host = new OdaHost({ transport: hub.baglanti(), kod: '444444', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA, katilimOnayi: true, olay: (o) => ol.push(o) });
    await host.baslat();
    const a = new OdaIstemci({ transport: hub.baglanti(), kod: '444444', istemciId: 'A', ad: 'Ada', surum: SURUM });
    const b = new OdaIstemci({ transport: hub.baglanti(), kod: '444444', istemciId: 'B', ad: 'Bora', surum: SURUM });
    const olA: IstemciOlayi['tur'][] = []; a.abone((o) => olA.push(o.tur));
    const redB: string[] = []; b.abone((o) => { if (o.tur === 'red') redB.push(o.neden); });
    await a.baglan(); await b.baglan(); hub.bosalt();
    expect(olA).toContain('onay_bekle');
    expect(a.rol).toBe(null);
    expect(host.katilimIstekleri()).toEqual([{ istemciId: 'A', ad: 'Ada' }, { istemciId: 'B', ad: 'Bora' }]);
    expect(ol.some((o) => o.tur === 'katilim')).toBe(true);
    host.katilimKarar('A', true); host.katilimKarar('B', false); hub.bosalt();
    expect(a.rol).toBe('oyuncu');
    expect(redB).toEqual(['onay']);
    expect([...host.uyeler.keys()]).toEqual(['A']);
    // Eski üye anahtarıyla döner: onay istenmez.
    hub.kopar('A'); hub.bosalt(); hub.bagla('A'); a.katilGonder(); hub.bosalt();
    expect(host.katilimIstekleri()).toEqual([]);
    expect(host.uyeler.get('A')?.bagli).toBe(true);
  });
  it('onay kapatılınca bekleyenler kabul edilir; varsayılan kapalı', async () => {
    const hub = bellekHub();
    const host = new OdaHost({ transport: hub.baglanti(), kod: '555555', hostId: 'gm', surum: SURUM, rng: seeded(1), oda: ODA });
    expect(host.katilimOnayi).toBe(false);
    await host.baslat();
    host.katilimOnayiAyarla(true);
    const a = new OdaIstemci({ transport: hub.baglanti(), kod: '555555', istemciId: 'A', ad: 'Ada', surum: SURUM });
    await a.baglan(); hub.bosalt();
    expect(a.rol).toBe(null);
    host.katilimOnayiAyarla(false); hub.bosalt();
    expect(a.rol).toBe('oyuncu');
  });
});

describe('Supabase yer tutucusu ve protokol', () => {
  it('arayüz hazır, bağlanmaz (katil → kapali); bu derlemede yok', async () => {
    const t = supabaseBaglantisi({ url: 'https://ornek.supabase.co', anonAnahtar: 'anon' });
    expect(t.tur).toBe('supabase');
    expect(supabaseHazir).toBe(false);
    await expect(t.katil('123456', { istemciId: 'x', rol: 'oyuncu' })).rejects.toBeInstanceOf(BaglantiHatasi);
    await expect(t.katil('123456', { istemciId: 'x', rol: 'oyuncu' })).rejects.toMatchObject({ neden: 'kapali' });
  });
  it('yeni mesajlar: onay_bekle, red{onay}, karakter_sonuc kimlikli, katil donemli, uye_durumu kararlı', () => {
    expect(mesajMi({ t: 'onay_bekle' })).toBe(true);
    expect(mesajMi({ t: 'red', neden: 'onay' })).toBe(true);
    expect(mesajMi({ t: 'karakter_sonuc', karakterId: 'k', durum: { hp: 3 }, kimlik: '1:2:k' })).toBe(true);
    expect(mesajMi({ t: 'karakter_sonuc', karakterId: 'k', durum: { hp: 3 } })).toBe(false);
    expect(mesajMi({ t: 'katil', istemciId: 'i', ad: 'A', sonSeq: 4, donem: 7, ...SURUM })).toBe(true);
    expect(mesajMi({ t: 'katil', istemciId: 'i', ad: 'A', donem: 1.5, ...SURUM })).toBe(false);
    expect(mesajMi({ t: 'uye_durumu', istemciId: 'i', bagli: false, karar: 'yz' })).toBe(true);
    expect(mesajMi({ t: 'uye_durumu', istemciId: 'i', bagli: false, karar: 'kral' })).toBe(false);
  });
});
