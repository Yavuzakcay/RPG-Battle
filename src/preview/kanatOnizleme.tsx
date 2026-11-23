/**
 * KW1: Dragonborn kanat önizleme sayfası (yalnız geliştirme; docs/sabah/dragonborn-kanat/). Gerçek oyun bileşenleriyle çizer.
 * ?m=ab: 10 soy × (Erkek Fighter Gladyatör, Kadın Wizard) × (256, 96 px rozet), önce/sonra karşılaştırması için aynı sayfa iki sürümde çekilir.
 * ?m=ozet: Erkek Fighter Gladyatör, 10 soy, 256 px (iki hal karşılaştırması için kompakt; `katmanlar.zar.etkin` açık/kapalı iki kez çekilir).
 * ?m=hepsi: bütün Dragonborn jetonları (savaş jetonu çizimi, havada), kök kontrol sayfası. ?m=kok: 4 farklı sınıf/poz, kök işaretli.
 * ?m=kirik (CELESTIAL-KIRIK-KANAT-YENI): Celestial Kırık Kanat, eski kanat (sepya filtreli, `?eski=` ile verilen dosya) ↔ yeni kanat
 * (filtresiz) yan yana; erkek Bard, kadın Rogue, erkek Monk; rozet ve savaş jetonu, 96 px ve 3× (288 px). Eski kanadın verisi burada
 * sabit (kanat-esleme.json'un önceki değerleri); eski görsel geçici olarak public/kanat/ altına konup çekimden sonra silinir.
 */
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { AvatarBadge, AvatarCircle, CharacterFigure } from '../ui/Avatar';
import { lineageLook, wingPlacements } from '../ui/lineageLook';
import { wingRoot } from '../ui/wingRoot';
import { tintedUrl } from '../ui/tint';
import { rgbToLab } from '../ui/color';
import { LookFrame } from '../ui/LookFrame';
import { blankCharacter } from '../rules/builder';
import { sheetAvatar } from '../battle/avatar';
import type { CharacterSheet } from '../rules/stats';
import gorunum from '../../data/alt-soy-gorunum.json';
import { loadWingData, wingTable } from '../ui/wingData';

const mode = new URLSearchParams(location.search).get('m') ?? 'ab';
const base = blankCharacter('t').sheet;
const LINEAGES = ['black', 'blue', 'brass', 'bronze', 'copper', 'gold', 'green', 'red', 'silver', 'white'];
/** Erkek Fighter Gladyatör (champion → ID12), Kadın Wizard (evoker → WZ-A1). */
const CHARS: Array<{ id: string; ad: string; sheet: Partial<CharacterSheet> }> = [
  { id: 'f', ad: 'Erkek Fighter · Gladyatör', sheet: { classId: 'fighter', gender: 'erkek', subclassId: 'champion' } },
  { id: 'w', ad: 'Kadın Wizard · Evoker', sheet: { classId: 'wizard', gender: 'kadin', subclassId: 'evoker' } },
];
const SIZES = [256, 96];
const lab = { font: '11px system-ui', color: '#cfd3dc', textAlign: 'center' as const };

