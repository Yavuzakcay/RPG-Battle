/**
 * SRD 5.2.1 PDF'ini (docs/SRD_CC_v5.2.1.pdf) satırlara çevirir (Görev N). pdfjs-dist ile her metin parçasının
 * konumu, yazı tipi ve boyutu okunur; iki sütunlu sayfa, okuma sırasına (sol sütun, sonra sağ) dizilir.
 * Yazı tipi + boyut, başlık düzeyini verir:
 *   h26 bölüm (Classes, Feats), h18 alt bölüm (Barbarian), h14 (Barbarian Subclass: …), h12 (Level 1: Rage,
 *   feat/büyü/eşya adı), cap (tablo başlığı, 10.5), body (Cambria), sans (tablo hücresi, GillSans).
 * Tablolar için ayrıca sütun ayrımı yapmadan, y'ye göre tam genişlik satırlar (`rowsBetween`).
 */
import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const SRD_PDF = new URL('../../docs/SRD_CC_v5.2.1.pdf', import.meta.url);

/** Parçanın türü: yazı tipi ve boyuttan. */
function kindOf(font, size) {
  const sans = font.startsWith('GillSans');
  const semi = /SemiBold|Bold/.test(font);
  if (sans && semi && size >= 25) return 'h26';
  if (sans && semi && size >= 17) return 'h18';
  if (sans && semi && size >= 13.5) return 'h14';
  if (sans && semi && size >= 11.5 && !/SC700/.test(font)) return 'h12';
  if (sans && semi && /SC700/.test(font)) return 'sc';
  if (sans && semi && size >= 10.2) return 'cap';
  if (sans && semi) return 'sansB';
  if (sans && /Italic/.test(font)) return 'sansI';
  if (sans) return 'sans';
  if (/BoldItalic/.test(font)) return 'bodyBI';
  if (/Bold/.test(font)) return 'bodyB';
  if (/Italic/.test(font)) return 'bodyI';
  return 'body';
}

/**
 * Bütün sayfaların parçaları: { page, x, y, w, size, font, kind, str }. Altbilgi (y < 40) atılır.
 * Önbellek: aynı çalıştırmada bir kez okunur.
 */
let cache = null;
export async function loadItems() {
  if (cache) return cache;
  const data = new Uint8Array(fs.readFileSync(SRD_PDF));
  const doc = await getDocument({ data, verbosity: 0, useSystemFonts: false }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const p = await doc.getPage(n);
    await p.getOperatorList();
    const tc = await p.getTextContent();
    const items = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      let font = '?';
      try { font = p.commonObjs.get(it.fontName).name.replace(/^.*\+/, ''); } catch { /* yok */ }
      const size = Math.abs(it.transform[0]);
      const y = it.transform[5];
      if (y < 40) continue;
      // Boşluk parçaları sözcük ayırıcı olarak tutulur (satırda boşluğa çevrilir).
      items.push({ page: n, x: it.transform[4], y, w: it.width, size, font, kind: kindOf(font, size), str: it.str, space: !it.str.trim() });
    }
    pages.push(items);
    p.cleanup();
  }
  cache = pages;
  return pages;
}

const MID = 297;

/** Parçaları satıra toplar (aynı y), soldan sağa; küçük boyutlu küçük harf (SC) parçaları küçük harfe çevrilir. */
function toLines(items) {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) < 2.5) last.items.push(it);
    else lines.push({ y: it.y, items: [it] });
  }
  return lines.map((l) => {
    const its = l.items.sort((a, b) => a.x - b.x);
    const maxSize = Math.max(...its.map((i) => i.size));
    const spans = [];
    let prevEnd = null;
    let pendingSpace = false;
    for (const i of its) {
      if (i.space) { pendingSpace = true; continue; }
      let s = i.str;
      if (i.kind === 'sc' && i.size < maxSize - 1) s = s.toLowerCase();
      const gap = prevEnd === null ? 0 : i.x - prevEnd;
      const kind = i.kind === 'sc' ? 'h12' : i.kind;
      const last = spans[spans.length - 1];
      if (last && last.kind === kind && gap < 2.5) last.text += pendingSpace ? ` ${s}` : s;
      else if (last && last.kind === kind && gap < 6) last.text += (last.text.endsWith(' ') || s.startsWith(' ') ? '' : ' ') + s;
      else spans.push({ kind, text: s, x: i.x, size: i.size });
      prevEnd = i.x + i.w;
      pendingSpace = false;
    }
    for (const sp of spans) sp.text = sp.text.replace(/\s+/g, ' ').trim();
    const real = its.find((i) => !i.space) ?? its[0];
    return { page: real.page, y: l.y, x: real.x, spans: spans.filter((s) => s.text) };
  }).filter((l) => l.spans.length > 0);
}

