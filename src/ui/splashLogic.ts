/**
 * Açılış ekranı mantığı (Görev L, L2, L3, L4), saf: sahneler, zamanlama, atlama, kısa ve azaltılmış sürümler, katman,
 * kanat katlanması ve zar yerleşimi. Çizim `Splash.tsx` (tembel parça) + `splash.css`; ilk statik kare index.html'de
 * (yalnızca koyu zemin; vite eklentisi `splashStaticHtml`). Zamanlama `data/acilis-ekrani.json`, katman, katlanma ve zar
 * ölçüleri `data/logo.json` (`npm run logo`).
 *
 * Soğuk açılış (`full`): prep (kapalı kanatlı logo indirilip çözülene dek; saat başlamaz; `prepTimeoutMs` aşılırsa
 * statik geniş logo) → die (logo ve zar birlikte belirir, zar ease-in döner, 20 önde durur) → logo (gözden keskin ışık;
 * açık kanatlar kapalı kanatların yerinden önde açılır; kapalı gövde geniş gövdeye geçerken ışık gözü izler; zar
 * geniş logodakine devreder; yazı, nefes) → leaving (fade) → done. Açık kanatlı katmanlar zar dönerken yüklenir; dönüş
 * bitince hazır değilse en çok `assetTimeoutMs` beklenir, sonra statik logo (`reduced`). Arka plandan dönüş (`short`)
 * ve "hareketi azalt" (`reduced`): zar ve animasyon yok, statik logo ve kısa fade. Dokunma ya da tuş: hazırlıkta ve
 * zar sahnesinde ileri (hazırlıkta statik logoya, zarda logo sahnesine), logo sahnesinde kapanışa geçer.
 */
import timing from '../../data/acilis-ekrani.json';
import { acilis, checks as logoChecks } from '../../data/logo.json';
import { TRI_H, apply, cssMatrix, dot, d20, faceShade, faceTransform, fittedVertices, spinFrames, vertexLabels, type DieVertexName, type Face } from './d20';

export const SPLASH_TIMING = timing;
export type SplashMode = 'full' | 'short' | 'reduced';
export type SplashPhase = 'prep' | 'die' | 'logo' | 'leaving' | 'done';
export interface SplashState { mode: SplashMode; phase: SplashPhase; since: number; ready: boolean }
export type SplashEvent =
  | { type: 'closedReady'; at: number }
  | { type: 'ready'; at: number }
  | { type: 'failed'; at: number }
  | { type: 'tick'; at: number }
  | { type: 'skip'; at: number };

/** Açılış durumu: soğuk açılışta hazırlık (kapalı logo çözülene dek); dönüşte kısa, hareketi azalt'ta statik logo. */
export function initialSplash(kind: 'cold' | 'resume', reduced: boolean, now = 0): SplashState {
  if (reduced) return { mode: 'reduced', phase: 'logo', since: now, ready: true };
  if (kind === 'resume') return { mode: 'short', phase: 'logo', since: now, ready: true };
  return { mode: 'full', phase: 'prep', since: now, ready: false };
}

/** Logo sahnesinin süresi (leaving'e kadar). */
export const holdMs = (mode: SplashMode): number =>
  mode === 'full' ? timing.logo.leaveAfter : mode === 'short' ? timing.resume.fadeInMs + timing.resume.holdMs : timing.reduced.fadeInMs + timing.reduced.holdMs;
export const fadeMs = (mode: SplashMode): number =>
  mode === 'full' ? timing.fadeMs : mode === 'short' ? timing.resume.fadeMs : timing.reduced.fadeMs;
/** Zar sahnesinin süresi: dönüş + 20 önde duruş ve parlama. */
export const dieMs = (): number => timing.die.spinMs + timing.die.holdMs;
/** Soğuk açılışın toplam süresi (hazırlıktan sonra; görseller zamanında yüklenirse, atlamasız). */
export const totalMs = (): number => dieMs() + holdMs('full') + fadeMs('full');

/** Bir sonraki kendiliğinden geçişin zamanı (yoksa null). */
export function nextDeadline(s: SplashState): number | null {
  switch (s.phase) {
    case 'prep': return s.since + timing.prepTimeoutMs;
    case 'die': return s.since + dieMs() + (s.ready ? 0 : timing.assetTimeoutMs);
    case 'logo': return s.since + holdMs(s.mode);
    case 'leaving': return s.since + fadeMs(s.mode);
    default: return null;
  }
}