function Cell({ lineage, ch, size }: { lineage: string; ch: (typeof CHARS)[number]; size: number }) {
  const sheet = { ...base, raceId: 'dragonborn', level: 5, lineageId: lineage, ...ch.sheet } as CharacterSheet;
  const a = sheetAvatar(sheet);
  return (
    <div data-cell={`${lineage}-${ch.id}-${size}`} style={{ width: size === 256 ? 400 : 170, height: size === 256 ? 272 : 112, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <LookFrame sheet={{ raceId: 'dragonborn', lineageId: lineage, level: 5 }} size={size} ability><AvatarBadge avatar={a} size={size} eager /></LookFrame>
    </div>
  );
}

function PageAb() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 10, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `70px ${CHARS.map(() => `${400 + 170}px`).join(' ')}`, gap: 0 }}>
        <div />
        {CHARS.map((c) => <div key={c.id} style={{ ...lab, fontWeight: 700, fontSize: 13 }}>{c.ad} · 256 px | 96 px</div>)}
        {LINEAGES.map((l) => (
          <div key={l} style={{ display: 'contents' }}>
            <div style={{ alignSelf: 'center', color: '#f5d76e', fontWeight: 700, textTransform: 'capitalize' }}>{l}</div>
            {CHARS.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #2a3039', paddingBottom: 4 }}>
                {SIZES.map((s) => <Cell key={s} lineage={l} ch={c} size={s} />)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const TOKENS = Object.keys(import.meta.glob('/public/characters/dragonborn-*.webp')).map((f) => (f.split('/').pop() as string).replace(/\.webp$/, '')).sort();
const q = new URLSearchParams(location.search);
const LIN = q.get('soy') ?? 'blue';
/** Gerçek çizim yolundaki (sheetAvatar) boya: cinsiyet başına bir kez; jeton adı yalnız src'yi değiştirir. */
const tintOf = (gender: 'erkek' | 'kadin') => sheetAvatar({ ...base, raceId: 'dragonborn', level: 5, lineageId: LIN, classId: 'fighter', gender, subclassId: 'champion' } as CharacterSheet).tint;
const avatarOfToken = (name: string) => {
  const gender = /^dragonborn-(erkek|male)/.test(name) ? 'erkek' : 'kadin';
  const tint = tintOf(gender);
  return { src: `characters/${name}.webp`, bg: '#4f7a3a', label: 'D', look: { raceId: 'dragonborn', lineageId: LIN, level: 5 }, ...(tint ? { tint } : {}) };
};

function TokenTile({ name, w = 132, T = 200, H = 190, marks = false }: { name: string; w?: number; T?: number; H?: number; marks?: boolean }) {
  const a = avatarOfToken(name);
  const cx = T / 2, cy = H / 2 + 6;
  const wing = lineageLook(a.look, { ability: true }).wing;
  const root = wingRoot(a.src, a.look);
  const ps = wing ? wingPlacements(wing, cx, cy, w, root) : [];
  return (
    <svg width={T} height={H} viewBox={`0 0 ${T} ${H}`} data-token={name} style={{ background: '#2b3a2a', borderRadius: 6 }}>
      <AvatarCircle avatar={a} cx={cx} cy={cy} r={w / 2} flying ability eager />
      {marks && ps.map((p) => <g key={p.side}><circle cx={p.pivot.x} cy={p.pivot.y} r={4} fill="none" stroke="#ff3b3b" strokeWidth={1.5} /><circle cx={p.pivot.x} cy={p.pivot.y} r={1} fill="#ff3b3b" /></g>)}
      <text x={3} y={H - 4} fontSize={9} fill="#cfd3dc">{name.replace('dragonborn-', '')}</text>
    </svg>
  );
}
function PageHepsi() {
  const cols = 14;
  return (
    <div id="sayfa" style={{ background: '#1d2128', padding: 6, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 200px)`, gap: 4 }}>
        {TOKENS.map((n) => <TokenTile key={n} name={n} />)}
      </div>
    </div>
  );
}
/** ?m=figur: karakter ekranı figürü (CharacterFigure: liste, oluşturucu önizlemesi) ve savaş jetonu, 4 poz. */
function PageFigur() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', padding: 8, display: 'inline-block' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {KOK.map((n) => <div key={n} style={{ outline: '1px dashed #3a4350' }}><CharacterFigure avatar={avatarOfToken(n)} size={170} /></div>)}
      </div>
    </div>
  );
}
function PageOzet() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', padding: 8, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 360px)', gap: 4 }}>
        {LINEAGES.map((l) => (
          <div key={l} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 282, position: 'relative' }}>
            <LookFrame sheet={{ raceId: 'dragonborn', lineageId: l, level: 5 }} size={256} ability><AvatarBadge avatar={sheetAvatar({ ...base, raceId: 'dragonborn', level: 5, lineageId: l, ...CHARS[0]!.sheet } as CharacterSheet)} size={256} eager /></LookFrame>
            <div style={{ position: 'absolute', left: 6, top: 4, font: '700 13px system-ui', color: '#f5d76e', textTransform: 'capitalize' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
const KOK = (q.get('jeton') ?? 'dragonborn-erkek-bard-ID3,dragonborn-kadin-monk-ID2,dragonborn-erkek-fighter-ID12,dragonborn-erkek-sorcerer-SC-3').split(',');
function PageKok() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', padding: 6, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 440px)', gap: 6 }}>
        {KOK.map((n) => <TokenTile key={n} name={n} w={264} T={440} H={380} marks />)}
      </div>
    </div>
  );
}

/** ?m=renk: soy başına boyanmış gövde (pul maskesi) Lab istatistiği (gerçek boyama yolu: sheetAvatar tint + tintedUrl); window.__renk. */
const loadImg = (u: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(u)); i.src = u; });
const pixels = (i: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
async function renkOlc(adim: number) {
  const BASE = import.meta.env.BASE_URL;
  const out: Record<string, { n: number; L: number; a: number; b: number; r: number; g: number; bl: number; Lp: number[] }> = {};
  const names = TOKENS.filter((n) => /^dragonborn-(erkek|kadin)-/.test(n)).filter((_, i) => i % adim === 0);
  for (const lin of LINEAGES) {
    let n = 0, sL = 0, sa = 0, sb = 0, sr = 0, sg = 0, sbl = 0; const Ls: number[] = [];
    for (const name of names) {
      const gender = /^dragonborn-erkek/.test(name) ? 'erkek' : 'kadin';
      const tint = sheetAvatar({ ...base, raceId: 'dragonborn', level: 5, lineageId: lin, classId: 'fighter', gender, subclassId: 'champion' } as CharacterSheet).tint;
      const url = tint ? await tintedUrl(`${BASE}characters/${name}.webp`, tint) : null;
      if (!url) continue;
      const [img, mask] = await Promise.all([loadImg(url), loadImg(`${BASE}characters/maske-pul/${name}.png`)]);
      const d = pixels(img), m = pixels(mask);
      for (let p = 0; p < d.length; p += 4) {
        if (d[p + 3]! < 200 || m[p]! < 128) continue;
        const [L, a, b] = rgbToLab(d[p]!, d[p + 1]!, d[p + 2]!);
        n++; sL += L; sa += a; sb += b; sr += d[p]!; sg += d[p + 1]!; sbl += d[p + 2]!;
        if (n % 7 === 0) Ls.push(L);
      }
    }
    Ls.sort((x, y) => x - y);
    const pc = (q: number) => Ls[Math.floor(q * (Ls.length - 1))]!;
    out[lin] = { n, L: sL / n, a: sa / n, b: sb / n, r: sr / n, g: sg / n, bl: sbl / n, Lp: [0.05, 0.25, 0.5, 0.75, 0.95].map(pc) };
  }
  (window as unknown as { __renk: unknown }).__renk = out;
  const pre = document.createElement('pre'); pre.id = 'sayfa'; pre.textContent = JSON.stringify(out); host.appendChild(pre);
}

/** Eski Kırık Kanat (CELESTIAL-KIRIK-KANAT-YENI öncesi): beyaz kanat + sepya filtresi; sahte uyanış `kk-eski` ve slot `kk-eski`. */
async function kirikHazirla() {
  await loadWingData();
  const uy = (gorunum as unknown as { celestialUyanis: Record<string, { sepya?: Record<string, unknown> }> }).celestialUyanis;
  const yeni = uy['kirik-kanat']!;
  uy['kk-eski'] = { ...yeni, kanat: 'kk-eski', sepya: { ...yeni.sepya, kanat: true } } as never;
  wingTable.slotlar['kk-eski'] = { ...wingTable.slotlar['celestial-kirik-kanat']!, dosya: q.get('eski') ?? '_karsilastirma-eski.webp', olcek: 1.45, capa: [0.568, 0.438], enBoy: 0.734 };
}
const KIRIK: Array<{ ad: string; sheet: Partial<CharacterSheet> }> = [
  { ad: 'Erkek Bard', sheet: { classId: 'bard', gender: 'erkek' } },
  { ad: 'Kadın Rogue', sheet: { classId: 'rogue', gender: 'kadin' } },
  { ad: 'Erkek Monk', sheet: { classId: 'monk', gender: 'erkek' } },
];
const KIRIK_KOL = [{ aw: 'kk-eski', ad: 'ESKİ kanat + sepya filtresi' }, { aw: 'kirik-kanat', ad: 'YENİ kanat (filtresiz)' }];
function KirikHucre({ ch, aw, size, kind }: { ch: (typeof KIRIK)[number]; aw: string; size: number; kind: 'rozet' | 'jeton' }) {
  const sheet = { ...base, raceId: 'celestial', level: 5, celestialAwakening: aw, ...ch.sheet } as CharacterSheet;
  const a = sheetAvatar(sheet);
  const box = Math.round(size * 1.6);
  if (kind === 'rozet') return (
    <div style={{ width: box, height: Math.round(size * 1.15), display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <LookFrame sheet={{ raceId: 'celestial', celestialAwakening: aw, level: 5 }} size={size} ability><AvatarBadge avatar={a} size={size} eager /></LookFrame>
    </div>
  );
  return (
    <svg width={box} height={Math.round(size * 1.15)} viewBox={`0 0 ${box} ${Math.round(size * 1.15)}`} style={{ background: '#2b3a2a', borderRadius: 6 }}>
      <AvatarCircle avatar={a} cx={box / 2} cy={Math.round(size * 1.15) / 2} r={size / 2} eager />
    </svg>
  );
}
function PageKirik() {
  const satir = (kind: 'rozet' | 'jeton', size: number) => `${kind === 'rozet' ? 'Rozet' : 'Savaş jetonu'} ${size} px`;
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 10, display: 'inline-block' }}>
      {KIRIK.map((ch) => (
        <div key={ch.ad} style={{ borderBottom: '1px solid #3a4350', padding: '6px 0' }}>
          <div style={{ color: '#f5d76e', fontWeight: 700, fontSize: 15 }}>{ch.ad} · Celestial Kırık Kanat (5. seviye)</div>
          <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${KIRIK_KOL.length}, auto)`, columnGap: 18, alignItems: 'end' }}>
            <div />{KIRIK_KOL.map((k) => <div key={k.aw} style={{ ...lab, fontWeight: 700 }}>{k.ad}</div>)}
            {(['rozet', 'jeton'] as const).flatMap((kind) => [96, 288].map((size) => (
              <div key={kind + size} style={{ display: 'contents' }}>
                <div style={{ alignSelf: 'center', color: '#cfd3dc' }}>{satir(kind, size)}</div>
                {KIRIK_KOL.map((k) => <KirikHucre key={k.aw} ch={ch} aw={k.aw} size={size} kind={kind} />)}
              </div>
            )))}
          </div>
        </div>
      ))}
    </div>
  );
}

const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(host);
if (mode === 'ab') createRoot(host).render(<PageAb />);
else if (mode === 'hepsi') createRoot(host).render(<PageHepsi />);
else if (mode === 'kok') createRoot(host).render(<PageKok />);
else if (mode === 'ozet') createRoot(host).render(<PageOzet />);
else if (mode === 'figur') createRoot(host).render(<PageFigur />);
else if (mode === 'kirik') void kirikHazirla().then(() => createRoot(host).render(<PageKirik />));
else if (mode === 'renk') void renkOlc(+(q.get('adim') ?? 5));
