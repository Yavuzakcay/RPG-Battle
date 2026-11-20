/**
 * Testler için tek kalıp: başlık/ad metninden sonra `<b>` içinde glif rozeti (`GlyphBadges`, `glyph-badges`) durabilir.
 * `nameWithBadges('Extra Attack')` → `Extra Attack` ve isteğe bağlı rozet bölümü (RegExp kaynağı). Uygulama içe aktarmaz.
 */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const BADGES_SRC = '(?:<span class="glyph-badges">[^]*?</span>)?';
export const nameWithBadges = (name: string): string => `${esc(name)}${BADGES_SRC}`;
/** `<b>ad</b>` (rozet `<b>` içinde olabilir). */
export const boldName = (name: string): RegExp => new RegExp(`<b>${nameWithBadges(name)}</b>`);
