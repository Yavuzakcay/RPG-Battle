/**
 * Görev ODA-1 (O1): çevrimiçi oda arayüzü (aynı tarayıcıdaki sekmeler; ODA-TASARIM.md §7 O1). GM'in "Çevrimiçi aç"
 * paneli (kod, katılanlar, karakter kopyaları) ve oyuncunun "Kodla katıl" + lobisi (karakter kopyası gönder/geri al,
 * savaşı izle). Bağlantı ve oda çekirdeği `src/room/` (saf), uygulama yapıştırıcısı `odaCanli.ts`. Tembel: yalnız oda
 * ekranlarıyla (`OdaScreens`) yüklenir.
 */
import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n';
import type { Oda } from '../oda/model';
import { addOnlineCopy, clearOnlineCopies, removeOnlineCopy } from '../oda/store';
import type { SavedCharacter } from '../rules/builder';
import type { RemotePrompt, SessionWatch } from '../ui/session';
import { DicePrompt } from '../ui/DicePrompt';
import { sheetClassLevel } from '../ui/classLabel';
import { BaglantiHatasi } from '../room/transport';
import { kodGecerli, kodTemizle } from '../room/code';
import type { OdaIstemci } from '../room/client';
import {
  aktifHost, aktifHostTuru, aktifIstemci, cevrimiciAc, cevrimiciKapat, hostAbone, hostOdaGuncelle, istemciAyril, izleme, kodlaKatil,
} from './odaCanli';

const useYenile = (): (() => void) => { const [, set] = useState(0); return () => set((n) => n + 1); };

/** Game Master: odayı çevrimiçi aç/kapat, kod ve katılanlar. Karakter kopyaları oda kaydına yazılır. */
export function OdaCevrimiciPanel(props: { room: Oda; onChange: (fn: (o: Oda) => Oda) => void }) {
  const C = t().odaCevrimici;
  const yenile = useYenile();
  const [hata, setHata] = useState<string | null>(null);
  const [aciliyor, setAciliyor] = useState(false);
  const change = useRef(props.onChange);
  change.current = props.onChange;
  const room = props.room;
  useEffect(() => { hostOdaGuncelle(room, true); });
  useEffect(() => () => hostOdaGuncelle(room, false), [room.id]);
  useEffect(() => hostAbone((e) => {
    if (e.tur === 'karakter_geldi') change.current((o) => addOnlineCopy(o, { karakterId: e.kopya.id, istemciId: e.istemciId, kopya: e.kopya, kopyaZamani: new Date().toISOString() }));
    if (e.tur === 'karakter_gitti') change.current((o) => removeOnlineCopy(o, e.karakterId));
    yenile();
  }), []);
  const host = aktifHost(room.id);
  const tur = aktifHostTuru();
  const ac = async () => {
    setAciliyor(true); setHata(null);
    try {
      const h = await cevrimiciAc(room);
      change.current((o) => ({ ...o, kod: h.kod }));
    } catch (e) {
      setHata(e instanceof BaglantiHatasi && e.neden === 'kod_dolu' ? C.codeTaken : C.openFailed);
    }
    setAciliyor(false);
  };
  const kapat = async () => { await cevrimiciKapat(); change.current(clearOnlineCopies); };
  const uyeler = host ? [...host.uyeler.values()] : [];
  return (
    <section className="panel oda-cevrimici" data-testid="oda-cevrimici">
      <h2>{C.title}</h2>
      <p className="mute">{C.help}</p>
      {!host && <div className="set-btns"><button type="button" className="cta" data-testid="oda-cevrimici-ac" disabled={aciliyor} onClick={() => { void ac(); }}>{aciliyor ? C.opening : C.open}</button></div>}
      {hata && <p className="oda-error" role="alert">{hata}</p>}
      {host && (
        <>
          <p className="oda-kod">{C.code}: <strong data-testid="oda-kod">{host.kod}</strong> <small className="mute">{C.stage[host.asama] ?? host.asama}{tur ? ` · ${C.transport[tur] ?? tur}` : ''}</small></p>
          <h3>{C.members}</h3>
          {uyeler.length === 0 && <p className="empty-state">{C.noMembers}</p>}
          <ul className="oda-list">
            {uyeler.map((u) => (
              <li key={u.istemciId} className="oda-card">
                <div className="oda-card-text"><strong>{u.ad}</strong> <small className="mute">{u.bagli ? C.online : C.offline}{u.rol === 'izleyici' ? ` · ${C.watcher}` : ''} · {C.copies(u.kopyalar.size)}</small></div>
                {[...u.kopyalar.values()].map((k) => <span key={k.id} className="chip on">{k.sheet.name} <small>({C.copyBadge})</small></span>)}
              </li>
            ))}
          </ul>
          <div className="set-btns"><button type="button" className="ghost" onClick={() => { void kapat(); }}>{C.close}</button></div>
        </>
      )}
    </section>
  );
}