const reducedLogo = (at: number): SplashState => ({ mode: 'reduced', phase: 'logo', since: at, ready: true });
const toLogo = (s: SplashState, at: number, ok: boolean): SplashState =>
  ok ? { ...s, phase: 'logo', since: at, ready: true } : reducedLogo(at);

export function splashReducer(s: SplashState, e: SplashEvent): SplashState {
  if (s.phase === 'done') return s;
  switch (e.type) {
    case 'closedReady':
      // Kapalı logo hazır: logo ve zar birlikte başlar (saat buradan).
      return s.phase === 'prep' ? { ...s, phase: 'die', since: e.at } : s;
    case 'ready':
      if (s.ready || (s.phase !== 'prep' && s.phase !== 'die')) return s;
      // Dönüş bitmiş ve görsel bekleniyorsa hemen logo sahnesi.
      return s.phase === 'die' && e.at >= s.since + dieMs() ? toLogo(s, e.at, true) : { ...s, ready: true };
    case 'failed':
      return s.phase === 'prep' || s.phase === 'die' ? reducedLogo(e.at) : s;
    case 'skip':
      if (s.phase === 'prep') return reducedLogo(e.at);
      if (s.phase === 'die') return toLogo(s, e.at, s.ready);
      return s.phase === 'logo' ? { ...s, phase: 'leaving', since: e.at } : s;
    case 'tick': {
      const d = nextDeadline(s);
      if (d === null || e.at < d) return s;
      if (s.phase === 'prep') return reducedLogo(e.at); // yavaş ağ: zar sahnesi atlanır
      if (s.phase === 'die') return toLogo(s, e.at, s.ready);
      if (s.phase === 'logo') return { ...s, phase: 'leaving', since: e.at };
      return { ...s, phase: 'done', since: e.at };
    }
  }
}

export type LayerId = 'kanat-sol' | 'kanat-sag' | 'govde' | 'yazi';
interface Box { x: number; y: number; w: number; h: number }
const pct = (v: number) => `${Math.round(v * 100000) / 1000}%`;

/**
 * Katmanın sahnedeki yeri (yüzde). Kanatlarda (Görev L4) dönme noktası kanadın kökü (gövdeye en yakın uç) ve katlı
 * başlangıç pozu: kök kapalı kanadın köküne, uç kapalı kanadın ucuna gelecek öteleme, dönme ve ölçek
 * (`--fold`; `data/logo.json` `acilis.fold`, öteleme katman kutusu yüzdesi).
 */
export function layerStyle(id: LayerId): Record<string, string> {
  const l = acilis.layers[id] as { box: Box };
  const b = l.box;
  const style: Record<string, string> = { left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) };
  if (id === 'kanat-sol' || id === 'kanat-sag') {
    const f = acilis.fold[id];
    style.transformOrigin = `${pct((f.root.x - b.x) / b.w)} ${pct((f.root.y - b.y) / b.h)}`;
    style['--fold'] = `translate(${pct(f.dx / b.w)}, ${pct(f.dy / b.h)}) rotate(${f.rotate}deg) scale(${f.scale})`;
  }
  return style;
}

/**
 * Gözden çıkan keskin ışık (Görev L3): kare kutu (sahne eninin `boxW` oranı), merkezi geniş logodaki gözde; ışık
 * kapalı kanatlı katmandaki gözden çıkar ve kanatlar açılırken geniş logodakine kayar (`--eye-dx/--eye-dy`, kutu
 * yüzdesi; iki çizimde ejderhanın başı farklı durduğundan göz birkaç yüzde kayık, `data/logo.json` `closed.align`).
 */
export function eyeStyle(): Record<string, string> {
  const box = timing.logo.eye.boxW;
  const { wide, closed } = eyePoints();
  return {
    left: pct(wide.x), top: pct(wide.y), width: pct(box), marginLeft: pct(-box / 2), marginTop: pct(-box / 2),
    '--eye-dx': pct((closed.x - wide.x) / box), '--eye-dy': pct((closed.y - wide.y) / acilis.aspect / box),
  };
}

/**
 * Göz noktaları sahne oranında (Görev L5): elle bulunan değerler (`data/acilis-ekrani.json` `eyes`); kapalı logonun
 * gözü kare kaynaktan kapalı katmanın sahnedeki kutusuyla dönüştürülür.
 */
