/**
 * 3D zar atışı (Görev J3, seçenek A): düşük çözünürlüklü (192×128) WebGL tuvali, büyütülüp piksel keskin gösterilir.
 * Zarlar sahte fizikle (`throw.ts`) fırlatılır, seker, yuvarlanır, gölge düşürür ve önceden belli sonuca oturur.
 * Yüzlerdeki sayılar tuval dokusu. Renkler temadan (`data/zar-gorselleri.json` "three"). three.js yalnızca bu
 * parçada; zar tepsisi 3D'ye izin verdiğinde tembel yüklenir. Atışın kare hızı `onFps` ile bildirilir (yavaşsa oturumda 2D'ye dönülür).
 * Yalnızca sunum: motor, kayıt ve elle zar girişi bundan habersiz.
 */
import { useEffect, useRef } from 'react';
import {
  AmbientLight, BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color, DirectionalLight, Mesh,
  LinearMipmapLinearFilter, MeshBasicMaterial, MeshLambertMaterial, NearestFilter, PerspectiveCamera, RingGeometry, Scene, WebGLRenderer,
} from 'three';
import type { DiceRoll } from '../../battle';
import { keptIndex } from '../diceAnim';
import { emitDiceSound } from '../diceSound';
import type { Dice3DColors } from '../diceTheme';
import { cross, dot, sub, visualRandom, type Vec3 } from './math';
import { restingQuat, visibleDice, type DieShape } from './shapes';
import { bounceTimes, frameAt, layout, makePath, type DiePath } from './throw';

export const CANVAS_W = 192;
export const CANVAS_H = 128;
const CELL = 64;

/** Yüz dokusu atlası: her yüz bir hücre; sayı hücrenin ortasında, yüzün "yukarı" yönüne göre dik. */
function atlas(shape: DieShape, colors: Dice3DColors): { canvas: HTMLCanvasElement; uv: (face: number, p: Vec3) => [number, number] } {
  const n = shape.faces.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * CELL;
  canvas.height = rows * CELL;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D;
  g.imageSmoothingEnabled = false;
  g.fillStyle = colors.body;
  g.fillRect(0, 0, canvas.width, canvas.height);
  // Yüz düzleminde 2B koordinat: x sağ, y yukarı (yazının yönü); bütün yüzler aynı ölçekte.
  const local = (fi: number, p: Vec3): [number, number] => {
    const f = shape.faces[fi] as DieShape['faces'][number];
    const right = cross(f.up, f.normal);
    const d = sub(p, f.center);
    return [dot(d, right), dot(d, f.up)];
  };
  let ext = 0;
  shape.faces.forEach((f, fi) => f.verts.forEach((k) => { const [x, y] = local(fi, shape.vertices[k] as Vec3); ext = Math.max(ext, Math.abs(x), Math.abs(y)); }));
  ext *= 1.06;
  const px = (fi: number, p: Vec3): [number, number] => {
    const [x, y] = local(fi, p);
    const col = fi % cols, row = Math.floor(fi / cols);
    return [(col + 0.5 + x / (2 * ext)) * CELL, (row + 0.5 - y / (2 * ext)) * CELL];
  };
  shape.faces.forEach((f, fi) => {
    const pts = f.verts.map((k) => px(fi, shape.vertices[k] as Vec3));
    g.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillStyle = colors.face;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = colors.edge;
    g.stroke();
    const [cx, cy] = px(fi, f.center);
    g.fillStyle = colors.number;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (shape.vertexLabels) {
      // d4: her köşenin değeri o köşeye yakın, yazının üstü köşeye bakar.
      f.verts.forEach((k, i) => {
        const [vx, vy] = pts[i] as [number, number];
        g.save();
        g.translate(cx + (vx - cx) * 0.55, cy + (vy - cy) * 0.55);
        g.rotate(Math.atan2(vx - cx, -(vy - cy)));
        g.font = `bold ${Math.round(CELL * 0.26)}px system-ui, sans-serif`;
        g.fillText(shape.vertexLabels?.[k] ?? '', 0, 0);
        g.restore();
      });
      return;
    }
    const big = f.label.length > 1;
    const size = shape.sides === 20 ? 0.4 : shape.sides === 10 ? 0.36 : shape.sides === 12 ? 0.44 : big ? 0.38 : 0.46;
    g.font = `bold ${Math.round(CELL * size)}px system-ui, sans-serif`;
    const yOff = shape.sides === 20 || shape.sides === 8 ? CELL * 0.05 : shape.sides === 10 ? CELL * 0.08 : 0;
    g.fillText(f.label, cx, cy + yOff);
    // 6 ve 9 karışmasın: altı çizgili.
    if ((f.label === '6' || f.label === '9') && shape.sides > 6) g.fillRect(cx - CELL * 0.08, cy + yOff + CELL * 0.14, CELL * 0.16, 2);
  });
  return {
    canvas,
    uv: (fi, p) => { const [x, y] = px(fi, p); return [x / canvas.width, 1 - y / canvas.height]; },
  };
}

