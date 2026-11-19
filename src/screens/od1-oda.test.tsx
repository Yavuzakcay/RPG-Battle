/** Görev OD1: yerel Oda kur / Odaya katıl: oda modeli ve saklama, kural örtüsü, kilit, HP görünürlüğü, ekranlar, ana menü. */
import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_KURALLAR, ODA_KEY, defaultAyarlar, newRoom, normalizeRoom, overlayOf, rulesSummary } from '../oda/model';
import { createRoom, deleteRoom, isLocked, joinRoom, leaveRoom, loadRooms, lockRoom, renameRoom, saveRooms, unlockRoom, updateRoom } from '../oda/store';
import { enemyHpVis, roomOverlay, setRoomOverlay } from '../oda/active';
import { hpBand, hpBarFraction, hpPercent } from '../oda/hp';
import { alignmentEnabled, setAlignmentEnabled } from '../app/features';
import { storedCarryRule } from '../ui/carrySetting';
import { loadSettings } from '../app/discovery';
import { MAX_PARTY } from '../app/limits';
import { OdaKatil, OdaKur, RoomPanel } from './OdaScreens';
import { Home } from './Screens';
import { demoCharacters } from './fixtures';
import { t } from '../i18n';

const mem = (): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); } };
};
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, String(v)); }, removeItem: (k: string) => { m.delete(k); }, clear: () => m.clear(), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage;
}
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });
afterEach(() => { setRoomOverlay(null); });

describe('OD1 model ve saklama', () => {
  it('yeni oda: davet kodu boş, kural kopyası, kilitsiz, parti boş; ayrı anahtar', () => {
    const r = newRoom('a', '  Masa  ', '2026-11-15T10:00:00Z', { ...DEFAULT_KURALLAR, hizalanma: true }, 'Ayşe');
    expect(r).toMatchObject({ id: 'a', kod: '', ad: 'Masa', gmAdi: 'Ayşe', parti: [], kilit: null, surum: 1 });
    expect(r.ayarlar.kurallar.hizalanma).toBe(true);
    // 2026-11-19: "Üst seviye" anahtarı kalktı; yeni odada yazılmaz.
    expect('ustSeviye' in r.ayarlar.kurallar).toBe(false);
    expect(r.ayarlar).toMatchObject({ zarModu: 'auto', hpGorunurluk: 'tam', zorluk: { party: 'normal', enemies: 'normal' } });
    expect(ODA_KEY).toBe('rpg-battle-oda');
  });
  it('kaydet/yükle gidiş dönüş; bozuk ve eski kayıt onarılır; başka anahtarlara dokunulmaz', () => {
    const s = mem();
    s.setItem('rpg-battle-karakterler', 'X');
    const { list } = createRoom([], 'Masa', DEFAULT_KURALLAR, '2026-11-15T10:00:00Z');
    saveRooms(list, s);
    expect(loadRooms(s)).toEqual(list);
    expect(s.getItem('rpg-battle-karakterler')).toBe('X');
    s.setItem(ODA_KEY, JSON.stringify({ surum: 1, odalar: [{ id: 'z', ad: 'Eski', ayarlar: { zarModu: 'bilinmeyen', hpGorunurluk: 'x' }, parti: ['k1', 'k1', 5] }, 7, null] }));
    const l = loadRooms(s);
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ id: 'z', ad: 'Eski', kod: '', parti: ['k1'] });
    expect(l[0]?.ayarlar).toMatchObject({ zarModu: 'auto', hpGorunurluk: 'tam' });
    s.setItem(ODA_KEY, '{ bozuk');
    expect(loadRooms(s)).toEqual([]);
    expect(normalizeRoom('x')).toBeNull();
  });
  it('yeniden adlandır, sil; ad boş olamaz', () => {
    const a = createRoom([], 'A', DEFAULT_KURALLAR);
    const b = createRoom(a.list, 'B', DEFAULT_KURALLAR);
    expect(renameRoom(b.list, a.room.id, 'Yeni').find((o) => o.id === a.room.id)?.ad).toBe('Yeni');
    expect(renameRoom(b.list, a.room.id, '   ').find((o) => o.id === a.room.id)?.ad).toBe('A');
    expect(deleteRoom(b.list, a.room.id).map((o) => o.ad)).toEqual(['B']);
  });
  it('parti en çok MAX_PARTY, tekrar eklenmez, ayrılınca çıkar', () => {
    let r = newRoom('a', 'A', 'now');
    for (let i = 0; i < MAX_PARTY + 3; i++) r = joinRoom(r, `k${i}`);
    expect(r.parti).toHaveLength(MAX_PARTY);
    expect(joinRoom(r, 'k0').parti).toHaveLength(MAX_PARTY);
    expect(leaveRoom(r, 'k0').parti).not.toContain('k0');
  });
  it('kilit: savaş başlayınca kilitli; yalnız kayıtlı savaş varken geçerli; bitince açılır ve özet yazılır', () => {
    const r = lockRoom(newRoom('a', 'A', 'now'));
    expect(isLocked(r, true)).toBe(true);
    expect(isLocked(r, false)).toBe(false);
    const u = unlockRoom(r, { zaman: 'z', harita: 'col', sonuc: 'zafer' });
    expect(u.kilit).toBeNull();
    expect(u.sonSavas).toEqual({ zaman: 'z', harita: 'col', sonuc: 'zafer' });
    expect(updateRoom([u], 'a', (o) => ({ ...o, ad: 'Y' }), 't')[0]?.guncelleme).toBe('t');
  });
});

