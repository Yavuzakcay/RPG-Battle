/**
 * Kuyruk H1: dünya haritası işaretleri (düğüm ve merkezler). Düz sarı kare/nokta yerine küçük simgeler: yerleşim = ev,
 * iskele = çapa, savaş = çapraz kılıç, yer = pusula yıldızı. Ekran koordinatında; boy yakınlaştırmayla (uzakta kaybolur),
 * koyu ince kenar. Etiket kutularıyla çakışan işaret kutunun altına (sonra yanına) kaçar. Saf (çizim yalnızca `drawMarker`).
 */
export type MarkerKind = 'yerlesim' | 'iskele' | 'savas' | 'yer';
export interface Box { x: number; y: number; w: number; h: number }

/** Ölçek (dünya px / ekran px) → simge boyu (px) ve saydamlık; çok uzakta 0 (çizilmez). */
export function markerStyle(scale: number): { size: number; alpha: number } {
  if (scale >= 9) return { size: 0, alpha: 0 };
  const alpha = scale <= 6 ? 1 : (9 - scale) / 3;
  const size = Math.max(9, Math.min(18, 9 + (6 - Math.min(6, scale)) * 1.8));
  return { size, alpha };
}

const hit = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** İşaretin konumu: etiket kutusuyla çakışırsa önce altına, olmazsa sağına kaydırır (en çok 3 deneme). */
export function avoidLabels(x: number, y: number, size: number, labels: Box[]): [number, number] {
  const box = (cx: number, cy: number): Box => ({ x: cx - size / 2, y: cy - size / 2, w: size, h: size });
  let cx = x, cy = y;
  for (let i = 0; i < 3; i++) {
    const l = labels.find((b) => hit(box(cx, cy), b));
    if (!l) return [cx, cy];
    if (i === 0) cy = l.y + l.h + size / 2 + 2;
    else cx = l.x + l.w + size / 2 + 2;
  }
  return [cx, cy];
}

/** Simgeyi (cx, cy) merkezli `size` boyunda çizer. `fill` iç renk (açık/tamam/kapalı durumuna göre). */
export function drawMarker(g: CanvasRenderingContext2D, kind: MarkerKind, cx: number, cy: number, size: number, fill: string): void {
  const s = size / 2;
  g.save();
  g.translate(cx, cy);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(20,14,8,.9)'; g.lineWidth = Math.max(1.2, size / 10); g.fillStyle = fill;
  g.beginPath();
  if (kind === 'yerlesim') {
    // Ev: çatı üçgeni + gövde.
    g.moveTo(-s, -s * 0.05); g.lineTo(0, -s); g.lineTo(s, -s * 0.05); g.lineTo(s * 0.72, -s * 0.05);
    g.lineTo(s * 0.72, s); g.lineTo(-s * 0.72, s); g.lineTo(-s * 0.72, -s * 0.05); g.closePath();
    g.fill(); g.stroke();
  } else if (kind === 'iskele') {
    // Çapa: halka, gövde, kol, alt kavis.
    g.lineWidth = Math.max(1.6, size / 7);
    g.strokeStyle = 'rgba(20,14,8,.9)';
    const anchor = () => {
      g.beginPath(); g.arc(0, -s * 0.72, s * 0.22, 0, Math.PI * 2);
      g.moveTo(0, -s * 0.5); g.lineTo(0, s * 0.85);
      g.moveTo(-s * 0.45, -s * 0.2); g.lineTo(s * 0.45, -s * 0.2);
      g.moveTo(-s * 0.8, s * 0.25); g.quadraticCurveTo(-s * 0.6, s * 0.95, 0, s * 0.85); g.quadraticCurveTo(s * 0.6, s * 0.95, s * 0.8, s * 0.25);
    };
    g.lineWidth = Math.max(3, size / 3.6); anchor(); g.stroke();
    g.lineWidth = Math.max(1.4, size / 8); g.strokeStyle = fill; anchor(); g.stroke();
  } else if (kind === 'savas') {
    // Çapraz iki kılıç.
    const sword = (sign: 1 | -1) => {
      g.moveTo(-s * 0.85 * sign, s * 0.85); g.lineTo(s * 0.8 * sign, -s * 0.8);
      g.moveTo(-s * 0.55 * sign, s * 0.2); g.lineTo(-s * 0.2 * sign, s * 0.55);
    };
    g.lineWidth = Math.max(3, size / 3.8); sword(1); sword(-1); g.stroke();
    g.beginPath(); g.lineWidth = Math.max(1.4, size / 8); g.strokeStyle = fill; sword(1); sword(-1); g.stroke();
  } else {
    // Yer: dört kollu pusula yıldızı.
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const r = i % 2 === 0 ? s : s * 0.36;
      if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
}
