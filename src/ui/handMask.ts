/**
 * Görev K21: elle çizilmiş ten maskesi doğrulaması (saf; `scripts/soy-maske-el.ts` sharp ile okuyup bunu çağırır).
 * Kural: dosya adı bir soylu jetonla aynı (`<ırk>-<male|female>-<sınıf>.png`), boyutu jetonla aynı, gri tonlu (renkli
 * piksel yok; saydam pikseller siyah sayılır). Beyaz = boyanır, siyah = dokunulmaz, gri = kısmi ağırlık.
 */
export interface HandMaskInfo {
  file: string;
  width: number;
  height: number;
  /** Saydam olmayan renkli (gri olmayan) piksel sayısı. */
  colored: number;
}

export type HandMaskCheck = { ok: true; name: string } | { ok: false; file: string; warning: string };

/** Gri sayılma eşiği (kanallar arası en büyük fark). */
export const GRAY_TOLERANCE = 8;

export function checkHandMask(info: HandMaskInfo, spriteSize: (name: string) => { w: number; h: number } | undefined): HandMaskCheck {
  const m = info.file.match(/^([a-z-]+-(?:male|female)-[a-z]+)\.png$/);
  if (!m) return { ok: false, file: info.file, warning: 'ad kurala uymuyor (<ırk>-<male|female>-<sınıf>.png bekleniyor)' };
  const name = m[1] as string;
  const size = spriteSize(name);
  if (!size) return { ok: false, file: info.file, warning: `"${name}" adlı soylu jeton yok` };
  if (info.width !== size.w || info.height !== size.h) return { ok: false, file: info.file, warning: `boyut ${info.width}×${info.height}, jeton ${size.w}×${size.h} olmalı` };
  if (info.colored > 0) return { ok: false, file: info.file, warning: `renkli dosya (${info.colored} gri olmayan piksel): siyah-beyaz maske olmalı; şablon mu kaydedildi?` };
  return { ok: true, name };
}

/** Her jetonun maske kaynağı: geçerli elle maske varsa `el`, yoksa `oto`. */
export function maskSources(sprites: readonly string[], valid: readonly string[]): Record<string, 'el' | 'oto'> {
  const set = new Set(valid);
  return Object.fromEntries(sprites.map((s) => [s, set.has(s) ? 'el' : 'oto']));
}
