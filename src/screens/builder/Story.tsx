/**
 * Kuyruk KQ4 CK1: oluşturucunun "Hikâye" adımı ve karakter listesindeki kısa "Notları düzenle" ekranının ortak alan formu.
 * Yedi serbest metin alanı (çok satırlı, en çok `STORY_MAX` karakter, kalan sayacı); hazır tablo yok, boş bırakılırsa uyarı yok.
 */
import { STORY_FIELDS, STORY_MAX, type Hikaye } from '../../rules/story';
import type { SavedCharacter } from '../../rules/builder';
import { t } from '../../i18n';

export function StoryFields(props: { value: Hikaye | undefined; onChange: (h: Hikaye) => void }) {
  const S = t().story;
  return (
    <div className="story-fields">
      {STORY_FIELDS.map((k) => {
        const v = props.value?.[k] ?? '';
        return (
          <label key={k} className="story-field">
            <span>{S.fields[k]}</span>
            <textarea value={v} maxLength={STORY_MAX} rows={k === 'gorunum' ? 3 : 4} placeholder={S.hints[k] ?? ''} aria-label={S.fields[k]}
              onChange={(e: { target: { value: string } }) => props.onChange({ ...props.value, [k]: e.target.value.slice(0, STORY_MAX) })} />
            <small className="mute counter" aria-live="polite">{S.left(STORY_MAX - v.length)}</small>
          </label>
        );
      })}
    </div>
  );
}

export function StoryStep(props: { c: SavedCharacter; setC: (f: (x: SavedCharacter) => SavedCharacter) => void }) {
  const S = t().story;
  return (
    <section className="wiz-story">
      <h2>{S.title}</h2>
      <p className="mute">{S.intro}</p>
      <StoryFields value={props.c.hikaye} onChange={(h) => props.setC((x) => ({ ...x, hikaye: h }))} />
    </section>
  );
}
