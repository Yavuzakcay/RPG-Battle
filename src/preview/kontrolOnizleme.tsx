/**
 * GORSEL-DUZELTME kontrol sayfası (yalnız geliştirme; `npm run dev` → /onizleme-kontrol.html?d=<durum>; build girdisi değil).
 * Uygulamadaki sırayı birebir izler: kanat filtre ev sahibi (`WingFilterHost`) en önce çizilir, sınıf ve kanat verisi SONRA yüklenir
 * (`App` `useClassData` gibi), ardından gerçek oluşturma ekranı (`Builder`, Karakter adımı; masaüstünde mobil önizleme gizli ve önce gelir)
 * ve aynı karakterin savaş jetonu (`AvatarCircle`, havada). Durumlar: db (Dragonborn Blue Fighter 13), hu (Human erkek Fighter 1),
 * gf (Goliath Fire Fighter 1), gr (Goliath Frost Ranger 9), cc (Celestial Cleric 9, alt sınıf boş),
 * cb/cbe (Celestial Cleric 9 kadın/erkek, Birlik Manastırı).
 */
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import '../styles.css';
import { removeStaticSplash } from '../ui/splashBoot';
import { applyTheme, storedTheme } from '../ui/theme';
import { ensureLang } from '../i18n';
import { WingFilterHost } from '../ui/WingFilter';
import { AvatarCircle } from '../ui/Avatar';
import { loadWingData } from '../ui/wingData';
import { loadClassData } from '../data';
import { Builder } from '../screens/Builder';
import { blankCharacter, type SavedCharacter } from '../rules/builder';
import { defaultSubclassId } from '../rules/subclasses';
import { sheetAvatar } from '../battle/avatar';
import type { CharacterSheet } from '../rules/stats';

const DURUMLAR: Record<string, Partial<CharacterSheet>> = {
  db: { raceId: 'dragonborn', lineageId: 'blue', classId: 'fighter', level: 13, gender: 'erkek' },
  hu: { raceId: 'human', classId: 'fighter', level: 1, gender: 'erkek' },
  gf: { raceId: 'goliath', lineageId: 'fire', classId: 'fighter', level: 1, gender: 'erkek' },
  gr: { raceId: 'goliath', lineageId: 'frost', classId: 'ranger', level: 9, gender: 'erkek' },
  // Kayıtlı karakter düzenlenirken seviye 9'a çıkarılmış, alt sınıf seçilmemiş (öneri kipi dışında sihirbaz alt sınıf önermez).
  cc: { raceId: 'celestial', classId: 'cleric', level: 9, gender: 'kadin' },
  // Kullanıcının bildirdiği görünüş: Celestial Cleric 9, Birlik Manastırı.
  cb: { raceId: 'celestial', classId: 'cleric', level: 9, gender: 'kadin', subclassId: 'imza_birlik' },
  cbe: { raceId: 'celestial', classId: 'cleric', level: 9, gender: 'erkek', subclassId: 'imza_birlik' },
};
/** Alt sınıfı bilerek boş bırakılan durumlar. */
const ALT_SINIFSIZ = new Set(['cc']);
const d = new URLSearchParams(location.search).get('d') ?? 'db';

function charOf(): SavedCharacter {
  const b = blankCharacter('kontrol');
  const p = DURUMLAR[d] ?? DURUMLAR.db!;
  const sub = p.subclassId ?? ((p.level ?? 1) >= 3 && !ALT_SINIFSIZ.has(d) ? defaultSubclassId(p.classId ?? 'fighter') : undefined);
  return { ...b, sheet: { ...b.sheet, name: d, ...p, ...(sub ? { subclassId: sub } : {}) } as CharacterSheet };
}

function Page() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // App `useClassData` sırası: sınıf + kanat verisi, sonra dış içerik.
    void Promise.all([loadClassData(), loadWingData().catch(() => undefined)])
      .then(() => import('../content/store').then((m) => { m.applyStoredContent(); return m.loadLocalFolder().catch(() => undefined); }))
      .then(() => setReady(true));
  }, []);
  const c = ready ? charOf() : null;
  return (
    <>
      <style>{'*, *::before, *::after { animation: none !important; transition: none !important; }'}</style>
      <WingFilterHost />
      {c && (
        <>
          <Builder initial={c} onSave={() => {}} onCancel={() => {}} step="character" />
          <svg id="kontrol-jeton" width={420} height={420} viewBox="0 0 140 140" style={{ background: '#3a3f4a', display: 'block' }}>
            <AvatarCircle avatar={sheetAvatar(c.sheet)} cx={70} cy={76} r={34} flying eager />
          </svg>
        </>
      )}
    </>
  );
}

// main.tsx gibi: tema ve dil tabloları ilk çizimden önce.
removeStaticSplash();
applyTheme(storedTheme());
void ensureLang().then(() => createRoot(document.getElementById('root')!).render(<Page />));
