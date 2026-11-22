/**
 * Ranger Ejder Muhafızı (ID4) kontrol sayfası (yalnız geliştirme; `npm run dev` → /onizleme-ranger.html; build girdisi değil).
 * Gerçek oyun bileşenleriyle çizer: satır = ırk × cinsiyet; sütun = ham jeton, sonra ırkın her alt soyu (Celestial: Göksel Uyanış).
 * Her hücrede rozet (`LookFrame` + `AvatarBadge`, karakter ekranlarındaki gibi `ability`) ve savaş jetonu (`AvatarCircle`, havada,
 * kanat dahil). Ekran görüntüsü harita/belgeler/RANGER-ID4-KONTROL.png (`?k=<sınıf>&h=<hücre>` başka jetonlar için).
 */
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { AvatarBadge, AvatarCircle } from '../ui/Avatar';
import { LookFrame } from '../ui/LookFrame';
import { races } from '../data';
import { blankCharacter } from '../rules/builder';
import { sheetAvatar } from '../battle/avatar';
import type { CharacterSheet } from '../rules/stats';
import { CELESTIAL_AWAKENINGS } from './soyOnizlemeVeri';
import { removeStaticSplash } from '../ui/splashBoot';

const q = new URLSearchParams(location.search);
const CLS = q.get('k') ?? 'ranger';
const SUB = q.get('a') ?? 'ejder-muhafizi';
const LEVEL = Number(q.get('s') ?? 13);
/** `?irk=goliath,dragonborn`: yalnız bu ırklar (yakın inceleme). */
const ONLY = q.get('irk')?.split(',');
const ROZET = 96, SAVAS = 84;
const base = blankCharacter('t').sheet;
const lab = { font: '11px system-ui', color: '#cfd3dc', textAlign: 'center' as const };

function Cell({ sheet, label, raw }: { sheet: CharacterSheet; label: string; raw?: boolean }) {
  const a = sheetAvatar(sheet);
  const av = raw ? { src: a.src, bg: a.bg, label: a.label } : a;
  const lookSheet = { raceId: sheet.raceId, classId: sheet.classId, subclassId: sheet.subclassId, level: sheet.level,
    ...(sheet.lineageId ? { lineageId: sheet.lineageId } : {}), ...(sheet.celestialAwakening ? { celestialAwakening: sheet.celestialAwakening } : {}) };
  const T = 132;
  return (
    <div data-cell={`${sheet.raceId}-${sheet.gender}-${label}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 4px', borderRight: '1px solid #2a3039' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {raw ? <AvatarBadge avatar={av} size={ROZET} eager /> : <LookFrame sheet={lookSheet} size={ROZET} ability><AvatarBadge avatar={av} size={ROZET} eager /></LookFrame>}
        <svg width={T} height={T} viewBox={`0 0 ${T} ${T}`} style={{ background: '#3d5a32', borderRadius: 6 }}>
          <AvatarCircle avatar={av} cx={T / 2} cy={T / 2 + 6} r={SAVAS / 2} flying={!raw} ability={!raw} eager />
        </svg>
      </div>
      <div style={{ ...lab, color: raw ? '#9aa3b2' : '#f5d76e' }}>{label}</div>
    </div>
  );
}

function Page() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 10, display: 'inline-block' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{CLS} · {SUB} · seviye {LEVEL}: her hücrede rozet {ROZET} px (karakter ekranı) + savaş jetonu {SAVAS} px (havada, kanat dahil); ilk sütun ham jeton</div>
      {races.filter((r) => !ONLY || ONLY.includes(r.id)).flatMap((r) => (['erkek', 'kadin'] as const).map((g) => {
        const sh = (x: Partial<CharacterSheet>) => ({ ...base, raceId: r.id, classId: CLS, subclassId: SUB, gender: g, level: LEVEL, ...x }) as CharacterSheet;
        const items = r.id === 'celestial'
          ? CELESTIAL_AWAKENINGS.map((aw) => ({ label: aw, sheet: sh({ celestialAwakening: aw }) }))
          : (r.lineages ?? []).map((l) => ({ label: l.id, sheet: sh({ lineageId: l.id }) }));
        return (
          <div key={`${r.id}-${g}`} data-row={`${r.id}-${g}`} style={{ display: 'flex', alignItems: 'flex-end', borderBottom: '1px solid #333a46', padding: '4px 0' }}>
            <div style={{ width: 92, fontWeight: 700, alignSelf: 'center' }}>{r.id}<br /><span style={{ fontWeight: 400, color: '#9aa3b2' }}>{g}</span></div>
            <Cell sheet={sh({ lineageId: r.lineages?.[0]?.id })} label="ham" raw />
            {items.map((it) => <Cell key={it.label} sheet={it.sheet} label={it.label} />)}
          </div>
        );
      }))}
    </div>
  );
}

// index.html kabuğunun açılış katmanı (`appShell`) bu sayfada da var: kaldırılır.
removeStaticSplash();
createRoot(document.getElementById('root')!).render(<Page />);
