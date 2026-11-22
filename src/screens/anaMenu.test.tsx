/**
 * ANA-MENU-SADELESTIR: ana menü düzenlemeleri. Hızlı savaş kartı yok (Oda kur kapsıyor; odasız kayıtlı savaş Oda kur'dan
 * açılır), "Oyuncu" → "Karakterlerim", Odaya katıl kendi simgesiyle, Serüven `seruvenMenu` bayrağıyla (varsayılan gizli),
 * sol açıklama kutusu yok, sürüm/SRD satırı kalır.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Home } from './Screens';
import { OdaKur } from './OdaScreens';
import { seruvenMenuEnabled, setSeruvenMenuEnabled } from '../app/features';
import { SAVE_KEY } from '../app/saveKey';
import { lockRoom, saveRooms } from '../oda/store';
import { newRoom } from '../oda/model';
import { setRoomOverlay } from '../oda/active';
import { t } from '../i18n';

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });
afterEach(() => { setRoomOverlay(null); });

const menu = () => renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onRoomCreate={() => {}} onRoomJoin={() => {}} onSeruven={() => {}} onSettings={() => {}} onDex={() => {}} />);

describe('ANA-MENU-SADELESTIR ana menü', () => {
  it('Serüven gizli (varsayılan): kart, sınıf ve metin yok; diğer kartlar yerinde', () => {
    expect(seruvenMenuEnabled()).toBe(false);
    const html = menu();
    expect(html).not.toContain('seruven');
    expect(html).not.toContain('Serüven');
    for (const s of ['Karakterlerim', 'Oda kur', 'Odaya katıl', 'Dungeondex', 'Ayarlar']) expect(html).toContain(s);
  });
  it('Serüven açık (Ayarlar ▸ Geliştirici): kart görünür', () => {
    setSeruvenMenuEnabled(true);
    expect(seruvenMenuEnabled()).toBe(true);
    const html = menu();
    expect(html).toContain('home-card journey seruven');
    expect(html).toContain('Serüven');
    setSeruvenMenuEnabled(false);
    expect(menu()).not.toContain('Serüven');
  });
  it('Hızlı savaş kartı yok; Oda kur açıklaması tek cihazda hemen savaşı da anlatır', () => {
    const html = menu();
    expect(html).not.toContain('Hızlı savaş');
    expect(html).not.toContain('home-quick');
    expect(t().home.roomCreateDesc).toMatch(/Giriş yok/);
    expect(t().home.roomCreateDesc).toMatch(/tek cihazda hemen savaş/);
    expect(t().home.roomCreateDesc).toContain('Game Master');
  });
  it('Oyuncu → Karakterlerim; Odaya katıl kişi simgesini paylaşmaz', () => {
    const html = menu();
    expect(html).toContain('<strong>Karakterlerim</strong>');
    expect(html).not.toContain('<strong>Oyuncu</strong>');
    const card = (cls: string) => html.slice(html.indexOf(`home-card ${cls}`), html.indexOf('</button>', html.indexOf(`home-card ${cls}`)));
    const svgOf = (part: string) => part.slice(part.indexOf('<svg'), part.indexOf('</svg>'));
    expect(svgOf(card('join'))).not.toBe('');
    expect(svgOf(card('join'))).not.toBe(svgOf(card('player')));
  });
  it('sol açıklama kutusu yok; logo, ad ve sürüm/SRD satırı kalır', () => {
    const html = menu();
    expect(html).not.toContain('class="intro"');
    expect(html).not.toContain('sıra tabanlı taktik');
    expect(html).toContain('logo/logo-masaustu.webp');
    expect(html).toContain('class="brand-title"');
    expect(html).toContain('SRD 5.2.1 kurallarına dayanır');
  });
  it('EN etiketleri', async () => {
    const { setLang } = await import('../i18n');
    await setLang('en');
    expect(t().home.player).toBe('My Characters');
    expect(t().settingsUi.seruvenMenu).toBe('Adventure in the main menu');
    expect(t().oda.quickResume).toBe('Continue saved battle');
    await setLang('tr');
  });
});

describe('ANA-MENU-SADELESTIR Oda kur: odasız kayıtlı savaş', () => {
  const props = { characters: [], onBack: () => {}, onStart: () => {}, onResumeUnbound: () => {} };
  it('kayıt yok: devam düğmesi yok', () => {
    expect(renderToStaticMarkup(<OdaKur {...props} />)).not.toContain('oda-resume-unbound');
  });
  it('odaya bağlı olmayan kayıt (eski Hızlı savaş): Oda kur listesinde devam düğmesi', () => {
    localStorage.setItem(SAVE_KEY, '{}');
    const html = renderToStaticMarkup(<OdaKur {...props} />);
    expect(html).toContain('oda-resume-unbound');
    expect(html).toContain('Kayıtlı savaşa devam et');
  });
  it('kayıt bir odanın (kilitli oda): düğme yok, o odanın "Savaşa dön"ü geçerli', () => {
    localStorage.setItem(SAVE_KEY, '{}');
    saveRooms([lockRoom(newRoom('a', 'Masa', 'now'))]);
    expect(renderToStaticMarkup(<OdaKur {...props} />)).not.toContain('oda-resume-unbound');
  });
});