interface SekmeKimligi { istemciId?: string; anahtarlar: Record<string, string> }
const KIMLIK = 'rpg-battle-oda-istemci';
/** Sekme başına kimlik (sessionStorage: aynı tarayıcıdaki iki sekme iki ayrı istemci). */
function kimlikOku(): SekmeKimligi {
  try { const v = JSON.parse(sessionStorage.getItem(KIMLIK) ?? '{}') as Partial<SekmeKimligi>; return { ...(typeof v.istemciId === 'string' ? { istemciId: v.istemciId } : {}), anahtarlar: v.anahtarlar && typeof v.anahtarlar === 'object' ? v.anahtarlar : {} }; } catch { return { anahtarlar: {} }; }
}
function kimlikYaz(k: SekmeKimligi): void { try { sessionStorage.setItem(KIMLIK, JSON.stringify(k)); } catch { /* yalnız bu sayfada */ } }

/** Oyuncu: kodla katıl, lobi, karakter kopyası, savaşı izle. */
export function OdaKodlaKatil(props: { characters: SavedCharacter[]; onWatch: (w: SessionWatch) => void }) {
  const C = t().odaCevrimici, O = t().oda;
  const yenile = useYenile();
  const [kod, setKod] = useState('');
  const [ad, setAd] = useState(() => props.characters[0]?.sheet.name ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);
  const [c, setC] = useState<OdaIstemci | null>(() => aktifIstemci());
  const onWatch = useRef(props.onWatch);
  onWatch.current = props.onWatch;
  // Görev ODA-2: savaş ekranı açılmadan gelen zar istemi (kurulumdaki inisiyatif) lobide sorulur.
  const [istemler, setIstemler] = useState<RemotePrompt[]>([]);
  useEffect(() => (c ? izleme.prompts?.((p) => setIstemler((q) => (p.kind === 'cancel' ? q.filter((x) => x.id !== p.id) : p.kind === 'dice' && !q.some((x) => x.id === p.id) ? [...q, p] : q))) : undefined), [c]);
  useEffect(() => c?.abone((o) => {
    if (o.tur === 'kabul') { const k = kimlikOku(); kimlikYaz({ ...k, istemciId: c.istemciId, anahtarlar: { ...k.anahtarlar, [c.kod]: o.anahtar } }); }
    if (o.tur === 'red') setHata(o.neden === 'surum' ? `${C.rejected.surum} (${C.versionField[o.ayrinti ?? ''] ?? o.ayrinti ?? ''})` : C.rejected[o.neden] ?? o.neden);
    if (o.tur === 'karakter_red') setHata(C.charRejected[o.neden] ?? o.neden);
    if (o.tur === 'kapandi') setHata(C.closed);
    if (o.tur === 'baglanti' && o.d.tur === 'koptu') setHata(C.lost);
    // Savaş başlayınca (yeni anlık) izlemeye geç.
    if (o.tur === 'savas' && o.sifirlandi && c.durum) onWatch.current(izleme);
    yenile();
  }), [c]);
  const katil = async () => {
    const k = kodTemizle(kod);
    if (!kodGecerli(k)) { setHata(C.badCode); return; }
    setBekliyor(true); setHata(null);
    try {
      const kim = kimlikOku();
      const yeni = await kodlaKatil({ kod: k, ad: ad.trim() || C.namePlaceholder, ...(kim.istemciId ? { istemciId: kim.istemciId } : {}), ...(kim.anahtarlar[k] ? { anahtar: kim.anahtarlar[k] } : {}) });
      kimlikYaz({ ...kim, istemciId: yeni.istemciId });
      setC(yeni);
    } catch (e) {
      setHata(e instanceof BaglantiHatasi && e.neden === 'oda_yok' ? C.noRoom : C.openFailed);
    }
    setBekliyor(false);
  };
  if (!c) {
    return (
      <section className="panel oda-kodla" data-testid="oda-kodla">
        <h2>{C.joinTitle}</h2>
        <p className="mute">{C.joinHelp}</p>
        <div className="oda-name">
          <label>{C.code} <input value={kod} inputMode="numeric" maxLength={7} aria-label={C.code} data-testid="oda-kod-gir" onChange={(e: { target: { value: string } }) => setKod(e.target.value)} /></label>
          <label>{C.yourName} <input value={ad} maxLength={40} placeholder={C.namePlaceholder} aria-label={C.yourName} onChange={(e: { target: { value: string } }) => setAd(e.target.value)} /></label>
          <button type="button" className="cta" data-testid="oda-katil" disabled={bekliyor} onClick={() => { void katil(); }}>{bekliyor ? C.joining : C.join}</button>
        </div>
        {hata && <p className="oda-error" role="alert">{hata}</p>}
      </section>
    );
  }
  const oda = c.oda;
  const ilk = istemler[0];
  const zarIstemi = ilk?.kind === 'dice' ? ilk : null;
  const cevapla = (v: number[] | null) => { zarIstemi?.answer(v); setIstemler((q) => q.slice(1)); };
  const ben = oda?.uyeler.find((u) => u.istemciId === c.istemciId);
  const gonderilen = new Set(ben?.karakterler ?? []);
  const kilitli = !!oda && (oda.asama === 'savas' || oda.asama === 'kurulum');
  return (
    <section className="panel oda-lobi" data-testid="oda-lobi">
      {zarIstemi && <DicePrompt key={zarIstemi.id} request={zarIstemi.request} whoName={null} note={C.remoteFrom}
        onEnter={(v) => cevapla(v)} onAuto={() => cevapla(null)} onCancel={() => cevapla(null)} />}
      <h2>{oda?.ad ?? C.connecting} <small className="mute">{C.connected(c.kod)}{oda ? ` · ${C.stage[oda.asama] ?? oda.asama}` : ''}</small></h2>
      {oda && <p className="mute">{O.lineGm(oda.gmAdi)}</p>}
      {hata && <p className="oda-error" role="alert">{hata}</p>}
      {oda && (
        <>
          <h3>{C.members}</h3>
          <ul className="oda-rules-read">
            {oda.uyeler.map((u) => <li key={u.istemciId} className={u.bagli ? 'on' : ''}>{u.ad}{u.istemciId === c.istemciId ? ' ★' : ''}: <b>{u.bagli ? C.online : C.offline}</b>{u.karakterler.length ? ` · ${C.copies(u.karakterler.length)}` : ''}</li>)}
          </ul>
        </>
      )}
      <h3>{C.myChars}</h3>
      {props.characters.length === 0 && <p className="empty-state">{O.joinNoChars}</p>}
      <ul className="oda-list">
        {props.characters.map((ch) => {
          const sent = gonderilen.has(ch.id);
          return (
            <li key={ch.id} className="oda-card">
              <div className="oda-card-text"><strong>{ch.sheet.name}</strong> <small className="mute">{sheetClassLevel(ch.sheet)}</small></div>
              {sent && <span className="chip on oda-ready">{C.sent}</span>}
              {sent
                ? <button type="button" className="ghost" disabled={kilitli} onClick={() => c.karakterGeriAl(ch.id)}>{C.withdraw}</button>
                : <button type="button" className="cta" disabled={kilitli || !oda} data-testid="oda-kopya-gonder" onClick={() => { setHata(null); c.karakterGonder(ch); }}>{C.send}</button>}
            </li>
          );
        })}
      </ul>
      <div className="set-btns">
        {c.durum && <button type="button" className="cta" data-testid="oda-izle" onClick={() => props.onWatch(izleme)}>{C.watch}</button>}
        <button type="button" className="ghost" onClick={() => { void istemciAyril().then(() => { setC(null); setHata(null); }); }}>{C.leave}</button>
      </div>
    </section>
  );
}