describe('OD1 kural örtüsü (cihaz ayarına yazılmaz)', () => {
  it('oda etkinken kurallar odadan okunur; kapanınca cihazın değerleri aynen', () => {
    setAlignmentEnabled(false);
    const r = newRoom('a', 'A', 'now', { ...DEFAULT_KURALLAR, hizalanma: true, tasima: 'tiered', kesif: false, ipucu: false });
    setRoomOverlay(overlayOf(r));
    expect(alignmentEnabled()).toBe(true);
    expect(storedCarryRule()).toBe('tiered');
    expect(loadSettings()).toMatchObject({ discovery: false, hints: false });
    expect(enemyHpVis()).toBe('tam');
    setRoomOverlay(null);
    expect(alignmentEnabled()).toBe(false);
    expect(storedCarryRule()).toBe('srd');
    expect(loadSettings()).toMatchObject({ discovery: true, hints: true });
    expect(localStorage.getItem('rpg-battle-deneysel')).toBe(JSON.stringify({ hizalanma: false }));
    expect(roomOverlay()).toBeNull();
  });
  it('düşman HP görünürlüğü odadan', () => {
    const r = newRoom('a', 'A', 'now');
    setRoomOverlay(overlayOf({ ...r, ayarlar: { ...r.ayarlar, hpGorunurluk: 'gizli' } }));
    expect(enemyHpVis()).toBe('gizli');
  });
  it('oda kural özeti beş satır (Üst seviye kalktı)', () => {
    expect(rulesSummary(DEFAULT_KURALLAR).map((x) => x.id)).toEqual(['tasima', 'hizalanma', 'kesif', 'ipucu', 'yolculuk']);
  });
});

describe('OD1 HP görünürlüğü', () => {
  it('kademeler ve çubuk', () => {
    expect([100, 76, 75, 51, 50, 26, 25, 1, 0].map((h) => hpBand(h, 100))).toEqual(['full', 'full', 'hurt', 'hurt', 'bloodied', 'bloodied', 'dying', 'dying', 'down']);
    expect(hpBarFraction(30, 100, 'gizli')).toBeNull();
    expect(hpBarFraction(30, 100, 'etiket')).toBe(0.5);
    expect(hpBarFraction(30, 100, 'yuzde')).toBeCloseTo(0.3);
    expect(hpBarFraction(30, 100, 'tam')).toBeCloseTo(0.3);
    expect(hpPercent(1, 3)).toBe(33);
  });
});