function geometry(shape: DieShape, uv: (face: number, p: Vec3) => [number, number]): BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uvs: number[] = [];
  shape.faces.forEach((f, fi) => {
    for (let i = 1; i < f.verts.length - 1; i++) {
      for (const k of [f.verts[0], f.verts[i], f.verts[i + 1]] as number[]) {
        const v = shape.vertices[k] as Vec3;
        pos.push(...v);
        nor.push(...f.normal);
        uvs.push(...uv(fi, v));
      }
    }
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nor), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  return g;
}

export default function Dice3D(props: {
  roll: DiceRoll; colors: Dice3DColors; duration: number; seed: number; onFps?: (fps: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const { roll, colors, duration } = props;
    const rand = visualRandom(props.seed);
    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.setSize(CANVAS_W, CANVAS_H, false);
    const scene = new Scene();
    const camera = new PerspectiveCamera(34, CANVAS_W / CANVAS_H, 0.1, 50);
    // Neredeyse tepeden (~72°): sonuç yüzü (üstteki) en büyük ve en okunur yüz; yan yüzler derinlik verir.
    camera.position.set(0, 9.2, 3);
    camera.lookAt(0, 0, 0.15);
    scene.add(new AmbientLight(0xffffff, 1.1));
    const sun = new DirectionalLight(0xffffff, 1.6);
    sun.position.set(-3, 8, 4);
    scene.add(sun);

    const dice = visibleDice(roll.sides, roll.values);
    const { centers, size } = layout(dice.length, rand);
    const kept = keptIndex(roll);
    const twoD20 = roll.sides === 20 && roll.values.length === 2;
    const disposables: Array<{ dispose: () => void }> = [];
    const items = dice.map((d, i) => {
      const art = atlas(d.shape, colors);
      const tex = new CanvasTexture(art.canvas);
      // Büyütmede piksel keskin; küçültmede mipmap: küçük yüzdeki sayı bozulmadan okunur.
      tex.magFilter = NearestFilter;
      tex.minFilter = LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      const geo = geometry(d.shape, art.uv);
      const mat = new MeshLambertMaterial({ map: tex, transparent: true });
      const mesh = new Mesh(geo, mat);
      mesh.scale.setScalar(size);
      scene.add(mesh);
      const shadowMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false });
      const shadow = new Mesh(new CircleGeometry(1, 16), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      scene.add(shadow);
      disposables.push(tex, geo, mat, shadowMat, shadow.geometry);
      const final = restingQuat(d.shape, d.label, (rand() - 0.5) * 0.5);
      const path: DiePath = makePath(centers[i] as Vec3, size, final, d.shape.inradius * size, rand);
      return { d, mesh, mat, shadow, shadowMat, path };
    });

    const place = (t: number) => {
      for (const it of items) {
        const f = frameAt(it.path, t);
        it.mesh.position.set(...f.pos);
        it.mesh.quaternion.set(...f.quat);
        it.shadow.position.set(f.pos[0], 0.01, f.pos[2]);
        it.shadow.scale.setScalar(size * (0.85 + f.height * 0.15));
        it.shadowMat.opacity = 0.38 * f.shadow;
      }
    };

    /** Durunca vurgular: avantajda sayılmayan d20 soluk, sayılana halka; doğal 20 altın, doğal 1 kırmızı parıltı. */
    const settle = () => {
      items.forEach((it) => {
        const v = roll.values[it.d.valueIndex] ?? 0;
        const isKept = !twoD20 || it.d.valueIndex === kept;
        const crit = roll.sides === 20 && isKept && v === 20;
        const fumble = roll.sides === 20 && isKept && v === 1;
        if (twoD20 && !isKept) it.mat.opacity = 0.42;
        if (crit || fumble) { it.mat.emissive = new Color(crit ? colors.crit : colors.fumble); it.mat.emissiveIntensity = 0.35; }
        if (twoD20 && isKept) {
          const ringMat = new MeshBasicMaterial({ color: new Color(colors.ring), transparent: true, opacity: 0.9 });
          const ring = new Mesh(new RingGeometry(size * 1.05, size * 1.3, 24), ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(it.path.rest[0], 0.02, it.path.rest[2]);
          scene.add(ring);
          disposables.push(ringMat, ring.geometry);
        }
        emitDiceSound({ type: 'settle', sides: roll.sides, crit, fumble });
      });
    };

    const bounces = bounceTimes();
    let next = 0;
    let raf = 0;
    const t0 = performance.now();
    let frames = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / Math.max(1, duration));
      frames++;
      while (next < bounces.length && t >= (bounces[next] as { t: number }).t) {
        emitDiceSound({ type: 'bounce', sides: roll.sides, strength: (bounces[next] as { strength: number }).strength });
        next++;
      }
      place(t);
      if (t >= 1) settle();
      renderer.render(scene, camera);
      if (t < 1) { raf = requestAnimationFrame(tick); return; }
      const fps = frames / Math.max(0.001, (now - t0) / 1000);
      canvas.dataset.fps = fps.toFixed(1);
      props.onFps?.(fps);
    };
    place(0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      for (const d of disposables) d.dispose();
      renderer.dispose();
    };
    // Her zar grubu ayrı bileşen (çağıran key verir).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <canvas ref={ref} className="dice3d" width={CANVAS_W} height={CANVAS_H} aria-hidden="true" />;
}

