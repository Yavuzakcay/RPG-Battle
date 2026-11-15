/**
 * Kuyruk KQ4 CK1: karakter listesinden kısa "Notları düzenle" ekranı (tüm sihirbazı açmadan; tembel parça). Yalnız hikâye alanları;
 * kaydedince karakterin `hikaye` alanı güncellenir (boş alanlar yazılmaz).
 */
import { useState } from 'react';
import type { SavedCharacter } from '../rules/builder';
import { cleanStory, type Hikaye } from '../rules/story';
import { StoryFields } from './builder/Story';
import { t } from '../i18n';

export function NotesScreen(props: { character: SavedCharacter; onSave: (c: SavedCharacter) => void; onCancel: () => void }) {
  const S = t().story;
  const [h, setH] = useState<Hikaye | undefined>(props.character.hikaye);
  return (
    <div className="menu-screen">
      <main className="app">
        <header><h1>{S.notesTitle(props.character.sheet.name || '—')}</h1><button className="ghost" onClick={props.onCancel}>{S.cancel}</button></header>
        <section className="panel">
          <p className="mute">{S.intro}</p>
          <StoryFields value={h} onChange={setH} />
          <div className="set-btns">
            <button className="cta" onClick={() => {
              const { hikaye: _old, ...rest } = props.character;
              const clean = cleanStory(h);
              props.onSave({ ...rest, ...(clean ? { hikaye: clean } : {}) });
            }}>{S.done}</button>
          </div>
        </section>
      </main>
    </div>
  );
}
