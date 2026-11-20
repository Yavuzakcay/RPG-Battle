/**
 * Ortak simge setleri (glif) çizimi: mevcut açıklama çizimine eklenti (yeni ayrı çizim yolu yok). Simgeler yalnız görsel:
 * `aria-hidden`, boş alt metin; metin aynen kalır (kopyalama ve ekran okuyucu değişmez). Ayar "Açıklama simgeleri" kapalıysa
 * ya da simgenin görseli kesilmemişse (`data/glif-esleme.json` `kesim`) hiçbir şey çizilmez. Görseller `public/glif/`.
 */
import { Fragment } from 'react';
import { getLang } from '../../i18n';
import { storedGlyphs } from '../glyphSetting';
import { GLYPH_SIZE, damageGlyph, glyphLabel, glyphPath, glyphSegments, hasGlyph } from './glyphs';
import './glyph.css';

const BASE = import.meta.env.BASE_URL;
type Kind = 'inline' | 'head' | 'chip';
const SIZE: Record<Kind, number> = { inline: GLYPH_SIZE.satirIci, head: GLYPH_SIZE.baslik, chip: GLYPH_SIZE.cip };

/** Tek simge. Başlıkta (`head`) fare ipucu adı (`title`); satır içinde ipucu yok. */
export function Glyph(props: { ad: string | undefined; kind?: Kind }) {
  const kind = props.kind ?? 'inline';
  if (!props.ad || !storedGlyphs() || !hasGlyph(props.ad)) return null;
  const px = SIZE[kind];
  return (
    <img className={`glyph glyph-${kind}`} src={`${BASE}${glyphPath(props.ad)}`} width={px} height={px} alt="" aria-hidden="true"
      decoding="async" draggable={false} data-glif={props.ad} {...(kind === 'head' ? { title: glyphLabel(props.ad, getLang()) } : {})} />
  );
}

/** Açıklama başlığı rozetleri (adın yanında): okul, Concentration/Ritual, eylem türü, Attunement. */
export function GlyphBadges(props: { list: Array<string | undefined> | undefined }) {
  const list = (props.list ?? []).filter((x): x is string => !!x && hasGlyph(x));
  if (!list.length || !storedGlyphs()) return null;
  return <span className="glyph-badges">{list.map((ad) => <Glyph key={ad} ad={ad} kind="head" />)}</span>;
}

/** Açıklama metni: hasar türü, geçici can, kurtarma zarı ve iyileştirme geçen yerin önüne 16 px simge (veriden kalıplar). */
export function GlyphText(props: { text: string | undefined }) {
  const text = props.text ?? '';
  if (!text || !storedGlyphs()) return <>{text}</>;
  const parts = glyphSegments(text);
  if (parts.length === 1 && 'text' in parts[0]!) return <>{text}</>;
  return <>{parts.map((p, i) => ('glif' in p ? <Glyph key={i} ad={p.glif} /> : <Fragment key={i}>{p.text}</Fragment>))}</>;
}

/** Hasar türü çipi (hamle önizleme kartı, günlük): simge + tür adı. Ayar kapalıysa ya da simge kesilmemişse hiç çizilmez. */
export function DamageChip(props: { type: string; label: string }) {
  const ad = damageGlyph(props.type);
  if (!ad || !storedGlyphs() || !hasGlyph(ad)) return null;
  return <span className="dmg-chip" data-dmg={props.type}><Glyph ad={ad} kind="chip" />{props.label}</span>;
}