export function eyePoints(): { wide: { x: number; y: number }; closed: { x: number; y: number } } {
  const b = acilis.closed.box, c = timing.eyes.closed;
  return { wide: timing.eyes.wide, closed: { x: b.x + c.x * b.w, y: b.y + c.y * b.h } };
}

/** Kapalı kanatlı (zarsız) katmanların sahnedeki kutusu: altıgen dış sınırı geniş logodakiyle çakışır. */
export const closedStyle = (): Record<string, string> => {
  const b = acilis.closed.box;
  return { left: pct(b.x), top: pct(b.y), width: pct(b.w), height: pct(b.h) };
};
/** Kapalı kanatlı logonun gövde ve kanat katmanları (yolları data/acilis-ekrani.json'dan; npm run logo üretir). */
export const CLOSED_BODY = timing.closedLayers.body;
export const CLOSED_WINGS = timing.closedLayers.wings;
export const SPLASH_ASPECT = acilis.aspect;
export const layerFile = (id: LayerId): string => `logo/acilis-${id}.webp`;
export const FULL_LOGO = 'logo/logo-acilis.webp';

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const inline = (s: Record<string, string>) => Object.entries(s).map(([k, v]) => `${kebab(k)}:${v}`).join(';');

// --- 3D d20 (Görev L2) ---
const GEO = d20();
/** Zar sahnesinin dönüş animasyonu adı (keyframes `splashDieCss`). */
export const DIE_SPIN = 'splash-die-spin';

type V2 = [number, number];
interface DieModel {
  linePx: number;
  vertices: Record<DieVertexName, V2>;
  faces: Record<string, { gray: V2[]; top: string; bottom: string; rim: string; number: { c: V2; heightPx: number; angle: number } }>;
}
/** Logodaki zarın 2B modeli (`npm run logo`, `data/logo.json` `acilis.dieModel`; Görev L5). */
const MODEL = acilis.dieModel as unknown as DieModel;
const SRC_W = (logoChecks.acilis.source as number[])[0]!;
const P_EM = timing.die.perspectiveEm;

/**
 * Zarın sahnedeki yeri (Görev L5): çapa logodaki zarın silüet merkezi (köşelerin x ve y uçlarının ortası), em sahne
 * eninin oranı (silüet eni / 1,618 ≈ kenar 1). `toEm`: tuval oranı → zar merkezine göre em.
 */
export function dieLayout(): { em: number; left: number; top: number; toEm: (p: V2) => V2 } {
  const v = Object.values(MODEL.vertices);
  const xs = v.map((p) => p[0]), ys = v.map((p) => p[1]);
  const left = (Math.min(...xs) + Math.max(...xs)) / 2, top = (Math.min(...ys) + Math.max(...ys)) / 2;
  const em = (MODEL.vertices.UR[0] - MODEL.vertices.UL[0]) / 1.618;
  return { em, left, top, toEm: (p) => [(p[0] - left) / em, (p[1] - top) / acilis.aspect / em] };
}
const LAYOUT = dieLayout();
const TARGETS = Object.fromEntries(Object.entries(MODEL.vertices).map(([k, p]) => [k, LAYOUT.toEm(p)])) as Record<DieVertexName, V2>;
/** Gövde koordinatında ağ: son pozda görünen 9 köşe logodakine oturur. */
const VERTS = fittedVertices(GEO.faces, GEO.R0, TARGETS, P_EM);
/** Son pozda bir köşenin ekran konumu (em, perspektifle). */
const screenOf = (i: number): V2 => { const q = apply(GEO.R0, VERTS[i]!); const k = P_EM / (P_EM - q[2]); return [q[0] * k, q[1] * k]; };
/** Son pozda ağın logodaki köşelere uzaklığı (em; test ve doğrulama). */
export function fitError(): number {
  const lab = vertexLabels(GEO.faces);
  return Math.max(...(Object.entries(lab) as Array<[DieVertexName, number]>).map(([k, i]) => Math.hypot(screenOf(i)[0] - TARGETS[k][0], screenOf(i)[1] - TARGETS[k][1])));
}

/** Logodaki zarın merkezi (ışık parlaması buradan; sahne yüzdesi). */
export const dieCenterStyle = (): Record<string, string> => ({ left: pct(LAYOUT.left), top: pct(LAYOUT.top) });

