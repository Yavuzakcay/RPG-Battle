/**
 * Kuyruk 16 K16A: `npm run sprite-ice` magenta anahtar halesi. Görsel dosyası yok: zeytin gövde + magenta zemin +
 * magenta/yeşil karışık yumuşak kenarlı sentetik görüntü bellekte üretilir.
 */
import { describe, expect, it } from 'vitest';

type Sharp = (input: Uint8Array, o?: { raw: { width: number; height: number; channels: 4 } }) => {
  png(): { toBuffer(): Promise<Uint8Array> };
  ensureAlpha(): { raw(): { toBuffer(o: { resolveWithObject: true }): Promise<{ data: Uint8Array; info: { width: number; height: number } }> } };
};

describe('sprite-ice magenta hale', () => {
  it('zeytin gövdenin kenarında magenta kalmaz; gövdenin kendi tonu korunur', async () => {
    const sharpMod = 'sharp';
    const sharp = ((await import(/* @vite-ignore */ sharpMod)) as { default: Sharp }).default;
    const ice = 'scripts/sprite-ice.mjs';
    const { processSprite } = (await import(/* @vite-ignore */ `../../${ice}`)) as { processSprite: (f: Uint8Array, o: { size: number; tol?: number; shadow?: boolean }) => Promise<{ buffer: Uint8Array }> };
    const W = 96, H = 96, cx = 48, cy = 48, R = 30;
    const raw = new Uint8Array(W * H * 4);
    const olive = [154, 147, 72], mag = [255, 0, 255], green = [40, 200, 60];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy);
      // İçeride zeytin; 2 px'lik yumuşak kenarda zeytin + magenta karışımı, bazı kenar piksellerinde yeşil de karışık.
      const t = Math.max(0, Math.min(1, (d - (R - 1)) / 2.5));
      const mix = (x + y) % 5 === 0 ? mag.map((m, k) => (m + green[k]!) / 2) : mag;
      const c = olive.map((o, k) => Math.round(o * (1 - t) + mix[k]! * t));
      raw.set([c[0]!, c[1]!, c[2]!, 255], (y * W + x) * 4);
    }
    const png = await sharp(raw, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    const out = await processSprite(png, { size: 128, shadow: false });
    const { data, info } = await sharp(out.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let opaque = 0, magenta = 0, offTone = 0;
    for (let i = 0; i < info.width * info.height * 4; i += 4) {
      if (data[i + 3]! < 128) continue;
      opaque++;
      const [r, g, b] = [data[i]!, data[i + 1]!, data[i + 2]!];
      if (Math.min(r, b) - g > 10) magenta++;
      // Zeytin-sarı tonu: R ≈ G > B.
      if (!(r >= b && g >= b - 10)) offTone++;
    }
    expect(opaque).toBeGreaterThan(Math.PI * (R - 3) ** 2);
    expect(magenta).toBe(0);
    expect(offTone).toBe(0);
  }, 30000);
});
