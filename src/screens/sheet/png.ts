/**
 * Kuyruk KQ4 CK1: kâğıdı PNG'ye çizme, kütüphanesiz: sayfa DOM'u stilleri satır içine alınıp SVG `foreignObject` olarak bir
 * tuvale çizilir (2×). Jeton görselleri veri URL'sine çevrilir. Yalnız tarayıcıda (testlenmez).
 */
async function toDataUrl(img: HTMLImageElement): Promise<string | null> {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    c.getContext('2d')?.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch { return null; }
}

function inlineStyles(src: Element, dst: Element): void {
  const cs = getComputedStyle(src);
  let css = '';
  for (let i = 0; i < cs.length; i++) { const p = cs[i] as string; css += `${p}:${cs.getPropertyValue(p)};`; }
  (dst as HTMLElement).setAttribute('style', css);
  const a = src.children, b = dst.children;
  for (let i = 0; i < a.length; i++) if (b[i]) inlineStyles(a[i] as Element, b[i] as Element);
}

/** Bir kâğıt sayfasını PNG'ye çevirir. */
export async function pageToPng(page: HTMLElement, scale = 2): Promise<Blob> {
  const w = page.offsetWidth, h = page.offsetHeight;
  const clone = page.cloneNode(true) as HTMLElement;
  inlineStyles(page, clone);
  const srcImgs = [...page.querySelectorAll('img')], dstImgs = [...clone.querySelectorAll('img')];
  for (let i = 0; i < srcImgs.length; i++) {
    const url = await toDataUrl(srcImgs[i] as HTMLImageElement);
    if (url) (dstImgs[i] as HTMLImageElement).setAttribute('src', url);
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = w * scale; canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'));
}
