/** KQ6-19: yıldız tacı önizleme sayfası (yalnız geliştirme; docs/sabah/hale-oyun-onizleme.png). */
import { Fragment } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { AvatarBadge, AvatarCircle, CharacterFigure } from '../ui/Avatar';
import { LookFrame } from '../ui/LookFrame';
import { crownSpec } from '../ui/haloCrown';
import type { Avatar } from '../battle';

const files = Object.keys(import.meta.glob('/public/characters/celestial-*.webp')).map((f) => f.split('/').pop() as string);
const CLASSES = ['paladin', 'fighter', 'wizard', 'rogue', 'warlock', 'cleric', 'monk'];
const look = { raceId: 'celestial', celestialAwakening: 'parlayan-ruh', level: 3 };
const avatarOf = (file: string): Avatar => ({ src: `characters/${file}`, bg: '#444', label: 'C', look });
const hasCrown = (f: string) => crownSpec(`characters/${f}`, look) !== null;
function pick(cls: string, kind: 'kadin' | 'erkek' | 'gr'): string | null {
  const gender = kind === 'gr' ? 'erkek' : kind;
  const list = files.filter((f) => f.startsWith(`celestial-${gender}-${cls}-`) && (kind === 'gr' ? f.endsWith('-GR.webp') : !f.endsWith('-GR.webp')));
  const generic = files.find((f) => f === `celestial-${gender === 'kadin' ? 'female' : 'male'}-${cls}.webp`);
  if (kind !== 'gr' && generic && hasCrown(generic)) return generic;
  return list.find(hasCrown) ?? (kind === 'gr' ? files.filter((f) => f.startsWith(`celestial-kadin-${cls}-GR`)).find(hasCrown) ?? null : null);
}
function Cell({ file, kind }: { file: string | null; kind: string }) {
  if (!file) return <div style={{ color: '#888', padding: 8, font: '12px system-ui' }}>{kind}: taçlı (halesiz) jeton yok</div>;
  const a = avatarOf(file);
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', padding: 6 }}>
      <div><LookFrame sheet={look} size={96} ability><AvatarBadge avatar={a} size={96} eager /></LookFrame><div style={lab}>rozet 96</div></div>
      <div><CharacterFigure avatar={a} size={150} /><div style={lab}>karakter ekranı</div></div>
      <div>
        <svg width={130} height={150} viewBox="0 0 130 150"><polygon points="65,12 118,40 118,100 65,128 12,100 12,40" fill="#4f7a3a" stroke="#2e4a22" strokeWidth={2} />
          <AvatarCircle avatar={a} cx={65} cy={70} r={42} eager /></svg><div style={lab}>savaş jetonu</div>
      </div>
    </div>
  );
}
const lab = { font: '10px system-ui', color: '#aab', textAlign: 'center' as const };
function Page() {
  return (
    <div id="sayfa" style={{ background: '#1d2128', color: '#e8e4da', font: '13px system-ui', padding: 10, display: 'inline-block' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${CLASSES.length}, auto)`, gap: 4 }}>
        <div />{CLASSES.map((c) => <div key={c} style={{ fontWeight: 700, textTransform: 'capitalize' }}>{c}</div>)}
        {(['kadin', 'erkek', 'gr'] as const).map((k) => (
          <Fragment key={k}>
            <div style={{ alignSelf: 'center', color: '#f5d76e' }}>{k === 'gr' ? 'Gariban' : k === 'kadin' ? 'kadın' : 'erkek'}</div>
            {CLASSES.map((c) => <Cell key={`${k}${c}`} file={pick(c, k)} kind={k} />)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(host);
createRoot(host).render(<Page />);