/**
 * Yüzler satır içi SVG (clip-path 3D dönüşümde kenar yumuşatmıyor; Görev L5'te logodaki zara benzetildi): siyah dış
 * üçgen (logodaki çizgi kalınlığının yarısı kadar her yüzde), açık gri kenar bandı ve ölçülen renklerle üstten alta
 * gradyanlı iç üçgen. Gradyan aynı `<svg>` içinde tanımlı (yüz başına tek kimlik; L4'teki ortak, başka svg'deki
 * gradyana başvuru kopabiliyordu). Rakam logodaki yerinde, açısında ve boyunda: yüzün son pozdaki eğikliği rakamın
 * dönüşümünde tersine çevrilir (ekranda dik, eğilmemiş yazı).
 */
const PAD = 0.06; // yüz div'inin saydam payı (em)
const VB = { A: [500, 0] as V2, B: [1000, 866] as V2, C: [0, 866] as V2 }; // yerel üçgen (viewBox birimi; 1000 = 1 em)
const LOCAL = { A: [PAD + 0.5, PAD] as V2, B: [PAD + 1, PAD + TRI_H] as V2, C: [PAD, PAD + TRI_H] as V2 }; // em
const hex2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
/** Opak yüz rengi: gümüş-gri taban (#b4b6bb) ışık katsayısıyla (logoda görünmeyen arka yüzler). */
export function faceFill(shade: number): string {
  return `#${hex2(180 * shade)}${hex2(182 * shade)}${hex2(187 * shade)}`;
}
/** Yerel üçgeni iç teğet merkezine doğru `d` (yerel birim) içeri kaydırır. */
function insetLocal(d: number): string {
  const [a, b, c] = [VB.A, VB.B, VB.C];
  const L = 1000, per = 3 * L, I: V2 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
  const r = (2 * ((L * 866) / 2)) / per;
  const k = (r - d) / r;
  return [a, b, c].map((p) => `${Math.round(I[0] + (p[0] - I[0]) * k)},${Math.round(I[1] + (p[1] - I[1]) * k)}`).join(' ');
}
/** 2x2 matris işlemleri (sütun vektörlü). */
const inv2 = (m: number[]) => { const d = m[0]! * m[3]! - m[1]! * m[2]!; return [m[3]! / d, -m[1]! / d, -m[2]! / d, m[0]! / d]; };
const mul2 = (m: number[], n: number[]) => [m[0]! * n[0]! + m[1]! * n[2]!, m[0]! * n[1]! + m[1]! * n[3]!, m[2]! * n[0]! + m[3]! * n[2]!, m[2]! * n[1]! + m[3]! * n[3]!];

