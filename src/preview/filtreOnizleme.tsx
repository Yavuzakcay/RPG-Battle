/**
 * GORSEL-DUZELTME: maskesiz soy boyası yedek filtresi seçimi (yalnız geliştirme; `npm run dev` → /onizleme-filtre.html; build girdisi değil).
 * Satır = soy (`data/soy-filtre-adaylari.json`); satırda o soyun oyunda gerçekten yedeğe düşen jetonlarından en çok 4'ü (karar oyunun
 * kendisinden: maskeli boyada maske yüklenemiyor mu, maskesiz boyada `tintedUrl` + `fallbackFilterFor`) × 8 aday, numaralı. Hücreye
 * tıklamak o soyun seçimini değiştirir. "Seçimim" kutusu `data/soy-filtre-yedek.json` içeriğini üretir ve panoya kopyalar.
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import '../styles.css';
import { removeStaticSplash } from '../ui/splashBoot';
import { lineageTint } from '../battle/avatar';
import { lineageLook } from '../ui/lineageLook';
import { fallbackFilterFor, maskUrlFor, maskedTint, tintedUrl } from '../ui/tint';
import { loadWingData } from '../ui/wingData';
import { loadClassData } from '../data';
import type { TintSpec } from '../battle/types';
import adaylar from '../../data/soy-filtre-adaylari.json';
import yedek from '../../data/soy-filtre-yedek.json';

type Aday = { id: number; ad: string; filter: string };
const A = (adaylar as unknown as { soylar: Record<string, { hedef: string; kaynak: string; adaylar: Aday[] }> }).soylar;
const Y = (yedek as unknown as { not: string; soylar: Record<string, { aday: number; filter: string; bekliyor?: true }> });
/** Oyunun jeton dosyaları (yalnız adlar; görsel yüklenmez). */
const TOKENS = Object.keys(import.meta.glob('/public/characters/*.webp')).map((p) => p.replace(/^.*\//, '').replace(/\.webp$/, ''));

const probe = (url: string) => new Promise<boolean>((res) => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url; });
const genderOf = (name: string): 'erkek' | 'kadin' => (/-(kadin|female)-/.test(name) ? 'kadin' : 'erkek');

interface Row { key: string; race: string; lineage: string; tokens: Array<{ name: string; yedek: boolean }> }

/** Soyun yedeğe düşen jetonları (oyunun kararı), en çok 4; hiç yoksa 3 örnek jeton (maskeli: yedek görünmez). */
async function rowOf(key: string): Promise<Row> {
  const [race, lineage] = key.split('/') as [string, string];
  // Mahkûm kıyafetinin tabanı monk jetonu (oyunda sınıf-genel jetonun çizildiği tek yer): önce onlar.
  const own = TOKENS.filter((n) => n.startsWith(`${race}-`)).sort((a, b) => Number(/-monk$/.test(b)) - Number(/-monk$/.test(a)));
  const hits: string[] = [];
  for (const name of own) {
    if (hits.length >= 4) break;
    const tint = lineageTint(race, lineage, genderOf(name));
    if (!tint) continue;
    const url = `/characters/${name}.webp`;
    if (maskedTint(tint)) {
      const m = maskUrlFor(url, tint);
      // Otomatik maske ırkta kapalıysa (`otoMaske: false`, Goliath) maske adresi yok: oyunda yedek filtre.
      if (!m || !(await probe(m))) hits.push(name);
    } else {
      await tintedUrl(url, tint);
      if (fallbackFilterFor(url, tint as TintSpec, { raceId: race, lineageId: lineage })) hits.push(name);
    }
  }
  return { key, race, lineage, tokens: hits.length ? hits.map((name) => ({ name, yedek: true })) : own.filter((n) => /-(erkek|kadin)-.+-GR$/.test(n)).slice(0, 3).map((name) => ({ name, yedek: false })) };
}

/** Jeton: zemin ayrı kutuda (filtre yalnız jetona; zemin rengi adaylar arasında aynı kalsın). */
const Tok = (p: { name: string; filter: string }) => (
  <span style={{ display: 'block', width: 72, height: 72, background: '#2a2f38' }}>
    <img src={`/characters/${p.name}.webp`} width={72} height={72} alt="" style={{ imageRendering: 'pixelated', display: 'block', filter: p.filter || undefined }} />
  </span>
);

function Page() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sec, setSec] = useState<Record<string, number>>(() => Object.fromEntries(Object.entries(Y.soylar).map(([k, v]) => [k, v.aday])));
  const [out, setOut] = useState('');
  useEffect(() => { void Promise.all(Object.keys(A).map(rowOf)).then((r) => { setRows(r); (window as { __filtreHazir?: boolean }).__filtreHazir = true; }); }, []);
  const json = useMemo(() => JSON.stringify({ not: Y.not, soylar: Object.fromEntries(Object.keys(A).map((k) => {
    const a = A[k]!.adaylar.find((x) => x.id === sec[k]) ?? A[k]!.adaylar[0]!;
    const same = Y.soylar[k]?.bekliyor && sec[k] === Y.soylar[k]?.aday;
    return [k, same ? { aday: a.id, filter: a.filter, bekliyor: true } : { aday: a.id, filter: a.filter }];
  })) }, null, 1) + '\n', [sec]);
  const save = async () => { setOut(json); try { await navigator.clipboard.writeText(json); } catch { /* pano izni yok: metin kutuda */ } };
  if (!rows) return <p style={{ color: '#ccc', padding: 16 }}>Jetonlar taranıyor…</p>;
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '12px system-ui', padding: 12, display: 'inline-block' }}>
      <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>Yedek soy filtresi seçimi (maske yokken bütün jetona)</h1>
      <p style={{ color: '#9aa3b2', margin: '0 0 8px', maxWidth: 1300 }}>Satır: soy (hedef renk oyunun verisinden). Jetonlar o soyun yedeğe düşen jetonları (oyunun kararıyla: maske yok ya da maskesiz boya etkisiz); "örnek" yazanların maskesi var, yedek orada görünmez. Hücreye tıkla: seçim. Sarı çerçeve: seçili; "bekliyor": henüz seçilmedi (geçici olarak 1). Maske eklenince yedek kendiliğinden devre dışı kalır.</p>
      <table style={{ borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((r) => {
            const a = A[r.key]!;
            const lookF = lineageLook({ raceId: r.race, lineageId: r.lineage }).filter;
            return (
              <tr key={r.key} style={{ borderTop: '1px solid #333a46' }}>
                <th style={{ textAlign: 'left', padding: 6, minWidth: 170, verticalAlign: 'top' }}>
                  <div>{r.key}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400, color: '#9aa3b2' }}><span style={{ width: 14, height: 14, background: a.hedef, display: 'inline-block', border: '1px solid #000' }} />{a.hedef}</div>
                  <div style={{ fontWeight: 400, color: Y.soylar[r.key]?.bekliyor ? '#ffb070' : '#7fd48a' }}>{Y.soylar[r.key]?.bekliyor ? 'bekliyor' : `seçili ${Y.soylar[r.key]?.aday}`}</div>
                  <div style={{ fontWeight: 400, color: '#9aa3b2', fontSize: 10 }}>{r.tokens.map((t) => `${t.name}${t.yedek ? '' : ' (örnek)'}`).join(', ')}</div>
                </th>
                <td style={{ padding: 4 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{r.tokens.map((t) => <Tok key={t.name} name={t.name} filter={lookF} />)}</div>
                      <div>orijinal</div>
                    </div>
                    {a.adaylar.map((c) => (
                      <button key={c.id} type="button" title={c.filter} onClick={() => setSec((s) => ({ ...s, [r.key]: c.id }))}
                        style={{ background: 'none', border: `3px solid ${sec[r.key] === c.id ? '#f5d76e' : 'transparent'}`, padding: 2, color: '#e8e4da', cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{r.tokens.map((t) => <Tok key={t.name} name={t.name} filter={[lookF, c.filter].filter(Boolean).join(' ')} />)}</div>
                        <div><b>{c.id}</b> {c.ad}</div>
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <h2 style={{ fontSize: 16, margin: '14px 0 4px' }}>Seçimim</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 6, maxWidth: 1300 }}>
        {Object.keys(A).map((k) => (
          <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{k}
            <input type="number" min={1} max={A[k]!.adaylar.length} value={sec[k] ?? 1} style={{ width: 52 }}
              onChange={(e) => setSec((s) => ({ ...s, [k]: Math.max(1, Math.min(A[k]!.adaylar.length, Number(e.target.value) || 1)) }))} />
          </label>
        ))}
      </div>
      <p><button type="button" onClick={() => void save()} style={{ padding: '6px 14px' }}>Kaydet (data/soy-filtre-yedek.json içeriğini panoya kopyala)</button></p>
      {out && <textarea readOnly value={out} style={{ width: 1100, height: 220, background: '#14171c', color: '#cfd3dc', font: '11px monospace' }} />}
    </div>
  );
}

removeStaticSplash();
void Promise.all([loadClassData(), loadWingData()]).then(() => createRoot(document.getElementById('root')!).render(<Page />));