describe('OD1 ekranlar', () => {
  it('Oda kur: boş durum ve oluşturma formu; renk: eylem düğmesi cta', () => {
    const html = renderToStaticMarkup(<OdaKur characters={[]} onBack={() => {}} onStart={() => {}} />);
    expect(html).toContain('Henüz oda yok, Oda kur ile başla.');
    expect(html).toContain('Oda adı');
    expect(html).toContain('Game Master adı');
  });
  it('Odaya katıl: oda yoksa sade boş durum', () => {
    const html = renderToStaticMarkup(<OdaKatil characters={demoCharacters()} onBack={() => {}} />);
    expect(html).toContain('Henüz oda yok');
  });
  it('Oda kur: kayıtlı oda listede ad, Game Master, parti sayısı, son oynanma', () => {
    const { list } = createRoom([], 'Cuma Masası', DEFAULT_KURALLAR, '2026-11-15T10:00:00Z', 'Deniz');
    saveRooms(list);
    const html = renderToStaticMarkup(<OdaKur characters={[]} onBack={() => {}} onStart={() => {}} />);
    for (const s of ['Cuma Masası', 'Game Master: Deniz', 'Parti: 0 karakter', 'Henüz oynanmadı', 'Adı değiştir', 'Sil']) expect(html).toContain(s);
  });
  it('Oda paneli: kilitliyken "Bu savaş için kilitli" ve alanlar devre dışı; açıkken kilit notu yok', () => {
    const r = newRoom('a', 'A', 'now');
    const on = renderToStaticMarkup(<RoomPanel room={r} locked onChange={() => {}} onRename={() => {}} onUnlock={() => {}} onBackToBattle={() => {}} />);
    expect(on).toContain('Bu savaş için kilitli');
    expect(on).toContain('<fieldset class="oda-lock" disabled=""');
    expect(on).toContain('Savaşa dön');
    const off = renderToStaticMarkup(<RoomPanel room={r} locked={false} onChange={() => {}} onRename={() => {}} onUnlock={() => {}} />);
    expect(off).not.toContain('Bu savaş için kilitli');
    for (const s of ['Zar modu', 'Düşman HP görünürlüğü', 'Gizli', 'Etiket', 'Yüzde', 'Tam', 'Oda kuralları', 'Taşıma yükü', 'Yapay zekâ zorluğu']) expect(off).toContain(s);
  });
  it('Odaya katıl: oda seçilince kurallar salt okunur özet, karakter listesi ve Hazır', () => {
    const chars = demoCharacters();
    let r = newRoom('a', 'Masa', 'now', { ...DEFAULT_KURALLAR, hizalanma: true });
    r = joinRoom(r, chars[0]?.id ?? '');
    saveRooms([r]);
    const html = renderToStaticMarkup(<OdaKatil characters={chars} onBack={() => {}} roomId="a" />);
    for (const s of ['Oda kuralları (yalnız okunur)', 'Alignment', 'açık', 'Karakterini seç', 'Hazır', 'Ayrıl', 'Katıl']) expect(html).toContain(s);
    expect(html).not.toContain('role="radiogroup"'); // oyuncu kural değiştiremez
  });
  it('Ana menü: Oda kur, Odaya katıl, Hızlı savaş', () => {
    const html = renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} onRoomCreate={() => {}} onRoomJoin={() => {}} />);
    for (const s of ['Oda kur', 'Odaya katıl', 'Hızlı savaş']) expect(html).toContain(s);
    expect(html).not.toContain('>Game Master</strong>');
  });
  it('Ana menü: yalnız Hızlı savaş yolu (eski çağrı) Oda kur kartı olarak onGm', () => {
    const html = renderToStaticMarkup(<Home onPlayer={() => {}} onGm={() => {}} />);
    expect(html).toContain('Oda kur');
  });
  it('EN metinleri var', async () => {
    const { setLang } = await import('../i18n');
    await setLang('en');
    expect(t().oda.createTitle).toBe('Create room');
    expect(t().home.quick).toBe('Quick battle');
    await setLang('tr');
  });
  it('varsayılan ayar fabrikası', () => {
    expect(defaultAyarlar().gelismis).toEqual({ cokAltigen: false, ruleToggles: {}, ruleParams: {} });
  });
});

describe('OD1 kurulum ekranı iki kipte', () => {
  it('Hızlı savaş (oda yok): sade; zar modu ve zorluk var, Oda kuralları ve Gelişmiş yok', async () => {
    const { GmScreen } = await import('./GmScreen');
    const html = renderToStaticMarkup(<GmScreen characters={demoCharacters()} onStart={() => {}} onBack={() => {}} />);
    expect(html).toContain('Hızlı savaş');
    expect(html).toContain('Zar modu');
    expect(html).toContain('Yapay zekâ zorluğu');
    expect(html).not.toContain('Oda kuralları');
    expect(html).not.toContain('gm-advanced');
  });
  it('Oda kur (oda var): oda paneli, Gelişmiş katı; parti odadan; kilitliyken Savaşı kur devre dışı', async () => {
    const { GmScreen } = await import('./GmScreen');
    const chars = demoCharacters();
    const room = joinRoom(newRoom('a', 'Masa', 'now'), chars[0]?.id ?? '');
    const panel = <RoomPanel room={room} locked={false} onChange={() => {}} onRename={() => {}} onUnlock={() => {}} />;
    const open = renderToStaticMarkup(<GmScreen characters={chars} room={room} roomPanel={panel} onStart={() => {}} onBack={() => {}} />);
    for (const s of ['Oda ayarları', 'Oda kuralları', 'gm-advanced', 'Çok altıgenli']) expect(open).toContain(s);
    expect(open).toContain(`${chars[0]?.sheet.name}`);
    const locked = renderToStaticMarkup(<GmScreen characters={chars} room={room} locked roomPanel={panel} onStart={() => {}} onBack={() => {}} />);
    expect(locked).toContain('Savaş sürerken yeni savaş kurulamaz');
  });
});
