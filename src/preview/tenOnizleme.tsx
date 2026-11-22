/**
 * TEN-MASKE-4-IRK: Orc, Goliath, Dwarf, Gnome soy ten rengi seçimi (yalnız geliştirme; `npm run dev` → /onizleme-ten.html; build girdisi değil).
 * Satır = soy (`data/soy-ten-renkleri.json`); ırk başına 3 temsilci jeton (çıplak kollu, düz kıyafetli, zırhlı; efektsiz). HEX kutusu ya da renk
 * seçici değişince jetonlar oyunun kendi boyama yoluyla (`hexTint` → `tintedUrl`: ten maskesi, çalışma anı onarımı, LCh; açıklık farkları
 * korunur) yeniden çizilir. "Boyasız (orijinal)" o soyu boyamaz. "Dışa aktar" `data/soy-ten-renkleri.json` içeriğini üretir (pano + indirme).
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import '../styles.css';
import { removeStaticSplash } from '../ui/splashBoot';
import { hexTint } from '../ui/lineageLook';
import { tintedUrl } from '../ui/tint';
import { loadClassData, races } from '../data';
import ten from '../../data/soy-ten-renkleri.json';

const T = ten as unknown as { not: string; soylar: Record<string, string | null> };
/** Irk başına temsilci jetonlar: çıplak kollu (Barbarian GR), düz kıyafetli (Bard GR, kadın), zırhlı (sınıf-genel Fighter). */
const ORNEK = (race: string) => [`${race}-erkek-barbarian-GR`, `${race}-kadin-bard-GR`, `${race}-male-fighter`];
const RACES = [...new Set(Object.keys(T.soylar).map((k) => k.split('/')[0]!))];
const HEX = /^#[0-9a-fA-F]{6}$/;
const lineageName = (race: string, lin: string) => races.find((r) => r.id === race)?.lineages?.find((l) => l.id === lin)?.name ?? lin;

/** Oyunun boyama yoluyla çizilmiş jeton (hex null: orijinal). */
function Tok({ name, hex }: { name: string; hex: string | null }) {
  const url = `/characters/${name}.webp`;
  const [src, setSrc] = useState<string>(url);
  useEffect(() => {
    let live = true;
    if (!hex) { setSrc(url); return; }
    void tintedUrl(url, hexTint(hex)).then((u) => { if (live) setSrc(u ?? url); });
    return () => { live = false; };
  }, [url, hex]);
  return (
    <span style={{ display: 'block', width: 128, height: 128, background: '#2a2f38' }} title={name}>
      <img src={src} width={128} height={128} alt="" style={{ imageRendering: 'pixelated', display: 'block' }} />
    </span>
  );
}

function Page() {
  // Son geçerli renk soy başına (boyasız işaretlenip geri alınınca kaybolmasın).
  const [renk, setRenk] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(T.soylar).map(([k, v]) => [k, v ?? '#808080'])));
  const [boyasiz, setBoyasiz] = useState<Record<string, boolean>>(() => Object.fromEntries(Object.entries(T.soylar).map(([k, v]) => [k, v === null])));
  const [yazi, setYazi] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(T.soylar).map(([k, v]) => [k, v ?? ''])));
  const [out, setOut] = useState('');
  const json = useMemo(() => JSON.stringify({ not: T.not, soylar: Object.fromEntries(Object.keys(T.soylar).map((k) => [k, boyasiz[k] ? null : renk[k]!.toUpperCase()])) }, null, 1) + '\n', [renk, boyasiz]);
  const setHex = (k: string, v: string) => { setYazi((s) => ({ ...s, [k]: v })); if (HEX.test(v)) setRenk((s) => ({ ...s, [k]: v })); };
  const disa = async () => {
    setOut(json);
    try { await navigator.clipboard.writeText(json); } catch { /* pano izni yok: metin kutuda */ }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = 'soy-ten-renkleri.json'; a.click();
  };
  useEffect(() => { (window as { __tenHazir?: boolean }).__tenHazir = true; }, []);
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '12px system-ui', padding: 12, display: 'inline-block' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>Soy ten rengi (Orc, Goliath, Dwarf, Gnome)</h1>
      <p style={{ color: '#9aa3b2', margin: '0 0 8px', maxWidth: 1100 }}>Renk yalnız ten maskesine (yüz, boyun, kol, el, görünen bacak) uygulanır; kıyafet, zırh, silah, saç ve sakal aynen kalır.
        Açıklık hedef rengin açıklığına taşınır, gölge ve çizgi farkları korunur. Seçimi "Dışa aktar" ile <code>data/soy-ten-renkleri.json</code> olarak kaydet; oyun bu dosyadan çizer.</p>
      {RACES.map((race) => (
        <section key={race} style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, margin: '8px 0 4px', textTransform: 'capitalize' }}>{race}</h2>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <th style={{ textAlign: 'left', padding: 6, minWidth: 260, color: '#9aa3b2', fontWeight: 400 }}>orijinal (boyasız)</th>
                {ORNEK(race).map((n) => <td key={n} style={{ padding: 2 }}><Tok name={n} hex={null} /></td>)}
              </tr>
              {Object.keys(T.soylar).filter((k) => k.startsWith(`${race}/`)).map((k) => {
                const lin = k.split('/')[1]!;
                const hex = boyasiz[k] ? null : renk[k]!;
                return (
                  <tr key={k} style={{ borderTop: '1px solid #333a46' }}>
                    <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'top' }}>
                      <div>{lineageName(race, lin)} <span style={{ color: '#9aa3b2', fontWeight: 400 }}>({k})</span></div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontWeight: 400 }}>
                        <input type="color" value={renk[k]} disabled={boyasiz[k]} onChange={(e) => setHex(k, e.target.value.toUpperCase())} />
                        <input type="text" value={yazi[k]} disabled={boyasiz[k]} placeholder="#RRGGBB" maxLength={7} onChange={(e) => setHex(k, e.target.value.trim())}
                          style={{ width: 80, font: '12px monospace', background: '#14171c', color: HEX.test(yazi[k] ?? '') ? '#e8e4da' : '#ff8a7a', border: '1px solid #444' }} />
                      </div>
                      <label style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4, fontWeight: 400 }}>
                        <input type="checkbox" checked={!!boyasiz[k]} onChange={(e) => setBoyasiz((s) => ({ ...s, [k]: e.target.checked }))} /> Boyasız (orijinal)
                      </label>
                    </th>
                    {ORNEK(race).map((n) => <td key={n} style={{ padding: 2 }}><Tok name={n} hex={hex} /></td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
      <p><button type="button" onClick={() => void disa()} style={{ padding: '6px 14px' }}>Dışa aktar (data/soy-ten-renkleri.json: panoya kopyala ve indir)</button></p>
      {out && <textarea readOnly value={out} style={{ width: 900, height: 260, background: '#14171c', color: '#cfd3dc', font: '11px monospace' }} />}
    </div>
  );
}

removeStaticSplash();
void loadClassData().then(() => createRoot(document.getElementById('root')!).render(<Page />));