/**
 * Okuma sırasındaki satırlar: her sayfada sol sütun (x < 297), sonra sağ sütun. Her satır:
 * { page, col, y, x, spans: [{kind, text, x, size}], text, kind (ilk parçanın türü) }.
 */
export async function readingLines(fromPage = 1, toPage = Infinity) {
  const pages = await loadItems();
  const out = [];
  pages.forEach((items, i) => {
    const n = i + 1;
    if (n < fromPage || n > toPage) return;
    for (const col of [0, 1]) {
      const its = items.filter((it) => (col === 0 ? it.x < MID : it.x >= MID));
      if (its.every((it) => it.space)) continue;
      for (const l of toLines(its)) out.push({ ...l, col, text: l.spans.map((s) => s.text).join(' '), kind: l.spans[0].kind });
    }
  });
  return out;
}

/** Tam genişlik satırlar (sütun ayrımı yok): tablolar için. `filter` parça seçer. */
export async function fullRows(page, filter = () => true) {
  const pages = await loadItems();
  return toLines((pages[page - 1] ?? []).filter(filter));
}

/** Satırların gövde metnini birleştirir: satır sonu tirelerini kaldırır, paragrafları "\n" ile ayırır. */
export function joinBody(lines) {
  let out = '';
  let left = null;
  for (const l of lines) {
    const t = l.text;
    const first = l.spans[0];
    const indent = left !== null && l.x - left > 4 && l.x - left < 40;
    const newPara = out === '' || first.kind === 'bodyBI' || first.kind === 'bodyB' || t.startsWith('•') || indent || l.kind !== 'body';
    if (left === null || l.x < left) left = l.x;
    if (out === '') out = t;
    else if (newPara) out += `\n${t}`;
    else if (/[a-z]-$/.test(out) && /^[a-z]/.test(t)) out = out.slice(0, -1) + t;
    else out += ` ${t}`;
  }
  return out.trim();
}

/** Gövde satırlarını paragraflara böler: [{ label?, text }]; etiket, kalın-italik/kalın girişli paragrafın başlığı. */
export function paragraphs(lines) {
  const out = [];
  let left = null;
  for (const l of lines) {
    const first = l.spans[0];
    const indent = left !== null && l.x - left > 4 && l.x - left < 40;
    const lead = first.kind === 'bodyBI' || first.kind === 'bodyB';
    const fresh = out.length === 0 || lead || l.text.startsWith('•') || indent;
    if (left === null || l.x < left) left = l.x;
    if (fresh) {
      const p = { text: l.text };
      if (lead) p.label = first.text.replace(/[.:]$/, '');
      out.push(p);
      continue;
    }
    const p = out[out.length - 1];
    if (/[a-z]-$/.test(p.text) && /^[a-z]/.test(l.text)) p.text = p.text.slice(0, -1) + l.text;
    else p.text += ` ${l.text}`;
  }
  return out;
}

/** Ham parçalardan tablo satırları: y'ye göre gruplanır, her hücre { x, w, text, kind }; yakın parçalar birleşir. */
export async function tableRows(page, filter) {
  const pages = await loadItems();
  const its = (pages[page - 1] ?? []).filter((it) => !it.space && filter(it)).sort((a, b) => b.y - a.y || a.x - b.x);
  const rows = [];
  for (const it of its) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - it.y) < 2.5) last.items.push(it);
    else rows.push({ y: it.y, items: [it] });
  }
  return rows.map((r) => {
    const cells = [];
    for (const it of r.items.sort((a, b) => a.x - b.x)) {
      const last = cells[cells.length - 1];
      if (last && it.x - (last.x + last.w) < 3 && last.kind === it.kind) {
        last.text += it.str;
        last.w = it.x + it.w - last.x;
      } else cells.push({ x: it.x, w: it.w, text: it.str, kind: it.kind });
    }
    for (const c of cells) c.text = c.text.replace(/\s+/g, ' ').trim();
    return { y: r.y, page, cells: cells.filter((c) => c.text) };
  }).filter((r) => r.cells.length > 0);
}