function faceHtml(f: Face): string {
  const n = f.number;
  const m = MODEL.faces[String(n)];
  const [ia, ib, ic] = f.v;
  // Yerel (em) → ekran (em) afin dönüşümü son pozda: S = M·l + t.
  const sA = screenOf(ia), sB = screenOf(ib), sC = screenOf(ic);
  const e1: V2 = [sB[0] - sC[0], sB[1] - sC[1]]; // yerel x (C→B, 1 em)
  const mid: V2 = [(sB[0] + sC[0]) / 2, (sB[1] + sC[1]) / 2];
  const e2: V2 = [(mid[0] - sA[0]) / TRI_H, (mid[1] - sA[1]) / TRI_H]; // yerel y (A→BC ortası)
  const M = [e1[0], e2[0], e1[1], e2[1]]; // [[a b][c d]]
  const t: V2 = [sC[0] - (M[0]! * LOCAL.C[0] + M[1]! * LOCAL.C[1]), sC[1] - (M[2]! * LOCAL.C[0] + M[3]! * LOCAL.C[1])];
  const scale = Math.sqrt(Math.abs(M[0]! * M[3]! - M[1]! * M[2]!)) || 1; // yerel 1 em ≈ ekranda `scale` em
  const pxToLocal = (px: number) => ((px / SRC_W / LAYOUT.em) / scale) * 1000; // kaynak piksel → viewBox birimi
  const line = pxToLocal(MODEL.linePx / 2), rim = pxToLocal(5);
  const p = PAD * 1000;
  let fills: string, defs = '';
  if (m) {
    // Üstten alta gradyan: son pozda en üstteki ve en alttaki köşe.
    const loc = [VB.A, VB.B, VB.C], ys = [sA[1], sB[1], sC[1]];
    const top = loc[ys.indexOf(Math.min(...ys))]!, bot = loc[ys.indexOf(Math.max(...ys))]!;
    defs = `<defs><linearGradient id="d20g-${n}" gradientUnits="userSpaceOnUse" x1="${top[0]}" y1="${top[1]}" x2="${bot[0]}" y2="${bot[1]}">`
      + `<stop offset="0.15" stop-color="${m.top}"/><stop offset="0.85" stop-color="${m.bottom}"/></linearGradient></defs>`;
    fills = `<polygon points="${insetLocal(line)}" fill="${m.rim}"/><polygon points="${insetLocal(line + rim)}" fill="url(#d20g-${n})"/>`;
  } else {
    fills = `<polygon points="${insetLocal(line)}" fill="${faceFill(faceShade(f, GEO.R0))}"/>`;
  }
  const svg = `<svg viewBox="${-p} ${-p} ${1000 + 2 * p} ${866 + 2 * p}" aria-hidden="true">${defs}<polygon points="${insetLocal(0)}" fill="#0b0b0c"/>${fills}</svg>`;
  let num: string;
  if (m) {
    const S = LAYOUT.toEm(m.number.c);
    const Mi = inv2(M);
    const dx = S[0] - t[0], dy = S[1] - t[1];
    const lx = Mi[0]! * dx + Mi[1]! * dy, ly = Mi[2]! * dx + Mi[3]! * dy;
    const a = (m.number.angle * Math.PI) / 180;
    const T = mul2(Mi, [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)]);
    const capEm = m.number.heightPx / SRC_W / LAYOUT.em;
    const r6 = (v: number) => Math.round(v * 1e5) / 1e5;
    // left/top yüz kutusunun yüzdesi (em, <b>'nin kendi yazı boyutuna göre olurdu).
    num = `<b class="d20n${n === 18 ? ' it' : ''}" style="left:${r6((lx / (1 + 2 * PAD)) * 100)}%;top:${r6((ly / (TRI_H + 2 * PAD)) * 100)}%;font-size:${r6(capEm / CAP)}em;transform:matrix(${[T[0]!, T[2]!, T[1]!, T[3]!].map(r6).join(',')},0,0) translate(-50%,-50%)">${n}</b>`;
  } else {
    num = `<b class="d20n back">${n}</b>`;
  }
  const size = `width:${1 + 2 * PAD}em;height:${Math.round((TRI_H + 2 * PAD) * 1e4) / 1e4}em`;
  return `<div class="d20f" style="${size};transform:${faceTransform(f, PAD, VERTS)}">${svg}${num}</div>`;
}
/** Rakam yazı tipinin büyük harf/rakam yüksekliği (font-size oranı; Arial Black ≈ 0,72). */
const CAP = 0.72;

/**
 * Zar HTML'i: sahne (perspektif, sahnedeki yer), gövde (preserve-3d, ilk yönelim) ve 20 yüz.
 */
export function dieHtml(): string {
  const first = spinFrames(GEO.R0, timing.die.turns)[0]!.m;
  return `<div class="splash-die" style="left:${pct(LAYOUT.left)};top:${pct(LAYOUT.top)};font-size:calc(var(--stage-w) * ${Math.round(LAYOUT.em * 1e5) / 1e5});perspective:${P_EM}em">`
    + `<div class="splash-die-body" style="transform:${cssMatrix(first)}">${GEO.faces.map(faceHtml).join('')}</div></div>`;
}

/** Zar dönüşünün @keyframes metni (index.html'deki satır içi stile eklenir). */
export function splashDieCss(): string {
  return `@keyframes ${DIE_SPIN}{${spinFrames(GEO.R0, timing.die.turns).map((f) => `${Math.round(f.at * 100000) / 1000}%{transform:${cssMatrix(f.m)}}`).join('')}}`;
}

/** Zarın son yönelimde ekrana bakan yüzü (test ve doğrulama için). */
export const frontFace = (): number => GEO.faces.reduce((a, b) => (dot(GEO.R0[2], b.normal) > dot(GEO.R0[2], a.normal) ? b : a)).number;
export const dieFaces = () => GEO.faces;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * İlk statik kare (index.html, JavaScript yüklenmeden; React ağacının dışında `#splash-static`): yalnızca koyu zemin
 * (Görev L4: zar logosuz görünmesin; kapalı logo çözülünce logo ve zar birlikte başlar). Tembel açılış bileşeni
 * kendi ilk karesini çizince bunu kaldırır.
 */
export function splashStaticHtml(label: string): string {
  return `<div id="splash-static" class="splash" role="img" aria-label="${esc(label)}"></div>`;
}
